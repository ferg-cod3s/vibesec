# VibeSec Installation Guide

## 🚀 Quick Installation

### Option 1: Install from npm (Recommended for Users)

```bash
# Install globally
npm install -g vibesec

# Or install locally
npm install vibesec

# Verify installation
vibesec --version
```

### Option 2: Install from Source (Recommended for Developers)

```bash
# Clone the repository
git clone https://github.com/vibesec/vibesec.git
cd vibesec

# Install dependencies
npm install

# Build the project
npm run build

# Install globally (optional)
npm install -g .
```

---

## 🔧 MCP Server Setup

VibeSec provides MCP (Model Context Protocol) server integration for AI assistants like Claude Code, Cursor, and Cline.

### Step 1: Build/Install VibeSec

If you haven't already, install VibeSec from source (Option 2 above) to get the MCP server.

### Step 2: Configure Claude Code

Create or edit your Claude Code MCP configuration:

```bash
# Create the config directory
mkdir -p ~/.claude

# Add VibeSec to your MCP configuration
cat > ~/.claude/mcp.json << 'EOF'
{
  "mcpServers": {
    "vibesec": {
      "command": "node",
      "args": ["/absolute/path/to/vibesec/dist/mcp/server.js"],
      "cwd": "/absolute/path/to/vibesec"
    }
  }
}
EOF
```

**Important:** Replace `/absolute/path/to/vibesec` with the actual path where you cloned VibeSec.

### Step 3: Restart Claude Code

Close and reopen Claude Code to load the VibeSec MCP server.

### Step 4: Verify Installation

In Claude Code, ask:

```
What MCP tools do you have available?
```

You should see `vibesec_scan` and `vibesec_list_rules` in the response.

---

## 🛠️ Alternative MCP Configurations

### Using Bun Runtime (Faster)

If you have Bun installed, you can use it for better performance:

```json
{
  "mcpServers": {
    "vibesec": {
      "command": "bun",
      "args": ["run", "/absolute/path/to/vibesec/bin/vibesec-mcp"],
      "cwd": "/absolute/path/to/vibesec"
    }
  }
}
```

### Using npm Scripts

If you installed VibeSec globally:

```json
{
  "mcpServers": {
    "vibesec": {
      "command": "vibesec-mcp"
    }
  }
}
```

---

## 📱 Other AI Assistants

### Cursor

Add to your Cursor MCP configuration (usually in `~/.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "vibesec": {
      "command": "node",
      "args": ["/absolute/path/to/vibesec/dist/mcp/server.js"]
    }
  }
}
```

### Cline

Add to your Cline MCP configuration (usually in `~/.cline/mcp.json`):

```json
{
  "mcpServers": {
    "vibesec": {
      "command": "node",
      "args": ["/absolute/path/to/vibesec/dist/mcp/server.js"]
    }
  }
}
```

---

## 🧪 Testing Your Installation

### Test CLI

```bash
# Scan a sample file
vibesec scan src/mcp/tools/scan.ts

# List available rules
vibesec list-rules

# Get help
vibesec --help
```

### Test MCP Integration

In Claude Code:

```
Claude, can you use vibesec_scan to check this file for security issues?
```

Or:

```
Claude, use vibesec_list_rules to show me all available security rules.
```

---

## 🔍 Troubleshooting

### Common Issues

#### 1. "Command not found" error

```bash
# If you installed globally but command isn't found
echo $PATH  # Check if npm global bin is in PATH

# Add npm global bin to PATH (add to ~/.bashrc or ~/.zshrc)
export PATH="$(npm config get prefix)/bin:$PATH"
```

#### 2. MCP server not starting

```bash
# Check if the file exists
ls -la /absolute/path/to/vibesec/dist/mcp/server.js

# Check if Node.js is installed
node --version

# Test the server manually
node /absolute/path/to/vibesec/dist/mcp/server.js
```

#### 3. Permission denied

```bash
# Make the binary executable
chmod +x /absolute/path/to/vibesec/bin/vibesec-mcp

# Or use npm global installation instead
npm install -g vibesec
```

#### 4. Claude Code doesn't show VibeSec tools

1. Verify the MCP configuration file syntax: `cat ~/.claude/mcp.json`
2. Check that the path is absolute and correct
3. Restart Claude Code completely (close all windows)
4. Check Claude Code logs for errors

### Debug Mode

Enable debug logging to troubleshoot issues:

```bash
# Set debug environment variable
export DEBUG=vibesec:*

# Run with debug output
DEBUG=vibesec:* vibesec scan .
```

For MCP server debugging:

```json
{
  "mcpServers": {
    "vibesec": {
      "command": "node",
      "args": ["/absolute/path/to/vibesec/dist/mcp/server.js"],
      "env": {
        "DEBUG": "vibesec:*"
      }
    }
  }
}
```

---

## 📋 System Requirements

### Minimum Requirements

- **Node.js**: 16.0.0 or higher
- **npm**: 7.0.0 or higher
- **OS**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 18.04+)

### Recommended Requirements

- **Node.js**: 18.0.0 or higher
- **Bun**: 1.0.0 or higher (for better performance)
- **Memory**: 4GB RAM or higher
- **Storage**: 500MB free disk space

### AI Assistant Requirements

- **Claude Code**: Latest version
- **Cursor**: Latest version
- **Cline**: Latest version

---

## 🔄 Updates

### Update CLI Installation

```bash
# If installed globally
npm update -g vibesec

# If installed locally
npm update vibesec
```

### Update Source Installation

```bash
cd vibesec
git pull origin main
npm install
npm run build
```

### Update MCP Configuration

After updating, restart your AI assistant to load the new version.

---

## 🆘 Getting Help

### Documentation

- [Quick Start Guide](./QUICK_START.md)
- [API Documentation](./API.md)
- [Detection Rules](./DETECTION_RULES.md)

### Community

- **GitHub Issues**: [Create an issue](https://github.com/vibesec/vibesec/issues)
- **Discord**: [Join our community](https://discord.gg/vibesec)
- **Twitter**: [@vibesec_dev](https://twitter.com/vibesec_dev)

### Support

- **Email**: support@vibesec.dev
- **Documentation**: [docs.vibesec.dev](https://docs.vibesec.dev)

---

## 🎯 Next Steps

After installation:

1. **Read the Quick Start Guide** - Learn basic usage in 5 minutes
2. **Try the Examples** - Test with sample vulnerable code
3. **Configure Your Project** - Add `.vibesec.yaml` for custom settings
4. **Integrate with CI/CD** - Add automated security scanning
5. **Explore Advanced Features** - Custom rules, integrations, and reporting

Happy secure coding! 🚀
