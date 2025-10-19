/**
 * Stdio Transport Implementation for MCP Server
 *
 * Implements JSON-RPC 2.0 over stdio for integration with Claude Code
 * Messages are newline-delimited JSON objects
 */

import { BaseTransport, TransportError } from './base';
import type { MCPRequest, MCPResponse, MCPNotification } from '../types';
import { createInterface } from 'readline';

/**
 * Stdio transport for MCP protocol
 * Communicates via stdin/stdout using newline-delimited JSON
 */
export class StdioTransport extends BaseTransport {
  private lineReader: any = null;
  private buffer: string = '';
  private pendingRequests: MCPRequest[] = [];
  private resolveNext: ((request: MCPRequest) => void) | null = null;

  /**
   * Start the stdio transport
   */
  async start(): Promise<void> {
    await super.start();

    // Initialize readline interface for line-by-line reading
    if (typeof process !== 'undefined' && process.stdin) {
      this.lineReader = createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: false,
      });

      // Handle incoming lines
      this.lineReader.on('line', (line: string) => {
        if (line.trim()) {
          try {
            const request = JSON.parse(line) as MCPRequest;

            // If there's a pending receive(), resolve it
            if (this.resolveNext) {
              this.resolveNext(request);
              this.resolveNext = null;
            } else {
              // Otherwise buffer it
              this.pendingRequests.push(request);
            }
          } catch (error) {
            // Ignore invalid JSON lines
          }
        }
      });

      this.lineReader.on('close', () => {
        this.running = false;
      });
    } else {
      throw new TransportError('stdin not available', 'STDIN_UNAVAILABLE');
    }
  }

  /**
   * Send a message to stdout
   * @param message Response or notification to send
   */
  async send(message: MCPResponse | MCPNotification): Promise<void> {
    if (!this.running) {
      throw new TransportError('Transport not started', 'NOT_STARTED');
    }

    try {
      const json = JSON.stringify(message);
      // Write directly to stdout with newline
      process.stdout.write(json + '\n');
    } catch (error) {
      throw new TransportError(
        'Failed to send message',
        'SEND_ERROR',
        error as Error
      );
    }
  }

  /**
   * Receive a request from stdin
   * Returns a promise that resolves with the next request
   * @returns The parsed request
   */
  async receive(): Promise<MCPRequest> {
    if (!this.running) {
      throw new TransportError('Transport not started', 'NOT_STARTED');
    }

    // If we have buffered requests, return the first one
    if (this.pendingRequests.length > 0) {
      return this.pendingRequests.shift()!;
    }

    // Otherwise, wait for the next request
    return new Promise((resolve, reject) => {
      if (!this.running) {
        reject(new TransportError('stdin closed', 'STDIN_CLOSED'));
        return;
      }

      this.resolveNext = resolve;
    });
  }

  /**
   * Close the transport and release resources
   */
  async close(): Promise<void> {
    this.running = false;

    if (this.lineReader) {
      this.lineReader.close();
      this.lineReader = null;
    }

    this.buffer = '';
    this.pendingRequests = [];
    this.resolveNext = null;
  }

  /**
   * Check if there are buffered messages waiting to be processed
   */
  hasBufferedData(): boolean {
    return this.pendingRequests.length > 0;
  }

  /**
   * Clear the internal buffer
   */
  clearBuffer(): void {
    this.buffer = '';
    this.pendingRequests = [];
  }
}
