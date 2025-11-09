import { ASTNode } from '../../src/ast/enhanced-ast-parser';
import { SourcePattern, SinkPattern, SanitizerPattern, StringPattern } from './eql-types';

/**
 * Taint Analysis Engine for tracking data flow from sources to sinks.
 * Identifies potential security vulnerabilities through data flow analysis.
 */
export class TaintAnalysisEngine {
  private sourceTracker: SourceTracker;
  private sinkDetector: SinkDetector;
  private dataFlowAnalyzer: DataFlowAnalyzer;

  constructor() {
    this.sourceTracker = new SourceTracker();
    this.sinkDetector = new SinkDetector();
    this.dataFlowAnalyzer = new DataFlowAnalyzer();
  }

  /**
   * Analyze taint flows for given patterns and AST nodes.
   */
  async analyzeTaintFlows(
    sources: SourcePattern[],
    sinks: SinkPattern[],
    sanitizers: SanitizerPattern[],
    astNodes: ASTNode[]
  ): Promise<TaintFlowResult[]> {
    // Find all source nodes
    const sourceNodes = await this.sourceTracker.findSources(sources, astNodes);

    // Find all sink nodes
    const sinkNodes = await this.sinkDetector.findSinks(sinks, astNodes);

    // Find all sanitizer nodes
    const sanitizerNodes = await Promise.all(
      sanitizers.map((s) => this.sourceTracker.findSources([s], astNodes))
    ).then((results) => results.flat());

    // Analyze data flows
    const flows = await this.dataFlowAnalyzer.analyzeFlows(
      sourceNodes,
      sinkNodes,
      sanitizerNodes,
      astNodes
    );

    return flows;
  }

  /**
   * Get detailed taint flow information.
   */
  async getDetailedFlowInfo(flow: TaintFlowResult): Promise<DetailedFlowInfo> {
    return this.dataFlowAnalyzer.getFlowDetails(flow);
  }

  /**
   * Check if a specific node is tainted.
   */
  isNodeTainted(node: ASTNode, flows: TaintFlowResult[]): boolean {
    return flows.some((flow) => flow.path.some((pathNode) => pathNode.node === node));
  }

  /**
   * Get all tainted nodes from flows.
   */
  getTaintedNodes(flows: TaintFlowResult[]): ASTNode[] {
    const taintedNodes = new Set<ASTNode>();

    for (const flow of flows) {
      for (const pathNode of flow.path) {
        taintedNodes.add(pathNode.node);
      }
    }

    return Array.from(taintedNodes);
  }
}

/**
 * Tracks potential taint sources in the AST.
 */
export class SourceTracker {
  /**
   * Find all nodes matching source patterns.
   */
  async findSources(sources: SourcePattern[], astNodes: ASTNode[]): Promise<SourceNode[]> {
    const sourceNodes: SourceNode[] = [];

    for (const sourcePattern of sources) {
      for (const node of astNodes) {
        if (this.matchesSourcePattern(sourcePattern, node)) {
          sourceNodes.push({
            node,
            pattern: sourcePattern,
            confidence: this.calculateSourceConfidence(sourcePattern, node),
            taintValue: this.extractTaintValue(node),
          });
        }
      }
    }

    return sourceNodes;
  }

  /**
   * Check if a node matches a source pattern.
   */
  private matchesSourcePattern(pattern: SourcePattern, node: ASTNode): boolean {
    // Check node type
    if (!this.matchesNodeType(pattern.nodeType, node.type)) {
      return false;
    }

    // Check patterns
    return pattern.patterns.every((p) => this.matchesStringPattern(p, node));
  }

  /**
   * Check if node type matches pattern (supports arrays).
   */
  private matchesNodeType(patternType: string | string[], nodeType: string): boolean {
    if (typeof patternType === 'string') {
      return patternType === nodeType;
    }
    return patternType.includes(nodeType);
  }

  /**
   * Check if node matches a string pattern.
   */
  private matchesStringPattern(pattern: StringPattern, node: ASTNode): boolean {
    const value = this.getNodeStringValue(node);
    if (!value) return false;

    switch (pattern.type) {
      case 'exact':
        return pattern.caseSensitive !== false
          ? value === pattern.value
          : value.toLowerCase() === pattern.value.toLowerCase();
      case 'contains':
        return pattern.caseSensitive !== false
          ? value.includes(pattern.value)
          : value.toLowerCase().includes(pattern.value.toLowerCase());
      case 'startsWith':
        return pattern.caseSensitive !== false
          ? value.startsWith(pattern.value)
          : value.toLowerCase().startsWith(pattern.value.toLowerCase());
      case 'endsWith':
        return pattern.caseSensitive !== false
          ? value.endsWith(pattern.value)
          : value.toLowerCase().endsWith(pattern.value.toLowerCase());
      case 'regex': {
        const regex = new RegExp(pattern.value, pattern.caseSensitive ? '' : 'i');
        return regex.test(value);
      }
      default:
        return false;
    }
  }

  /**
   * Extract string value from node for pattern matching.
   */
  private getNodeStringValue(node: ASTNode): string | null {
    // Check node value
    if (node.value && typeof node.value === 'string') {
      return node.value;
    }

    // Check node content
    if (node.content) {
      return node.content;
    }

    // Check node name
    if (node.name) {
      return node.name;
    }

    // Check properties for string values
    if (node.properties) {
      for (const key in node.properties) {
        const prop = node.properties[key];
        if (prop.value && typeof prop.value === 'string') {
          return prop.value;
        }
        if (prop.content) {
          return prop.content;
        }
      }
    }

    return null;
  }

  /**
   * Calculate confidence score for source match.
   */
  private calculateSourceConfidence(pattern: SourcePattern, node: ASTNode): number {
    let confidence = 0.5;

    // Increase confidence for exact type matches
    if (typeof pattern.nodeType === 'string' && pattern.nodeType === node.type) {
      confidence += 0.2;
    }

    // Increase confidence for pattern matches
    confidence += pattern.patterns.length * 0.1;

    // Increase confidence for common source patterns
    const commonSources = ['user', 'input', 'request', 'param', 'query', 'body'];
    const nodeValue = this.getNodeStringValue(node);
    if (nodeValue && commonSources.some((source) => nodeValue.toLowerCase().includes(source))) {
      confidence += 0.2;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Extract actual taint value from a source node.
   */
  private extractTaintValue(node: ASTNode): string {
    return this.getNodeStringValue(node) || 'unknown';
  }
}

/**
 * Detects potential taint sinks in the AST.
 */
export class SinkDetector {
  /**
   * Find all nodes matching sink patterns.
   */
  async findSinks(sinks: SinkPattern[], astNodes: ASTNode[]): Promise<SinkNode[]> {
    const sinkNodes: SinkNode[] = [];

    for (const sinkPattern of sinks) {
      for (const node of astNodes) {
        if (this.matchesSinkPattern(sinkPattern, node)) {
          sinkNodes.push({
            node,
            pattern: sinkPattern,
            confidence: this.calculateSinkConfidence(sinkPattern, node),
            sinkType: this.classifySinkType(sinkPattern, node),
          });
        }
      }
    }

    return sinkNodes;
  }

  /**
   * Check if a node matches a sink pattern.
   */
  private matchesSinkPattern(pattern: SinkPattern, node: ASTNode): boolean {
    // Check node type
    if (!this.matchesNodeType(pattern.nodeType, node.type)) {
      return false;
    }

    // Check patterns
    return pattern.patterns.every((p) => this.matchesStringPattern(p, node));
  }

  /**
   * Check if node type matches pattern (supports arrays).
   */
  private matchesNodeType(patternType: string | string[], nodeType: string): boolean {
    if (typeof patternType === 'string') {
      return patternType === nodeType;
    }
    return patternType.includes(nodeType);
  }

  /**
   * Check if node matches a string pattern.
   */
  private matchesStringPattern(pattern: StringPattern, node: ASTNode): boolean {
    const value = this.getNodeStringValue(node);
    if (!value) return false;

    switch (pattern.type) {
      case 'exact':
        return pattern.caseSensitive !== false
          ? value === pattern.value
          : value.toLowerCase() === pattern.value.toLowerCase();
      case 'contains':
        return pattern.caseSensitive !== false
          ? value.includes(pattern.value)
          : value.toLowerCase().includes(pattern.value.toLowerCase());
      case 'startsWith':
        return pattern.caseSensitive !== false
          ? value.startsWith(pattern.value)
          : value.toLowerCase().startsWith(pattern.value.toLowerCase());
      case 'endsWith':
        return pattern.caseSensitive !== false
          ? value.endsWith(pattern.value)
          : value.toLowerCase().endsWith(pattern.value.toLowerCase());
      case 'regex': {
        const regex = new RegExp(pattern.value, pattern.caseSensitive ? '' : 'i');
        return regex.test(value);
      }
      default:
        return false;
    }
  }

  /**
   * Extract string value from node for pattern matching.
   */
  private getNodeStringValue(node: ASTNode): string | null {
    // Check node value
    if (node.value && typeof node.value === 'string') {
      return node.value;
    }

    // Check node content
    if (node.content) {
      return node.content;
    }

    // Check node name
    if (node.name) {
      return node.name;
    }

    // Check properties for string values
    if (node.properties) {
      for (const key in node.properties) {
        const prop = node.properties[key];
        if (prop.value && typeof prop.value === 'string') {
          return prop.value;
        }
        if (prop.content) {
          return prop.content;
        }
      }
    }

    return null;
  }

  /**
   * Calculate confidence score for sink match.
   */
  private calculateSinkConfidence(pattern: SinkPattern, node: ASTNode): number {
    let confidence = 0.5;

    // Increase confidence for exact type matches
    if (typeof pattern.nodeType === 'string' && pattern.nodeType === node.type) {
      confidence += 0.2;
    }

    // Increase confidence for pattern matches
    confidence += pattern.patterns.length * 0.1;

    // Increase confidence for common sink patterns
    const commonSinks = ['eval', 'exec', 'query', 'execute', 'innerHTML', 'outerHTML'];
    const nodeValue = this.getNodeStringValue(node);
    if (nodeValue && commonSinks.some((sink) => nodeValue.toLowerCase().includes(sink))) {
      confidence += 0.2;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Classify the type of sink.
   */
  private classifySinkType(pattern: SinkPattern, node: ASTNode): string {
    const nodeValue = this.getNodeStringValue(node);
    if (!nodeValue) return 'unknown';

    if (nodeValue.toLowerCase().includes('eval')) return 'code_execution';
    if (nodeValue.toLowerCase().includes('exec')) return 'command_execution';
    if (nodeValue.toLowerCase().includes('query')) return 'sql_injection';
    if (nodeValue.toLowerCase().includes('innerhtml')) return 'xss';
    if (nodeValue.toLowerCase().includes('writefile')) return 'path_traversal';

    return 'generic';
  }
}

/**
 * Analyzes data flow between sources and sinks.
 */
export class DataFlowAnalyzer {
  /**
   * Analyze flows between sources and sinks.
   */
  async analyzeFlows(
    sources: SourceNode[],
    sinks: SinkNode[],
    sanitizers: SourceNode[],
    astNodes: ASTNode[]
  ): Promise<TaintFlowResult[]> {
    const flows: TaintFlowResult[] = [];

    for (const source of sources) {
      for (const sink of sinks) {
        const flow = await this.analyzeFlow(source, sink, sanitizers, astNodes);
        if (flow) {
          flows.push(flow);
        }
      }
    }

    return flows;
  }

  /**
   * Analyze a specific flow from source to sink.
   */
  private async analyzeFlow(
    source: SourceNode,
    sink: SinkNode,
    sanitizers: SourceNode[],
    astNodes: ASTNode[]
  ): Promise<TaintFlowResult | null> {
    // Simple path finding - in a real implementation, this would be more sophisticated
    const path = this.findPath(source.node, sink.node, astNodes);

    if (path.length === 0) {
      return null;
    }

    // Check for sanitizers
    const sanitizerNodes = this.findSanitizersOnPath(path, sanitizers);

    return {
      source,
      sink,
      path,
      sanitizers: sanitizerNodes,
      riskLevel: this.calculateRiskLevel(source, sink, sanitizerNodes),
      flowDistance: path.length - 1,
    };
  }

  /**
   * Find path from source to sink (simplified implementation).
   */
  private findPath(source: ASTNode, sink: ASTNode, astNodes: ASTNode[]): PathNode[] {
    // Very simplified path finding - just return direct connection
    // In a real implementation, this would use proper data flow analysis
    if (this.isConnected(source, sink, astNodes)) {
      return [
        { node: source, distance: 0, confidence: 1.0 },
        { node: sink, distance: 1, confidence: 0.8 },
      ];
    }

    return [];
  }

  /**
   * Check if two nodes are connected (simplified).
   */
  private isConnected(source: ASTNode, sink: ASTNode, _astNodes: ASTNode[]): boolean {
    // Very simplified connection check
    // In a real implementation, this would analyze variable assignments, function calls, etc.

    // Check line proximity
    const lineProximity = source.line <= sink.line && sink.line - source.line <= 10;

    // Check parent-child relationships
    const hasChildRelation = source.children?.includes(sink) || sink.children?.includes(source);

    // Check if they're in the same general area (simplified)
    return lineProximity || hasChildRelation;
  }

  /**
   * Find sanitizers that affect the flow path.
   */
  private findSanitizersOnPath(path: PathNode[], sanitizers: SourceNode[]): SourceNode[] {
    return sanitizers.filter((sanitizer) =>
      path.some((pathNode) => pathNode.node === sanitizer.node)
    );
  }

  /**
   * Calculate risk level for the flow.
   */
  private calculateRiskLevel(
    source: SourceNode,
    sink: SinkNode,
    sanitizers: SourceNode[]
  ): 'low' | 'medium' | 'high' | 'critical' {
    let riskScore = 0.5;

    // Base risk from source and sink confidence
    riskScore += (source.confidence + sink.confidence) / 4;

    // Reduce risk based on sanitizers
    riskScore -= sanitizers.length * 0.2;

    // Increase risk for dangerous sink types
    if (sink.sinkType === 'code_execution' || sink.sinkType === 'command_execution') {
      riskScore += 0.3;
    }

    if (riskScore >= 0.8) return 'critical';
    if (riskScore >= 0.6) return 'high';
    if (riskScore >= 0.4) return 'medium';
    return 'low';
  }

  /**
   * Get detailed flow information.
   */
  async getFlowDetails(flow: TaintFlowResult): Promise<DetailedFlowInfo> {
    return {
      flow,
      recommendations: this.generateRecommendations(flow),
      relatedCWEs: this.identifyCWEs(flow),
      mitigationStrategies: this.getMitigationStrategies(flow),
    };
  }

  /**
   * Generate security recommendations for the flow.
   */
  private generateRecommendations(flow: TaintFlowResult): string[] {
    const recommendations: string[] = [];

    if (flow.sink.sinkType === 'sql_injection') {
      recommendations.push('Use parameterized queries or prepared statements');
      recommendations.push('Implement input validation and sanitization');
    } else if (flow.sink.sinkType === 'xss') {
      recommendations.push('Use output encoding and Content Security Policy');
      recommendations.push('Validate and sanitize user input');
    } else if (flow.sink.sinkType === 'code_execution') {
      recommendations.push('Avoid dynamic code execution with user input');
      recommendations.push('Use allowlists for dynamic function calls');
    }

    if (flow.sanitizers.length === 0) {
      recommendations.push('Implement proper input sanitization');
    }

    return recommendations;
  }

  /**
   * Identify relevant CWEs for the flow.
   */
  private identifyCWEs(flow: TaintFlowResult): string[] {
    const cwes: string[] = [];

    if (flow.sink.sinkType === 'sql_injection') {
      cwes.push('CWE-89');
    } else if (flow.sink.sinkType === 'xss') {
      cwes.push('CWE-79');
    } else if (flow.sink.sinkType === 'code_execution') {
      cwes.push('CWE-94');
    } else if (flow.sink.sinkType === 'command_execution') {
      cwes.push('CWE-78');
    } else if (flow.sink.sinkType === 'path_traversal') {
      cwes.push('CWE-22');
    }

    return cwes;
  }

  /**
   * Get mitigation strategies for the flow.
   */
  private getMitigationStrategies(_flow: TaintFlowResult): string[] {
    const strategies: string[] = [];

    strategies.push('Input validation and sanitization');
    strategies.push('Output encoding');
    strategies.push('Principle of least privilege');
    strategies.push('Secure by design architecture');

    return strategies;
  }
}

// Type definitions
export interface SourceNode {
  node: ASTNode;
  pattern: SourcePattern;
  confidence: number;
  taintValue: string;
}

export interface SinkNode {
  node: ASTNode;
  pattern: SinkPattern;
  confidence: number;
  sinkType: string;
}

export interface PathNode {
  node: ASTNode;
  distance: number;
  confidence: number;
}

export interface TaintFlowResult {
  source: SourceNode;
  sink: SinkNode;
  path: PathNode[];
  sanitizers: SourceNode[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  flowDistance: number;
}

export interface DetailedFlowInfo {
  flow: TaintFlowResult;
  recommendations: string[];
  relatedCWEs: string[];
  mitigationStrategies: string[];
}
