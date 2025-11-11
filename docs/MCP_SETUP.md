# MCP Server Configuration

This document describes the Model Context Protocol (MCP) servers configured for VibeSec.

## Configured Servers

### 1. Playwright (`@playwright/mcp@latest`)

**Purpose**: Browser automation for web-based security testing

**Command**: `npx @playwright/mcp@latest`

**Use Cases**:

- Testing web vulnerabilities (XSS, CSRF)
- Dynamic analysis of web applications
- Automated security test scenarios

---

### 2. Context7 (`@upstash/context7-mcp`)

**Purpose**: AI-powered code context and documentation search

**Command**: `npx -y @upstash/context7-mcp`

**Use Cases**:

- Searching library documentation
- Understanding API usage patterns
- Resolving package dependencies and compatibility

---

### 3. Sentry (Self-Hosted)

**Purpose**: Error monitoring and performance tracking

**Command**: `npx @sentry/mcp-server@latest`
**Host**: `sentry.fergify.work` (self-hosted instance)
**Access Token**: Configured in `.mcp.json`

**Use Cases**:

- Real-time error tracking
- Performance monitoring
- Release health tracking
- User feedback collection

**Environment Variables**:

```bash
SENTRY_DSN=https://xxx@sentry.fergify.work/xxx
NODE_ENV=production
VIBESEC_VERSION=1.0.0
SENTRY_TRACES_SAMPLE_RATE=0.1
SENTRY_PROFILES_SAMPLE_RATE=0.1
```

---

### 4. GitHub MCP

**Purpose**: GitHub integration for issue tracking, PR management

**Command**: `docker run ghcr.io/github/github-mcp-server`
**Authentication**: GitHub Personal Access Token

**Use Cases**:

- Creating and managing GitHub issues
- Automating PR workflows
- Repository management
- Security advisory integration

---

### 5. Conexus

**Purpose**: Local knowledge graph and context management

**Command**: `cd /home/f3rg/src/github/conexus && ./bin/conexus`
**Database**: `/home/f3rg/src/github/conexus/data/conexus.db`

**Use Cases**:

- Project-specific context retention
- Knowledge graph building
- Dependency tracking
- Code relationship mapping

---

## Remote Server (Not Currently Configured)

### Socket.dev MCP

**URL**: `https://mcp.socket.dev/`
**Type**: Remote MCP server

**Note**: Claude Code's MCP configuration currently uses the `stdio` transport protocol. Remote MCP servers (HTTP/WebSocket) may require a different integration approach. If you need Socket.dev integration, we can:

1. Create a local proxy server that connects to the remote endpoint
2. Use the Socket.dev API directly in VibeSec code
3. Check if Claude Code adds remote MCP support in future versions

**What Socket.dev Provides**:

- npm package security scanning
- Supply chain vulnerability detection
- Malicious package detection
- Dependency risk analysis

---

## Configuration File

All MCP servers are configured in `.mcp.json`:

```json
{
  "mcpServers": {
    "playwright": { ... },
    "context7": { ... },
    "sentry": { ... },
    "github": { ... },
    "conexus": { ... }
  }
}
```

## Testing MCP Servers

### Test Sentry Integration

```bash
bun run src/observability/integrations/sentry-test.ts
```

Expected output:

- ✅ Sentry initialized
- ✅ Test errors captured
- ✅ Breadcrumbs added
- ✅ Performance monitoring active

Check your Sentry dashboard at: https://sentry.fergify.work

### Test Playwright

Playwright commands are available through Claude Code when the server is active.

### Test GitHub MCP

```bash
# List issues
gh issue list

# Create issue
gh issue create --title "Test Issue" --body "Testing MCP integration"
```

### Test Context7

Context7 provides library documentation search through Claude Code prompts like:

- "Show me the latest FastAPI documentation"
- "How do I use Pydantic V2?"

### Test Conexus

Conexus runs as a local knowledge graph server and provides context persistence.

---

## Security Considerations

### Credentials in Configuration

⚠️ **IMPORTANT**: The `.mcp.json` file contains sensitive credentials:

- Sentry access token
- GitHub Personal Access Token

**Security Best Practices**:

1. **Add `.mcp.json` to `.gitignore`** (if not already):

   ```bash
   echo ".mcp.json" >> .gitignore
   ```

2. **Create a template file** for team members:

   ```bash
   cp .mcp.json .mcp.json.example
   # Then manually remove sensitive tokens from .mcp.json.example
   ```

3. **Use environment variables** for sensitive data:

   ```json
   {
     "args": ["--access-token=${SENTRY_ACCESS_TOKEN}", "--host=${SENTRY_HOST}"]
   }
   ```

4. **Rotate tokens regularly** - especially if committing config files

### Current Exposed Credentials

⚠️ **ACTION REQUIRED**: The following credentials are currently in plain text:

- **Sentry Access Token**: `sntryu_[REDACTED_EXAMPLE_TOKEN]`
- **GitHub PAT**: `ghp_[REDACTED_EXAMPLE_TOKEN]`

**Recommended Actions**:

1. Rotate both tokens immediately
2. Move to environment variable-based configuration
3. Add `.mcp.json` to `.gitignore`
4. Use a secrets manager for production deployments

---

## Troubleshooting

### Sentry Connection Issues

If Sentry is not receiving events:

1. Check DSN is correctly configured:

   ```bash
   echo $SENTRY_DSN
   ```

2. Verify self-hosted instance is accessible:

   ```bash
   curl -I https://sentry.fergify.work
   ```

3. Check Sentry server logs for connection attempts

4. Test with the integration test script:
   ```bash
   bun run src/observability/integrations/sentry-test.ts
   ```

### Docker-based MCP Servers

If GitHub MCP server fails:

1. Ensure Docker is running:

   ```bash
   docker ps
   ```

2. Pull the latest image:

   ```bash
   docker pull ghcr.io/github/github-mcp-server
   ```

3. Test the container manually:
   ```bash
   docker run --rm -i -e GITHUB_PERSONAL_ACCESS_TOKEN=xxx ghcr.io/github/github-mcp-server
   ```

### Conexus Issues

If Conexus fails to start:

1. Verify the binary exists:

   ```bash
   ls -la /home/f3rg/src/github/conexus/bin/conexus
   ```

2. Check database directory:

   ```bash
   ls -la /home/f3rg/src/github/conexus/data/
   ```

3. Ensure proper permissions:
   ```bash
   chmod +x /home/f3rg/src/github/conexus/bin/conexus
   ```

---

## Adding New MCP Servers

To add a new MCP server:

1. **Edit `.mcp.json`**:

   ```json
   {
     "mcpServers": {
       "new-server": {
         "type": "stdio",
         "command": "npx",
         "args": ["@package/mcp-server"],
         "env": {
           "API_KEY": "your-api-key"
         }
       }
     }
   }
   ```

2. **Restart Claude Code** to load the new configuration

3. **Test the integration** with a simple prompt

4. **Document the server** in this file

---

## References

- [Claude Code MCP Documentation](https://docs.claude.com/en/docs/claude-code/mcp)
- [Model Context Protocol Specification](https://spec.modelcontextprotocol.io/)
- [Sentry MCP Server](https://github.com/getsentry/sentry-mcp-server)
- [Playwright MCP](https://github.com/playwright/playwright-mcp)
- [Context7 MCP](https://github.com/upstash/context7-mcp)

---

**Last Updated**: 2025-10-17
**VibeSec Version**: 1.0.0 (Priority 2 Complete)
