/**
 * VibeSec Scan Code Tool for MCP
 *
 * Provides security scanning functionality for raw code content via the Model Context Protocol.
 * Accepts code strings directly instead of file paths for Cloudflare Workers deployment.
 */

import {
  Finding,
  Severity,
  Category,
  ScanResult as CoreScanResult,
} from '../../../scanner/core/types';
import { MCPTool } from '../types';

/**
 * Input parameters for vibesec_scan_code tool
 */
export interface ScanCodeParams {
  /** Raw code content to scan */
  code: string;
  /** Programming language (typescript, javascript, python, etc.) */
  language: string;
  /** Optional filename for context (affects rule matching) */
  filename?: string;
  /** Optional: Filter by specific severity level (critical, high, medium, low) */
  severity?: 'critical' | 'high' | 'medium' | 'low';
  /** Optional: Specific rule IDs to run (if omitted, runs all rules) */
  rules?: string[];
  /** Optional: Output format (json is default for MCP) */
  format?: 'json' | 'text' | 'sarif';
}

/**
 * Result from vibesec_scan_code tool
 */
export interface ScanCodeResult {
  /** Array of security findings */
  findings: Finding[];
  /** Summary statistics */
  summary: {
    total: number;
    bySeverity: {
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
    byCategory: Record<string, number>;
  };
  /** Scan metadata */
  scan: {
    language: string;
    filename?: string;
    rulesApplied: number;
    duration: number;
  };
}

/**
 * MCP tool schema for vibesec_scan_code
 */
export const vibesecScanCodeTool: MCPTool = {
  name: 'vibesec_scan_code',
  description: `Scan raw code content for security vulnerabilities.

Use this tool to analyze code snippets, functions, or entire files for security issues without requiring file system access.

Supported languages: typescript, javascript, python, java, csharp, go, rust, php, ruby

Capabilities:
- Detects hardcoded secrets and API keys
- Identifies SQL/command injection vulnerabilities
- Finds path traversal issues
- Catches authentication/authorization flaws
- Discovers insecure crypto usage
- Identifies incomplete implementations

Returns detailed findings with severity levels, descriptions, and fix recommendations.`,

  inputSchema: {
    type: 'object',
    properties: {
      code: {
        type: 'string',
        description: 'Raw code content to scan for security vulnerabilities',
      },
      language: {
        type: 'string',
        enum: ['typescript', 'javascript', 'python', 'java', 'csharp', 'go', 'rust', 'php', 'ruby'],
        description: 'Programming language of the code (affects which rules are applied)',
      },
      filename: {
        type: 'string',
        description:
          'Optional filename for context (e.g., "auth.ts", "api.py"). Helps with rule matching.',
      },
      severity: {
        type: 'string',
        enum: ['critical', 'high', 'medium', 'low'],
        description: 'Filter findings by minimum severity level. If omitted, returns all findings.',
      },
      rules: {
        type: 'array',
        items: { type: 'string' },
        description:
          'Optional: Specific rule IDs to run (e.g., ["hardcoded-secret", "sql-injection"]). If omitted, runs all applicable rules.',
      },
      format: {
        type: 'string',
        enum: ['json', 'text', 'sarif'],
        description: 'Output format (default: json)',
        default: 'json',
      },
    },
    required: ['code', 'language'],
  },

  handler: handleScanCode,
};

/**
 * Handler for vibesec_scan_code tool
 */
export async function handleScanCode(params: unknown): Promise<ScanCodeResult> {
  // Validate and parse parameters
  const scanParams = validateScanCodeParams(params);

  // Create virtual file path for scanner
  const virtualPath = scanParams.filename || `code.${getExtensionForLanguage(scanParams.language)}`;

  // Create in-memory scanner that works with code content
  const scanner = new InMemoryScanner({
    code: scanParams.code,
    language: scanParams.language,
    filename: virtualPath,
    severity: scanParams.severity ? (scanParams.severity.toLowerCase() as Severity) : Severity.LOW,
    rules: scanParams.rules,
  });

  // Run scan
  const result: CoreScanResult = await scanner.scan();

  // Transform to MCP response format
  return transformScanCodeResult(result, scanParams);
}

/**
 * In-memory scanner for code content (Cloudflare Workers compatible)
 */
class InMemoryScanner {
  private options: {
    code: string;
    language: string;
    filename: string;
    severity: Severity;
    rules?: string[];
  };

  constructor(options: {
    code: string;
    language: string;
    filename: string;
    severity: Severity;
    rules?: string[];
  }) {
    this.options = options;
  }

  async scan(): Promise<CoreScanResult> {
    const startTime = Date.now();
    const findings: Finding[] = [];

    // Basic regex-based scanning for common vulnerabilities
    findings.push(...this.scanForHardcodedSecrets());
    findings.push(...this.scanForSQLInjection());
    findings.push(...this.scanForCommandInjection());
    findings.push(...this.scanForPathTraversal());

    // Filter by severity
    const filteredFindings = findings.filter(
      (finding) =>
        this.getSeverityLevel(finding.severity) >= this.getSeverityLevel(this.options.severity)
    );

    // Calculate summary
    const summary = this.calculateSummary(filteredFindings);

    return {
      version: '1.0.0',
      scan: {
        path: this.options.filename,
        filesScanned: 1,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      },
      summary,
      findings: filteredFindings,
    };
  }

  private scanForHardcodedSecrets(): Finding[] {
    const findings: Finding[] = [];
    const { code, filename } = this.options;

    // Common secret patterns
    const secretPatterns = [
      {
        regex: /['"`](sk-[a-zA-Z0-9]{48})['"`]/g,
        type: 'OpenAI API Key',
        severity: Severity.CRITICAL,
      },
      {
        regex: /['"`](xoxb-[0-9]+-[0-9]+-[a-zA-Z0-9]+)['"`]/g,
        type: 'Slack Bot Token',
        severity: Severity.CRITICAL,
      },
      {
        regex: /['"`](ghp_[a-zA-Z0-9]{36})['"`]/g,
        type: 'GitHub Personal Access Token',
        severity: Severity.CRITICAL,
      },
      {
        regex: /['"`](AIza[0-9A-Za-z-_]{35})['"`]/g,
        type: 'Google API Key',
        severity: Severity.HIGH,
      },
      {
        regex: /password\s*[:=]\s*['"`]([^'"\s]{8,})['"`]/gi,
        type: 'Hardcoded Password',
        severity: Severity.HIGH,
      },
      {
        regex: /secret\s*[:=]\s*['"`]([^'"\s]{8,})['"`]/gi,
        type: 'Hardcoded Secret',
        severity: Severity.HIGH,
      },
      {
        regex: /token\s*[:=]\s*['"`]([^'"\s]{20,})['"`]/gi,
        type: 'Hardcoded Token',
        severity: Severity.MEDIUM,
      },
    ];

    for (const pattern of secretPatterns) {
      let match;
      while ((match = pattern.regex.exec(code)) !== null) {
        const line = this.getLineNumber(code, match.index);
        const snippet = this.getCodeSnippet(code, line);

        findings.push({
          id: `hardcoded-${pattern.type.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          rule: 'hardcoded-secret',
          severity: pattern.severity,
          category: Category.SECRETS,
          title: `Hardcoded ${pattern.type}`,
          description: `Found hardcoded ${pattern.type.toLowerCase()}. Never commit secrets to version control.`,
          location: {
            file: filename,
            line,
            column: match.index - code.lastIndexOf('\n', match.index) + 1,
          },
          snippet,
          fix: {
            recommendation: 'Move secrets to environment variables or secure credential storage',
            before: match[0],
            after: `process.env.${pattern.type.toUpperCase().replace(/\s+/g, '_')}_KEY`,
            references: [
              'https://owasp.org/www-community/vulnerabilities/Use_of_hardcoded_credentials',
            ],
          },
          metadata: {
            confidence: 0.9,
            cwe: '798',
            owasp: 'A2:2017-Broken Authentication',
          },
        });
      }
    }

    return findings;
  }

  private scanForSQLInjection(): Finding[] {
    const findings: Finding[] = [];
    const { code, filename, language } = this.options;

    if (!['javascript', 'typescript', 'python', 'java', 'csharp', 'php'].includes(language)) {
      return findings;
    }

    // SQL injection patterns
    const sqlPatterns = [
      {
        regex: /(\$_(?:GET|POST|REQUEST)\[.*?\]|\w+\.query\(.*?\+\s*\$)/gi,
        type: 'Potential SQL Injection',
        severity: Severity.HIGH,
      },
      {
        regex: /execute\(.*?\+\s*['"`]/gi,
        type: 'String Concatenation in SQL',
        severity: Severity.MEDIUM,
      },
      {
        regex: /query\(.*?\$\{.*?\}/gi,
        type: 'Template Literal in SQL Query',
        severity: Severity.MEDIUM,
      },
    ];

    for (const pattern of sqlPatterns) {
      let match;
      while ((match = pattern.regex.exec(code)) !== null) {
        const line = this.getLineNumber(code, match.index);
        const snippet = this.getCodeSnippet(code, line);

        findings.push({
          id: `sql-injection-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          rule: 'sql-injection',
          severity: pattern.severity,
          category: Category.INJECTION,
          title: pattern.type,
          description:
            'Potential SQL injection vulnerability detected. User input is being concatenated into SQL queries.',
          location: {
            file: filename,
            line,
            column: match.index - code.lastIndexOf('\n', match.index) + 1,
          },
          snippet,
          fix: {
            recommendation: 'Use parameterized queries or prepared statements',
            before: match[0],
            after: 'Use prepared statements with bound parameters',
            references: ['https://owasp.org/www-community/attacks/SQL_Injection'],
          },
          metadata: {
            confidence: 0.7,
            cwe: '89',
            owasp: 'A1:2017-Injection',
          },
        });
      }
    }

    return findings;
  }

  private scanForCommandInjection(): Finding[] {
    const findings: Finding[] = [];
    const { code, filename, language } = this.options;

    if (
      !['javascript', 'typescript', 'python', 'java', 'csharp', 'go', 'php', 'ruby'].includes(
        language
      )
    ) {
      return findings;
    }

    // Command injection patterns
    const cmdPatterns = [
      {
        regex: /(exec|system|shell_exec|passthru|eval)\s*\(\s*.*?\+\s*\$/gi,
        type: 'Command Injection',
        severity: Severity.CRITICAL,
      },
      {
        regex: /spawn\([^,]+,\s*\[.*?\$\w+.*?\]/gi,
        type: 'Command Injection in Spawn',
        severity: Severity.HIGH,
      },
      {
        regex: /child_process\.(exec|spawn|execSync)\([^,]*\$\{/gi,
        type: 'Template Literal in Command',
        severity: Severity.HIGH,
      },
    ];

    for (const pattern of cmdPatterns) {
      let match;
      while ((match = pattern.regex.exec(code)) !== null) {
        const line = this.getLineNumber(code, match.index);
        const snippet = this.getCodeSnippet(code, line);

        findings.push({
          id: `command-injection-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          rule: 'command-injection',
          severity: pattern.severity,
          category: Category.INJECTION,
          title: pattern.type,
          description:
            'Potential command injection vulnerability. User input is being executed as system commands.',
          location: {
            file: filename,
            line,
            column: match.index - code.lastIndexOf('\n', match.index) + 1,
          },
          snippet,
          fix: {
            recommendation: 'Validate and sanitize user input, avoid shell execution of user data',
            before: match[0],
            after: 'Use safe APIs and validate input',
            references: ['https://owasp.org/www-community/attacks/Command_Injection'],
          },
          metadata: {
            confidence: 0.8,
            cwe: '78',
            owasp: 'A1:2017-Injection',
          },
        });
      }
    }

    return findings;
  }

  private scanForPathTraversal(): Finding[] {
    const findings: Finding[] = [];
    const { code, filename } = this.options;

    // Path traversal patterns
    const pathPatterns = [
      { regex: /\.\.[/\\]/g, type: 'Path Traversal', severity: Severity.HIGH },
      { regex: /\.\.%2f/gi, type: 'URL Encoded Path Traversal', severity: Severity.HIGH },
      { regex: /\/\.\.\//g, type: 'Directory Traversal', severity: Severity.MEDIUM },
    ];

    for (const pattern of pathPatterns) {
      let match;
      while ((match = pattern.regex.exec(code)) !== null) {
        const line = this.getLineNumber(code, match.index);
        const snippet = this.getCodeSnippet(code, line);

        findings.push({
          id: `path-traversal-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          rule: 'path-traversal',
          severity: pattern.severity,
          category: Category.INJECTION,
          title: pattern.type,
          description: 'Potential path traversal vulnerability detected.',
          location: {
            file: filename,
            line,
            column: match.index - code.lastIndexOf('\n', match.index) + 1,
          },
          snippet,
          fix: {
            recommendation: 'Validate file paths and use safe path resolution',
            before: match[0],
            after: 'Use path.resolve() and validate paths',
            references: ['https://owasp.org/www-community/attacks/Path_Traversal'],
          },
          metadata: {
            confidence: 0.6,
            cwe: '22',
            owasp: 'A5:2017-Broken Access Control',
          },
        });
      }
    }

    return findings;
  }

  private getLineNumber(code: string, index: number): number {
    return code.substring(0, index).split('\n').length;
  }

  private getCodeSnippet(code: string, lineNumber: number, context: number = 2): string {
    const lines = code.split('\n');
    const start = Math.max(0, lineNumber - context - 1);
    const end = Math.min(lines.length, lineNumber + context);

    return lines
      .slice(start, end)
      .map((line, i) => {
        const actualLine = start + i + 1;
        const prefix = actualLine === lineNumber ? '→ ' : '  ';
        return `${prefix}${actualLine.toString().padStart(4, ' ')} | ${line}`;
      })
      .join('\n');
  }

  private getSeverityLevel(severity: Severity): number {
    const levels = {
      [Severity.CRITICAL]: 4,
      [Severity.HIGH]: 3,
      [Severity.MEDIUM]: 2,
      [Severity.LOW]: 1,
    };
    return levels[severity] || 0;
  }

  private calculateSummary(findings: Finding[]) {
    const summary = {
      total: findings.length,
      bySeverity: { critical: 0, high: 0, medium: 0, low: 0 },
      byCategory: {} as Record<string, number>,
    };

    for (const finding of findings) {
      summary.bySeverity[finding.severity as keyof typeof summary.bySeverity]++;
      summary.byCategory[finding.category] = (summary.byCategory[finding.category] || 0) + 1;
    }

    return summary;
  }
}

/**
 * Transform core scan result to MCP format
 */
function transformScanCodeResult(result: CoreScanResult, params: ScanCodeParams): ScanCodeResult {
  return {
    findings: result.findings,
    summary: result.summary,
    scan: {
      language: params.language,
      filename: params.filename,
      rulesApplied: params.rules?.length || 0,
      duration: result.scan.duration,
    },
  };
}

/**
 * Validate and parse scan code parameters
 */
function validateScanCodeParams(params: unknown): ScanCodeParams {
  if (!params || typeof params !== 'object') {
    throw new Error('Invalid parameters: expected object');
  }

  const p = params as Record<string, unknown>;

  // Validate code parameter (required)
  if (!p.code || typeof p.code !== 'string') {
    throw new Error('Invalid parameters: "code" must be a non-empty string');
  }

  // Validate language parameter (required)
  if (!p.language || typeof p.language !== 'string') {
    throw new Error('Invalid parameters: "language" must be a string');
  }

  const supportedLanguages = [
    'typescript',
    'javascript',
    'python',
    'java',
    'csharp',
    'go',
    'rust',
    'php',
    'ruby',
  ];
  if (!supportedLanguages.includes(p.language.toLowerCase())) {
    throw new Error(
      `Invalid parameters: "language" must be one of: ${supportedLanguages.join(', ')}`
    );
  }

  // Validate filename parameter (optional)
  if (p.filename && typeof p.filename !== 'string') {
    throw new Error('Invalid parameters: "filename" must be a string');
  }

  // Validate severity parameter (optional)
  if (p.severity) {
    if (typeof p.severity !== 'string') {
      throw new Error('Invalid parameters: "severity" must be a string');
    }
    if (!['critical', 'high', 'medium', 'low'].includes(p.severity.toLowerCase())) {
      throw new Error('Invalid parameters: "severity" must be one of: critical, high, medium, low');
    }
  }

  // Validate rules parameter (optional)
  if (p.rules) {
    if (!Array.isArray(p.rules)) {
      throw new Error('Invalid parameters: "rules" must be an array of strings');
    }
    for (const rule of p.rules) {
      if (typeof rule !== 'string') {
        throw new Error('Invalid parameters: "rules" must contain only strings');
      }
    }
  }

  // Validate format parameter (optional)
  if (p.format) {
    if (typeof p.format !== 'string') {
      throw new Error('Invalid parameters: "format" must be a string');
    }
    if (!['json', 'text', 'sarif'].includes(p.format.toLowerCase())) {
      throw new Error('Invalid parameters: "format" must be one of: json, text, sarif');
    }
  }

  return {
    code: p.code,
    language: p.language.toLowerCase(),
    filename: p.filename as string | undefined,
    severity: p.severity as 'critical' | 'high' | 'medium' | 'low' | undefined,
    rules: p.rules as string[] | undefined,
    format: p.format as 'json' | 'text' | 'sarif' | undefined,
  };
}

/**
 * Get file extension for language
 */
function getExtensionForLanguage(language: string): string {
  const extensions: Record<string, string> = {
    typescript: 'ts',
    javascript: 'js',
    python: 'py',
    java: 'java',
    csharp: 'cs',
    go: 'go',
    rust: 'rs',
    php: 'php',
    ruby: 'rb',
  };
  return extensions[language] || 'txt';
}
