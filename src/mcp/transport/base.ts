/**
 * Base Transport Interface for MCP Server
 *
 * Defines the contract for different transport mechanisms
 * (stdio, HTTP, WebSocket, etc.)
 */

import type { MCPRequest, MCPResponse, MCPNotification } from '../types';

/**
 * Abstract base class for MCP transport implementations
 */
export abstract class BaseTransport {
  protected running = false;

  /**
   * Send a response message to the client
   * @param message The response to send
   */
  abstract send(message: MCPResponse | MCPNotification): Promise<void>;

  /**
   * Receive a request message from the client
   * @returns The received request
   */
  abstract receive(): Promise<MCPRequest>;

  /**
   * Start the transport
   */
  async start(): Promise<void> {
    this.running = true;
  }

  /**
   * Stop the transport and clean up resources
   */
  async stop(): Promise<void> {
    this.running = false;
  }

  /**
   * Close the transport connection
   */
  abstract close(): Promise<void>;

  /**
   * Check if transport is currently running
   */
  isRunning(): boolean {
    return this.running;
  }
}

/**
 * Transport error class
 */
export class TransportError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'TransportError';
  }
}

/**
 * Transport event emitter interface
 * For transports that need to emit events
 */
export interface TransportEvents {
  /** Emitted when connection is established */
  connect?: () => void;

  /** Emitted when connection is closed */
  disconnect?: () => void;

  /** Emitted when an error occurs */
  error?: (error: Error) => void;

  /** Emitted when a message is received */
  message?: (data: unknown) => void;
}
