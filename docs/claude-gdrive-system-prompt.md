# Google Drive MCP Server Instructions

## Overview
The Google Drive MCP server provides multiple tools for interacting with Google Drive files. The main tools include:
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
11. gdrive_list_recently_modified_files - List the 5 most recently modified files in your Google Drive

## Available Tools

### 1. Search Tool
Search for files in Google Drive:
```xml
<use_mcp_tool>
<server_name>gdrive</server_name>
<tool_name>gdrive_search</tool_name>
<arguments>
{
  "query": "your search term"
}
</arguments>
</use_mcp_tool>
```
Returns: List of files with their names, MIME types, and IDs

### 2. Read File Tool
Read a file's contents using its ID:
```xml
<use_mcp_tool>
<server_name>gdrive</server_name>
<tool_name>gdrive_read_file</tool_name>
<arguments>
{
  "file_id": "the-file-id-from-search"
}
</arguments>
</use_mcp_tool>
```

### 3. List Folders Tool
List all folders in your Google Drive:
```xml
<use_mcp_tool>
<server_name>gdrive</server_name>
<tool_name>gdrive_list_folders</tool_name>
<arguments>
{}
</arguments>
</use_mcp_tool>
```
Returns: List of folders with their names, IDs, and creation dates

### 4. Create Folder Tool
Create a new folder in Google Drive:
```xml
<use_mcp_tool>
<server_name>gdrive</server_name>
<tool_name>gdrive_create_folder</tool_name>
<arguments>
{
  "name": "New Folder Name"
}
</arguments>
</use_mcp_tool>
```
Returns: Details of the created folder including ID and web link

### 5. Upload File Tool
Upload a new file to a specific folder in Google Drive:
```xml
<use_mcp_tool>
<server_name>gdrive</server_name>
<tool_name>gdrive_upload_file</tool_name>
<arguments>
{
  "folder_id": "destination-folder-id",
  "filename": "example.txt",
  "mimeType": "text/plain",
  "content": "File content goes here"
}
</arguments>
</use_mcp_tool>
```
Returns: Details of the uploaded file including ID, size, and web link

### 6. Delete File Tool
Delete a file from Google Drive:
```xml
<use_mcp_tool>
<server_name>gdrive</server_name>
<tool_name>gdrive_delete_file</tool_name>
<arguments>
{
  "file_id": "file-id-to-delete"
}
</arguments>
</use_mcp_tool>
```

### 7. Move File Tool
Move a file to a different folder:
```xml
<use_mcp_tool>
<server_name>gdrive</server_name>
<tool_name>gdrive_move_file</tool_name>
<arguments>
{
  "file_id": "file-id-to-move",
  "folder_id": "destination-folder-id"
}
</arguments>
</use_mcp_tool>
```

### 8. Get File Metadata Tool
Get detailed information about a file:
```xml
<use_mcp_tool>
<server_name>gdrive</server_name>
<tool_name>gdrive_get_file_metadata</tool_name>
<arguments>
{
  "file_id": "file-id-to-get-info"
}
</arguments>
</use_mcp_tool>
```

### 9. Download File Tool
Download a file as base64 or text:
```xml
<use_mcp_tool>
<server_name>gdrive</server_name>
<tool_name>gdrive_download_file</tool_name>
<arguments>
{
  "file_id": "file-id-to-download"
}
</arguments>
</use_mcp_tool>
```

### 10. Share File Public Tool
Make a file publicly accessible via link:
```xml
<use_mcp_tool>
<server_name>gdrive</server_name>
<tool_name>gdrive_share_file_public</tool_name>
<arguments>
{
  "file_id": "file-id-to-share"
}
</arguments>
</use_mcp_tool>
```

## File Format Handling
The server automatically handles different file types:
- Google Docs → Markdown
- Google Sheets → CSV
- Google Presentations → Plain text
- Google Drawings → PNG
- Text/JSON files → UTF-8 text
- Binary files → Base64 encoded

## Common Usage Patterns

### Reading Files
1. First, search for the file you want to read:
```xml
<use_mcp_tool>
<server_name>gdrive</server_name>
<tool_name>gdrive_search</tool_name>
<arguments>
{
  "query": "project proposal"
}
</arguments>
</use_mcp_tool>
```

2. Then, use the file ID from the search results to read its contents:
```xml
<use_mcp_tool>
<server_name>gdrive</server_name>
<tool_name>gdrive_read_file</tool_name>
<arguments>
{
  "file_id": "file-id-from-search-results"
}
</arguments>
</use_mcp_tool>
```

### Creating and Managing Files
1. List folders to find a destination:
```xml
<use_mcp_tool>
<server_name>gdrive</server_name>
<tool_name>gdrive_list_folders</tool_name>
<arguments>
{}
</arguments>
</use_mcp_tool>
```

2. Create a new folder if needed:
```xml
<use_mcp_tool>
<server_name>gdrive</server_name>
<tool_name>gdrive_create_folder</tool_name>
<arguments>
{
  "name": "My New Project"
}
</arguments>
</use_mcp_tool>
```

3. Upload a file to the folder:
```xml
<use_mcp_tool>
<server_name>gdrive</server_name>
<tool_name>gdrive_upload_file</tool_name>
<arguments>
{
  "folder_id": "folder-id-from-previous-step",
  "filename": "document.txt",
  "mimeType": "text/plain",
  "content": "This is the content of my file."
}
</arguments>
</use_mcp_tool>
```

## Best Practices
1. Always use search first to find the correct file ID
2. Search results include file types (MIME types) to help identify the right file
3. Search is limited to 10 results per query, so use specific search terms
4. The server has read-only access to Google Drive

## Error Handling
If you encounter errors:
1. Verify the file ID is correct
2. Ensure you have access to the file
3. Check if the file format is supported
4. Verify the server is properly configured

Remember: Always use the tools in sequence - search first to get the file ID, then read_file to access the contents.
