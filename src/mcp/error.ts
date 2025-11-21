/**
 * MCP Error Handling Utilities
 *
 * Provides utilities for creating, validating, and handling MCP errors
 */

import {
  MCPError,
  MCPErrorCode,
  MCPRequest,
  MCPResponse,
  ToolCallParams,
  createErrorResponse,
  isValidMCPRequest,
  isValidToolCallParams,
} from './types';

/**
 * MCP Error Handler
 * Centralized error handling for the MCP server
 */
export class MCPErrorHandler {
  /**
   * Create a standardized MCP error
   */
  static createError(code: number, message: string, data?: unknown): MCPError {
    return {
      code,
      message,
      data,
    };
  }

  /**
   * Create a parse error (invalid JSON)
   */
  static parseError(data?: unknown): MCPError {
    return this.createError(MCPErrorCode.PARSE_ERROR, 'Parse error: Invalid JSON', data);
  }

  /**
   * Create an invalid request error
   */
  static invalidRequest(message?: string, data?: unknown): MCPError {
    return this.createError(MCPErrorCode.INVALID_REQUEST, message || 'Invalid request', data);
  }

  /**
   * Create a method not found error
   */
  static methodNotFound(method: string): MCPError {
    return this.createError(MCPErrorCode.METHOD_NOT_FOUND, `Method not found: ${method}`, {
      method,
    });
  }

  /**
   * Create an invalid params error
   */
  static invalidParams(message: string, data?: unknown): MCPError {
    return this.createError(MCPErrorCode.INVALID_PARAMS, `Invalid params: ${message}`, data);
  }

  /**
   * Create an internal error
   */
  static internalError(message?: string, data?: unknown): MCPError {
    return this.createError(MCPErrorCode.INTERNAL_ERROR, message || 'Internal error', data);
  }

  /**
   * Create a tool not found error
   */
  static toolNotFound(toolName: string): MCPError {
    return this.createError(MCPErrorCode.TOOL_NOT_FOUND, `Tool not found: ${toolName}`, {
      toolName,
    });
  }

  /**
   * Create a tool execution error
   */
  static toolExecutionError(toolName: string, error: Error): MCPError {
    return this.createError(
      MCPErrorCode.TOOL_EXECUTION_ERROR,
      `Tool execution failed: ${toolName}`,
      {
        toolName,
        error: error.message,
        stack: error.stack,
      }
    );
  }

  /**
   * Create an invalid tool arguments error
   */
  static invalidToolArgs(toolName: string, reason: string): MCPError {
    return this.createError(
      MCPErrorCode.INVALID_TOOL_ARGS,
      `Invalid tool arguments for ${toolName}: ${reason}`,
      { toolName, reason }
    );
  }

  /**
   * Validate an MCP request
   * @returns Error if invalid, null if valid
   */
  static validateRequest(req: unknown): MCPError | null {
    if (!isValidMCPRequest(req)) {
      return this.invalidRequest('Invalid request structure');
    }

    const request = req as MCPRequest;

    // Check required fields
    if (!request.id) {
      return this.invalidRequest('Missing request id');
    }

    if (!request.method) {
      return this.invalidRequest('Missing request method');
    }

    return null;
  }

  /**
   * Validate tool call parameters
   * @returns Error if invalid, null if valid
   */
  static validateToolCallParams(params: unknown): MCPError | null {
    if (!isValidToolCallParams(params)) {
      return this.invalidParams('Invalid tool call parameters');
    }

    const toolParams = params as ToolCallParams;

    if (!toolParams.name) {
      return this.invalidParams('Missing tool name');
    }

    return null;
  }

  /**
   * Sanitize parameters to prevent injection attacks
   */
  static sanitizeParams(params: unknown): Record<string, unknown> {
    if (!params || typeof params !== 'object') {
      return {};
    }

    const sanitized: Record<string, unknown> = {};
    const obj = params as Record<string, unknown>;

    for (const [key, value] of Object.entries(obj)) {
      // Skip prototype pollution attempts
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        continue;
      }

      // Recursively sanitize objects
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        sanitized[key] = this.sanitizeParams(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Convert an unknown error to an MCP error
   */
  static fromError(error: unknown): MCPError {
    if (error instanceof Error) {
      return this.internalError(error.message, {
        name: error.name,
        stack: error.stack,
      });
    }

    if (typeof error === 'string') {
      return this.internalError(error);
    }

    return this.internalError('Unknown error', { error });
  }

  /**
   * Create an error response from an error
   */
  static toErrorResponse(id: string | number, error: unknown): MCPResponse {
    const mcpError =
      error instanceof Object && 'code' in error && 'message' in error
        ? (error as MCPError)
        : this.fromError(error);

    return createErrorResponse(id, mcpError.code, mcpError.message, mcpError.data);
  }

  /**
   * Check if an error is a specific MCP error code
   */
  static isErrorCode(error: unknown, code: MCPErrorCode): boolean {
    if (!error || typeof error !== 'object') return false;
    const mcpError = error as MCPError;
    return mcpError.code === code;
  }

  /**
   * Format error for logging
   */
  static formatError(error: MCPError): string {
    let formatted = `[${error.code}] ${error.message}`;

    if (error.data) {
      try {
        formatted += `\nData: ${JSON.stringify(error.data, null, 2)}`;
      } catch {
        formatted += `\nData: [Unable to stringify]`;
      }
    }

    return formatted;
  }
}

/**
 * Custom error class for MCP operations
 */
export class MCPOperationError extends Error {
  constructor(
    message: string,
    public readonly code: MCPErrorCode,
    public readonly data?: unknown
  ) {
    super(message);
    this.name = 'MCPOperationError';
  }

  /**
   * Convert to MCP error object
   */
  toMCPError(): MCPError {
    return {
      code: this.code,
      message: this.message,
      data: this.data,
    };
  }
}

/**
 * Validation error for tool parameters
 */
export class ToolValidationError extends MCPOperationError {
  constructor(toolName: string, reason: string) {
    super(`Invalid arguments for tool ${toolName}: ${reason}`, MCPErrorCode.INVALID_TOOL_ARGS, {
      toolName,
      reason,
    });
    this.name = 'ToolValidationError';
  }
}

/**
 * Tool execution error
 */
export enum MCPErrorCode {
  /** Invalid JSON was received */
  PARSE_ERROR = -32700,

  /** JSON-RPC request is invalid */
  INVALID_REQUEST = -32600,

  /** Requested method does not exist */
  METHOD_NOT_FOUND = -32601,

  /** Method parameters are invalid */
  INVALID_PARAMS = -32602,

  /** Internal server error */
  INTERNAL_ERROR = -32603,

  /** Requested tool does not exist */
  TOOL_NOT_FOUND = -32001,

  /** Tool execution failed */
  TOOL_EXECUTION_ERROR = -32002,

  /** Tool arguments are invalid */
  INVALID_TOOL_ARGS = -32003,
}

export class ToolExecutionError extends MCPOperationError {
  constructor(toolName: string, cause: Error) {
    super(`Tool execution failed: ${toolName}`, MCPErrorCode.TOOL_EXECUTION_ERROR, {
      toolName,
      error: cause.message,
      stack: cause.stack,
    });
    this.name = 'ToolExecutionError';
  }
}
