# Cloudflare Deployment Guide for VibeSec MCP Server

## Overview

VibeSec can be deployed as a Cloudflare Worker, providing a globally distributed, serverless MCP server that AI assistants can connect to via WebSockets.

## Prerequisites

1. **Cloudflare Account**: Sign up at [cloudflare.com](https://cloudflare.com)
2. **Wrangler CLI**: Install the Cloudflare Workers CLI
   ```bash
   npm install -g wrangler
   ```
3. **Cloudflare API Token**: Generate an API token with Workers permissions

## Deployment Steps

### 1. Authenticate with Cloudflare

```bash
wrangler auth login
# or
wrangler auth token <your-api-token>
```

### 2. Build the Project

```bash
npm run build
```

This creates the `dist/` directory with compiled JavaScript.

### 3. Deploy to Cloudflare Workers

```bash
# Deploy to production
wrangler deploy

# Or deploy to a specific environment
wrangler deploy --env production
```

### 4. Get Your Worker URL

After deployment, Wrangler will show your Worker URL:

```
https://vibesec-mcp.your-subdomain.workers.dev
```

## Configuration

### MCP Client Configuration

Add VibeSec to your MCP client configuration:

**For Claude Code** (`.claude/mcp.json`):

```json
{
  "mcpServers": {
    "vibesec": {
      "type": "remote",
      "url": "wss://vibesec-mcp.your-subdomain.workers.dev",
      "headers": {}
    }
  }
}
```

**For Cursor** (`.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "vibesec": {
      "type": "remote",
      "url": "wss://vibesec-mcp.your-subdomain.workers.dev"
    }
  }
}
```

**For Cline** (`.cline/mcp.json`):

```json
{
  "mcpServers": {
    "vibesec": {
      "type": "remote",
      "url": "wss://vibesec-mcp.your-subdomain.workers.dev"
    }
  }
}
```

## Architecture

### WebSocket Transport

The Cloudflare Worker version uses WebSocket transport instead of stdio:

```
AI Assistant ←→ WebSocket ←→ Cloudflare Worker ←→ VibeSec MCP Server
```

### Key Differences from Local Deployment

1. **Transport**: WebSocket instead of stdio
2. **Protocol**: JSON messages over WebSocket frames
3. **Scaling**: Automatic global distribution
4. **Persistence**: Stateless (no local file system access)

## Security Considerations

### Authentication

For production deployments, consider adding authentication:

```typescript
// In cloudflare-worker.ts
const authToken = request.headers.get('Authorization');
if (!authToken || !authToken.startsWith('Bearer ')) {
  return new Response('Unauthorized', { status: 401 });
}
```

### Rate Limiting

Add rate limiting to prevent abuse:

```toml
# wrangler.toml
[rate_limiting]
requests_per_minute = 100
```

### CORS Configuration

The Worker includes CORS headers for cross-origin requests.

## Monitoring and Debugging

### Logs

View Worker logs:

```bash
wrangler tail
```

### Analytics

Monitor usage in the Cloudflare Dashboard:

- Real-time logs
- Performance metrics
- Error rates

## Cost Optimization

### Free Tier Limits

- 100,000 requests/day
- 10ms CPU time per request
- 128 MB memory

### Paid Tier Benefits

- Higher limits
- Advanced analytics
- Custom domains

## Troubleshooting

### Common Issues

1. **WebSocket Connection Failed**
   - Check Worker URL is correct
   - Verify WebSocket protocol (`wss://`)
   - Check Cloudflare status

2. **Tool Not Found**
   - Ensure Worker is deployed with latest code
   - Check MCP client configuration

3. **Timeout Errors**
   - Increase timeout in MCP client config
   - Check Worker performance metrics

### Debugging Steps

1. Test Worker directly:

   ```bash
   curl -I https://vibesec-mcp.your-subdomain.workers.dev
   ```

2. Check Worker logs:

   ```bash
   wrangler tail --format=pretty
   ```

3. Test WebSocket connection:
   ```javascript
   const ws = new WebSocket('wss://vibesec-mcp.your-subdomain.workers.dev');
   ws.onopen = () => console.log('Connected');
   ```

## Advanced Configuration

### Environment Variables

Add environment variables in `wrangler.toml`:

```toml
[vars]
API_KEY = "your-api-key"
DEBUG = "true"
```

### Custom Domains

Use a custom domain instead of `workers.dev`:

```toml
# wrangler.toml
routes = [
  { pattern = "mcp.yourdomain.com", zone_name = "yourdomain.com" }
]
```

### Durable Objects (for State)

If you need persistent state:

```toml
[[durable_objects.bindings]]
name = "SESSION_STORE"
class_name = "SessionStore"

[[migrations]]
tag = "v1"
new_classes = ["SessionStore"]
```

## Migration from Local to Cloudflare

### What Changes

1. **Transport**: stdio → WebSocket
2. **Protocol**: Same JSON-RPC 2.0
3. **Tools**: Same functionality
4. **Configuration**: Remote URL instead of local command

### Migration Steps

1. Deploy to Cloudflare Workers
2. Update MCP client configuration
3. Test all tools work correctly
4. Update documentation

## Performance Benchmarks

Expected performance on Cloudflare Workers:

- **Cold Start**: ~100-200ms
- **Tool Execution**: ~50-200ms (depending on complexity)
- **Global Latency**: <50ms worldwide
- **Concurrent Connections**: Unlimited (serverless)

## Support

- **Cloudflare Workers Docs**: [developers.cloudflare.com/workers](https://developers.cloudflare.com/workers)
- **MCP Specification**: [modelcontextprotocol.io](https://modelcontextprotocol.io)
- **VibeSec Issues**: [GitHub Issues](https://github.com/sst/opencode/issues)
