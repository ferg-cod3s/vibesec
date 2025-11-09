import { describe, it, expect } from '@jest/globals';
import { EQLLexer } from '../../scanner/analyzers/eql-lexer';

describe('EQLLexer', () => {
  it('should tokenize simple patterns', () => {
    const lexer = new EQLLexer();
    const tokens = lexer.tokenize('CallExpr');

    expect(tokens).toHaveLength(2); // IDENTIFIER + EOF
    expect(tokens[0].type).toBe('IDENTIFIER');
    expect(tokens[0].value).toBe('CallExpr');
    expect(tokens[1].type).toBe('EOF');
  });

  it('should tokenize wildcard patterns', () => {
    const lexer = new EQLLexer();
    const tokens = lexer.tokenize('*');

    expect(tokens).toHaveLength(2);
    expect(tokens[0].type).toBe('WILDCARD');
    expect(tokens[0].value).toBe('*');
    expect(tokens[1].type).toBe('EOF');
  });

  it('should tokenize string literals', () => {
    const lexer = new EQLLexer();
    const tokens = lexer.tokenize('"eval"');

    expect(tokens).toHaveLength(2);
    expect(tokens[0].type).toBe('STRING');
    expect(tokens[0].value).toBe('eval');
    expect(tokens[1].type).toBe('EOF');
  });

  it('should tokenize regex patterns', () => {
    const lexer = new EQLLexer();
    const tokens = lexer.tokenize('/evals*\\(/');

    expect(tokens).toHaveLength(2);
    expect(tokens[0].type).toBe('REGEX');
    expect(tokens[0].value).toBe('/evals*(/');
    expect(tokens[1].type).toBe('EOF');
  });

  it('should tokenize logical operators', () => {
    const lexer = new EQLLexer();
    const tokens = lexer.tokenize('AND OR NOT');

    expect(tokens).toHaveLength(4);
    expect(tokens[0].type).toBe('AND');
    expect(tokens[1].type).toBe('OR');
    expect(tokens[2].type).toBe('NOT');
    expect(tokens[3].type).toBe('EOF');
  });

  it('should tokenize comparison operators', () => {
    const lexer = new EQLLexer();
    const tokens = lexer.tokenize('= != > < >=');

    expect(tokens).toHaveLength(6);
    expect(tokens[0].type).toBe('EQ');
    expect(tokens[1].type).toBe('NEQ');
    expect(tokens[2].type).toBe('GT');
    expect(tokens[3].type).toBe('LT');
    expect(tokens[4].type).toBe('GTE');
    expect(tokens[5].type).toBe('EOF');
  });

  it('should tokenize string pattern operators', () => {
    const lexer = new EQLLexer();
    const tokens = lexer.tokenize('contains starts_with ends_with matches');

    expect(tokens).toHaveLength(5);
    expect(tokens[0].type).toBe('CONTAINS');
    expect(tokens[1].type).toBe('STARTS_WITH');
    expect(tokens[2].type).toBe('ENDS_WITH');
    expect(tokens[3].type).toBe('MATCHES');
    expect(tokens[4].type).toBe('EOF');
  });

  it('should tokenize taint analysis keywords', () => {
    const lexer = new EQLLexer();
    const tokens = lexer.tokenize('TAINT SOURCE SINK SANITIZER');

    expect(tokens).toHaveLength(5);
    expect(tokens[0].type).toBe('TAINT');
    expect(tokens[1].type).toBe('SOURCE');
    expect(tokens[2].type).toBe('SINK');
    expect(tokens[3].type).toBe('SANITIZER');
    expect(tokens[4].type).toBe('EOF');
  });

  it('should tokenize punctuation', () => {
    const lexer = new EQLLexer();
    const tokens = lexer.tokenize('( ) [ ] { } , : .');

    expect(tokens).toHaveLength(10);
    expect(tokens[0].type).toBe('LPAREN');
    expect(tokens[1].type).toBe('RPAREN');
    expect(tokens[2].type).toBe('LBRACKET');
    expect(tokens[3].type).toBe('RBRACKET');
    expect(tokens[4].type).toBe('LBRACE');
    expect(tokens[5].type).toBe('RBRACE');
    expect(tokens[6].type).toBe('COMMA');
    expect(tokens[7].type).toBe('COLON');
    expect(tokens[8].type).toBe('DOT');
    expect(tokens[9].type).toBe('EOF');
  });

  it('should tokenize complex expressions', () => {
    const lexer = new EQLLexer();
    const tokens = lexer.tokenize('CallExpr[name contains "eval"]');

    const expectedTypes = [
      'IDENTIFIER',
      'LBRACKET',
      'IDENTIFIER',
      'CONTAINS',
      'STRING',
      'RBRACKET',
      'EOF',
    ];

    expect(tokens).toHaveLength(expectedTypes.length);
    expectedTypes.forEach((type, index) => {
      expect(tokens[index].type).toBe(type);
    });
  });

  it('should handle pipe-separated node types', () => {
    const lexer = new EQLLexer();
    const tokens = lexer.tokenize('CallExpr|MemberExpr|BinaryExpr');

    expect(tokens).toHaveLength(6);
    expect(tokens[0].type).toBe('IDENTIFIER');
    expect(tokens[0].value).toBe('CallExpr');
    expect(tokens[1].type).toBe('PIPE');
    expect(tokens[2].type).toBe('IDENTIFIER');
    expect(tokens[2].value).toBe('MemberExpr');
    expect(tokens[3].type).toBe('PIPE');
    expect(tokens[4].type).toBe('IDENTIFIER');
    expect(tokens[4].value).toBe('BinaryExpr');
    expect(tokens[5].type).toBe('EOF');
  });

  it('should track positions correctly', () => {
    const lexer = new EQLLexer();
    const tokens = lexer.tokenize('CallExpr(name)');

    expect(tokens[0].position).toBe(0);
    expect(tokens[0].line).toBe(1);
    expect(tokens[0].column).toBe(1);

    expect(tokens[1].position).toBe(8);
    expect(tokens[1].line).toBe(1);
    expect(tokens[1].column).toBe(9);
  });

  it('should handle multi-line input', () => {
    const lexer = new EQLLexer();
    const input = 'CallExpr\n(name)';
    const tokens = lexer.tokenize(input);

    expect(tokens[1].line).toBe(2);
    expect(tokens[1].column).toBe(1);
  });

  it('should handle empty input', () => {
    const lexer = new EQLLexer();
    const tokens = lexer.tokenize('');

    expect(tokens).toHaveLength(1);
    expect(tokens[0].type).toBe('EOF');
  });

  it('should handle whitespace correctly', () => {
    const lexer = new EQLLexer();
    const tokens = lexer.tokenize('  CallExpr   (  name  )  ');

    const expectedTypes = ['IDENTIFIER', 'LPAREN', 'IDENTIFIER', 'RPAREN', 'EOF'];
    expect(tokens).toHaveLength(expectedTypes.length);
    expectedTypes.forEach((type, index) => {
      expect(tokens[index].type).toBe(type);
    });
  });
});
