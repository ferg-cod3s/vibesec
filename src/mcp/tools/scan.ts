/**
 * VibeSec Scan Tool for MCP
 *
 * Provides security scanning functionality to AI assistants via the Model Context Protocol.
 * Wraps the existing Scanner engine with MCP-compatible interface.
 */

import { Scanner } from '../../../scanner/core/engine';
import { Finding, Severity, ScanResult as CoreScanResult } from '../../../scanner/core/types';
import { MCPTool } from '../types';
import { validatePath, PathValidationError } from '../../../lib/path-validator';

/**
 * Input parameters for vibesec_scan tool
 */
export interface ScanParams {
  /** Array of file paths or glob patterns to scan */
  files: string[];
  /** Optional: Filter by specific severity level (critical, high, medium, low) */
  severity?: 'critical' | 'high' | 'medium' | 'low';
  /** Optional: Specific rule IDs to run (if omitted, runs all rules) */
  rules?: string[];
  /** Optional: Output format (json is default for MCP) */
  format?: 'json' | 'text' | 'sarif';
  /** Optional: Base path for scanning (defaults to current directory) */
  basePath?: string;
  /** Optional: Enable parallel scanning (default: true) */
  parallel?: boolean;
}

/**
 * Result from vibesec_scan tool
 */
export interface ScanToolResult {
  /** Array of security findings */
  findings: Finding[];
  /** Summary statistics */
  summary: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    filesScanned: number;
  };
  /** Scan metadata */
  scan: {
    timestamp: string;
    duration: number;
    path: string;
  };
  /** Overall security status */
  status: 'pass' | 'warning' | 'fail';
}

/**
 * MCP tool schema for vibesec_scan
 */
export const vibesecScanTool: MCPTool = {
  name: 'vibesec_scan',
  description: `Scan code files for security vulnerabilities using VibeSec's AI-native security scanner.

This tool detects:
- Hardcoded secrets and credentials
- SQL injection vulnerabilities
- Command injection risks
- Path traversal issues
- Incomplete implementations
- Authentication/authorization flaws
- AI-specific security risks (prompt injection, unsafe LLM calls)

Returns detailed findings with severity levels, descriptions, and fix recommendations.`,

  inputSchema: {
    type: 'object',
    properties: {
      files: {
        type: 'array',
        items: { type: 'string' },
        description: 'Array of file paths or glob patterns to scan (e.g., ["src/**/*.ts", "lib/auth.js"])',
      },
      severity: {
        type: 'string',
        enum: ['critical', 'high', 'medium', 'low'],
        description: 'Filter findings by minimum severity level. If omitted, returns all findings.',
      },
      rules: {
        type: 'array',
        items: { type: 'string' },
        description: 'Optional: Specific rule IDs to run (e.g., ["hardcoded-secret", "sql-injection"]). If omitted, runs all applicable rules.',
      },
      format: {
        type: 'string',
        enum: ['json', 'text', 'sarif'],
        description: 'Output format (default: json)',
        default: 'json',
      },
      basePath: {
        type: 'string',
        description: 'Base directory for scanning. Defaults to current working directory.',
      },
      parallel: {
        type: 'boolean',
        description: 'Enable parallel file scanning for better performance (default: true)',
        default: true,
      },
    },
    required: ['files'],
  },

  handler: handleScan,
};

/**
 * Handler for vibesec_scan tool
 */
export async function handleScan(params: unknown): Promise<ScanToolResult> {
  // Validate and parse parameters
  const scanParams = validateScanParams(params);

  // Determine and validate scan path (single file or directory)
  let scanPath: string;
  try {
    const inputPath = scanParams.basePath || process.cwd();
    // Validate the path to prevent path traversal attacks
    // We allow external paths for MCP since AI assistants may need to scan anywhere
    // but we still sanitize and normalize the path
    scanPath = validatePath(inputPath, { allowExternal: true });
  } catch (error) {
    if (error instanceof PathValidationError) {
      throw new Error(`Invalid base path: ${error.message}`);
    }
    throw error;
  }

  // Create scanner with validated options
  const scanner = new Scanner({
    path: scanPath,
    severity: scanParams.severity ? (scanParams.severity.toLowerCase() as Severity) : Severity.LOW,
    format: scanParams.format === 'text' ? 'text' : 'json',
    include: scanParams.files.length > 0 ? scanParams.files : ['**/*.{js,ts,py,jsx,tsx}'],
    parallel: scanParams.parallel !== false,
    quiet: true, // Suppress console output for MCP
  });

  // Run scan
  const result: CoreScanResult = await scanner.scan();

  // Transform to MCP response format
  return transformScanResult(result, scanParams);
}

/**
 * Validate and parse scan parameters
 */
function validateScanParams(params: unknown): ScanParams {
  if (!params || typeof params !== 'object') {
    throw new Error('Invalid parameters: expected object');
  }

  const p = params as Record<string, unknown>;

  // Validate files parameter (required)
  if (!p.files || !Array.isArray(p.files)) {
    throw new Error('Invalid parameters: "files" is required and must be an array');
  }

  if (p.files.length === 0) {
    throw new Error('Invalid parameters: "files" array cannot be empty');
  }

  if (!p.files.every((f) => typeof f === 'string')) {
    throw new Error('Invalid parameters: all items in "files" must be strings');
  }

  // Validate severity (optional)
  if (p.severity && typeof p.severity !== 'string') {
    throw new Error('Invalid parameters: "severity" must be a string');
  }

  if (p.severity && !['critical', 'high', 'medium', 'low'].includes(p.severity as string)) {
    throw new Error('Invalid parameters: "severity" must be one of: critical, high, medium, low');
  }

  // Validate rules (optional)
  if (p.rules !== undefined) {
    if (!Array.isArray(p.rules) || !p.rules.every((r) => typeof r === 'string')) {
      throw new Error('Invalid parameters: "rules" must be an array of strings');
    }
  }

  // Validate format (optional)
  if (p.format && !['json', 'text', 'sarif'].includes(p.format as string)) {
    throw new Error('Invalid parameters: "format" must be one of: json, text, sarif');
  }

  // Validate basePath (optional)
  if (p.basePath && typeof p.basePath !== 'string') {
    throw new Error('Invalid parameters: "basePath" must be a string');
  }

  // Validate parallel (optional)
  if (p.parallel !== undefined && typeof p.parallel !== 'boolean') {
    throw new Error('Invalid parameters: "parallel" must be a boolean');
  }

  return {
    files: p.files as string[],
    severity: p.severity as 'critical' | 'high' | 'medium' | 'low' | undefined,
    rules: p.rules as string[] | undefined,
    format: (p.format as 'json' | 'text' | 'sarif' | undefined) || 'json',
    basePath: p.basePath as string | undefined,
    parallel: p.parallel as boolean | undefined,
  };
}

/**
 * Transform core ScanResult to MCP tool result
 */
function transformScanResult(
  coreResult: CoreScanResult,
  params: ScanParams
): ScanToolResult {
  // Apply additional filtering if specific rules requested
  let findings = coreResult.findings;
  if (params.rules && params.rules.length > 0) {
    findings = findings.filter((f) => params.rules!.includes(f.rule));
  }

  // Calculate summary
  const summary = {
    total: findings.length,
    critical: findings.filter((f) => f.severity === Severity.CRITICAL).length,
    high: findings.filter((f) => f.severity === Severity.HIGH).length,
    medium: findings.filter((f) => f.severity === Severity.MEDIUM).length,
    low: findings.filter((f) => f.severity === Severity.LOW).length,
    filesScanned: coreResult.scan.filesScanned,
  };

  // Determine overall status
  let status: 'pass' | 'warning' | 'fail';
  if (summary.critical > 0) {
    status = 'fail';
  } else if (summary.high > 0) {
    status = 'warning';
  } else {
    status = 'pass';
  }

  return {
    findings,
    summary,
    scan: {
      timestamp: coreResult.scan.timestamp,
      duration: coreResult.scan.duration,
      path: coreResult.scan.path,
    },
    status,
  };
}
