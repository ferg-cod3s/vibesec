import {
  Finding,
  Rule,
  Severity,
  Category,
  Location,
  FixRecommendation,
  Pattern,
} from '../core/types';
import { ASTNode } from '../../src/ast/enhanced-ast-parser';
import { EQLLexer } from './eql-lexer';
import { EQLParser, QueryValidator } from './eql-parser';
import { AdvancedPatternMatcher } from './advanced-pattern-matcher';
import {
  LogicalExpression,
  PatternExpression,
  TaintExpression,
  EQLQuery,
  QueryMetadata,
} from './eql-types';
import { TaintAnalysisEngine } from './taint-analysis-engine';

/**
 * Options for enhanced AST analysis
 */
export interface EnhancedAnalysisOptions {
  enableParallelExecution?: boolean;
  enableQueryOptimization?: boolean;
  cacheResults?: boolean;
}

/**
 * Query optimization hints
 */
interface QueryOptimizationHints {
  useIndexing: boolean;
  preferEarlyExit: boolean;
  batchSimilarPatterns: boolean;
}

/**
 * Enhanced AST analysis with EQL support, parallel execution, and query optimization
 */
export class EnhancedASTAnalyzer {
  private readonly lexer: EQLLexer;
  private readonly parser: EQLParser;
  private readonly validator: QueryValidator;
  private readonly patternMatcher: AdvancedPatternMatcher;
  private readonly taintEngine: TaintAnalysisEngine;
  private readonly options: EnhancedAnalysisOptions;

  constructor(options: EnhancedAnalysisOptions = {}) {
    this.options = {
      enableParallelExecution: false,
      enableQueryOptimization: true,
      cacheResults: true,
      ...options,
    };

    this.lexer = new EQLLexer();
    this.parser = new EQLParser();
    this.validator = new QueryValidator();
    this.patternMatcher = new AdvancedPatternMatcher();
    this.taintEngine = new TaintAnalysisEngine();
  }

  /**
   * Enhanced AST analysis with EQL support, parallel execution, and query optimization
   */
  async analyze(
    filePath: string,
    content: string,
    ast: ASTNode[],
    rule: Rule,
    options?: EnhancedAnalysisOptions
  ): Promise<Finding[]> {
    const mergedOptions = { ...this.options, ...options };
    const findings: Finding[] = [];
    const lines = content.split('\n');

    // Process each pattern in the rule
    for (const p of rule.patterns as Pattern[]) {
      if (!('type' in p) || (p.type !== 'ast' && p.type !== 'eql')) continue;

      const query = 'query' in p ? String(p.query || '').trim() : '';
      if (!query) continue;

      try {
        // Check if this is an EQL query (starts with EQL keywords or has complex syntax)
        if (this.isEQLQuery(query)) {
          const eqlFindings = await this.processEQLQuery(
            filePath,
            content,
            ast,
            query,
            rule,
            mergedOptions
          );
          findings.push(...eqlFindings);
        } else {
          // Legacy simple query support for backward compatibility
          const legacyFindings = await this.processLegacyQuery(filePath, lines, ast, query, rule);
          findings.push(...legacyFindings);
        }
      } catch (error) {
        console.warn(`Failed to process query "${query}" in rule ${rule.id}:`, error);
        // Continue with other patterns even if one fails
      }
    }

    return findings;
  }

  /**
   * Process EQL queries with full advanced analysis capabilities
   */
  private async processEQLQuery(
    filePath: string,
    content: string,
    ast: ASTNode[],
    query: string,
    rule: Rule,
    options: EnhancedAnalysisOptions
  ): Promise<Finding[]> {
    // Tokenize and parse the EQL query
    const tokens = this.lexer.tokenize(query);
    const eqlQuery = this.parser.parse(tokens);

    // Validate the query
    const validation = this.validator.validate(eqlQuery);
    if (!validation.valid) {
      throw new Error(`Invalid EQL query: ${validation.errors.join(', ')}`);
    }

    // Optimize the query if enabled
    const optimizedQuery = options.enableQueryOptimization
      ? this.optimizeQuery(eqlQuery)
      : eqlQuery;

    // Process the query based on its type
    switch (optimizedQuery.expression.type) {
      case 'taint':
        return this.processTaintQuery(filePath, content, ast, optimizedQuery, rule);

      case 'logical':
        return this.processLogicalQuery(filePath, content, ast, optimizedQuery, rule);

      case 'pattern':
        return this.processPatternQuery(filePath, content, ast, optimizedQuery, rule);

      default:
        throw new Error(
          `Unsupported query type: ${(optimizedQuery.expression as LogicalExpression | PatternExpression | TaintExpression).type}`
        );
    }
  }

  /**
   * Process taint analysis queries
   */
  private async processTaintQuery(
    filePath: string,
    content: string,
    ast: ASTNode[],
    query: EQLQuery,
    rule: Rule
  ): Promise<Finding[]> {
    const taintExpr = query.expression as TaintExpression;
    // Type assertion is safe because this function is only called for 'taint' query types
    const findings: Finding[] = [];

    // Convert EQL taint expression to TaintAnalysisEngine format
    const sourceConfig = {
      nodeType: Array.isArray(taintExpr.source.nodeType)
        ? taintExpr.source.nodeType
        : [taintExpr.source.nodeType],
      patterns: taintExpr.source.patterns.map((p) => ({
        type: p.type,
        value: p.value,
        caseSensitive: p.caseSensitive ?? true,
      })),
    };

    const sinkConfig = {
      nodeType: Array.isArray(taintExpr.sink.nodeType)
        ? taintExpr.sink.nodeType
        : [taintExpr.sink.nodeType],
      patterns: taintExpr.sink.patterns.map((p) => ({
        type: p.type,
        value: p.value,
        caseSensitive: p.caseSensitive ?? true,
      })),
    };

    const sanitizerConfigs =
      taintExpr.sanitizers?.map((s) => ({
        nodeType: Array.isArray(s.nodeType) ? s.nodeType : [s.nodeType],
        patterns: s.patterns.map((p) => ({
          type: p.type,
          value: p.value,
          caseSensitive: p.caseSensitive ?? true,
        })),
      })) || [];

    // Run taint analysis
    const taintResults = await this.taintEngine.analyzeTaintFlows(
      [sourceConfig],
      [sinkConfig],
      sanitizerConfigs,
      ast
    );

    // Convert taint results to findings
    for (const result of taintResults) {
      const location: Location = {
        file: filePath,
        line: result.sink.node.line,
        column: result.sink.node.column,
      };

      const snippet = this.getSnippet(content.split('\n'), result.sink.node.line - 1);

      const fix: FixRecommendation = {
        recommendation: this.generateTaintFixRecommendation(result),
        before: result.sink.node.content.trim(),
        after: '',
        references: rule.fix?.references || [],
      };

      findings.push({
        id: `${rule.id}-taint-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        rule: rule.id,
        severity: this.mapRiskLevelToSeverity(result.riskLevel),
        category: rule.category as Category,
        title: rule.name,
        description: `${rule.description}\n\nTaint Analysis Details:\nFlow from source to sink detected`,
        location,
        snippet,
        fix,
        metadata: {
          confidence: rule.confidence || 0.8,
          cwe: rule.metadata?.cwe,
          owasp: rule.metadata?.owasp,
          taintFlow: result.path,
          riskLevel: result.riskLevel,
          flowDistance: result.flowDistance,
        },
      });
    }

    return findings;
  }

  /**
   * Process logical queries (AND, OR, NOT)
   */
  private async processLogicalQuery(
    filePath: string,
    content: string,
    ast: ASTNode[],
    query: EQLQuery,
    rule: Rule
  ): Promise<Finding[]> {
    const logicalExpr = query.expression as LogicalExpression;
    const findings: Finding[] = [];

    // Process each operand
    const operandResults: Finding[][] = [];

    for (const operand of logicalExpr.operands) {
      // Process operand based on its expression type
      let operandFindings: Finding[] = [];
      switch (operand.expression.type) {
        case 'taint':
          operandFindings = await this.processTaintQuery(filePath, content, ast, operand, rule);
          break;
        case 'logical':
          operandFindings = await this.processLogicalQuery(filePath, content, ast, operand, rule);
          break;
        case 'pattern':
          operandFindings = await this.processPatternQuery(filePath, content, ast, operand, rule);
          break;
        default:
          throw new Error(
            `Unsupported operand type: ${(operand.expression as LogicalExpression | PatternExpression | TaintExpression).type}`
          );
      }
      operandResults.push(operandFindings);
    }

    // Apply logical operator
    switch (logicalExpr.operator) {
      case 'AND':
        // For AND, we need findings that satisfy all operands
        findings.push(...this.combineFindingsAND(operandResults, rule));
        break;

      case 'OR':
        // For OR, we include all findings from any operand
        findings.push(...operandResults.flat());
        break;

      case 'NOT':
        // For NOT, we would need to find nodes that DON'T match the pattern
        // This is complex and may require full AST traversal
        // For now, we'll skip NOT operations
        console.warn('NOT operator not yet implemented in enhanced AST analyzer');
        break;
    }

    return findings;
  }

  /**
   * Process pattern queries using AdvancedPatternMatcher
   */
  private async processPatternQuery(
    filePath: string,
    content: string,
    ast: ASTNode[],
    query: EQLQuery,
    rule: Rule
  ): Promise<Finding[]> {
    const patternExpr = query.expression as PatternExpression;
    const findings: Finding[] = [];

    // Run pattern matching using executeQuery
    const patternQuery = {
      expression: patternExpr,
      metadata: {},
    };
    const matches = await this.patternMatcher.executeQuery(patternQuery, ast);

    // Convert matches to findings
    for (const match of matches) {
      const location: Location = {
        file: filePath,
        line: match.node.line,
        column: match.node.column,
      };

      const snippet = this.getSnippet(content.split('\n'), match.node.line - 1);

      const fix: FixRecommendation = {
        recommendation: rule.fix?.template || 'Review and fix this security issue',
        before: match.node.content.trim(),
        after: '',
        references: rule.fix?.references || [],
      };

      findings.push({
        id: `${rule.id}-pattern-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        rule: rule.id,
        severity: rule.severity,
        category: rule.category as Category,
        title: rule.name,
        description: `${rule.description}\n\nPattern Match Details:\n${match.metadata?.matchReason || 'Pattern matched'}`,
        location,
        snippet,
        fix,
        metadata: {
          confidence: match.confidence,
          cwe: rule.metadata?.cwe,
          owasp: rule.metadata?.owasp,
          patternMatch: match.metadata,
        },
      });
    }

    return findings;
  }

  /**
   * Process legacy simple queries for backward compatibility
   */
  private async processLegacyQuery(
    filePath: string,
    lines: string[],
    ast: ASTNode[],
    query: string,
    rule: Rule
  ): Promise<Finding[]> {
    const findings: Finding[] = [];

    // Dataflow query: flow(source -> sink)
    const flowMatch = query.match(/flow\((.+)->(.+)\)/i);
    if (flowMatch) {
      const sourceRe = new RegExp(flowMatch[1].trim());
      const sinkRe = new RegExp(flowMatch[2].trim());
      this.detectNaiveFlow(filePath, lines, sourceRe, sinkRe, rule, findings);
      return findings;
    }

    // NodeType[name=Identifier]
    const nodeQuery = query.match(/^(\w+)(?:\s*\[\s*name\s*=\s*['"]?([^'"\]]+)['"]?\s*\])?$/);
    if (nodeQuery) {
      const qType = nodeQuery[1];
      const qName = nodeQuery[2];

      for (const node of ast) {
        if (node.type === qType && (!qName || node.name === qName)) {
          const location: Location = {
            file: filePath,
            line: node.line,
            column: node.column,
          };
          const snippet = this.getSnippet(lines, node.line - 1);
          const fix: FixRecommendation = {
            recommendation: rule.fix?.template || 'Review and fix this security issue',
            before: node.content.trim(),
            after: '',
            references: rule.fix?.references || [],
          };
          findings.push({
            id: `${rule.id}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            rule: rule.id,
            severity: rule.severity,
            category: rule.category as Category,
            title: rule.name,
            description: rule.description,
            location,
            snippet,
            fix,
            metadata: {
              confidence: rule.confidence ?? 0.8,
              cwe: rule.metadata?.cwe,
              owasp: rule.metadata?.owasp,
            },
          });
        }
      }
    }

    return findings;
  }

  /**
   * Check if a query is an EQL query
   */
  private isEQLQuery(query: string): boolean {
    // Check for EQL-specific keywords and patterns
    const eqlKeywords = ['TAINT', 'AND', 'OR', 'NOT', 'SOURCE', 'SINK', 'SANITIZER'];
    const hasEQLKeyword = eqlKeywords.some((keyword) => query.toUpperCase().includes(keyword));

    // Check for complex patterns that suggest EQL
    const hasComplexPattern =
      /[{}[\]()]/.test(query) && (query.includes(':') || query.includes('|'));

    return hasEQLKeyword || hasComplexPattern;
  }

  /**
   * Optimize EQL queries for better performance
   */
  private optimizeQuery(query: EQLQuery): EQLQuery {
    // Simple optimization hints for now
    // In a full implementation, this would do query rewriting, indexing hints, etc.
    return {
      ...query,
      metadata: {
        ...query.metadata,
        optimizationHints: {
          useIndexing: true,
          preferEarlyExit: true,
          batchSimilarPatterns: true,
        },
      } as QueryMetadata & { optimizationHints: QueryOptimizationHints },
    };
  }

  /**
   * Combine findings using AND logic (findings that satisfy all operands)
   */
  private combineFindingsAND(operandResults: Finding[][], _rule: Rule): Finding[] {
    if (operandResults.length === 0) return [];
    if (operandResults.length === 1) return operandResults[0];

    // For now, we'll use a simple approach: find overlapping findings
    // In a full implementation, this would be more sophisticated
    const combinedFindings: Finding[] = [];
    const firstOperand = operandResults[0];

    for (const baseFinding of firstOperand) {
      let foundInAllOperands = true;

      for (let i = 1; i < operandResults.length; i++) {
        const otherOperand = operandResults[i];
        const hasMatchingLocation = otherOperand.some(
          (f) =>
            f.location.line === baseFinding.location.line &&
            f.location.column === baseFinding.location.column
        );

        if (!hasMatchingLocation) {
          foundInAllOperands = false;
          break;
        }
      }

      if (foundInAllOperands) {
        combinedFindings.push({
          ...baseFinding,
          description: `${baseFinding.description}\n\nCombined finding from AND operation`,
          metadata: {
            ...baseFinding.metadata,
            logicalOperation: 'AND',
            operandCount: operandResults.length,
          },
        });
      }
    }

    return combinedFindings;
  }

  /**
   * Map taint risk levels to severity levels
   */
  private mapRiskLevelToSeverity(riskLevel: string): Severity {
    switch (riskLevel) {
      case 'critical':
        return Severity.CRITICAL;
      case 'high':
        return Severity.HIGH;
      case 'medium':
        return Severity.MEDIUM;
      case 'low':
        return Severity.LOW;
      default:
        return Severity.MEDIUM;
    }
  }

  /**
   * Generate fix recommendations for taint findings
   */
  private generateTaintFixRecommendation(result: any): string {
    const recommendations: string[] = [];

    if (result.recommendations) {
      recommendations.push(...result.recommendations);
    }

    if (result.flow.length > 0) {
      recommendations.push('Validate and sanitize input from untrusted sources');
      recommendations.push('Consider using parameterized queries or prepared statements');
      recommendations.push('Implement proper output encoding');
    }

    return recommendations.join('. ') || 'Review and fix this security issue';
  }

  /**
   * Get code snippet with context
   */
  private getSnippet(lines: string[], lineIndex: number, context: number = 2): string {
    const start = Math.max(0, lineIndex - context);
    const end = Math.min(lines.length, lineIndex + context + 1);
    return lines
      .slice(start, end)
      .map((line, i) => {
        const actualLine = start + i + 1;
        const prefix = actualLine === lineIndex + 1 ? '→ ' : '  ';
        return `${prefix}${actualLine.toString().padStart(4, ' ')} | ${line}`;
      })
      .join('\n');
  }

  /**
   * Very naive flow detection across lines (legacy support)
   */
  private detectNaiveFlow(
    filePath: string,
    lines: string[],
    sourceRe: RegExp,
    sinkRe: RegExp,
    rule: Rule,
    findings: Finding[]
  ): void {
    const varAssignments: Record<string, number> = {};

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // const x = req.body.name; or x = req.body
      const assignMatch = line.match(/(?:const|let|var)?\s*(\w+)\s*=\s*(.+)/);
      if (assignMatch && sourceRe.test(assignMatch[2])) {
        varAssignments[assignMatch[1]] = i;
      }
    }

    // Search for sink usage with any of the assigned vars
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!sinkRe.test(line)) continue;
      for (const v of Object.keys(varAssignments)) {
        if (line.includes(v)) {
          const location: Location = {
            file: filePath,
            line: i + 1,
            column: Math.max(0, line.indexOf(v)),
          };
          const fix: FixRecommendation = {
            recommendation: rule.fix?.template || 'Validate/sanitize untrusted input before use',
            before: line.trim(),
            after: '',
            references: rule.fix?.references || [],
          };
          findings.push({
            id: `${rule.id}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            rule: rule.id,
            severity: rule.severity as Severity,
            category: rule.category as Category,
            title: rule.name,
            description: rule.description,
            location,
            snippet: this.getSnippet(lines, i),
            fix,
            metadata: {
              confidence: 0.6,
              cwe: rule.metadata?.cwe,
              owasp: rule.metadata?.owasp,
            },
          });
        }
      }
    }
  }
}
