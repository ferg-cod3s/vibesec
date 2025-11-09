# VibeSec Quick Start - Cursor

Get started with VibeSec security scanning in Cursor IDE in 2 minutes.

## Prerequisites

- Cursor IDE installed ([download](https://www.cursor.com))
- VibeSec MCP worker deployed (already live at `wss://vibesec.vibesec.workers.dev`)

## Option 1: Via GUI (Easiest)

### Step 1: Open Cursor Settings

1. Press `Cmd+,` (macOS) or `Ctrl+,` (Windows/Linux)
2. Search for "MCP"
3. Find **"MCP Servers"** section

### Step 2: Add VibeSec

1. Click **"+"** button to add new server
2. Select **"Remote"** type
3. Enter:
   - **Name**: `vibesec`
   - **URL**: `wss://vibesec.vibesec.workers.dev`
   - **Enabled**: Toggle ON

### Step 3: Restart Cursor

- Press `Cmd+Q` (macOS) or `Alt+F4` (Windows) to quit
- Reopen Cursor

## Option 2: Via Configuration File

### Step 1: Open Config Directory

**macOS/Linux:**
```bash
~/.cursor/settings/settings.json
```

**Windows:**
```
C:\Users\<YourUsername>\AppData\Local\Cursor\settings\settings.json
```

### Step 2: Add VibeSec Configuration

Add this to your settings file:

```json
{
  "mcpServers": {
    "vibesec": {
      "type": "remote",
      "url": "wss://vibesec.vibesec.workers.dev",
      "enabled": true
    }
  }
}
```

### Step 3: Restart Cursor

Close and reopen Cursor

## 4. Start Using It!

In Cursor chat or composer:

```
@vibesec_scan_code - Scan this file for security vulnerabilities
```

Or simply ask:

```
Can you check this code for security issues?
```

## Example Usage

```
You:
@filename - check this for vulnerabilities

const username = req.query.username;
const password = req.query.password;
const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
db.execute(query);

Cursor:
I'll scan this code using VibeSec for security issues.

🔴 SQL Injection (High) - Line 3
Directly concatenating user input into SQL query allows injection attacks.

Fix: Use parameterized queries:
db.execute(
  'SELECT * FROM users WHERE username = ? AND password = ?',
  [username, password]
)
```

## Key Features

### File Scanning

```
Can you scan /src/api.ts for security issues?
```

### Batch Scanning

```
@vibesec_scan_code - Check all these files for vulnerabilities
[files...]
```

### Specific Vulnerability Checks

```
Check this code for SQL injection and command injection vulnerabilities only
```

### Get Security Rules

```
What are all the security patterns VibeSec can detect?
```

## Tips for Cursor

### Use @ mentions for faster access:

```
@vibesec - scan this for issues
```

### In Composer mode:

Open file and press `Cmd+I`, then:

```
Scan this file for security vulnerabilities using @vibesec
```

### Inline Security Checks:

Highlight code block and ask Claude:

```
Scan this selected code for security vulnerabilities
```

## Troubleshooting

### MCP Server not appearing

1. Open Settings with `Cmd+,`
2. Search "MCP Servers"
3. Verify VibeSec is in the list
4. If not, try manual config file edit
5. Restart Cursor

### Tool not working

1. Check URL: `wss://vibesec.vibesec.workers.dev`
2. Ensure `"enabled": true`
3. Verify internet connection
4. Try starting new chat conversation

### Slow responses

- First request: ~500ms (worker initializing)
- Normal requests: <100ms
- Check your internet connection

## Configuration Details

### Complete Example

```json
{
  "mcpServers": {
    "vibesec": {
      "type": "remote",
      "url": "wss://vibesec.vibesec.workers.dev",
      "enabled": true
    },
    "filesystem": {
      "type": "local",
      "command": "npx",
      "args": ["@modelcontextprotocol/server-filesystem", "/home/user/projects"]
    }
  }
}
```

### Config File Locations

**macOS:**
```
~/.cursor/settings/settings.json
~/Library/Application Support/Cursor/settings.json
```

**Windows:**
```
C:\Users\<YourUsername>\AppData\Local\Cursor\settings\settings.json
%APPDATA%\Cursor\settings\settings.json
```

**Linux:**
```
~/.cursor/settings/settings.json
~/.config/Cursor/settings.json
```

## What VibeSec Detects

**Critical Issues:**
- SQL Injection
- Command Injection
- Cross-Site Scripting (XSS)

**High Priority:**
- Path Traversal
- Insecure Cryptography
- Authentication Bypass

**Also Covers:**
- Sensitive Data Exposure
- Broken Access Control
- SSRF & XXE
- Unsafe Deserialization
- Vulnerable Dependencies
- And 12+ more patterns

## Performance Metrics

| Metric | Value |
|--------|-------|
| **Cost** | FREE |
| **First Scan** | ~500ms |
| **Subsequent** | <100ms |
| **Global Latency** | <100ms |
| **Uptime** | 99.97% SLA |

## Support

- **Full Guide**: `docs/MCP_INSTALLATION_GUIDE.md`
- **Issues**: https://github.com/vibesec/vibesec/issues
- **GitHub**: https://github.com/vibesec/vibesec

---

**Status**: ✅ Ready to use in Cursor!
