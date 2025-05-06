# Google Drive MCP Server Instructions

## Overview
The Google Drive MCP server provides access to Google Drive files and documents through multiple tools for interacting with Google Drive. The main tools include:
1. gdrive_search - Find files in your Google Drive
2. gdrive_read_file - Read file contents directly using a file ID
3. gdrive_list_folders - List all folders in your Google Drive
4. gdrive_create_folder - Create a new folder in Google Drive
5. gdrive_upload_file - Upload a file to Google Drive
6. gdrive_delete_file - Delete a file from Google Drive
7. gdrive_move_file - Move a file to a different folder
8. gdrive_get_file_metadata - Get detailed information about a file
9. gdrive_download_file - Download a file as base64 or text
10. gdrive_share_file_public - Make a file publicly accessible

## Capabilities

### Document Reading
The server can read and export various file types:

#### Google Workspace Documents
- Google Docs → Markdown
- Google Sheets → CSV
- Google Presentations → Plain text
- Google Drawings → PNG
- Other Google Apps files → Plain text

#### Regular Files
- Text files → UTF-8 text
- JSON files → UTF-8 text
- Binary files → Base64 encoded blob

### Search Functionality
Search through your entire Google Drive content using fullText search queries.

## How to Use

### 1. Listing Files
To get a list of files from Google Drive:
```
List my Google Drive files
```
This will return up to 10 files with their IDs, names, and MIME types.

### 2. Reading Documents
There are two ways to read documents:

#### Using File ID
If you know the file ID:
```
Read the Google Drive file with URI gdrive:///[file-id]
```

#### Using File Name
If you want to find and read a file by name:
```
List my Google Drive files and then read the document named "[document-name]"
```

### 3. Searching Files
To search for specific files:
```
Use the Google Drive search tool to find files containing "[search-term]"
```

### 4. Working with Folders

#### Listing Folders
To list all folders in your Google Drive:
```
List all folders in my Google Drive
```

#### Creating Folders
To create a new folder:
```
Create a new folder named "[folder-name]" in my Google Drive
```

### 5. File Management

#### Uploading Files
To upload a file to a specific folder:
```
Upload a file named "[filename]" to the folder with ID "[folder-id]" in my Google Drive
```

#### Deleting Files
To delete a file:
```
Delete the file with ID "[file-id]" from my Google Drive
```

#### Moving Files
To move a file to a different folder:
```
Move the file with ID "[file-id]" to the folder with ID "[folder-id]" in my Google Drive
```

#### Getting File Metadata
To get detailed information about a file:
```
Get metadata for the file with ID "[file-id]" in my Google Drive
```

#### Downloading Files
To download a file as base64 or text:
```
Download the file with ID "[file-id]" from my Google Drive
```

#### Sharing Files
To make a file publicly accessible:
```
Share the file with ID "[file-id]" publicly in my Google Drive
```

## Example Commands

1. Read a specific Google Doc as markdown:
```
List my Google Drive files and then read the document named "Project Proposal"
```

2. Search for documents about a specific topic:
```
Use the Google Drive search tool to find files containing "quarterly report"
```

3. List all folders in your Google Drive:
```
List all folders in my Google Drive
```

4. Create a new folder:
```
Create a new folder named "Project Documents" in my Google Drive
```

5. Upload a file to a specific folder:
```
Upload a file named "report.txt" with content "This is my report" to the folder with ID "folder-id" in my Google Drive
```

6. Move a file to a different folder:
```
Move the file with ID "file-id" to the folder with ID "destination-folder-id" in my Google Drive
```

7. Get file metadata:
```
Get metadata for the file with ID "file-id" in my Google Drive
```

8. Download a file:
```
Download the file with ID "file-id" from my Google Drive
```

9. Share a file publicly:
```
Share the file with ID "file-id" publicly in my Google Drive
```

10. Delete a file:
```
Delete the file with ID "file-id" from my Google Drive
```

## Notes
- The server has full read and write access to Google Drive
- File listings are paginated with 10 files per page
- Google Docs are automatically exported as markdown
- Searches use Google Drive's fullText search capability
- The server supports file modifications including creating folders, uploading files, moving files, and deleting files
- Files can be shared publicly to generate shareable links

## Error Handling
If you encounter any errors:
1. Verify the file ID or name is correct
2. Ensure you have access to the file
3. Check if the file format is supported
4. Verify the authentication credentials are valid

## Best Practices
1. When searching for files, use specific terms to narrow down results
2. For Google Docs, prefer reading them directly as they'll be automatically converted to markdown
3. When listing files, be aware that only 10 files are shown at a time
4. Use file IDs when possible as they're unique and more reliable than names
5. When creating folders, use descriptive names to organize your content effectively
6. Before uploading files, ensure you have the correct folder ID for the destination
7. When moving files, verify both the file ID and destination folder ID
8. After sharing a file publicly, save the shareable link for future reference
9. Always confirm file deletions as they cannot be undone
10. Use the file metadata tool to get comprehensive information about files
