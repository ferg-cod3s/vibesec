import { BunASTParser, ParseResult } from '../ast-parser/bun-parser';

export interface SecurityFinding {
  pattern: string;
  filePath: string;
  line: number;
  column: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  code: string;
}

/**
 * Detects hardcoded secrets like API keys, tokens, passwords
 */
export class BunSecretsDetector {
  private parser: BunASTParser;
  private secretPatterns = [
    /api[_-]?key\s*[:=]\s*["']([^"']{10,})/gi,
    /password\s*[:=]\s*["']([^"']{5,})/gi,
    /token\s*[:=]\s*["']([^"']{10,})/gi,
    /secret\s*[:=]\s*["']([^"']{10,})/gi,
    /auth[_-]?token\s*[:=]\s*["']([^"']{10,})/gi,
    /sk[_-]test[_-][a-z0-9]{24,}/gi, // Stripe test key
    /pk[_-]live[_-][a-z0-9]{24,}/gi, // Stripe live key
    /[0-9a-f]{32,}/gi, // Generic hex strings that might be keys
  ];

  constructor(parser: BunASTParser) {
    this.parser = parser;
  }

  async detect(parseResult: ParseResult): Promise<SecurityFinding[]> {
    const findings: SecurityFinding[] = [];
    const { content, tree, filePath } = parseResult;

    // Get string literals
    const stringNodes = this.parser.findStringLiterals(tree);

    for (const node of stringNodes) {
      const nodeText = this.parser.getNodeText(node, content);
      const cleanText = nodeText.slice(1, -1); // Remove quotes

      // Check against patterns
      for (const pattern of this.secretPatterns) {
        if (pattern.test(cleanText)) {
          const location = this.parser.getNodeLocation(node);
          findings.push({
            pattern: 'hardcoded_secret',
            filePath,
            line: location.line,
            column: location.column,
            severity: 'critical',
            message: `Potential hardcoded secret detected in string literal`,
            code: cleanText.substring(0, 50),
          });
          break; // Only report once per node
        }
      }
    }

    return findings;
  }
}

/**
 * Detects potential SQL injection vulnerabilities
 * Looks for string concatenation or template strings in SQL queries
 */
export class BunSQLInjectionDetector {
  private parser: BunASTParser;
  private sqlKeywords = ['select', 'insert', 'update', 'delete', 'drop', 'create', 'alter'];

  constructor(parser: BunASTParser) {
    this.parser = parser;
  }

  async detect(parseResult: ParseResult): Promise<SecurityFinding[]> {
    const findings: SecurityFinding[] = [];
    const { content, tree, filePath } = parseResult;

    // Get template strings (most likely SQL injection vectors)
    const templateNodes = this.parser.findTemplateStrings(tree);

    for (const node of templateNodes) {
      const nodeText = this.parser.getNodeText(node, content);

      // Check if template contains SQL keywords
      const containsSQLKeyword = this.sqlKeywords.some(keyword =>
        nodeText.toLowerCase().includes(keyword)
      );

      if (containsSQLKeyword && nodeText.includes('${')) {
        const location = this.parser.getNodeLocation(node);
        findings.push({
          pattern: 'sql_injection',
          filePath,
          line: location.line,
          column: location.column,
          severity: 'high',
          message: `Potential SQL injection: SQL query with variable interpolation`,
          code: nodeText.substring(0, 60),
        });
      }
    }

    // Also check for string concatenation in function calls
    const functionCalls = this.parser.findFunctionCalls(tree);
    for (const node of functionCalls) {
      const nodeText = this.parser.getNodeText(node, content);

      // Look for query-like function names with concatenation
      if ((nodeText.includes('query') || nodeText.includes('execute')) && nodeText.includes('+')) {
        const location = this.parser.getNodeLocation(node);
        findings.push({
          pattern: 'sql_injection',
          filePath,
          line: location.line,
          column: location.column,
          severity: 'medium',
          message: `Potential SQL injection: String concatenation in query`,
          code: nodeText.substring(0, 60),
        });
      }
    }

    return findings;
  }
}

export class BunDetectorSuite {
  private secretsDetector: BunSecretsDetector;
  private sqlDetector: BunSQLInjectionDetector;

  constructor(parser: BunASTParser) {
    this.secretsDetector = new BunSecretsDetector(parser);
    this.sqlDetector = new BunSQLInjectionDetector(parser);
  }

  async detectAll(parseResult: ParseResult): Promise<SecurityFinding[]> {
    const [secretsFindings, sqlFindings] = await Promise.all([
      this.secretsDetector.detect(parseResult),
      this.sqlDetector.detect(parseResult),
    ]);

    return [...secretsFindings, ...sqlFindings];
  }
}

export default BunDetectorSuite;
