import { describe, it, expect, beforeEach } from '@jest/globals';
import { EQLParser, QueryValidator } from '../../scanner/analyzers/eql-parser';
import { EQLLexer } from '../../scanner/analyzers/eql-lexer';

describe('EQLParser', () => {
  let parser: EQLParser;
  let lexer: EQLLexer;
  let validator: QueryValidator;

  beforeEach(() => {
    parser = new EQLParser();
    lexer = new EQLLexer();
    validator = new QueryValidator();
  });

  describe('Simple Pattern Parsing', () => {
    it('should parse simple node patterns', () => {
      const tokens = lexer.tokenize('CallExpr');
      const query = parser.parse(tokens);

      expect(query.expression.type).toBe('pattern');
      expect((query.expression as any).pattern.nodeType).toBe('CallExpr');
    });

    it('should parse wildcard patterns', () => {
      const tokens = lexer.tokenize('*');
      const query = parser.parse(tokens);

      expect(query.expression.type).toBe('pattern');
      expect((query.expression as any).pattern.nodeType).toEqual({
        type: 'wildcard',
        matches: 'all',
      });
    });

    it('should parse pipe-separated node types', () => {
      const tokens = lexer.tokenize('CallExpr|MemberExpr');
      const query = parser.parse(tokens);

      expect(query.expression.type).toBe('pattern');
      expect((query.expression as any).pattern.nodeType).toEqual(['CallExpr', 'MemberExpr']);
    });
  });

  describe('Pattern with Properties', () => {
    it('should parse patterns with string properties', () => {
      const tokens = lexer.tokenize('CallExpr[name: "eval"]');
      const query = parser.parse(tokens);

      expect(query.expression.type).toBe('pattern');
      const pattern = (query.expression as any).pattern;
      expect(pattern.nodeType).toBe('CallExpr');
      expect(pattern.properties).toHaveLength(1);
      expect(pattern.properties[0].name).toBe('name');
      expect(pattern.properties[0].value.type).toBe('string');
      expect(pattern.properties[0].value.value).toBe('eval');
    });

    it('should parse patterns with multiple properties', () => {
      const tokens = lexer.tokenize('CallExpr[name: "eval", value: "malicious"]');
      const query = parser.parse(tokens);

      const pattern = (query.expression as any).pattern;
      expect(pattern.properties).toHaveLength(2);
      expect(pattern.properties[0].name).toBe('name');
      expect(pattern.properties[1].name).toBe('value');
    });
  });

  describe('Pattern with Children', () => {
    it('should parse patterns with children', () => {
      const tokens = lexer.tokenize('CallExpr{MemberExpr}');
      const query = parser.parse(tokens);

      const pattern = (query.expression as any).pattern;
      expect(pattern.children).toHaveLength(1);
      expect(pattern.children[0].pattern.nodeType).toBe('MemberExpr');
    });

    it('should parse patterns with multiple children', () => {
      const tokens = lexer.tokenize('CallExpr{MemberExpr, BinaryExpr}');
      const query = parser.parse(tokens);

      const pattern = (query.expression as any).pattern;
      expect(pattern.children).toHaveLength(2);
    });
  });

  describe('Pattern with Arguments', () => {
    it('should parse patterns with arguments', () => {
      const tokens = lexer.tokenize('CallExpr(MemberExpr)');
      const query = parser.parse(tokens);

      const pattern = (query.expression as any).pattern;
      expect(pattern.arguments).toHaveLength(1);
      expect(pattern.arguments[0].nodeType).toBe('MemberExpr');
    });
  });

  describe('Logical Expressions', () => {
    it('should parse AND expressions', () => {
      const tokens = lexer.tokenize('AND(CallExpr, MemberExpr)');
      const query = parser.parse(tokens);

      expect(query.expression.type).toBe('logical');
      const logical = query.expression as any;
      expect(logical.operator).toBe('AND');
      expect(logical.operands).toHaveLength(2);
      expect(logical.operands[0].expression.type).toBe('pattern');
      expect(logical.operands[1].expression.type).toBe('pattern');
    });

    it('should parse OR expressions', () => {
      const tokens = lexer.tokenize('OR(CallExpr, MemberExpr)');
      const query = parser.parse(tokens);

      const logical = query.expression as any;
      expect(logical.operator).toBe('OR');
    });

    it('should parse NOT expressions', () => {
      const tokens = lexer.tokenize('NOT(CallExpr)');
      const query = parser.parse(tokens);

      const logical = query.expression as any;
      expect(logical.operator).toBe('NOT');
      expect(logical.operands).toHaveLength(1);
    });
  });

  describe('Taint Expressions', () => {
    it('should parse simple taint expressions', () => {
      const tokens = lexer.tokenize('TAINT(SOURCE: CallExpr{"user"}, SINK: MemberExpr{"eval"})');
      const query = parser.parse(tokens);

      expect(query.expression.type).toBe('taint');
      const taint = query.expression as any;
      expect(taint.source.nodeType).toBe('CallExpr');
      expect(taint.source.patterns).toHaveLength(1);
      expect(taint.source.patterns[0].value).toBe('user');
      expect(taint.sink.nodeType).toBe('MemberExpr');
      expect(taint.sink.patterns).toHaveLength(1);
      expect(taint.sink.patterns[0].value).toBe('eval');
    });

    it('should parse taint expressions with sanitizers', () => {
      const tokens = lexer.tokenize(
        'TAINT(SOURCE: CallExpr{"user"}, SINK: MemberExpr{"eval"}, SANITIZER: BinaryExpr{"sanitize"})'
      );
      const query = parser.parse(tokens);

      const taint = query.expression as any;
      expect(taint.sanitizers).toHaveLength(1);
      expect(taint.sanitizers[0].nodeType).toBe('BinaryExpr');
      expect(taint.sanitizers[0].patterns[0].value).toBe('sanitize');
    });
  });

  describe('Error Handling', () => {
    it('should throw error for empty query', () => {
      const tokens = lexer.tokenize('');
      expect(() => parser.parse(tokens)).toThrow('Empty query');
    });

    it('should throw error for invalid syntax', () => {
      const tokens = lexer.tokenize('CallExpr(');
      expect(() => parser.parse(tokens)).toThrow();
    });
  });
});

describe('QueryValidator', () => {
  let validator: QueryValidator;
  let lexer: EQLLexer;
  let parser: EQLParser;

  beforeEach(() => {
    validator = new QueryValidator();
    lexer = new EQLLexer();
    parser = new EQLParser();
  });

  it('should validate simple patterns', () => {
    const tokens = lexer.tokenize('CallExpr');
    const query = parser.parse(tokens);
    const result = validator.validate(query);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should validate logical expressions', () => {
    const tokens = lexer.tokenize('AND(CallExpr, MemberExpr)');
    const query = parser.parse(tokens);
    const result = validator.validate(query);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should validate taint expressions', () => {
    const tokens = lexer.tokenize('TAINT(SOURCE: CallExpr{"user"}, SINK: MemberExpr{"eval"})');
    const query = parser.parse(tokens);
    const result = validator.validate(query);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});
