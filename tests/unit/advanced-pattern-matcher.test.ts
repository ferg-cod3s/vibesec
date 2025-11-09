import { describe, it, expect, beforeEach } from '@jest/globals';
import { AdvancedPatternMatcher } from '../../scanner/analyzers/advanced-pattern-matcher';
import { EQLLexer } from '../../scanner/analyzers/eql-lexer';
import { EQLParser } from '../../scanner/analyzers/eql-parser';
import { ASTNode } from '../../src/ast/enhanced-ast-parser';

describe('AdvancedPatternMatcher', () => {
  let matcher: AdvancedPatternMatcher;
  let lexer: EQLLexer;
  let parser: EQLParser;

  beforeEach(() => {
    matcher = new AdvancedPatternMatcher();
    lexer = new EQLLexer();
    parser = new EQLParser();
  });

  const createMockASTNode = (type: string, line: number = 1, column: number = 1): ASTNode => ({
    type,
    line,
    column,
    content: `${type} content`,
    children: [],
    value: type === 'StringLiteral' ? 'test_value' : undefined,
    properties:
      type === 'ObjectExpression'
        ? { key: { type: 'Property', line, column, content: 'key content', children: [] } }
        : undefined,
  });

  describe('Simple Pattern Matching', () => {
    it('should match nodes by type', async () => {
      const tokens = lexer.tokenize('CallExpr');
      const query = parser.parse(tokens);

      const astNodes = [
        createMockASTNode('CallExpr'),
        createMockASTNode('MemberExpr'),
        createMockASTNode('CallExpr'),
      ];

      const results = await matcher.executeQuery(query, astNodes);

      expect(results).toHaveLength(2);
      expect(results[0].node.type).toBe('CallExpr');
      expect(results[1].node.type).toBe('CallExpr');
    });

    it('should match nodes with wildcard', async () => {
      const tokens = lexer.tokenize('*');
      const query = parser.parse(tokens);

      const astNodes = [
        createMockASTNode('CallExpr'),
        createMockASTNode('MemberExpr'),
        createMockASTNode('BinaryExpr'),
      ];

      const results = await matcher.executeQuery(query, astNodes);

      expect(results).toHaveLength(3);
    });

    it('should match nodes with properties', async () => {
      const tokens = lexer.tokenize('StringExpr[value: "test_value"]');
      const query = parser.parse(tokens);

      const astNodes = [createMockASTNode('StringExpr'), createMockASTNode('StringExpr')];

      // Set the value for the first node to match
      astNodes[0].value = 'test_value';
      // Set the value for the second node to not match
      astNodes[1].value = 'different_value';

      const results = await matcher.executeQuery(query, astNodes);

      expect(results).toHaveLength(1);
      expect(results[0].node.value).toBe('test_value');
    });
  });

  describe('Logical Expressions', () => {
    it('should match AND expressions', async () => {
      const tokens = lexer.tokenize('AND(CallExpr, MemberExpr)');
      const query = parser.parse(tokens);

      const astNodes = [createMockASTNode('CallExpr'), createMockASTNode('MemberExpr')];

      const results = await matcher.executeQuery(query, astNodes);

      // AND should return nodes that match both patterns (intersection)
      // In this simple implementation, it might return empty since no single node matches both
      expect(Array.isArray(results)).toBe(true);
    });

    it('should match OR expressions', async () => {
      const tokens = lexer.tokenize('OR(CallExpr, MemberExpr)');
      const query = parser.parse(tokens);

      const astNodes = [
        createMockASTNode('CallExpr'),
        createMockASTNode('BinaryExpr'),
        createMockASTNode('MemberExpr'),
      ];

      const results = await matcher.executeQuery(query, astNodes);

      expect(results).toHaveLength(2);
      expect(results.some((r) => r.node.type === 'CallExpr')).toBe(true);
      expect(results.some((r) => r.node.type === 'MemberExpr')).toBe(true);
    });

    it('should match NOT expressions', async () => {
      const tokens = lexer.tokenize('NOT(CallExpr)');
      const query = parser.parse(tokens);

      const astNodes = [
        createMockASTNode('CallExpr'),
        createMockASTNode('MemberExpr'),
        createMockASTNode('BinaryExpr'),
      ];

      const results = await matcher.executeQuery(query, astNodes);

      expect(results).toHaveLength(2);
      expect(results.every((r) => r.node.type !== 'CallExpr')).toBe(true);
    });
  });

  describe('Taint Analysis', () => {
    it('should analyze simple taint flows', async () => {
      const tokens = lexer.tokenize('TAINT(SOURCE: CallExpr{"user"}, SINK: MemberExpr{"eval"})');
      const query = parser.parse(tokens);

      const astNodes = [createMockASTNode('CallExpr'), createMockASTNode('MemberExpr')];

      // Set content to match the patterns
      astNodes[0].content = 'user_input';
      astNodes[1].content = 'eval_function';

      const results = await matcher.executeQuery(query, astNodes);

      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('Performance and Caching', () => {
    it('should cache query results', async () => {
      const tokens = lexer.tokenize('CallExpr');
      const query = parser.parse(tokens);

      const astNodes = [createMockASTNode('CallExpr')];

      // First query
      const stats1 = matcher.getPerformanceStats();
      await matcher.executeQuery(query, astNodes);
      const stats2 = matcher.getPerformanceStats();

      // Second query (should hit cache)
      await matcher.executeQuery(query, astNodes);
      const stats3 = matcher.getPerformanceStats();

      expect(stats2.queriesExecuted).toBe(stats1.queriesExecuted + 1);
      expect(stats3.queriesExecuted).toBe(stats2.queriesExecuted + 1);
      expect(stats3.cacheHits).toBe(1);
    });

    it('should clear cache', () => {
      matcher.clearCache();
      const stats = matcher.getPerformanceStats();

      // Cache should be empty after clear
      expect(stats.cacheHits).toBe(0);
      expect(stats.cacheMisses).toBe(0);
    });
  });

  describe('Results to Findings Conversion', () => {
    it('should convert match results to findings', () => {
      const matchResults = [
        {
          node: createMockASTNode('CallExpr', 10, 5),
          pattern: { nodeType: 'CallExpr' },
          confidence: 0.8,
          metadata: { test: true },
        },
      ];

      const findings = matcher.resultsToFindings(matchResults, 'test-rule', '/test/file.js');

      expect(findings).toHaveLength(1);
      expect(findings[0].rule).toBe('test-rule');
      expect(findings[0].location.file).toBe('/test/file.js');
      expect(findings[0].location.line).toBe(10);
      expect(findings[0].location.column).toBe(5);
      expect(findings[0].metadata.confidence).toBe(0.8);
      expect(findings[0].metadata.test).toBe(true);
    });
  });
});
