# VibeSec Quick Start - Claude Desktop

Get started with VibeSec security scanning in Claude Desktop in 2 minutes.

## Prerequisites

- Claude Desktop installed ([download](https://claude.ai/download))
- Administrator access to edit config files
- VibeSec MCP worker deployed (already live at `wss://vibesec.vibesec.workers.dev`)

## 1. Locate Configuration File

Open your system file explorer:

**macOS:**
```
~/Library/Application Support/Claude/claude_desktop_config.json
```

**Windows:**
```
%APPDATA%\Claude\claude_desktop_config.json
```

**Linux:**
```
~/.config/Claude/claude_desktop_config.json
```

## 2. Edit Configuration

Add VibeSec to your MCP servers configuration:

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

**Full example** (if you have other MCP servers):

```json
{
  "mcpServers": {
    "vibesec": {
      "type": "remote",
      "url": "wss://vibesec.vibesec.workers.dev",
      "enabled": true
    },
    "github": {
      "type": "local",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "your-token"
      }
    }
  }
}
```

## 3. Restart Claude Desktop

1. **Close** Claude Desktop completely
2. **Wait** 5 seconds
3. **Open** Claude Desktop again
4. **Wait** 10 seconds for MCP to initialize

## 4. Start Using It!

In Claude chat, ask:

```
Can you scan this code for security vulnerabilities?
[paste your code]
```

Claude will automatically use the VibeSec tool!

## Example Conversation

```
You:
Can you scan this code for security issues?

function getUserData(userId) {
  const query = "SELECT * FROM users WHERE id = " + userId;
  const db = require('mysql');
  db.query(query);
}

Claude:
I'll scan this code for security vulnerabilities using VibeSec.

[Analyzing code...]

Found 1 security vulnerability:

🔴 SQL Injection (High Severity) - Line 3
The query concatenates user input directly into the SQL statement.

Risk: Attackers could inject malicious SQL commands
Fix: Use parameterized queries instead:
  db.query("SELECT * FROM users WHERE id = ?", [userId])
```

## Common Workflows

### Scan a file from your project:

```
I have a file at /Users/john/project/src/api.ts. Can you scan it for vulnerabilities?
```

### Check specific vulnerability types:

```
Check this code for SQL injection and XSS vulnerabilities
```

### Get security recommendations:

```
What are the top security issues in this code and how should I fix them?
```

### Audit multiple functions:

```
I have these functions in my codebase. Can you scan them all for security issues?
[paste functions]
```

## Troubleshooting

### MCP Server not showing up

1. **Check file path** - Verify config is in the correct directory
2. **Check JSON syntax** - Ensure no trailing commas
3. **Restart Claude** - Close and reopen completely
4. **Wait for initialization** - Takes 5-10 seconds on first load

### VibeSec tool not available

1. **Check enabled flag** - Ensure `"enabled": true`
2. **Verify URL** - Should be `wss://vibesec.vibesec.workers.dev`
3. **Check internet** - Worker requires internet connection
4. **Try refreshing** - Start a new conversation

### Slow responses

- First request may take 500ms (worker cold start)
- Subsequent requests: <100ms
- If consistently slow, check internet connection

## File Format Reference

### Configuration File Structure

```json
{
  "mcpServers": {
    "SERVER_NAME": {
      "type": "remote",
      "url": "wss://url-to-server",
      "enabled": true
    }
  }
}
```

### No trailing commas!

This is **wrong**:
```json
{
  "mcpServers": {
    "vibesec": {
      "type": "remote",
      "url": "wss://vibesec.vibesec.workers.dev",
      "enabled": true,  // ← trailing comma causes error
    }
  }
}
```

This is **correct**:
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

## Detection Capabilities

VibeSec scans for 22+ vulnerability patterns:

**Top Findings:**
- SQL Injection
- Cross-Site Scripting (XSS)
- Command Injection
- Path Traversal
- Insecure Cryptography

**Also Detects:**
- Authentication Bypass
- Sensitive Data Exposure
- Broken Access Control
- SSRF (Server-Side Request Forgery)
- Unsafe Deserialization
- And 12+ more patterns

## Performance & Cost

| Metric | Value |
|--------|-------|
| **Monthly Cost** | $0 (free!) |
| **First Scan** | ~500ms |
| **Subsequent Scans** | <100ms |
| **Global Latency** | <100ms |
| **Uptime SLA** | 99.97% |

## Support & Documentation

- **Full Setup Guide**: `docs/MCP_INSTALLATION_GUIDE.md`
- **Report Issues**: https://github.com/vibesec/vibesec/issues
- **GitHub**: https://github.com/vibesec/vibesec

---

**Status**: ✅ Ready to use!
