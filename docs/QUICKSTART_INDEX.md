# VibeSec Quick Start Guides

Choose your AI coding platform and get started with VibeSec security scanning in minutes!

## 🚀 Quick Links

| Platform | Guide | Setup Time |
|----------|-------|-----------|
| **OpenCode** | [Quick Start](./QUICKSTART_OPENCODE.md) | 2 min |
| **Claude Desktop** | [Quick Start](./QUICKSTART_CLAUDE_DESKTOP.md) | 2 min |
| **Cursor** | [Quick Start](./QUICKSTART_CURSOR.md) | 2 min |
| **Claude Code** | [Setup Guide](./MCP_INSTALLATION_GUIDE.md#2-claude-code-installation) | 2 min |

## Get Started in 2 Steps

### Step 1: Choose Your Platform

- **Terminal User?** → [OpenCode Quick Start](./QUICKSTART_OPENCODE.md)
- **Desktop App User?** → [Claude Desktop Quick Start](./QUICKSTART_CLAUDE_DESKTOP.md)
- **IDE User?** → [Cursor Quick Start](./QUICKSTART_CURSOR.md)
- **Web Browser User?** → [Claude Code Setup](./MCP_INSTALLATION_GUIDE.md#2-claude-code-installation)

### Step 2: Follow Your Platform's Guide

Each guide has:
- ✅ Copy-paste configuration
- ✅ Step-by-step instructions
- ✅ Example usage
- ✅ Troubleshooting tips

## What is VibeSec?

VibeSec is a security scanner for AI-generated code that detects 22+ vulnerability patterns including:

- SQL Injection
- Cross-Site Scripting (XSS)
- Command Injection
- Path Traversal
- Insecure Cryptography
- And 17+ more patterns...

## How It Works

1. **You** write or paste code
2. **VibeSec** scans for vulnerabilities
3. **Your AI** provides security recommendations
4. **You** fix the issues

Example:

```
You: Scan this code for security vulnerabilities

Vulnerable Code:
const query = "SELECT * FROM users WHERE id = " + userId;

VibeSec Response:
🔴 SQL Injection (High) - Line 1
Directly concatenating user input into SQL queries allows injection attacks.

Fix: Use parameterized queries
const query = "SELECT * FROM users WHERE id = ?";
db.query(query, [userId]);
```

## Common Use Cases

### Security Review

```
Can you scan my API endpoints for security vulnerabilities?
```

### Vulnerability Hunting

```
Check this code for SQL injection and command injection issues
```

### Security Compliance

```
Make sure all user input is properly sanitized in this code
```

### Secure Coding

```
Show me the security issues in this code and how to fix them
```

## Platform Comparison

### OpenCode (Terminal)

- **Best for**: Developers who live in the terminal
- **Speed**: Fast, no GUI overhead
- **Setup**: 2 minutes
- **Features**: Full MCP support, integrates with your CLI workflow

[→ OpenCode Quick Start](./QUICKSTART_OPENCODE.md)

### Claude Desktop

- **Best for**: Desktop application users
- **Speed**: Instant scanning in Claude conversations
- **Setup**: 2 minutes (edit JSON config)
- **Features**: Native integration, no dependencies

[→ Claude Desktop Quick Start](./QUICKSTART_CLAUDE_DESKTOP.md)

### Cursor

- **Best for**: Cursor IDE users
- **Speed**: Inline scanning while coding
- **Setup**: 2 minutes (GUI or config)
- **Features**: GUI settings, hot reload

[→ Cursor Quick Start](./QUICKSTART_CURSOR.md)

### Claude Code

- **Best for**: Web browser users
- **Speed**: Web-based, no installation
- **Setup**: 2 minutes (web GUI)
- **Features**: Browser-based, works anywhere

[→ Claude Code Setup](./MCP_INSTALLATION_GUIDE.md#2-claude-code-installation)

## Key Benefits

✅ **Free** - $0/month (Cloudflare free tier)  
✅ **Fast** - <100ms scanning time  
✅ **Global** - 200+ edge locations  
✅ **Reliable** - 99.97% uptime SLA  
✅ **Easy** - 2-minute setup  

## Troubleshooting

### General Issues

**Q: MCP server not showing up?**

A: 
1. Check configuration file syntax (no trailing commas)
2. Restart your IDE/terminal completely
3. Wait 5-10 seconds for MCP to initialize
4. Check internet connection

**Q: Tool not available?**

A:
1. Verify `"enabled": true` in config
2. Ensure correct WebSocket URL: `wss://vibesec.vibesec.workers.dev`
3. Start a new conversation/tab
4. Restart the application

**Q: Slow responses?**

A:
- First request: ~500ms (worker cold start)
- Normal: <100ms after that
- Check your internet speed

### Platform-Specific Help

- **OpenCode issues**: See [OpenCode guide troubleshooting](./QUICKSTART_OPENCODE.md#troubleshooting)
- **Claude Desktop issues**: See [Claude Desktop guide troubleshooting](./QUICKSTART_CLAUDE_DESKTOP.md#troubleshooting)
- **Cursor issues**: See [Cursor guide troubleshooting](./QUICKSTART_CURSOR.md#troubleshooting)
- **Claude Code issues**: See [Installation guide](./MCP_INSTALLATION_GUIDE.md#troubleshooting)

## Full Documentation

For complete details on all platforms, see:

📖 **[MCP Installation Guide](./MCP_INSTALLATION_GUIDE.md)** - Comprehensive setup for all platforms

## Support & Feedback

- **Report Issues**: https://github.com/vibesec/vibesec/issues
- **GitHub**: https://github.com/vibesec/vibesec
- **Documentation**: See `docs/` directory

## What's Included

### VibeSec Tools

- `vibesec_scan` - Scan code for vulnerabilities
- `vibesec_scan_code` - Scan code for vulnerabilities (claude-compatible alias)
- `vibesec_list_rules` - List all detection rules

### Detection Patterns (22+)

**Injection Attacks**
- SQL Injection
- Command Injection
- XPath Injection
- OS Command Injection

**XSS & DOM**
- Cross-Site Scripting (XSS)
- DOM-based XSS
- HTML Injection

**Access & Auth**
- Authentication Bypass
- Broken Access Control
- Privilege Escalation

**Data & Crypto**
- Insecure Cryptography
- Sensitive Data Exposure
- Hardcoded Secrets

**And More**
- Path Traversal
- SSRF (Server-Side Request Forgery)
- Unsafe Deserialization
- Race Conditions
- And 8+ additional patterns

## Performance

| Metric | Value |
|--------|-------|
| **Monthly Cost** | $0 (free!) |
| **First Scan** | ~500ms |
| **Subsequent Scans** | <100ms |
| **Global Latency** | <100ms |
| **Uptime SLA** | 99.97% |
| **Max Scans** | 100,000/month free |
| **Data Transfer** | Free (no egress charges) |

## Next Steps

1. **Choose your platform** from the links above
2. **Follow the 2-minute setup guide**
3. **Start scanning code** for vulnerabilities
4. **Share feedback** at https://github.com/vibesec/vibesec/issues

---

**Status**: ✅ VibeSec is live and ready to use!

**Version**: 1.0.0  
**Last Updated**: November 9, 2025  
**Worker URL**: https://vibesec.vibesec.workers.dev
