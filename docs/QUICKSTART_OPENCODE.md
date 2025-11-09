# VibeSec Quick Start - OpenCode

Get started with VibeSec security scanning in OpenCode terminal agent in 2 minutes.

## Prerequisites

- OpenCode installed ([download](https://opencode.ai))
- VibeSec MCP worker deployed (already live at `wss://vibesec.vibesec.workers.dev`)

## 1. Configure OpenCode

### Option A: Command Line (Easiest)

```bash
opencode config edit
```

### Option B: Edit File Directly

- **macOS/Linux**: `~/.config/opencode/opencode.jsonc`
- **Windows**: `%APPDATA%\opencode\opencode.jsonc`

## 2. Add VibeSec to Config

Add this to your `opencode.jsonc`:

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

## 3. Restart OpenCode

Close and reopen OpenCode terminal

## 4. Start Using It!

### Scan a file:

```bash
opencode
# Then type:
@filename - scan this for security vulnerabilities
```

### Or ask directly:

```
Can you check this code for SQL injection vulnerabilities? Use vibesec_scan_code
```

## Example Usage

```
$ opencode

OpenCode 1.0.0

> Scan src/api.ts for vulnerabilities

I'll scan that file for security issues using VibeSec.
[Scanning code...]
✅ Found 3 vulnerabilities:

1. SQL Injection (High) - Line 45
   SELECT * FROM users WHERE id = ${userId}
   
2. Command Injection (Medium) - Line 67
   child_process.exec(`npm install ${packageName}`)
   
3. XSS (Low) - Line 89
   document.innerHTML = userInput
```

## Tips

### Use specific rules:

```
Can you use vibesec to scan for SQL injection in this file?
```

### Get list of detection rules:

```
What vulnerability patterns does vibesec detect?
```

### Scan multiple files:

```
Scan all files in src/ for security issues
```

## Troubleshooting

### Tool not found:

1. Check config has `"enabled": true`
2. Ensure WebSocket URL is correct: `wss://vibesec.vibesec.workers.dev`
3. Restart OpenCode completely
4. Wait 5-10 seconds for MCP to initialize

### Timeout errors:

- Increase `timeout` value to `15000` or `20000`
- Check internet connection
- Try again (first request may be slow due to worker cold start)

## Available Commands in VibeSec

### `vibesec_scan_code`

Scan code for security vulnerabilities

```
Scan this code for issues
```

### `vibesec_list_rules`

List all detection rules

```
What detection rules are available?
```

## Performance

- **First scan**: ~500ms (worker cold start)
- **Subsequent scans**: <100ms (worker warm)
- **Response time**: <100ms globally via Cloudflare edge

## Cost

✅ **FREE** - 100,000 scans/month included in Cloudflare free tier

## What Gets Scanned

VibeSec detects 22+ vulnerability patterns:

- SQL Injection
- Cross-Site Scripting (XSS)
- Command Injection
- Path Traversal
- Insecure Cryptography
- Authentication Bypass
- Sensitive Data Exposure
- Broken Access Control
- And 14+ more...

## Support

- Questions? See `docs/MCP_INSTALLATION_GUIDE.md`
- Issues? Report at: https://github.com/vibesec/vibesec/issues

---

**Status**: ✅ Ready to use!
