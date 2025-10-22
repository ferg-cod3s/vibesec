/**
 * Typed Error Classes (ERROR-001 fix)
 *
 * Provides a comprehensive hierarchy of typed errors for better error handling,
 * debugging, and user experience.
 */

/**
 * Base error class for all VibeSec errors
 * Extends Error with additional context and error codes
 */
export abstract class VibeSecError extends Error {
  /** Unique error code for programmatic handling */
  public readonly code: string;

  /** Additional context data */
  public readonly context?: Record<string, unknown>;

  /** HTTP status code equivalent (for API errors) */
  public readonly statusCode: number;

  /** Whether this error should be reported to Sentry */
  public readonly shouldReport: boolean;

  constructor(
    message: string,
    code: string,
    statusCode: number = 500,
    context?: Record<string, unknown>,
    shouldReport: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.context = context;
    this.statusCode = statusCode;
    this.shouldReport = shouldReport;

    // Maintain proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Serialize error to JSON
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      context: this.context,
      stack: this.stack,
    };
  }
}

/**
 * Path validation errors (path traversal, invalid paths, etc.)
 */
export class PathValidationError extends VibeSecError {
  public readonly attemptedPath: string;

  constructor(message: string, attemptedPath: string, context?: Record<string, unknown>) {
    super(message, 'PATH_VALIDATION_ERROR', 400, context, false);
    this.attemptedPath = attemptedPath;
  }
}

/**
 * File system errors (file not found, permission denied, etc.)
 */
export class FileSystemError extends VibeSecError {
  public readonly path: string;
  public readonly operation: 'read' | 'write' | 'delete' | 'stat';

  constructor(
    message: string,
    path: string,
    operation: 'read' | 'write' | 'delete' | 'stat',
    context?: Record<string, unknown>
  ) {
    super(message, 'FILE_SYSTEM_ERROR', 500, context, true);
    this.path = path;
    this.operation = operation;
  }
}

/**
 * Configuration errors (invalid config, missing required config, etc.)
 */
export class ConfigurationError extends VibeSecError {
  public readonly configKey?: string;

  constructor(message: string, configKey?: string, context?: Record<string, unknown>) {
    super(message, 'CONFIGURATION_ERROR', 400, context, false);
    this.configKey = configKey;
  }
}

/**
 * Validation errors (invalid input, type mismatch, etc.)
 */
export class ValidationError extends VibeSecError {
  public readonly field?: string;
  public readonly value?: unknown;

  constructor(
    message: string,
    field?: string,
    value?: unknown,
    context?: Record<string, unknown>
  ) {
    super(message, 'VALIDATION_ERROR', 400, context, false);
    this.field = field;
    this.value = value;
  }
}

/**
 * Scanner errors (rule loading failure, detection failure, etc.)
 */
export class ScannerError extends VibeSecError {
  public readonly phase: 'initialization' | 'file-discovery' | 'scanning' | 'reporting';

  constructor(
    message: string,
    phase: 'initialization' | 'file-discovery' | 'scanning' | 'reporting',
    context?: Record<string, unknown>
  ) {
    super(message, 'SCANNER_ERROR', 500, context, true);
    this.phase = phase;
  }
}

/**
 * Rule errors (invalid rule syntax, rule not found, etc.)
 */
export class RuleError extends VibeSecError {
  public readonly ruleId?: string;
  public readonly ruleFile?: string;

  constructor(
    message: string,
    ruleId?: string,
    ruleFile?: string,
    context?: Record<string, unknown>
  ) {
    super(message, 'RULE_ERROR', 500, context, true);
    this.ruleId = ruleId;
    this.ruleFile = ruleFile;
  }
}

/**
 * Parser errors (AST parsing failure, syntax errors in scanned code, etc.)
 */
export class ParserError extends VibeSecError {
  public readonly file: string;
  public readonly line?: number;
  public readonly column?: number;

  constructor(
    message: string,
    file: string,
    line?: number,
    column?: number,
    context?: Record<string, unknown>
  ) {
    super(message, 'PARSER_ERROR', 500, context, false); // Don't report parser errors (user's code issue)
    this.file = file;
    this.line = line;
    this.column = column;
  }
}

/**
 * MCP protocol errors (JSON-RPC errors, tool invocation failures, etc.)
 */
export class MCPError extends VibeSecError {
  public readonly method?: string;
  public readonly jsonrpcCode: number;

  constructor(
    message: string,
    jsonrpcCode: number,
    method?: string,
    context?: Record<string, unknown>
  ) {
    super(message, 'MCP_ERROR', 500, context, true);
    this.method = method;
    this.jsonrpcCode = jsonrpcCode;
  }
}

/**
 * Observability errors (Sentry init failure, metrics collection failure, etc.)
 */
export class ObservabilityError extends VibeSecError {
  public readonly service: 'sentry' | 'metrics' | 'logger';

  constructor(
    message: string,
    service: 'sentry' | 'metrics' | 'logger',
    context?: Record<string, unknown>
  ) {
    super(message, 'OBSERVABILITY_ERROR', 500, context, false); // Don't report observability errors to avoid loops
    this.service = service;
  }
}

/**
 * Integration errors (Snyk API failure, Socket.dev failure, etc.)
 */
export class IntegrationError extends VibeSecError {
  public readonly integration: string;
  public readonly httpStatus?: number;

  constructor(
    message: string,
    integration: string,
    httpStatus?: number,
    context?: Record<string, unknown>
  ) {
    super(message, 'INTEGRATION_ERROR', httpStatus || 500, context, true);
    this.integration = integration;
    this.httpStatus = httpStatus;
  }
}

/**
 * Timeout errors (scan timeout, network timeout, etc.)
 */
export class TimeoutError extends VibeSecError {
  public readonly operation: string;
  public readonly timeoutMs: number;

  constructor(
    message: string,
    operation: string,
    timeoutMs: number,
    context?: Record<string, unknown>
  ) {
    super(message, 'TIMEOUT_ERROR', 408, context, true);
    this.operation = operation;
    this.timeoutMs = timeoutMs;
  }
}

/**
 * Resource exhaustion errors (memory limit, file handle limit, etc.)
 */
export class ResourceExhaustedError extends VibeSecError {
  public readonly resource: 'memory' | 'disk' | 'fileHandles' | 'cpu';
  public readonly limit?: number;
  public readonly actual?: number;

  constructor(
    message: string,
    resource: 'memory' | 'disk' | 'fileHandles' | 'cpu',
    limit?: number,
    actual?: number,
    context?: Record<string, unknown>
  ) {
    super(message, 'RESOURCE_EXHAUSTED', 507, context, true);
    this.resource = resource;
    this.limit = limit;
    this.actual = actual;
  }
}

/**
 * Unrecoverable fatal errors
 */
export class FatalError extends VibeSecError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'FATAL_ERROR', 500, context, true);
  }
}

/**
 * Type guard to check if error is a VibeSec typed error
 */
export function isVibeSecError(error: unknown): error is VibeSecError {
  return error instanceof VibeSecError;
}

/**
 * Create error from unknown value (for catch blocks)
 */
export function toError(value: unknown): Error {
  if (value instanceof Error) {
    return value;
  }

  if (typeof value === 'string') {
    return new Error(value);
  }

  if (typeof value === 'object' && value !== null) {
    return new Error(JSON.stringify(value));
  }

  return new Error(String(value));
}

/**
 * Wrap unknown errors in typed errors
 */
export function wrapError(error: unknown, defaultMessage: string = 'An unexpected error occurred'): VibeSecError {
  if (isVibeSecError(error)) {
    return error;
  }

  const baseError = toError(error);

  // Try to classify the error based on its properties
  if ('code' in baseError) {
    const nodeError = baseError as NodeJS.ErrnoException;

    // File system errors
    if (nodeError.code === 'ENOENT' || nodeError.code === 'EACCES' || nodeError.code === 'EISDIR') {
      return new FileSystemError(
        baseError.message,
        nodeError.path || 'unknown',
        'read',
        { originalCode: nodeError.code }
      );
    }

    // Resource exhaustion
    if (nodeError.code === 'EMFILE' || nodeError.code === 'ENFILE') {
      return new ResourceExhaustedError(
        baseError.message,
        'fileHandles',
        undefined,
        undefined,
        { originalCode: nodeError.code }
      );
    }

    // Timeout
    if (nodeError.code === 'ETIMEDOUT' || nodeError.code === 'ESOCKETTIMEDOUT') {
      return new TimeoutError(
        baseError.message,
        'network',
        30000,
        { originalCode: nodeError.code }
      );
    }
  }

  // Generic wrapper
  return new FatalError(baseError.message || defaultMessage, {
    originalError: baseError.name,
    originalMessage: baseError.message,
  });
}
