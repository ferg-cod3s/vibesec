/**
 * Model Context Protocol (MCP) Type Definitions
 *
 * Implements the MCP protocol specification for VibeSec
 * @see https://spec.modelcontextprotocol.io/
 */

/**
 * JSON-RPC 2.0 Request
 */
export interface MCPRequest {
  /** Unique request identifier */
  id: string | number;

  /** JSON-RPC version (always "2.0") */
  jsonrpc?: '2.0';

  /** Method name to invoke */
  method: string;

  /** Method parameters */
  params?: Record<string, unknown>;
}

/**
 * JSON-RPC 2.0 Response
 */
export interface MCPResponse {
  /** Request identifier (matches request.id) */
  id: string | number;

  /** JSON-RPC version (always "2.0") */
  jsonrpc?: '2.0';

  /** Successful result (mutually exclusive with error) */
  result?: unknown;

  /** Error result (mutually exclusive with result) */
  error?: MCPError;
}

/**
 * JSON-RPC 2.0 Error Object
 */
export interface MCPError {
  /** Error code (standard JSON-RPC codes or custom) */
  code: number;

  /** Human-readable error message */
  message: string;

  /** Additional error data */
  data?: unknown;
}

/**
 * Standard JSON-RPC Error Codes
 */
export enum MCPErrorCode {
  /** Invalid JSON was received */
  PARSE_ERROR = -32700,

  /** JSON is valid but does not match protocol */
  INVALID_REQUEST = -32600,

  /** Method does not exist */
  METHOD_NOT_FOUND = -32601,

  /** Invalid method parameters */
  INVALID_PARAMS = -32602,

  /** Internal server error */
  INTERNAL_ERROR = -32603,

  /** Custom: Tool not found */
  TOOL_NOT_FOUND = -32001,

  /** Custom: Tool execution failed */
  TOOL_EXECUTION_ERROR = -32002,

  /** Custom: Invalid tool arguments */
  INVALID_TOOL_ARGS = -32003,
}

/**
 * JSON Schema Definition
 * Simplified subset for MCP tool parameters
 */
export interface JSONSchema {
  /** Schema type */
  type: 'object' | 'string' | 'number' | 'boolean' | 'array' | 'null';

  /** Object properties (for type: object) */
  properties?: Record<string, JSONSchema>;

  /** Required property names (for type: object) */
  required?: string[];

  /** Array item schema (for type: array) */
  items?: JSONSchema;

  /** Enum values */
  enum?: (string | number)[];

  /** Property description */
  description?: string;

  /** Whether property is optional */
  optional?: boolean;

  /** Default value */
  default?: unknown;

  /** Minimum value (for type: number) */
  minimum?: number;

  /** Maximum value (for type: number) */
  maximum?: number;

  /** Minimum length (for type: string/array) */
  minLength?: number;

  /** Maximum length (for type: string/array) */
  maxLength?: number;

  /** Pattern (for type: string) */
  pattern?: string;
}

/**
 * MCP Tool Definition
 * Represents a callable tool that AI assistants can invoke
 */
export interface MCPTool {
  /** Unique tool name (e.g., "vibesec_scan") */
  name: string;

  /** Human-readable description of what the tool does */
  description: string;

  /** JSON Schema defining input parameters */
  inputSchema: JSONSchema;

  /** Tool implementation function */
  handler: (params: unknown) => Promise<unknown>;
}

/**
 * Tool List Response
 * Returned by the tools/list method
 */
export interface ToolListResponse {
  tools: ToolInfo[];
}

/**
 * Tool Information (without handler)
 * Used in tools/list responses
 */
export interface ToolInfo {
  name: string;
  description: string;
  inputSchema: JSONSchema;
}

/**
 * Tool Call Request Parameters
 * For the tools/call method
 */
export interface ToolCallParams {
  /** Name of the tool to call */
  name: string;

  /** Arguments to pass to the tool */
  arguments?: unknown;
}

/**
 * MCP Server Configuration
 */
export interface MCPServerConfig {
  /** Server name (e.g., "vibesec") */
  name: string;

  /** Server version (e.g., "1.0.0") */
  version: string;

  /** Server capabilities */
  capabilities: MCPCapability[];

  /** Optional: Server description */
  description?: string;
}

/**
 * MCP Server Capabilities
 */
export type MCPCapability = 'tools' | 'prompts' | 'resources' | 'completion';

/**
 * Server Info Response
 * Returned by the initialize method
 */
export interface ServerInfo {
  name: string;
  version: string;
  capabilities: Record<MCPCapability, boolean>;
}

/**
 * Initialize Request Parameters
 */
export interface InitializeParams {
  /** Client name */
  clientName: string;

  /** Client version */
  clientVersion: string;

  /** Client capabilities */
  capabilities?: Partial<Record<MCPCapability, boolean>>;
}

/**
 * Notification Message
 * One-way message from server to client (no response expected)
 */
export interface MCPNotification {
  /** JSON-RPC version */
  jsonrpc: '2.0';

  /** Notification method */
  method: string;

  /** Notification parameters */
  params?: Record<string, unknown>;
}

/**
 * Progress Notification Parameters
 * For long-running operations
 */
export interface ProgressParams {
  /** Operation identifier */
  token: string | number;

  /** Progress value (0-100) */
  value: number;

  /** Optional progress message */
  message?: string;
}

/**
 * Tool Result
 * Standardized structure for tool responses
 */
export interface ToolResult<T = unknown> {
  /** Whether the tool execution was successful */
  success: boolean;

  /** Result data (if successful) */
  data?: T;

  /** Error message (if failed) */
  error?: string;

  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Type guard to check if object is a valid MCP request
 */
export function isValidMCPRequest(obj: unknown): obj is MCPRequest {
  if (!obj || typeof obj !== 'object') return false;

  const req = obj as Partial<MCPRequest>;

  return (
    (typeof req.id === 'string' || typeof req.id === 'number') &&
    typeof req.method === 'string' &&
    (req.params === undefined || typeof req.params === 'object')
  );
}

/**
 * Type guard to check if object is a valid tool call params
 */
export function isValidToolCallParams(obj: unknown): obj is ToolCallParams {
  if (!obj || typeof obj !== 'object') return false;

  const params = obj as Partial<ToolCallParams>;

  return typeof params.name === 'string';
}

/**
 * Create an MCP error response
 */
export function createErrorResponse(
  id: string | number,
  code: number,
  message: string,
  data?: unknown
): MCPResponse {
  return {
    id,
    jsonrpc: '2.0',
    error: {
      code,
      message,
      data,
    },
  };
}

/**
 * Create an MCP success response
 */
export function createSuccessResponse(id: string | number, result: unknown): MCPResponse {
  return {
    id,
    jsonrpc: '2.0',
    result,
  };
}

/**
 * Create an MCP notification
 */
export function createNotification(
  method: string,
  params?: Record<string, unknown>
): MCPNotification {
  return {
    jsonrpc: '2.0',
    method,
    params,
  };
}
