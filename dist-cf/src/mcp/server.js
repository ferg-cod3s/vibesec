import { createSuccessResponse, createErrorResponse } from './types';
import { MCPErrorHandler, MCPOperationError, ToolExecutionError } from './error';
import { Logger } from '../observability/logger';
import { MetricsCollector } from '../observability/metrics';
export class MCPServer {
    constructor(config, transport) {
        this.tools = new Map();
        this.running = false;
        this.initialized = false;
        this.config = config;
        this.transport = transport;
        this.logger = new Logger('mcp-server');
        this.metrics = MetricsCollector.getInstance();
        this.setupSignalHandlers();
    }
    registerTool(tool) {
        if (this.tools.has(tool.name)) {
            this.logger.warn(`Tool ${tool.name} already registered, overwriting`);
        }
        this.tools.set(tool.name, tool);
        this.logger.info(`Registered tool: ${tool.name}`);
        this.metrics.increment('mcp.tools.registered', 1, { tool: tool.name });
    }
    registerTools(tools) {
        for (const tool of tools) {
            this.registerTool(tool);
        }
    }
    getTool(name) {
        return this.tools.get(name);
    }
    getTools() {
        return Array.from(this.tools.values()).map(tool => ({
            name: tool.name,
            description: tool.description,
            inputSchema: tool.inputSchema
        }));
    }
    async start() {
        if (this.running) {
            throw new Error('Server is already running');
        }
        this.logger.info('Starting VibeSec MCP Server', {
            name: this.config.name,
            version: this.config.version,
            tools: this.tools.size
        });
        await this.transport.start();
        this.running = true;
        this.metrics.increment('mcp.server.started');
        await this.eventLoop();
    }
    async eventLoop() {
        while (this.running) {
            try {
                const request = await this.transport.receive();
                this.metrics.increment('mcp.requests.received', 1, {
                    method: request.method
                });
                const response = await this.handleRequest(request);
                await this.transport.send(response);
                this.metrics.increment('mcp.responses.sent', 1, {
                    success: String(!response.error)
                });
            }
            catch (error) {
                this.logger.error('Event loop error', {}, error);
                this.metrics.increment('mcp.errors.event_loop');
                if (!this.transport.isRunning()) {
                    this.logger.info('Transport closed, exiting event loop');
                    break;
                }
            }
        }
    }
    async handleRequest(req) {
        const startTime = performance.now();
        try {
            const validationError = MCPErrorHandler.validateRequest(req);
            if (validationError) {
                return createErrorResponse(req.id || 'unknown', validationError.code, validationError.message, validationError.data);
            }
            let result;
            switch (req.method) {
                case 'initialize':
                    result = await this.handleInitialize(req.params);
                    break;
                case 'tools/list':
                    result = await this.handleListTools();
                    break;
                case 'tools/call':
                    result = await this.handleToolCall(req.params);
                    break;
                case 'ping':
                    result = { status: 'ok', timestamp: Date.now() };
                    break;
                default:
                    const error = MCPErrorHandler.methodNotFound(req.method);
                    return createErrorResponse(req.id, error.code, error.message, error.data);
            }
            const duration = performance.now() - startTime;
            this.logger.info(`Request handled: ${req.method}`, {
                method: req.method,
                duration: `${duration.toFixed(2)}ms`
            });
            this.metrics.histogram('mcp.request.duration', duration, {
                method: req.method
            });
            return createSuccessResponse(req.id, result);
        }
        catch (error) {
            const duration = performance.now() - startTime;
            this.logger.error(`Request failed: ${req.method}`, {
                method: req.method,
                duration: `${duration.toFixed(2)}ms`
            }, error);
            this.metrics.increment('mcp.requests.failed', 1, {
                method: req.method
            });
            return MCPErrorHandler.toErrorResponse(req.id, error);
        }
    }
    async handleInitialize(params) {
        this.initialized = true;
        this.logger.info('Client initialized', {
            clientName: params.clientName,
            clientVersion: params.clientVersion
        });
        return {
            name: this.config.name,
            version: this.config.version,
            capabilities: {
                tools: this.config.capabilities.includes('tools'),
                prompts: this.config.capabilities.includes('prompts'),
                resources: this.config.capabilities.includes('resources'),
                completion: this.config.capabilities.includes('completion')
            }
        };
    }
    async handleListTools() {
        const tools = this.getTools();
        this.logger.debug(`Listing ${tools.length} tools`);
        return {
            tools
        };
    }
    async handleToolCall(params) {
        const validationError = MCPErrorHandler.validateToolCallParams(params);
        if (validationError) {
            throw new MCPOperationError(validationError.message, validationError.code, validationError.data);
        }
        const { name, arguments: args } = params;
        const tool = this.tools.get(name);
        if (!tool) {
            const error = MCPErrorHandler.toolNotFound(name);
            throw new MCPOperationError(error.message, error.code, error.data);
        }
        const sanitizedArgs = MCPErrorHandler.sanitizeParams(args);
        const startTime = performance.now();
        try {
            this.logger.info(`Executing tool: ${name}`, {
                tool: name,
                hasArgs: !!args
            });
            const result = await tool.handler(sanitizedArgs);
            const duration = performance.now() - startTime;
            this.logger.info(`Tool executed successfully: ${name}`, {
                tool: name,
                duration: `${duration.toFixed(2)}ms`
            });
            this.metrics.histogram('mcp.tool.duration', duration, {
                tool: name,
                success: 'true'
            });
            this.metrics.increment('mcp.tool.calls', 1, {
                tool: name,
                success: 'true'
            });
            return result;
        }
        catch (error) {
            const duration = performance.now() - startTime;
            this.logger.error(`Tool execution failed: ${name}`, {
                tool: name,
                duration: `${duration.toFixed(2)}ms`
            }, error);
            this.metrics.increment('mcp.tool.calls', 1, {
                tool: name,
                success: 'false'
            });
            throw new ToolExecutionError(name, error);
        }
    }
    async stop() {
        if (!this.running) {
            return;
        }
        this.logger.info('Stopping VibeSec MCP Server');
        this.running = false;
        await this.transport.close();
        await this.metrics.flush();
        await this.logger.close();
        this.metrics.increment('mcp.server.stopped');
        this.logger.info('Server stopped successfully');
    }
    setupSignalHandlers() {
        const shutdown = async (signal) => {
            this.logger.info(`Received ${signal}, shutting down gracefully`);
            await this.stop();
            process.exit(0);
        };
        process.on('SIGINT', () => shutdown('SIGINT'));
        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('uncaughtException', (error) => {
            this.logger.error('Uncaught exception', {}, error);
            this.stop().then(() => process.exit(1));
        });
        process.on('unhandledRejection', (reason) => {
            this.logger.error('Unhandled rejection', {}, reason);
            this.stop().then(() => process.exit(1));
        });
    }
    isRunning() {
        return this.running;
    }
    isInitialized() {
        return this.initialized;
    }
    getConfig() {
        return { ...this.config };
    }
    getStats() {
        return {
            running: this.running,
            initialized: this.initialized,
            tools: this.tools.size,
            uptime: process.uptime()
        };
    }
}
