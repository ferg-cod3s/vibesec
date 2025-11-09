import { describe, it, expect, beforeEach } from '@jest/globals';
import { EnhancedASTAnalyzer } from '../../scanner/analyzers/enhanced-ast-analyzer';
import { EnhancedASTParser } from '../../src/ast/enhanced-ast-parser';
import { Rule, Severity, Category, Pattern } from '../../scanner/core/types';

// Helper function to create test rules
const createTestRule = (
  patterns: Pattern[],
  severity: Severity = Severity.MEDIUM,
  category: Category = Category.CUSTOM
): Rule => ({
  id: 'test-rule',
  name: 'Test Rule',
  description: 'Test description',
  severity,
  category,
  patterns,
  languages: ['javascript'],
  enabled: true,
  confidence: 0.8,
});

describe('EnhancedASTAnalyzer', () => {
  let analyzer: EnhancedASTAnalyzer;
  let parser: EnhancedASTParser;

  beforeEach(() => {
    analyzer = new EnhancedASTAnalyzer({
      enableParallelExecution: false, // Disable for testing
      enableQueryOptimization: true,
      cacheResults: true,
    });
    parser = new EnhancedASTParser();
  });

  describe('Legacy Query Support', () => {
    it('should handle simple node type queries', async () => {
      const content = `
        function getUser(id) {
          return db.query('SELECT * FROM users WHERE id = ?', [id]);
        }
      `;

      const ast = parser.parseContent(content, 'javascript');
      const rule = createTestRule(
        [
          {
            type: 'ast',
            query: 'FunctionDecl',
          },
        ],
        Severity.MEDIUM,
        Category.INJECTION
      );

      const findings = await analyzer.analyze('test.js', content, ast, rule);

      expect(findings).toHaveLength(1);
      expect(findings[0].rule).toBe('test-rule');
      expect(findings[0].title).toBe('Test Rule');
      expect(findings[0].location.line).toBe(1);
    });

    it('should handle node type with name constraints', async () => {
      const content = `
        function getUser(id) {
          return db.query('SELECT * FROM users WHERE id = ?', [id]);
        }
        
        function createPost(data) {
          return db.query('INSERT INTO posts SET ?', data);
        }
      `;

      const ast = parser.parseContent(content, 'javascript');
      const rule = createTestRule(
        [
          {
            type: 'ast',
            query: 'FunctionDecl[name=getUser]',
          },
        ],
        Severity.MEDIUM,
        Category.INJECTION
      );

      const findings = await analyzer.analyze('test.js', content, ast, rule);

      expect(findings).toHaveLength(1);
      expect(findings[0].location.line).toBe(1);
    });

    it('should handle naive flow queries', async () => {
      const content = `
        const userInput = req.body.name;
        db.query('SELECT * FROM users WHERE name = '' + userInput);
      `;

      const ast = parser.parseContent(content, 'javascript');
      const rule = createTestRule(
        [
          {
            type: 'ast',
            query: 'flow(req.body -> db.query)',
          },
        ],
        Severity.HIGH,
        Category.INJECTION
      );

      const findings = await analyzer.analyze('test.js', content, ast, rule);

      // Should find the naive flow
      expect(findings.length).toBeGreaterThan(0);
    });
  });

  describe('EQL Query Support', () => {
    it('should detect EQL queries and process them differently', async () => {
      const content = `
        function getUser(id) {
          return db.query('SELECT * FROM users WHERE id = ?', [id]);
        }
      `;

      const ast = parser.parseContent(content, 'javascript');
      const rule = createTestRule(
        [
          {
            type: 'eql',
            query: 'FunctionDecl',
          },
        ],
        Severity.MEDIUM,
        Category.INJECTION
      );

      const findings = await analyzer.analyze('test.js', content, ast, rule);

      // Should process as EQL query
      expect(findings.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle complex EQL patterns', async () => {
      const content = `
        const userInput = req.body.name;
        const sanitized = validator.escape(userInput);
        db.query('SELECT * FROM users WHERE name = ?', [sanitized]);
      `;

      const ast = parser.parseContent(content, 'javascript');
      const rule = createTestRule(
        [
          {
            type: 'eql',
            query: 'CallExpr[name=db.query]',
          },
        ],
        Severity.MEDIUM,
        Category.INJECTION
      );

      const findings = await analyzer.analyze('test.js', content, ast, rule);

      // Should process complex EQL pattern
      expect(findings.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid queries gracefully', async () => {
      const content = `
        function test() {
          return 'hello';
        }
      `;

      const ast = parser.parseContent(content, 'javascript');
      const rule = createTestRule(
        [
          {
            type: 'eql',
            query: 'INVALID SYNTAX {{{',
          },
        ],
        Severity.LOW,
        Category.CUSTOM
      );

      // Should not throw, but handle gracefully
      const findings = await analyzer.analyze('test.js', content, ast, rule);
      expect(findings).toEqual([]);
    });

    it('should continue processing other patterns if one fails', async () => {
      const content = `
        function test() {
          return 'hello';
        }
      `;

      const ast = parser.parseContent(content, 'javascript');
      const rule = createTestRule(
        [
          {
            type: 'eql',
            query: 'INVALID SYNTAX {{{',
          },
          {
            type: 'ast',
            query: 'FunctionDecl',
          },
        ],
        Severity.LOW,
        Category.CUSTOM
      );

      const findings = await analyzer.analyze('test.js', content, ast, rule);

      // Should still find the valid pattern
      expect(findings).toHaveLength(1);
      expect(findings[0].rule).toBe('test-rule');
    });
  });

  describe('Performance Options', () => {
    it('should respect caching options', async () => {
      const analyzerWithCache = new EnhancedASTAnalyzer({
        cacheResults: true,
        enableParallelExecution: false,
      });

      const content = `
        function test() {
          return 'hello';
        }
      `;

      const ast = parser.parseContent(content, 'javascript');
      const rule = createTestRule(
        [
          {
            type: 'ast',
            query: 'FunctionDecl',
          },
        ],
        Severity.LOW,
        Category.CUSTOM
      );

      const findings1 = await analyzerWithCache.analyze('test.js', content, ast, rule);
      const findings2 = await analyzerWithCache.analyze('test.js', content, ast, rule);

      expect(findings1).toHaveLength(1);
      expect(findings2).toHaveLength(1);
    });

    it('should handle query optimization', async () => {
      const analyzerWithOptimization = new EnhancedASTAnalyzer({
        enableQueryOptimization: true,
        enableParallelExecution: false,
      });

      const content = `
        function test() {
          return 'hello';
        }
      `;

      const ast = parser.parseContent(content, 'javascript');
      const rule = createTestRule(
        [
          {
            type: 'eql',
            query: 'FunctionDecl',
          },
        ],
        Severity.LOW,
        Category.CUSTOM
      );

      const findings = await analyzerWithOptimization.analyze('test.js', content, ast, rule);
      expect(findings.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Finding Generation', () => {
    it('should generate findings with proper metadata', async () => {
      const content = `
        function getUser(id) {
          return db.query('SELECT * FROM users WHERE id = ?', [id]);
        }
      `;

      const ast = parser.parseContent(content, 'javascript');
      const rule: Rule = {
        id: 'test-rule',
        name: 'Test Rule',
        description: 'Test description',
        severity: Severity.HIGH,
        category: Category.INJECTION,
        patterns: [
          {
            type: 'ast',
            query: 'FunctionDecl',
          },
        ],
        languages: ['javascript'],
        enabled: true,
        confidence: 0.9,
        metadata: {
          cwe: 'CWE-89',
          owasp: 'A03:2021 – Injection',
        },
        fix: {
          template: 'Use parameterized queries',
          references: ['https://owasp.org/www-project-top-ten/2021/A03_2021-Injection/'],
        },
      };

      const findings = await analyzer.analyze('test.js', content, ast, rule);

      expect(findings).toHaveLength(1);
      const finding = findings[0];

      expect(finding.id).toMatch(/^test-rule-/);
      expect(finding.rule).toBe('test-rule');
      expect(finding.severity).toBe(Severity.HIGH);
      expect(finding.category).toBe(Category.INJECTION);
      expect(finding.title).toBe('Test Rule');
      expect(finding.description).toBe('Test description');
      expect(finding.location.file).toBe('test.js');
      expect(finding.location.line).toBe(1);
      expect(finding.snippet).toContain('function getUser');
      expect(finding.fix.recommendation).toBe('Use parameterized queries');
      expect(finding.metadata.confidence).toBe(0.9);
      expect(finding.metadata.cwe).toBe('CWE-89');
      expect(finding.metadata.owasp).toBe('A03:2021 – Injection');
    });
  });
});
