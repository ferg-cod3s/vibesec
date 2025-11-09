/**
 * WebSocket Transport for MCP
 *
 * Implements MCP transport over WebSocket connections for Cloudflare Workers.
 */

import { BaseTransport } from './base';
import type { MCPRequest, MCPResponse, MCPNotification } from '../types';

export class WebSocketTransport extends BaseTransport {
  private ws: WebSocket;
  private messageQueue: MCPRequest[] = [];

  constructor(ws: WebSocket) {
    super();
    this.ws = ws;
    this.setupWebSocketHandlers();
  }

  private setupWebSocketHandlers(): void {
    this.ws.addEventListener('message', (event: MessageEvent) => {
      try {
        // Parse incoming JSON message
        const data = JSON.parse(event.data as string) as MCPRequest;
        this.messageQueue.push(data);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    });

    this.ws.addEventListener('close', () => {
      this.running = false;
    });

    this.ws.addEventListener('error', () => {
      this.running = false;
    });
  }

  async start(): Promise<void> {
    this.running = true;
    // WebSocket is already connected when passed to constructor
  }

  async receive(): Promise<MCPRequest> {
    // Wait for a message to be available
    while (this.running && this.messageQueue.length === 0) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    if (!this.running) {
      throw new Error('Transport closed');
    }

    return this.messageQueue.shift()!;
  }

  async send(message: MCPResponse | MCPNotification): Promise<void> {
    if (!this.running || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    const jsonMessage = JSON.stringify(message);
    this.ws.send(jsonMessage);
  }

  async stop(): Promise<void> {
    this.running = false;
  }

  async close(): Promise<void> {
    this.running = false;
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.close();
    }
  }

  isRunning(): boolean {
    return this.running && this.ws.readyState === WebSocket.OPEN;
  }
}
