/**
 * VibeSec MCP Server - Cloudflare Worker Version
 *
 * WebSocket-based MCP server for Cloudflare Workers deployment.
 */

import { MCPServer } from './server';
import { WebSocketTransport } from './transport/websocket';
import { vibesecScanCodeTool } from './tools/scan-code';
import { vibesecListRulesTool } from './tools/list-rules';

export interface Env {
  // Add your environment variables here
}

// Cloudflare Workers type definitions
declare const WebSocketPair: {
  new (): {
    0: WebSocket;
    1: WebSocket;
    [Symbol.iterator](): IterableIterator<WebSocket>;
  };
};

interface ExecutionContext {
  waitUntil(promise: Promise<any>): void;
  passThroughOnException(): void;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Handle CORS for MCP clients
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    // Only accept WebSocket upgrade requests
    const upgradeHeader = request.headers.get('Upgrade');
    if (upgradeHeader !== 'websocket') {
      return new Response('Expected WebSocket upgrade', {
        status: 426,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Create WebSocket pair
    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);

    // Create MCP server with WebSocket transport
    const transport = new WebSocketTransport(server);
    const mcpServer = new MCPServer(
      {
        name: 'vibesec',
        version: '0.1.0',
        capabilities: ['tools'],
      },
      transport
    );

    // Register tools
    mcpServer.registerTool(vibesecScanCodeTool);
    mcpServer.registerTool(vibesecListRulesTool);

    // Start MCP server
    ctx.waitUntil(mcpServer.start());

    return new Response(null, {
      status: 101,
      // @ts-expect-error - Cloudflare Workers specific property
      webSocket: client,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    });
  },
};
