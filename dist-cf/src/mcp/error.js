import { MCPErrorCode, createErrorResponse, isValidMCPRequest, isValidToolCallParams } from './types';
export class MCPErrorHandler {
    static createError(code, message, data) {
        return {
            code,
            message,
            data
        };
    }
    static parseError(data) {
        return this.createError(MCPErrorCode.PARSE_ERROR, 'Parse error: Invalid JSON', data);
    }
    static invalidRequest(message, data) {
        return this.createError(MCPErrorCode.INVALID_REQUEST, message || 'Invalid request', data);
    }
    static methodNotFound(method) {
        return this.createError(MCPErrorCode.METHOD_NOT_FOUND, `Method not found: ${method}`, { method });
    }
    static invalidParams(message, data) {
        return this.createError(MCPErrorCode.INVALID_PARAMS, `Invalid params: ${message}`, data);
    }
    static internalError(message, data) {
        return this.createError(MCPErrorCode.INTERNAL_ERROR, message || 'Internal error', data);
    }
    static toolNotFound(toolName) {
        return this.createError(MCPErrorCode.TOOL_NOT_FOUND, `Tool not found: ${toolName}`, { toolName });
    }
    static toolExecutionError(toolName, error) {
        return this.createError(MCPErrorCode.TOOL_EXECUTION_ERROR, `Tool execution failed: ${toolName}`, {
            toolName,
            error: error.message,
            stack: error.stack
        });
    }
    static invalidToolArgs(toolName, reason) {
        return this.createError(MCPErrorCode.INVALID_TOOL_ARGS, `Invalid tool arguments for ${toolName}: ${reason}`, { toolName, reason });
    }
    static validateRequest(req) {
        if (!isValidMCPRequest(req)) {
            return this.invalidRequest('Invalid request structure');
        }
        const request = req;
        if (!request.id) {
            return this.invalidRequest('Missing request id');
        }
        if (!request.method) {
            return this.invalidRequest('Missing request method');
        }
        return null;
    }
    static validateToolCallParams(params) {
        if (!isValidToolCallParams(params)) {
            return this.invalidParams('Invalid tool call parameters');
        }
        const toolParams = params;
        if (!toolParams.name) {
            return this.invalidParams('Missing tool name');
        }
        return null;
    }
    static sanitizeParams(params) {
        if (!params || typeof params !== 'object') {
            return {};
        }
        const sanitized = {};
        const obj = params;
        for (const [key, value] of Object.entries(obj)) {
            if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
                continue;
            }
            if (value && typeof value === 'object' && !Array.isArray(value)) {
                sanitized[key] = this.sanitizeParams(value);
            }
            else {
                sanitized[key] = value;
            }
        }
        return sanitized;
    }
    static fromError(error) {
        if (error instanceof Error) {
            return this.internalError(error.message, {
                name: error.name,
                stack: error.stack
            });
        }
        if (typeof error === 'string') {
            return this.internalError(error);
        }
        return this.internalError('Unknown error', { error });
    }
    static toErrorResponse(id, error) {
        const mcpError = error instanceof Object && 'code' in error && 'message' in error
            ? error
            : this.fromError(error);
        return createErrorResponse(id, mcpError.code, mcpError.message, mcpError.data);
    }
    static isErrorCode(error, code) {
        if (!error || typeof error !== 'object')
            return false;
        const mcpError = error;
        return mcpError.code === code;
    }
    static formatError(error) {
        let formatted = `[${error.code}] ${error.message}`;
        if (error.data) {
            try {
                formatted += `\nData: ${JSON.stringify(error.data, null, 2)}`;
            }
            catch {
                formatted += `\nData: [Unable to stringify]`;
            }
        }
        return formatted;
    }
}
export class MCPOperationError extends Error {
    constructor(message, code, data) {
        super(message);
        this.code = code;
        this.data = data;
        this.name = 'MCPOperationError';
    }
    toMCPError() {
        return {
            code: this.code,
            message: this.message,
            data: this.data
        };
    }
}
export class ToolValidationError extends MCPOperationError {
    constructor(toolName, reason) {
        super(`Invalid arguments for tool ${toolName}: ${reason}`, MCPErrorCode.INVALID_TOOL_ARGS, { toolName, reason });
        this.name = 'ToolValidationError';
    }
}
export class ToolExecutionError extends MCPOperationError {
    constructor(toolName, cause) {
        super(`Tool execution failed: ${toolName}`, MCPErrorCode.TOOL_EXECUTION_ERROR, {
            toolName,
            error: cause.message,
            stack: cause.stack
        });
        this.name = 'ToolExecutionError';
    }
}
