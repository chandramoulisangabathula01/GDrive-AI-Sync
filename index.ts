#!/usr/bin/env node

import { authenticate } from "@google-cloud/local-auth";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  ErrorCode,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import fs from "fs";
import { google } from "googleapis";
import path from "path";
import { Readable } from "stream";

const drive = google.drive("v3");

const server = new Server(
  {
    name: "gdrive",
    version: "0.1.0",
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
  },
);

server.setRequestHandler(ListResourcesRequestSchema, async (request) => {
  const pageSize = 10;
  const params: any = {
    pageSize,
    fields: "nextPageToken, files(id, name, mimeType)",
  };

  if (request.params?.cursor) {
    params.pageToken = request.params.cursor;
  }
  params.q = 'trashed = false';

  const res = await drive.files.list(params);
  const files = res.data.files!;

  return {
    resources: files.map((file) => ({
      uri: `gdrive:///${file.id}`,
      mimeType: file.mimeType,
      name: file.name,
    })),
    nextCursor: res.data.nextPageToken,
  };
});

async function readFileContent(fileId: string) {
  // First get file metadata to check mime type
  const file = await drive.files.get({
    fileId,
    fields: "mimeType",
  });

  // For Google Docs/Sheets/etc we need to export
  if (file.data.mimeType?.startsWith("application/vnd.google-apps")) {
    let exportMimeType: string;
    switch (file.data.mimeType) {
      case "application/vnd.google-apps.document":
        exportMimeType = "text/markdown";
        break;
      case "application/vnd.google-apps.spreadsheet":
        exportMimeType = "text/csv";
        break;
      case "application/vnd.google-apps.presentation":
        exportMimeType = "text/plain";
        break;
      case "application/vnd.google-apps.drawing":
        exportMimeType = "image/png";
        break;
      default:
        exportMimeType = "text/plain";
    }

    const res = await drive.files.export(
      { fileId, mimeType: exportMimeType },
      { responseType: "text" },
    );

    return {
      mimeType: exportMimeType,
      content: res.data,
    };
  }

  // For regular files download content
  const res = await drive.files.get(
    { fileId, alt: "media" },
    { responseType: "arraybuffer" },
  );
  const mimeType = file.data.mimeType || "application/octet-stream";
  
  if (mimeType.startsWith("text/") || mimeType === "application/json") {
    return {
      mimeType: mimeType,
      content: Buffer.from(res.data as ArrayBuffer).toString("utf-8"),
    };
  } else {
    return {
      mimeType: mimeType,
      content: Buffer.from(res.data as ArrayBuffer).toString("base64"),
    };
  }
}

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const fileId = request.params.uri.replace("gdrive:///", "");
  const result = await readFileContent(fileId);
  
  return {
    contents: [
      {
        uri: request.params.uri,
        mimeType: result.mimeType,
        text: result.content,
      },
    ],
  };
});

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      
      {
        name: "gdrive_list_folders",
        description: "List all folders in the user's Google Drive",
        inputSchema: {
          type: "object",
          properties: {},
          required: [],
        },
      },
      {
        name: "gdrive_search",
        description: "Search for files specifically in your Google Drive account (don't use exa nor brave to search for files)",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Search query",
            },
            parent_folder_id: {
              type: "string",
              description: "ID of the parent folder to search within"
            }
          },
          required: ["query"],
        },
      },
      {
        name: "gdrive_read_file",
        description: "Read a file from Google Drive using its Google Drive file ID (don't use exa nor brave to read files)",
        inputSchema: {
          type: "object",
          properties: {
            file_id: {
              type: "string",
              description: "The ID of the file to read",
            },
          },
          required: ["file_id"],
        },
      },
      {
        name: "gdrive_create_folder",
        description: "Create a new folder in the user's Google Drive",
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "Name of the folder to create",
              minLength: 1,
              pattern: "^[^\\\/]*$"
            },
            parent_folder_id: {
              type: "string",
              description: "ID of the parent folder",
              default: "root"
            }
          },
          required: ["name"],
        },
      },
      {
        name: "gdrive_upload_file",
        description: "Upload a new file (text or base64 data) to a specific folder in Google Drive",
        inputSchema: {
          type: "object",
          properties: {
            folder_id: {
              type: "string",
              description: "ID of the folder to upload to",
            },
            filename: {
              type: "string",
              description: "Name of the file to create",
            },
            mimeType: {
              type: "string",
              description: "MIME type of the file",
            },
            content: {
              type: "string",
              description: "Content of the file (base64 or plain text)",
            },
          },
          required: ["folder_id", "filename", "mimeType", "content"],
          validate: {
            mimeType: {
              allowed: ["text/plain", "application/json", "text/markdown"]
            },
            content: {
              isBase64: {
                when: (data) => data.mimeType === "application/octet-stream",
                message: "Content must be base64 encoded for binary files"
              }
            }
          },
        },
      },
      {
        name: "gdrive_delete_file",
        description: "Delete a file by its file ID from the user's Google Drive",
        inputSchema: {
          type: "object",
          properties: {
            file_id: {
              type: "string",
              description: "ID of the file to delete",
            },
          },
          required: ["file_id"],
        },
      },
      {
        name: "gdrive_move_file",
        description: "Move a file to a different folder by updating its parent",
        inputSchema: {
          type: "object",
          properties: {
            file_id: {
              type: "string",
              description: "ID of the file to move",
            },
            folder_id: {
              type: "string",
              description: "ID of the destination folder",
            },
          },
          required: ["file_id", "folder_id"],
        },
      },
      {
        name: "gdrive_get_file_metadata",
        description: "Fetch metadata (name, mimeType, size, modifiedTime) for a file by its ID",
        inputSchema: {
          type: "object",
          properties: {
            file_id: {
              type: "string",
              description: "ID of the file to get metadata for",
            },
          },
          required: ["file_id"],
        },
      },
      {
        name: "gdrive_list_recent",
        description: "List the most recently modified files in your Google Drive",
        inputSchema: {
          type: "object",
          properties: {
            count: {
              type: "number",
              description: "How many recent files to list (max 20)",
            },
            folder_id: {
              type: "string",
              description: "ID of the folder to list recent files from",
            },
          },
          required: ["count"],
        },
      },
{
        name: "gdrive_get_file_info",
        description: "Get metadata (name, type, size, modified date) of a file by ID",
        inputSchema: {
          type: "object",
          properties: {
            file_id: {
              type: "string",
              description: "ID of the file to get info for",
            },
          },
          required: ["file_id"],
        },
      },
      {
        name: "gdrive_download_file",
        description: "Download a file as base64 or buffer by ID",
        inputSchema: {
          type: "object",
          properties: {
            file_id: {
              type: "string",
              description: "ID of the file to download",
            },
          },
          required: ["file_id"],
        },
      },
      {
        name: "gdrive_share_file_public",
        description: "Make a file publicly accessible via link and return the shareable URL",
        inputSchema: {
          type: "object",
          properties: {
            file_id: {
              type: "string",
              description: "ID of the file to share",
            },
          },
          required: ["file_id"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "gdrive_search") {
    const userQuery = request.params.arguments?.query as string;
    const parentFolderId = request.params.arguments?.parent_folder_id as string;
    const escapedQuery = userQuery.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
    const formattedQuery = `name contains '${escapedQuery}'` + 
      (parentFolderId ? ` and '${parentFolderId}' in parents` : '');
    
    try {
      const res = await drive.files.list({
        q: formattedQuery + ' and trashed = false',
        pageSize: 10,
        fields: "files(id, name, mimeType, modifiedTime, size, parents)",
      });
    } catch (error: unknown) {
      console.error("Search query:", formattedQuery);
      console.error("Drive API error:", error);
      return {
        content: [{
          type: "text",
          text: `Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        }],
        isError: true
      };
    }
  } else if (request.params.name === "gdrive_read_file") {
    const fileId = request.params.arguments?.file_id as string;
    if (!fileId) {
      throw new McpError(ErrorCode.InvalidParams, "File ID is required");
    }

    try {
      const result = await readFileContent(fileId);
      return {
        content: [
          {
            type: "text",
            text: result.content,
          },
        ],
        isError: false,
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Error reading file: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  } else if (request.params.name === "gdrive_list_folders") {
    try {
      const res = await drive.files.list({
        q: "mimeType='application/vnd.google-apps.folder'",
        pageSize: 50,
        fields: "files(id, name, createdTime)",
      });
      
      const folderList = res.data.files
        ?.map((folder: any) => `${folder.name} - ID: ${folder.id} (Created: ${folder.createdTime})`)
        .join("\n");
      
      return {
        content: [
          {
            type: "text",
            text: `Found ${res.data.files?.length ?? 0} folders:\n${folderList || "No folders found"}`,
          },
        ],
        isError: false,
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Error listing folders: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  } else if (request.params.name === "gdrive_create_folder") {
    const folderName = request.params.arguments?.name as string;
    if (!folderName) {
      throw new McpError(ErrorCode.InvalidParams, "Folder name is required");
    }
    
    try {
      const fileMetadata = {
        name: folderName,
        mimeType: "application/vnd.google-apps.folder",
      };
      
      const res = await drive.files.create({
        requestBody: fileMetadata,
        fields: "id, name, webViewLink",
      });
      
      return {
        content: [
          {
            type: "text",
            text: `Folder created successfully:\nName: ${res.data.name}\nID: ${res.data.id}\nLink: ${res.data.webViewLink}`,
          },
        ],
        isError: false,
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Error creating folder: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  } else if (request.params.name === "gdrive_upload_file") {
    const { folder_id, filename, mimeType, content } = request.params.arguments as {
      folder_id: string;
      filename: string;
      mimeType: string;
      content: string;
    };
    
    if (!folder_id || !filename || !mimeType || !content) {
      throw new McpError(ErrorCode.InvalidParams, "Missing required parameters");
    }
    
    try {
      // Determine if content is base64 or plain text and create appropriate stream
      let fileStream: Readable;
      let uploadBody: any;
      if (mimeType.startsWith("text/") || mimeType === "application/json") {
        // For text, create a stream from the string
        fileStream = Readable.from([content]);
        uploadBody = fileStream;
      } else {
        // For binary, decode base64 and create a stream from Buffer
        const buffer = Buffer.from(content, "base64");
        fileStream = Readable.from(buffer);
        uploadBody = fileStream;
      }

      const fileMetadata = {
        name: filename,
        parents: [folder_id],
      };

      const media = {
        mimeType: mimeType,
        body: uploadBody,
      };

      const res = await drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: "id, name, webViewLink, size",
      });

      return {
        content: [
          {
            type: "text",
            text: `File uploaded successfully:\nName: ${res.data.name}\nID: ${res.data.id}\nSize: ${res.data.size} bytes\nLink: ${res.data.webViewLink}`,
          },
        ],
        isError: false,
      };
    } catch (error: any) {
      // Log the detailed error for debugging
      console.error("Error during gdrive_upload_file:", JSON.stringify(error, null, 2)); // Log full error object
      const errorMessage = `Error uploading file: ${error.message}${error.code ? ` (Code: ${error.code})` : ''}${error.errors ? ` (Details: ${JSON.stringify(error.errors)})` : ''}`;
      return {
        content: [
          {
            type: "text",
            text: errorMessage,
          },
        ],
        isError: true,
      };
    }
  } else if (request.params.name === "gdrive_delete_file") {
    const fileId = request.params.arguments?.file_id as string;
    if (!fileId) {
      throw new McpError(ErrorCode.InvalidParams, "File ID is required");
    }
    
    try {
      await drive.files.delete({
        fileId: fileId,
      });
      
      return {
        content: [
          {
            type: "text",
            text: `File with ID ${fileId} has been deleted successfully.`,
          },
        ],
        isError: false,
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Error deleting file: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  } else if (request.params.name === "gdrive_move_file") {
    const { file_id, folder_id } = request.params.arguments as {
      file_id: string;
      folder_id: string;
    };
    
    if (!file_id || !folder_id) {
      throw new McpError(ErrorCode.InvalidParams, "File ID and Folder ID are required");
    }
    
    try {
      // First get the file to check its current parents
      const file = await drive.files.get({
        fileId: file_id,
        fields: "parents",
      });
      
      // Remove the file from all current parents and add to new parent
      const previousParents = file.data.parents?.join(",") || "";
      
      const res = await drive.files.update({
        fileId: file_id,
        addParents: folder_id,
        removeParents: previousParents,
        fields: "id, name, parents",
      });
      
      return {
        content: [
          {
            type: "text",
            text: `File moved successfully:\nName: ${res.data.name}\nID: ${res.data.id}\nNew parent folder: ${folder_id}`,
          },
        ],
        isError: false,
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Error moving file: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  } else if (request.params.name === "gdrive_get_file_metadata") {
    const fileId = request.params.arguments?.file_id as string;
    if (!fileId) {
      throw new McpError(ErrorCode.InvalidParams, "File ID is required");
    }
    
    try {
      const res = await drive.files.get({
        fileId: fileId,
        fields: "id, name, mimeType, size, modifiedTime, createdTime, webViewLink, parents",
      });
      
      return {
        content: [
          {
            type: "text",
            text: `File Metadata:\nName: ${res.data.name}\nID: ${res.data.id}\nMIME Type: ${res.data.mimeType}\nSize: ${res.data.size || "N/A"} bytes\nModified: ${res.data.modifiedTime}\nCreated: ${res.data.createdTime}\nLink: ${res.data.webViewLink}\nParent Folder IDs: ${res.data.parents?.join(", ") || "None"}`,
          },
        ],
        isError: false,
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Error getting file metadata: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  } else if (request.params.name === "gdrive_download_file") {
    const fileId = request.params.arguments?.file_id as string;
    if (!fileId) {
      throw new McpError(ErrorCode.InvalidParams, "File ID is required");
    }
    
    try {
      const result = await readFileContent(fileId);
      
      // For binary files, we return the base64 content
      // For text files, we return the text content directly
      const isTextFile = result.mimeType.startsWith("text/") || result.mimeType === "application/json";
      
      return {
        content: [
          {
            type: "text",
            text: `File downloaded successfully:\nMIME Type: ${result.mimeType}\nEncoding: ${isTextFile ? "utf-8" : "base64"}\n\n${result.content}`,
          },
        ],
        isError: false,
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Error downloading file: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  } else if (request.params.name === "gdrive_share_file_public") {
    const fileId = request.params.arguments?.file_id as string;
    if (!fileId) {
      throw new McpError(ErrorCode.InvalidParams, "File ID is required");
    }
    
    try {
      // First create a public permission for the file
      await drive.permissions.create({
        fileId: fileId,
        requestBody: {
          role: "reader",
          type: "anyone",
        },
      });
      
      // Then get the web view link
      const res = await drive.files.get({
        fileId: fileId,
        fields: "webViewLink, webContentLink, name",
      });
      
      const shareableLink = res.data.webContentLink || res.data.webViewLink;
      
      return {
        content: [
          {
            type: "text",
            text: `File "${res.data.name}" is now publicly accessible:\nShareable Link: ${shareableLink}`,
          },
        ],
        isError: false,
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Error sharing file: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  } else if (request.params.name === "gdrive_list_recent") {
    const count = (request.params.arguments?.count as number) ?? 10; // Default to 10 if not provided
    const maxCount = Math.min(Math.max(1, count), 20); // Clamp count between 1 and 20
    const folderId = request.params.arguments?.folder_id as string;

    try {
      const baseQuery = folderId
        ? `'${folderId}' in parents and trashed = false`
        : 'trashed = false';

      const res = await drive.files.list({
        q: baseQuery,
        orderBy: "modifiedTime desc",
        pageSize: maxCount,
        fields: "files(id, name, mimeType, modifiedTime)",
      });

      const fileList = res.data.files
        ?.map((file: any) => `${file.name} (${file.mimeType}) - ID: ${file.id} (Modified: ${file.modifiedTime})`)
        .join("\n");

      return {
        content: [
          {
            type: "text",
            text: `Found ${res.data.files?.length ?? 0} recent files:\n${fileList || "No recent files found"}`,
          },
        ],
        isError: false,
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Error listing recent files: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }
  throw new McpError(ErrorCode.MethodNotFound, `Tool '${request.params.name}' not found`);
});

const credentialsPath = process.env.MCP_GDRIVE_CREDENTIALS || path.join(process.cwd(), "credentials", ".gdrive-server-credentials.json");

async function authenticateAndSaveCredentials() {
  const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join(process.cwd(), "credentials", "gcp-oauth.keys.json");
  
  console.log("Looking for keys at:", keyPath);
  console.log("Will save credentials to:", credentialsPath);
  
  try {
    const auth = await authenticate({
      keyfilePath: keyPath,
      scopes: [
        "https://www.googleapis.com/auth/drive",
        "https://www.googleapis.com/auth/drive.file",
        "https://www.googleapis.com/auth/drive.metadata"
      ],
    });
    
    fs.writeFileSync(credentialsPath, JSON.stringify(auth.credentials));
    console.log("Credentials saved. You can now run the server.");
  } catch (error: any) {
    if (error.message?.includes("access_denied")) {
      console.error("Google OAuth verification error: This application has not been verified by Google yet.");
      console.error("To proceed, you'll need to:");
      console.error("1. Click 'Advanced' in the Google OAuth consent screen");
      console.error("2. Click 'Go to MCP GDrive Server (unsafe)'");
      console.error("3. Grant the requested permissions");
    } else {
      console.error("Authentication failed:", error.message);
    }
    process.exit(1);
  }
}

async function loadCredentialsAndRunServer() {
  if (!fs.existsSync(credentialsPath)) {
    console.error(
      "Credentials not found. Please run with 'auth' argument first.",
    );
    process.exit(1);
  }

  const credentials = JSON.parse(fs.readFileSync(credentialsPath, "utf-8"));
  const auth = new google.auth.OAuth2();
  auth.setCredentials(credentials);
  google.options({ auth });

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

if (process.argv[2] === "auth") {
  authenticateAndSaveCredentials().catch(console.error);
} else {
  loadCredentialsAndRunServer().catch((error) => {
    process.stderr.write(`Error: ${error}\n`);
    process.exit(1);
  });
}

// Use ts-node to run TypeScript files
// Example command: ts-node index.ts
