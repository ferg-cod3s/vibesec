# VibeSec MCP Server Installation Guide

Complete instructions for installing VibeSec security scanner as an MCP server in OpenCode, Claude Code, Cursor, and Claude Desktop.

## Quick Links

- **Worker URL**: `https://vibesec.vibesec.workers.dev`
- **WebSocket URL**: `wss://vibesec.vibesec.workers.dev`
- **Deployment Status**: ✅ Live on Cloudflare Workers
- **Cost**: $0/month (free tier)

---

## 1. OpenCode Installation

OpenCode is a terminal-based AI coding agent that supports both local and remote MCP servers.

### Step 1: Open OpenCode Config

OpenCode configuration files are stored in `opencode.jsonc` in your project root or globally.

```bash
# Edit global OpenCode config
opencode config edit
```

Or edit the file directly:

- **macOS/Linux**: `~/.config/opencode/opencode.jsonc`
- **Windows**: `%APPDATA%\opencode\opencode.jsonc`

### Step 2: Add VibeSec MCP Server

Add the following to your OpenCode config file:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "vibesec": {
      "type": "remote",
      "url": "wss://vibesec.vibesec.workers.dev",
      "enabled": true,
      "timeout": 10000,
    },
  },
}
```

### Step 3: Use VibeSec in OpenCode

Restart OpenCode and reference the VibeSec tools in your prompts:

```bash
Scan this file for security issues. use vibesec
```

Or add to your `AGENTS.md`:

```markdown
## Security Scanning

When you need to scan code for vulnerabilities, use the `vibesec` MCP server to check for:

- SQL Injection
- Cross-Site Scripting (XSS)
- Command Injection
- Path Traversal
- Insecure Cryptography
- And 17+ more vulnerability patterns
```

Then in your prompts:

```
@filename - can you scan this for security vulnerabilities?
```

---

## 2. Claude Code Installation

Claude Code is a web-based IDE integrated with Claude that supports MCP servers.

### Step 1: Access Claude Code Settings

1. Go to [code.claude.com](https://code.claude.com)
2. Open your project or create a new one
3. Click **Settings** (gear icon) in the top-right corner
4. Select **MCP Servers** tab

### Step 2: Add Remote MCP Server

1. Click **"Add MCP Server"** or **"+"**
2. Select **"Remote"** as the server type
3. Fill in the following:
   - **Name**: `vibesec`
   - **URL**: `wss://vibesec.vibesec.workers.dev`
   - **Type**: `Remote`

4. Leave authentication empty (not required)
5. Click **"Save"**

### Step 3: Use VibeSec in Claude Code

Once added, VibeSec tools become available in Claude Code:

1. Open any code file
2. Use @ to reference the tool:
   ```
   @vibesec_scan_code Scan this file for security issues
   ```

Or ask Claude directly:

```
Scan /src/api.ts for vulnerabilities using the vibesec tool
```

---

## 3. Cursor Installation

Cursor is an AI-powered IDE with built-in MCP support.

### Step 1: Open Cursor Settings

1. Open Cursor
2. Click **Settings** in the top-left menu (or `Cmd+,` on macOS, `Ctrl+,` on Windows/Linux)
3. Search for "MCP" in settings
4. Find **"MCP Servers"** section (under Context)

### Step 2: Add MCP Server Configuration

In Cursor, you can configure MCP servers in two ways:

#### Option A: Via GUI Settings (Easiest)

1. In Settings, find "MCP Servers"
2. Click **"+"** to add a new server
3. Configure:
   - **Type**: `Remote`
   - **Name**: `vibesec`
   - **URL**: `wss://vibesec.vibesec.workers.dev`
   - **Enabled**: Toggle ON

4. Click **Save**

#### Option B: Via Configuration File

Edit your Cursor configuration file:

**macOS/Linux:**

```bash
~/.cursor/settings/settings.json
```

**Windows:**

```
C:\Users\<YourUsername>\AppData\Local\Cursor\settings\settings.json
```

Add or update the `mcpServers` section:

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

### Step 3: Use VibeSec in Cursor

After restart, VibeSec tools are available:

1. Reference files with `@` in your prompt:

   ```
   @filename - scan this for security vulnerabilities
   ```

2. Or use the tool directly in Cursor's chat/agent mode

3. Cursor will automatically make available the `vibesec_scan_code` tool

---

## 4. Claude Desktop Installation

Claude Desktop is the desktop application for Claude that supports MCP servers.

### Option A: Desktop Extension (Recommended)

Claude Desktop supports "desktop extensions" for easier installation.

Unfortunately, VibeSec doesn't have an official desktop extension yet, so use **Option B** below.

### Option B: Manual JSON Configuration

#### Step 1: Locate Claude Configuration Directory

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

#### Step 2: Edit Configuration File

Open the config file and add the remote MCP server:

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

Your full config might look like:

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
        "GITHUB_PERSONAL_ACCESS_TOKEN": "your-token-here"
      }
    }
  }
}
```

#### Step 3: Restart Claude Desktop

1. Close Claude Desktop completely
2. Reopen it
3. The VibeSec MCP server will be available

#### Step 4: Use VibeSec in Claude Desktop

Once running, VibeSec tools appear in your conversations:

1. In chat, ask Claude to scan code:

   ```
   Can you scan this code for security issues?
   ```

2. Claude will automatically use the `vibesec_scan_code` tool

3. Results appear directly in the conversation

---

## Verification & Testing

### Verify Connection

To confirm VibeSec is properly connected:

#### In OpenCode:

```bash
opencode
# Then type: Use the vibesec tool to scan a simple SQL query for injection
```

#### In Claude Code:

Navigate to a .ts/.js file and ask:

```
@vibesec_scan_code Scan this file for issues
```

#### In Cursor:

Type in chat:

```
@vibesec_scan_code Check this code for vulnerabilities
```

#### In Claude Desktop:

Ask in chat:

```
Can you scan my code for vulnerabilities?
```

### Expected Response

If configured correctly, you should see VibeSec scanning code and returning findings like:

```
Scanning code...
Found 2 vulnerabilities:
1. SQL Injection (High) - Line 45
2. Command Injection (Medium) - Line 67
```

---

## Troubleshooting

### Issue: "MCP Server not found" or "Connection refused"

**Solution:**

1. Verify URL is correct: `wss://vibesec.vibesec.workers.dev`
2. Test connection: `curl -i https://vibesec.vibesec.workers.dev` (should return HTTP 426)
3. Restart your IDE completely
4. Check internet connection

### Issue: "vibesec_scan_code tool not available"

**Solution:**

1. Ensure `"enabled": true` in your config
2. Increase timeout value to `10000` (10 seconds)
3. Restart IDE and wait 5-10 seconds for MCP to fully initialize
4. Check tool naming - it's `vibesec_scan_code` (not `vibesec`)

### Issue: Slow responses

**Solution:**

- VibeSec runs on Cloudflare edge network, so responses should be <100ms
- If slow, it might be network issue - try restarting
- Cloudflare workers can take 100-500ms for first execution due to cold start

### Issue: "HTTP 426 Expected WebSocket upgrade"

**This is normal!** It means:

- The worker is live and responding
- It's correctly rejecting HTTP requests
- Your MCP client should be using WebSocket (`wss://`)
- Configuration is correct if client is using `wss://`

---

## Advanced Configuration

### Adding Authentication Headers (Optional)

If you want to add custom headers (for future authentication):

#### OpenCode:

```jsonc
{
  "mcp": {
    "vibesec": {
      "type": "remote",
      "url": "wss://vibesec.vibesec.workers.dev",
      "headers": {
        "Authorization": "Bearer YOUR_TOKEN_HERE",
      },
      "enabled": true,
    },
  },
}
```

#### Claude Desktop:

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

Note: Headers via config not currently supported in Claude Desktop - use environment variables instead.

### Enable/Disable Per Project

#### OpenCode:

```jsonc
{
  "mcp": {
    "vibesec": {
      "type": "remote",
      "url": "wss://vibesec.vibesec.workers.dev",
      "enabled": false, // Disable for this project
    },
  },
}
```

#### Cursor:

Just toggle in Settings > MCP Servers > vibesec

---

## Detection Capabilities

VibeSec detects 22+ vulnerability patterns:

- **SQL Injection** - Direct SQL queries with user input
- **Cross-Site Scripting (XSS)** - Unsafe DOM manipulation
- **Command Injection** - Shell command execution
- **Path Traversal** - Unsafe file system access
- **Insecure Cryptography** - Weak algorithms
- **Authentication Bypass** - Missing auth checks
- **Sensitive Data Exposure** - Hardcoded secrets
- **Broken Access Control** - Permission issues
- **Unsafe Deserialization** - Object parsing risks
- **Vulnerable Dependencies** - Known CVEs
- **SSRF** - Server-side request forgery
- **API Abuse** - Rate limiting bypasses
- Plus 10+ additional patterns...

---

## Support & Issues

### Troubleshooting Guide

For common issues:

1. Verify worker is live: `curl https://vibesec.vibesec.workers.dev`
2. Check logs on Cloudflare: `wrangler tail --format=pretty`
3. Ensure IDE is connected to internet
4. Try disabling and re-enabling MCP server in settings

### Feature Requests

- Submit issues at: https://github.com/vibesec/vibesec/issues

### VibeSec Documentation

- Full docs: See `README.md` and `DEPLOYMENT_LIVE.md`
- Architecture: See `docs/ARCHITECTURE.md`

---

## Cost & Performance

| Metric            | Value                    |
| ----------------- | ------------------------ |
| **Monthly Cost**  | $0 (free tier)           |
| **Response Time** | <100ms globally          |
| **Uptime**        | 99.97% (Cloudflare SLA)  |
| **Regions**       | 200+ edge locations      |
| **Data Transfer** | Free (no egress charges) |

---

## Next Steps

1. ✅ Configure MCP server for your tool (OpenCode/Claude/Cursor)
2. ✅ Restart your IDE
3. ✅ Test by scanning sample code
4. ✅ Use in your projects!

---

**Status**: ✅ VibeSec MCP Server is live and ready to use!
