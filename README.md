# Google Drive MCP Server
This project provides a server-side implementation for Google Drive's Media Content Protocol (MCP). It enables the retrieval of media content from Google Drive files and serves them over HTTP.

## 📝 Table of Contents

- [Features](#-features)
- [Test Cases](#-test-cases)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Google Cloud Configuration](#-google-cloud-configuration)
- [Authentication](#-authentication)
- [Usage](#-usage)
- [Security](#-security)
- [Troubleshooting](#-troubleshooting)
- [Resources](#-resources)

## ✨ Features

- Retrieve media content from Google Drive files
- Serve media over HTTP
- OAuth2 authentication


## 🧪 Test Cases

### Successful Test Execution
![Passed Tests](./public/images/passed_tests.png)

### Failed Test Scenario 
![Failed Tests](./public/images/failed_tests.png)

### Test Coverage
![Test Coverage](./public/images/test_coverage.png)

## 🔑 Prerequisites

- Node.js v16+
- Google Cloud account
- Terminal/CLI access

## 🛠️ Installation

1. Clone repository:
```bash
# git clone https://github.com/felores/gdrive-mcp-server.git
git clone https://github.com/chandramoulisangabathula01/GDrive-AI-Sync.git
cd GDrive-AI-Sync
```

2. Install dependencies:
```bash
npm install
```

3. Create credentials directory:
```bash
mkdir credentials
```

## ☁️ Google Cloud Configuration

1. **Enable Drive API**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create project > APIs & Services > Library
   - Search & enable "Google Drive API"

2. **Configure OAuth Consent Screen**:
   - Select "External" user type
   - Add required scopes:
     - `https://www.googleapis.com/auth/drive.readonly`
     - `https://www.googleapis.com/auth/userinfo.email`
   - Add `localhost` as authorized domain

3. **Create Desktop Credentials**:
   - Credentials > Create Credentials > OAuth Client ID
   - Application type: Desktop
   - Name: "MCP GDrive Desktop Client"
   - Download JSON credentials

4. **Setup Credential Files**:
```bash
mv ~/Downloads/client_secret_*.json credentials/gcp-oauth.keys.json
```

## 🔐 Authentication

1. Run initial setup:
```bash
npm run auth
```

2. Complete browser OAuth flow

3. Verify credentials:
```bash
ls credentials/ # Should contain:
# - gcp-oauth.keys.json
# - .gdrive-server-credentials.json (auto-generated)
```

## 🚦 Usage

**Start Server**:
```bash
npm run dev
```

**Integration Configuration**:
```json
{
  "mcpServers": {
    "gdrive": {
      "command": "node",
      "args": ["PATH/TO/dist/index.js"],
      "env": {
        "GOOGLE_APPLICATION_CREDENTIALS": "PATH/TO/gcp-oauth.keys.json",
        "MCP_GDRIVE_CREDENTIALS": "PATH/TO/.gdrive-server-credentials.json"
      }
    }
  }
}
```

## 🔒 Security

- Credentials directory excluded in .gitignore
- Never commit/store:
  - `gcp-oauth.keys.json`
  - `.gdrive-server-credentials.json`
- Read-only Drive access scope
- OAuth tokens refresh automatically

## 🚨 Troubleshooting

- Verify Drive API enabled
- Confirm OAuth scopes match
- Check credential file permissions
- Ensure no spaces in paths (use quotes)

## 📚 Resources

- [Google Drive API Docs](https://developers.google.com/drive/api/v3/reference)
- [OAuth 2.0 Guide](https://developers.google.com/identity/protocols/oauth2)