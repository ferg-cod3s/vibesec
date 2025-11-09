import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  TaintAnalysisEngine,
  SourceTracker,
  SinkDetector,
  DataFlowAnalyzer,
} from '../../scanner/analyzers/taint-analysis-engine';
import { ASTNode } from '../../src/ast/enhanced-ast-parser';

describe('TaintAnalysisEngine', () => {
  let engine: TaintAnalysisEngine;
  let sourceTracker: SourceTracker;
  let sinkDetector: SinkDetector;
  let dataFlowAnalyzer: DataFlowAnalyzer;

  beforeEach(() => {
    engine = new TaintAnalysisEngine();
    sourceTracker = new SourceTracker();
    sinkDetector = new SinkDetector();
    dataFlowAnalyzer = new DataFlowAnalyzer();
  });

  const createMockASTNode = (
    type: string,
    line: number = 1,
    column: number = 1,
    content?: string,
    value?: any
  ): ASTNode => ({
    type,
    line,
    column,
    content: content || `${type} content`,
    children: [],
    value,
    properties:
      type === 'ObjectExpression'
        ? {
            key: {
              type: 'Property',
              line,
              column,
              content: 'key content',
              children: [],
            },
          }
        : undefined,
  });

  describe('SourceTracker', () => {
    it('should find source nodes matching patterns', async () => {
      const sources = [
        {
          nodeType: ['CallExpr', 'MemberExpr'],
          patterns: [{ type: 'contains' as const, value: 'user', caseSensitive: false }],
        },
      ];

      const astNodes = [
        createMockASTNode('CallExpr', 1, 1, 'getUserInput()'),
        createMockASTNode('MemberExpr', 2, 1, 'user.request'),
        createMockASTNode('CallExpr', 3, 1, 'console.log()'),
      ];

      const sourceNodes = await sourceTracker.findSources(sources, astNodes);

      // Quick debug

      expect(sourceNodes).toHaveLength(2);
      expect(sourceNodes[0].node.type).toBe('CallExpr');
      expect(sourceNodes[1].node.type).toBe('MemberExpr');
    });

    it('should calculate source confidence correctly', async () => {
      const sources = [
        {
          nodeType: ['CallExpr', 'MemberExpr'],
          patterns: [{ type: 'contains' as const, value: 'user', caseSensitive: false }],
        },
      ];

      const astNodes = [createMockASTNode('CallExpr', 1, 1, 'getUserInput()')];

      const sourceNodes = await sourceTracker.findSources(sources, astNodes);

      expect(sourceNodes[0].confidence).toBeGreaterThan(0.5);
      expect(sourceNodes[0].taintValue).toBeTruthy();
    });
  });

  describe('SinkDetector', () => {
    it('should find sink nodes matching patterns', async () => {
      const sinks = [
        {
          nodeType: ['CallExpr', 'MemberExpr'],
          patterns: [{ type: 'contains' as const, value: 'eval' }],
        },
      ];

      const astNodes = [
        createMockASTNode('CallExpr', 1, 1, 'eval(userInput)'),
        createMockASTNode('MemberExpr', 2, 1, 'document.innerHTML'),
        createMockASTNode('CallExpr', 3, 1, 'console.log()'),
      ];

      const sinkNodes = await sinkDetector.findSinks(sinks, astNodes);

      expect(sinkNodes).toHaveLength(1);
      expect(sinkNodes[0].node.type).toBe('CallExpr');
    });

    it('should classify sink types correctly', async () => {
      const sinks = [
        {
          nodeType: 'CallExpr',
          patterns: [{ type: 'contains' as const, value: 'eval' }],
        },
      ];

      const astNodes = [createMockASTNode('CallExpr', 1, 1, 'eval(userInput)')];

      const sinkNodes = await sinkDetector.findSinks(sinks, astNodes);

      expect(sinkNodes[0].sinkType).toBe('code_execution');
    });
  });

  describe('DataFlowAnalyzer', () => {
    it('should analyze data flows between sources and sinks', async () => {
      const sourceNode = {
        node: createMockASTNode('CallExpr', 1, 1, 'getUserInput()'),
        pattern: { nodeType: 'CallExpr', patterns: [] },
        confidence: 0.8,
        taintValue: 'user_input',
      };

      const sinkNode = {
        node: createMockASTNode('CallExpr', 2, 1, 'eval(userInput)'),
        pattern: { nodeType: 'CallExpr', patterns: [] },
        confidence: 0.9,
        sinkType: 'code_execution',
      };

      // Create a simple connection
      sourceNode.node.children = [sinkNode.node];

      const flows = await dataFlowAnalyzer.analyzeFlows(
        [sourceNode],
        [sinkNode],
        [],
        [sourceNode.node, sinkNode.node]
      );

      expect(flows).toHaveLength(1);
      expect(flows[0].source).toBe(sourceNode);
      expect(flows[0].sink).toBe(sinkNode);
      expect(flows[0].source.confidence).toBeGreaterThan(0);
    });

    it('should calculate risk levels correctly', async () => {
      const sourceNode = {
        node: createMockASTNode('CallExpr', 1, 1, 'getUserInput()'),
        pattern: { nodeType: 'CallExpr', patterns: [] },
        confidence: 0.9,
        taintValue: 'user_input',
      };

      const sinkNode = {
        node: createMockASTNode('CallExpr', 2, 1, 'eval(userInput)'),
        pattern: { nodeType: 'CallExpr', patterns: [] },
        confidence: 0.9,
        sinkType: 'code_execution',
      };

      sourceNode.node.children = [sinkNode.node];

      const flows = await dataFlowAnalyzer.analyzeFlows(
        [sourceNode],
        [sinkNode],
        [],
        [sourceNode.node, sinkNode.node]
      );

      expect(flows[0].riskLevel).toBe('critical');
    });

    it('should provide detailed flow information', async () => {
      const sourceNode = {
        node: createMockASTNode('CallExpr', 1, 1, 'getUserInput()'),
        pattern: { nodeType: 'CallExpr', patterns: [] },
        confidence: 0.8,
        taintValue: 'user_input',
      };

      const sinkNode = {
        node: createMockASTNode('CallExpr', 2, 1, 'eval(userInput)'),
        pattern: { nodeType: 'CallExpr', patterns: [] },
        confidence: 0.9,
        sinkType: 'code_execution',
      };

      sourceNode.node.children = [sinkNode.node];

      const flows = await dataFlowAnalyzer.analyzeFlows(
        [sourceNode],
        [sinkNode],
        [],
        [sourceNode.node, sinkNode.node]
      );

      const details = await dataFlowAnalyzer.getFlowDetails(flows[0]);

      expect(details.flow).toBe(flows[0]);
      expect(details.relatedCWEs).toBeDefined();
      expect(details.mitigationStrategies).toBeDefined();
      expect(details.recommendations).toContain('Avoid dynamic code execution with user input');
    });
  });

  describe('TaintAnalysisEngine Integration', () => {
    it('should analyze complete taint flows', async () => {
      const sources = [
        {
          nodeType: 'CallExpr',
          patterns: [{ type: 'startsWith' as const, value: 'get', caseSensitive: false }],
        },
      ];

      const sinks = [
        {
          nodeType: 'CallExpr',
          patterns: [{ type: 'contains' as const, value: 'eval' }],
        },
      ];

      const astNodes = [
        createMockASTNode('CallExpr', 1, 1, 'getUserInput()'),
        createMockASTNode('CallExpr', 2, 1, 'eval(userInput)'),
      ];

      // Create connection
      astNodes[0].children = [astNodes[1]];

      const flows = await engine.analyzeTaintFlows(sources, sinks, [], astNodes);

      expect(flows).toHaveLength(1);
      expect(flows[0].source.node.type).toBe('CallExpr');
      expect(flows[0].sink.node.type).toBe('CallExpr');
    });

    it('should identify tainted nodes', async () => {
      const sources = [
        {
          nodeType: 'CallExpr',
          patterns: [{ type: 'contains' as const, value: 'user', caseSensitive: false }],
        },
      ];

      const sinks = [
        {
          nodeType: 'CallExpr',
          patterns: [{ type: 'contains' as const, value: 'eval' }],
        },
      ];

      const astNodes = [
        createMockASTNode('CallExpr', 1, 1, 'getUserInput()'),
        createMockASTNode('CallExpr', 2, 1, 'eval(userInput)'),
      ];

      astNodes[0].children = [astNodes[1]];

      const flows = await engine.analyzeTaintFlows(sources, sinks, [], astNodes);
      const taintedNodes = engine.getTaintedNodes(flows);

      expect(taintedNodes).toHaveLength(2);
      expect(taintedNodes).toContain(astNodes[0]);
      expect(taintedNodes).toContain(astNodes[1]);
    });

    it('should check if specific nodes are tainted', async () => {
      const sources = [
        {
          nodeType: 'CallExpr',
          patterns: [{ type: 'contains' as const, value: 'user', caseSensitive: false }],
        },
      ];

      const sinks = [
        {
          nodeType: 'CallExpr',
          patterns: [{ type: 'contains' as const, value: 'eval' }],
        },
      ];

      const astNodes = [
        createMockASTNode('CallExpr', 1, 1, 'getUserInput()'),
        createMockASTNode('CallExpr', 2, 1, 'eval(userInput)'),
        createMockASTNode('CallExpr', 3, 1, 'console.log()'),
      ];

      astNodes[0].children = [astNodes[1]];

      const flows = await engine.analyzeTaintFlows(sources, sinks, [], astNodes);

      expect(engine.isNodeTainted(astNodes[0], flows)).toBe(true);
      expect(engine.isNodeTainted(astNodes[1], flows)).toBe(true);
      expect(engine.isNodeTainted(astNodes[2], flows)).toBe(false);
    });
  });
});
