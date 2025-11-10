/**
 * MCP Server Implementation
 *
 * Main server class that handles MCP protocol communication,
 * tool registration, and request routing.
 */

import type { BaseTransport } from './transport/base';
import type {
  MCPRequest,
  MCPResponse,
  MCPTool,
  MCPServerConfig,
  ToolCallParams,
  ServerInfo,
  InitializeParams,
  ToolListResponse,
  ToolInfo,
} from './types';
import { MCPNotification, createSuccessResponse, createErrorResponse } from './types';
import { MCPErrorHandler, MCPOperationError, ToolExecutionError } from './error';
import { Logger } from '../observability/logger';
import { MetricsCollector } from '../observability/metrics';

/**
 * Main MCP Server class
 * Handles protocol communication and tool execution
 */
export class MCPServer {
  private tools: Map<string, MCPTool> = new Map();
  private transport: BaseTransport;
  private config: MCPServerConfig;
  private logger: Logger;
  private metrics: MetricsCollector;
  private running = false;
  private initialized = false;

  constructor(config: MCPServerConfig, transport: BaseTransport) {
    this.config = config;
    this.transport = transport;
    this.logger = new Logger('mcp-server');
    this.metrics = MetricsCollector.getInstance();

    // Setup signal handlers for graceful shutdown
    this.setupSignalHandlers();
  }

  /**
   * Register a tool with the server
   */
  registerTool(tool: MCPTool): void {
    if (this.tools.has(tool.name)) {
      this.logger.warn(`Tool ${tool.name} already registered, overwriting`);
    }

    this.tools.set(tool.name, tool);
    this.logger.info(`Registered tool: ${tool.name}`);
    this.metrics.increment('mcp.tools.registered', 1, { tool: tool.name });
  }

  /**
   * Register multiple tools at once
   */
  registerTools(tools: MCPTool[]): void {
    for (const tool of tools) {
      this.registerTool(tool);
    }
  }

  /**
   * Get a registered tool by name
   */
  getTool(name: string): MCPTool | undefined {
    return this.tools.get(name);
  }

  /**
   * Get all registered tools
   */
  getTools(): ToolInfo[] {
    return Array.from(this.tools.values()).map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    }));
  }

  /**
   * Start the MCP server
   * Begins listening for requests and processing them
   */
  async start(): Promise<void> {
    if (this.running) {
      throw new Error('Server is already running');
    }

    this.logger.info('Starting VibeSec MCP Server', {
      name: this.config.name,
      version: this.config.version,
      tools: this.tools.size,
    });

    // Start transport
    await this.transport.start();

    this.running = true;
    this.metrics.increment('mcp.server.started');

    // Main event loop
    await this.eventLoop();
  }

  /**
   * Main event loop - processes requests continuously
   */
  private async eventLoop(): Promise<void> {
    while (this.running) {
      try {
        // Wait for next request
        const request = await this.transport.receive();

        this.metrics.increment('mcp.requests.received', 1, {
          method: request.method,
        });

        // Process request
        const response = await this.handleRequest(request);

        // Send response
        await this.transport.send(response);

        this.metrics.increment('mcp.responses.sent', 1, {
          success: String(!response.error),
        });
      } catch (error) {
        // Log error but continue running
        this.logger.error('Event loop error', {}, error as Error);
        this.metrics.increment('mcp.errors.event_loop');

        // If transport is closed, exit loop
        if (!this.transport.isRunning()) {
          this.logger.info('Transport closed, exiting event loop');
          break;
        }
      }
    }
  }

  /**
   * Handle an incoming request
   */
  private async handleRequest(req: MCPRequest): Promise<MCPResponse> {
    const startTime = performance.now();

    try {
      // Validate request
      const validationError = MCPErrorHandler.validateRequest(req);
      if (validationError) {
        return createErrorResponse(
          req.id || 'unknown',
          validationError.code,
          validationError.message,
          validationError.data
        );
      }

      // Route to appropriate handler
      let result: unknown;

      switch (req.method) {
        case 'initialize':
          result = await this.handleInitialize(req.params as any);
          break;

        case 'tools/list':
          result = await this.handleListTools();
          break;

        case 'tools/call':
          result = await this.handleToolCall(req.params as any);
          break;

        case 'ping':
          result = { status: 'ok', timestamp: Date.now() };
          break;

        default:
          const error = MCPErrorHandler.methodNotFound(req.method);
          return createErrorResponse(req.id, error.code, error.message, error.data);
      }

      // Track success
      const duration = performance.now() - startTime;
      this.logger.info(`Request handled: ${req.method}`, {
        method: req.method,
        duration: `${duration.toFixed(2)}ms`,
      });
      this.metrics.histogram('mcp.request.duration', duration, {
        method: req.method,
      });

      return createSuccessResponse(req.id, result);
    } catch (error) {
      // Track error
      const duration = performance.now() - startTime;
      this.logger.error(
        `Request failed: ${req.method}`,
        {
          method: req.method,
          duration: `${duration.toFixed(2)}ms`,
        },
        error as Error
      );

      this.metrics.increment('mcp.requests.failed', 1, {
        method: req.method,
      });

      return MCPErrorHandler.toErrorResponse(req.id, error);
    }
  }

  /**
   * Handle initialize request
   */
  private async handleInitialize(params: InitializeParams): Promise<ServerInfo> {
    this.initialized = true;

    this.logger.info('Client initialized', {
      clientName: params.clientName,
      clientVersion: params.clientVersion,
    });

    // Return server capabilities
    return {
      name: this.config.name,
      version: this.config.version,
      capabilities: {
        tools: this.config.capabilities.includes('tools'),
        prompts: this.config.capabilities.includes('prompts'),
        resources: this.config.capabilities.includes('resources'),
        completion: this.config.capabilities.includes('completion'),
      },
    };
  }

  /**
   * Handle tools/list request
   */
  private async handleListTools(): Promise<ToolListResponse> {
    const tools = this.getTools();

    this.logger.debug(`Listing ${tools.length} tools`);

    return {
      tools,
    };
  }

  /**
   * Handle tools/call request
   */
  private async handleToolCall(params: ToolCallParams): Promise<unknown> {
    // Validate parameters
    const validationError = MCPErrorHandler.validateToolCallParams(params);
    if (validationError) {
      throw new MCPOperationError(
        validationError.message,
        validationError.code,
        validationError.data
      );
    }

    const { name, arguments: args } = params;

    // Get tool
    const tool = this.tools.get(name);
    if (!tool) {
      const error = MCPErrorHandler.toolNotFound(name);
      throw new MCPOperationError(error.message, error.code, error.data);
    }

    // Sanitize arguments
    const sanitizedArgs = MCPErrorHandler.sanitizeParams(args);

    // Execute tool
    const startTime = performance.now();

    try {
      this.logger.info(`Executing tool: ${name}`, {
        tool: name,
        hasArgs: !!args,
      });

      const result = await tool.handler(sanitizedArgs);

      const duration = performance.now() - startTime;

      this.logger.info(`Tool executed successfully: ${name}`, {
        tool: name,
        duration: `${duration.toFixed(2)}ms`,
      });

      this.metrics.histogram('mcp.tool.duration', duration, {
        tool: name,
        success: 'true',
      });

      this.metrics.increment('mcp.tool.calls', 1, {
        tool: name,
        success: 'true',
      });

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;

      this.logger.error(
        `Tool execution failed: ${name}`,
        {
          tool: name,
          duration: `${duration.toFixed(2)}ms`,
        },
        error as Error
      );

      this.metrics.increment('mcp.tool.calls', 1, {
        tool: name,
        success: 'false',
      });

      throw new ToolExecutionError(name, error as Error);
    }
  }

  /**
   * Stop the server gracefully
   */
  async stop(): Promise<void> {
    if (!this.running) {
      return;
    }

    this.logger.info('Stopping VibeSec MCP Server');
    this.running = false;

    // Close transport
    await this.transport.close();

    // Flush metrics and logs
    await this.metrics.flush();
    await this.logger.close();

    this.metrics.increment('mcp.server.stopped');
    this.logger.info('Server stopped successfully');
  }

  /**
   * Setup signal handlers for graceful shutdown
   */
  private setupSignalHandlers(): void {
    const shutdown = async (signal: string) => {
      this.logger.info(`Received ${signal}, shutting down gracefully`);
      await this.stop();
      process.exit(0);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
      this.logger.error('Uncaught exception', {}, error);
      this.stop().then(() => process.exit(1));
    });

    process.on('unhandledRejection', (reason) => {
      this.logger.error('Unhandled rejection', {}, reason as Error);
      this.stop().then(() => process.exit(1));
    });
  }

  /**
   * Check if server is running
   */
  isRunning(): boolean {
    return this.running;
  }

  /**
   * Check if server is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get server configuration
   */
  getConfig(): MCPServerConfig {
    return { ...this.config };
  }

  /**
   * Get server statistics
   */
  getStats(): {
    running: boolean;
    initialized: boolean;
    tools: number;
    uptime: number;
  } {
    return {
      running: this.running,
      initialized: this.initialized,
      tools: this.tools.size,
      uptime: process.uptime(),
    };
  }
}
