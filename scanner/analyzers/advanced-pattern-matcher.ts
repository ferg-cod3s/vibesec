import { ASTNode } from '../../src/ast/enhanced-ast-parser';
import {
  EQLQuery,
  PatternExpression,
  LogicalExpression,
  TaintExpression,
  SourcePattern,
  SinkPattern,
  SanitizerPattern,
  StringPattern,
  PropertyPattern,
  NodePattern,
  WildcardPattern,
} from './eql-types';

type EQLExpression = LogicalExpression | PatternExpression | TaintExpression;
import { QueryValidator } from './eql-parser';
import { Finding, Severity, Category } from '../core/types';

/**
 * Advanced pattern matcher for EQL queries with semantic analysis capabilities.
 * Supports complex pattern matching, taint analysis, and performance optimization.
 */
export class AdvancedPatternMatcher {
  private validator: QueryValidator;
  private cache: Map<string, MatchResult[]> = new Map();
  private performanceStats: PerformanceStats = {
    queriesExecuted: 0,
    totalMatchTime: 0,
    cacheHits: 0,
    cacheMisses: 0,
  };

  constructor() {
    this.validator = new QueryValidator();
  }

  /**
   * Execute an EQL query against AST nodes with semantic analysis.
   */
  async executeQuery(
    query: EQLQuery,
    astNodes: ASTNode[],
    options: MatcherOptions = {}
  ): Promise<MatchResult[]> {
    const startTime = performance.now();
    this.performanceStats.queriesExecuted++;

    // Validate query
    const validation = this.validator.validate(query);
    if (!validation.valid) {
      throw new Error(`Invalid query: ${validation.errors.join(', ')}`);
    }

    // Check cache
    const cacheKey = this.generateCacheKey(query, astNodes, options);
    if (this.cache.has(cacheKey)) {
      this.performanceStats.cacheHits++;
      return this.cache.get(cacheKey)!;
    }
    this.performanceStats.cacheMisses++;

    // Execute query based on expression type
    let results: MatchResult[] = [];
    switch (query.expression.type) {
      case 'pattern':
        results = await this.matchPattern(query.expression, astNodes, options);
        break;
      case 'logical':
        results = await this.matchLogical(query.expression, astNodes, options);
        break;
      case 'taint':
        results = await this.matchTaint(query.expression, astNodes, options);
        break;
      default:
        throw new Error(`Unsupported expression type: ${(query.expression as EQLExpression).type}`);
    }

    // Apply filters and sorting
    if (options.filter) {
      results = results.filter(options.filter);
    }
    if (options.sort) {
      results.sort(options.sort);
    }
    if (options.limit) {
      results = results.slice(0, options.limit);
    }

    // Cache results
    this.cache.set(cacheKey, results);

    // Update performance stats
    const endTime = performance.now();
    this.performanceStats.totalMatchTime += endTime - startTime;

    return results;
  }

  /**
   * Match a simple pattern against AST nodes.
   */
  private async matchPattern(
    pattern: PatternExpression,
    astNodes: ASTNode[],
    _options: MatcherOptions
  ): Promise<MatchResult[]> {
    const results: MatchResult[] = [];

    for (const node of astNodes) {
      if (this.matchesPattern(pattern.pattern, node)) {
        results.push({
          node,
          pattern: pattern.pattern,
          confidence: this.calculateConfidence(pattern.pattern, node),
          metadata: this.extractMetadata(pattern.pattern, node),
        });
      }
    }

    return results;
  }

  /**
   * Match logical expressions (AND, OR, NOT).
   */
  private async matchLogical(
    logical: LogicalExpression,
    astNodes: ASTNode[],
    options: MatcherOptions
  ): Promise<MatchResult[]> {
    const operandResults = await Promise.all(
      logical.operands.map((operand) => this.executeQuery(operand, astNodes, options))
    );

    switch (logical.operator) {
      case 'AND':
        return this.combineAND(operandResults);
      case 'OR':
        return this.combineOR(operandResults);
      case 'NOT':
        return this.combineNOT(operandResults[0], astNodes);
      default:
        throw new Error(`Unsupported logical operator: ${logical.operator}`);
    }
  }

  /**
   * Match taint analysis expressions.
   */
  private async matchTaint(
    taint: TaintExpression,
    astNodes: ASTNode[],
    _options: MatcherOptions
  ): Promise<MatchResult[]> {
    // Find source nodes
    const sourceResults = await this.findPatternMatches(taint.source, astNodes);

    // Find sink nodes
    const sinkResults = await this.findPatternMatches(taint.sink, astNodes);

    // Find sanitizer nodes if present
    const sanitizerResults = taint.sanitizers
      ? await Promise.all(taint.sanitizers.map((s) => this.findPatternMatches(s, astNodes)))
      : [];

    // Perform data flow analysis
    const taintFlows = this.analyzeDataFlow(
      sourceResults,
      sinkResults,
      sanitizerResults.flat(),
      astNodes
    );

    return taintFlows.map((flow) => ({
      node: flow.sink.node,
      pattern: taint.sink,
      confidence: flow.confidence,
      metadata: {
        type: 'taint_flow',
        source: flow.source,
        sink: flow.sink,
        sanitizers: flow.sanitizers,
        path: flow.path,
      },
    }));
  }

  /**
   * Check if a node matches a pattern.
   */
  private matchesPattern(pattern: NodePattern, node: ASTNode): boolean {
    // Check node type
    if (!this.matchesNodeType(pattern.nodeType, node.type)) {
      return false;
    }

    // Check properties
    if (pattern.properties) {
      for (const prop of pattern.properties) {
        if (!this.matchesProperty(prop, node)) {
          return false;
        }
      }
    }

    // Check children
    if (pattern.children) {
      for (const childPattern of pattern.children) {
        if (!node.children.some((child) => this.matchesPattern(childPattern.pattern, child))) {
          return false;
        }
      }
    }

    // Check arguments
    if (pattern.arguments) {
      for (const argPattern of pattern.arguments) {
        if (!node.arguments?.some((arg) => this.matchesPattern(argPattern, arg))) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Check if node type matches pattern (supports wildcards and arrays).
   */
  private matchesNodeType(
    patternType: string | string[] | WildcardPattern,
    nodeType: string
  ): boolean {
    if (typeof patternType === 'string') {
      return patternType === nodeType;
    }

    if (Array.isArray(patternType)) {
      return patternType.includes(nodeType);
    }

    if (patternType && typeof patternType === 'object' && patternType.type === 'wildcard') {
      return patternType.matches === 'all' || patternType.matches?.includes(nodeType);
    }

    return false;
  }

  /**
   * Check if a property matches the constraint.
   */
  private matchesProperty(constraint: PropertyPattern, node: ASTNode): boolean {
    const propertyName =
      typeof constraint.name === 'string' ? constraint.name : constraint.name.value;
    const nodeValue = (node as any)[propertyName];

    // Handle ValuePattern types
    if ('type' in constraint.value && typeof constraint.value.type === 'string') {
      if (constraint.value.type === 'string') {
        return nodeValue === constraint.value.value;
      }

      if (constraint.value.type === 'regex') {
        const regex = new RegExp(String(constraint.value.value), '');
        return regex.test(String(nodeValue));
      }
    }

    // Handle StringPattern types (they have different type values)
    if (
      'type' in constraint.value &&
      ['exact', 'regex', 'contains', 'startsWith', 'endsWith'].includes(constraint.value.type)
    ) {
      const stringPattern = constraint.value as StringPattern;
      if (stringPattern.type === 'exact') {
        return nodeValue === stringPattern.value;
      }
      if (stringPattern.type === 'regex') {
        const regex = new RegExp(stringPattern.value, '');
        return regex.test(String(nodeValue));
      }
      // Handle other string pattern types...
    }

    return false;
  }

  /**
   * Find all nodes matching a source/sink/sanitizer pattern.
   */
  private async findPatternMatches(
    pattern: SourcePattern | SinkPattern | SanitizerPattern,
    astNodes: ASTNode[]
  ): Promise<PatternMatch[]> {
    const matches: PatternMatch[] = [];

    for (const node of astNodes) {
      if (this.matchesNodeType(pattern.nodeType, node.type)) {
        // Check if patterns match
        const patternMatches = pattern.patterns.every((p) => {
          if (p.type === 'exact' || p.type === 'contains') {
            return this.nodeContainsString(node, p.value);
          }
          if (p.type === 'regex') {
            const regex = new RegExp(p.value, p.caseSensitive ? '' : 'i');
            return this.nodeMatchesRegex(node, regex);
          }
          return false;
        });

        if (patternMatches) {
          matches.push({
            node,
            patterns: pattern.patterns,
            confidence: this.calculateConfidence(pattern, node),
          });
        }
      }
    }

    return matches;
  }

  /**
   * Analyze data flow from sources to sinks.
   */
  private analyzeDataFlow(
    sources: PatternMatch[],
    sinks: PatternMatch[],
    sanitizers: PatternMatch[],
    astNodes: ASTNode[]
  ): TaintFlow[] {
    const flows: TaintFlow[] = [];

    for (const sink of sinks) {
      for (const source of sources) {
        // Simple data flow analysis - in a real implementation this would be more sophisticated
        const path = this.findDataFlowPath(source.node, sink.node, astNodes);

        if (path.length > 0) {
          // Check if path is sanitized
          const sanitizedSanitizers = sanitizers.filter((s) =>
            path.some((node) => this.nodesAreConnected(s.node, node))
          );

          const confidence = this.calculateTaintConfidence(source, sink, sanitizedSanitizers);

          flows.push({
            source,
            sink,
            sanitizers: sanitizedSanitizers,
            path,
            confidence,
          });
        }
      }
    }

    return flows;
  }

  /**
   * Find a data flow path between two nodes.
   */
  private findDataFlowPath(source: ASTNode, sink: ASTNode, _astNodes: ASTNode[]): ASTNode[] {
    // Simplified implementation - in reality this would use control flow and data flow analysis
    const path: ASTNode[] = [];
    const visited = new Set<ASTNode>();

    const dfs = (current: ASTNode, target: ASTNode, currentPath: ASTNode[]): boolean => {
      if (visited.has(current)) return false;
      visited.add(current);

      if (this.nodesAreConnected(current, target)) {
        path.push(...currentPath, current, target);
        return true;
      }

      // Check children and arguments
      const nextNodes = [...(current.children || []), ...(current.arguments || [])];
      for (const next of nextNodes) {
        if (dfs(next, target, [...currentPath, current])) {
          return true;
        }
      }

      return false;
    };

    dfs(source, sink, []);
    return path;
  }

  /**
   * Check if two nodes are connected in the AST.
   */
  private nodesAreConnected(node1: ASTNode, node2: ASTNode): boolean {
    // Simple implementation - check if nodes are the same or have parent-child relationship
    if (node1 === node2) return true;
    if (node1.children && node1.children.includes(node2)) return true;
    if (node2.children && node2.children.includes(node1)) return true;
    if (node1.arguments && node1.arguments.includes(node2)) return true;
    if (node2.arguments && node2.arguments.includes(node1)) return true;
    return false;
  }

  /**
   * Calculate confidence score for a pattern match.
   */
  private calculateConfidence(
    pattern: NodePattern | SourcePattern | SinkPattern | SanitizerPattern,
    node: ASTNode
  ): number {
    let confidence = 0.5; // Base confidence

    // Increase confidence for exact type matches
    if (typeof pattern.nodeType === 'string' && pattern.nodeType === node.type) {
      confidence += 0.3;
    }

    // Increase confidence for property matches (NodePattern)
    if ('properties' in pattern && (pattern as any).properties) {
      confidence += (pattern as any).properties.length * 0.1;
    }

    // Increase confidence for pattern matches (Source/Sink/Sanitizer patterns)
    if ('patterns' in pattern && (pattern as any).patterns) {
      confidence += (pattern as any).patterns.length * 0.1;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Calculate confidence for taint flow.
   */
  private calculateTaintConfidence(
    source: PatternMatch,
    sink: PatternMatch,
    sanitizers: PatternMatch[]
  ): number {
    let confidence = (source.confidence + sink.confidence) / 2;

    // Reduce confidence if sanitizers are present (unless they're trusted)
    if (sanitizers.length > 0) {
      confidence *= 0.3;
    }

    return Math.max(confidence, 0.1);
  }

  /**
   * Extract metadata from a matched node.
   */
  private extractMetadata(pattern: NodePattern, node: ASTNode): Record<string, unknown> {
    return {
      nodeType: node.type,
      properties: node.properties || {},
      children: node.children?.length || 0,
      arguments: node.arguments?.length || 0,
      line: node.line,
      column: node.column,
    };
  }

  /**
   * Check if a node contains a specific string value.
   */
  private nodeContainsString(node: ASTNode, value: string): boolean {
    // Check node properties (ASTNode properties)
    const properties = node.properties || {};
    for (const key in properties) {
      const val = properties[key];
      if (val.content && val.content.includes(value)) {
        return true;
      }
      if (val.value && typeof val.value === 'string' && val.value.includes(value)) {
        return true;
      }
    }

    // Check node value
    if (node.value && typeof node.value === 'string' && node.value.includes(value)) {
      return true;
    }

    // Check node content
    if (node.content && node.content.includes(value)) {
      return true;
    }

    return false;
  }

  /**
   * Check if a node matches a regex pattern.
   */
  private nodeMatchesRegex(node: ASTNode, regex: RegExp): boolean {
    // Check node properties (ASTNode properties)
    const properties = node.properties || {};
    for (const key in properties) {
      const val = properties[key];
      if (val.content && regex.test(val.content)) {
        return true;
      }
      if (val.value && typeof val.value === 'string' && regex.test(val.value)) {
        return true;
      }
    }

    // Check node value
    if (node.value && typeof node.value === 'string' && regex.test(node.value)) {
      return true;
    }

    // Check node content
    if (node.content && regex.test(node.content)) {
      return true;
    }

    return false;
  }

  /**
   * Combine results using AND logic.
   */
  private combineAND(operandResults: MatchResult[][]): MatchResult[] {
    if (operandResults.length === 0) return [];

    // Find nodes that appear in all operand results
    const nodeMap = new Map<ASTNode, MatchResult[]>();

    for (const results of operandResults) {
      for (const result of results) {
        if (!nodeMap.has(result.node)) {
          nodeMap.set(result.node, []);
        }
        nodeMap.get(result.node)!.push(result);
      }
    }

    // Only keep nodes that appear in all operands
    const combined: MatchResult[] = [];
    for (const [node, results] of nodeMap) {
      if (results.length === operandResults.length) {
        combined.push({
          node,
          pattern: results[0].pattern,
          confidence: Math.min(...results.map((r) => r.confidence)),
          metadata: { combined: true, sources: results.map((r) => r.metadata) },
        });
      }
    }

    return combined;
  }

  /**
   * Combine results using OR logic.
   */
  private combineOR(operandResults: MatchResult[][]): MatchResult[] {
    const nodeMap = new Map<ASTNode, MatchResult>();

    for (const results of operandResults) {
      for (const result of results) {
        const existing = nodeMap.get(result.node);
        if (!existing || result.confidence > existing.confidence) {
          nodeMap.set(result.node, result);
        }
      }
    }

    return Array.from(nodeMap.values());
  }

  /**
   * Combine results using NOT logic.
   */
  private combineNOT(operandResults: MatchResult[], astNodes: ASTNode[]): MatchResult[] {
    const matchedNodes = new Set(operandResults.map((r) => r.node));

    return astNodes
      .filter((node) => !matchedNodes.has(node))
      .map((node) => ({
        node,
        pattern: { type: 'not' } as any,
        confidence: 0.5,
        metadata: { negated: true },
      }));
  }

  /**
   * Generate cache key for query results.
   */
  private generateCacheKey(query: EQLQuery, astNodes: ASTNode[], options: MatcherOptions): string {
    const queryHash = JSON.stringify(query);
    const nodeHash = astNodes.map((n) => n.type + (n.line || 0)).join(',');
    const optionsHash = JSON.stringify(options);
    return `${queryHash}:${nodeHash}:${optionsHash}`;
  }

  /**
   * Get performance statistics.
   */
  getPerformanceStats(): PerformanceStats {
    return { ...this.performanceStats };
  }

  /**
   * Clear the cache.
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Convert match results to findings.
   */
  resultsToFindings(results: MatchResult[], ruleId: string, filePath: string): Finding[] {
    return results.map((result) => ({
      id: `${ruleId}-${result.node.line}-${result.node.column}`,
      rule: ruleId,
      severity: Severity.MEDIUM,
      category: Category.CUSTOM,
      title: `EQL Pattern Match`,
      description: `Pattern matched: ${JSON.stringify(result.pattern)}`,
      location: {
        file: filePath,
        line: result.node.line,
        column: result.node.column,
      },
      snippet: result.node.content || '',
      fix: {
        recommendation: 'Review this code for potential security issues',
        before: result.node.content || '',
        after: '// Review and fix if necessary',
        references: [],
      },
      metadata: {
        confidence: result.confidence,
        ...result.metadata,
      },
    }));
  }
}

// Type definitions
export interface MatcherOptions {
  filter?: (result: MatchResult) => boolean;
  sort?: (a: MatchResult, b: MatchResult) => number;
  limit?: number;
  includeMetadata?: boolean;
}

export interface MatchResult {
  node: ASTNode;
  pattern: NodePattern | SourcePattern | SinkPattern | SanitizerPattern | { type: string };
  confidence: number;
  metadata: Record<string, unknown>;
}

export interface PatternMatch {
  node: ASTNode;
  patterns: StringPattern[];
  confidence: number;
}

export interface TaintFlow {
  source: PatternMatch;
  sink: PatternMatch;
  sanitizers: PatternMatch[];
  path: ASTNode[];
  confidence: number;
}

export interface PerformanceStats {
  queriesExecuted: number;
  totalMatchTime: number;
  cacheHits: number;
  cacheMisses: number;
}
