# VibeSec MCP Server Setup Guide

## Quick Start: Add VibeSec to Claude Code

### 1. Find Your Claude MCP Config

**Location:** `~/.claude/mcp.json`

If it doesn't exist, create it:
```bash
mkdir -p ~/.claude
touch ~/.claude/mcp.json
```

### 2. Add VibeSec Server

Open `~/.claude/mcp.json` and add:

```json
{
  "mcpServers": {
    "vibesec": {
      "command": "bun",
      "args": ["run", "/home/f3rg/src/github/vibesec-bun-poc/bin/vibesec-mcp"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

**Or if you have other servers already:**
```json
{
  "mcpServers": {
    "your-existing-server": {
      "command": "...",
      "args": [...]
    },
    "vibesec": {
      "command": "bun",
      "args": ["run", "/home/f3rg/src/github/vibesec-bun-poc/bin/vibesec-mcp"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

### 3. Restart Claude Code

Close and reopen Claude Code to load the new MCP server.

### 4. Verify It's Working

Ask Claude: "What MCP tools do you have available?"

You should see:
- `vibesec_scan` - Scan code files for security vulnerabilities
- `vibesec_list_rules` - List available security detection rules

## Example Usage

### Scan Your Current Project
```
Claude, can you scan all TypeScript files in src/ for security issues using vibesec_scan?
```

### Check What Rules Are Available
```
Claude, what security rules does VibeSec have for JavaScript?
```

### Scan Before Commit
```
Claude, before I commit, can you scan the files I've changed for security vulnerabilities?
```

## Troubleshooting

### "vibesec_scan not found"
- Check `~/.claude/mcp.json` syntax is valid JSON
- Verify the path to vibesec-mcp is correct
- Restart Claude Code

### "Error: Cannot find module"
- Make sure you've run `bun install` in the vibesec directory
- Check that bun is installed: `bun --version`

### Enable Debug Logging
Add to your MCP config:
```json
"vibesec": {
  "command": "bun",
  "args": ["run", "/home/f3rg/src/github/vibesec-bun-poc/bin/vibesec-mcp"],
  "env": {
    "NODE_ENV": "production",
    "LOG_LEVEL": "debug"
  }
}
```

## What Can VibeSec Detect?

- 🔑 Hardcoded secrets & API keys
- 💉 SQL injection vulnerabilities
- 🖥️ Command injection risks
- 📁 Path traversal issues
- ⚠️ Incomplete implementations
- 🔐 Authentication/authorization flaws
- 🤖 AI-specific security risks (prompt injection, unsafe LLM calls)

## Advanced Configuration

### Scan Specific File Types Only
When using vibesec_scan, specify files:
```json
{
  "files": ["src/**/*.ts", "lib/**/*.js"],
  "severity": "high"
}
```

### Filter by Severity
Only show critical and high severity issues:
```json
{
  "files": ["src/**/*.ts"],
  "severity": "high"
}
```

### Enable Parallel Scanning (Default)
For faster scans on large codebases:
```json
{
  "files": ["src/**/*.ts"],
  "parallel": true
}
```
