import {
  Token,
  TokenType,
  EQLQuery,
  LogicalExpression,
  PatternExpression,
  TaintExpression,
  NodePattern,
  StringPattern,
  ValuePattern,
  WildcardPattern,
  SourcePattern,
  SinkPattern,
  SanitizerPattern,
  ValidationResult,
} from './eql-types';

export class EQLParser {
  private tokens: Token[] = [];
  private current: number = 0;

  parse(tokens: Token[]): EQLQuery {
    this.tokens = tokens;
    this.current = 0;

    if (this.isAtEnd()) {
      throw new Error('Empty query');
    }

    const expression = this.parseExpression();

    if (!this.isAtEnd() && !this.check('EOF')) {
      throw new Error(`Unexpected token ${this.peek().type} at position ${this.peek().position}`);
    }

    return {
      expression,
      metadata: {},
    };
  }

  private parseExpression(): LogicalExpression | PatternExpression | TaintExpression {
    // Check for taint expression
    if (this.match('TAINT')) {
      return this.parseTaintExpression();
    }

    // Check for logical expression
    if (this.check('AND') || this.check('OR') || this.check('NOT')) {
      return this.parseLogicalExpression();
    }

    // Default to pattern expression
    return this.parsePatternExpression();
  }

  private parseTaintExpression(): TaintExpression {
    this.consume('LPAREN', "Expected '(' after TAINT");

    const source = this.parseSourcePattern();
    this.consume('COMMA', "Expected ',' after source pattern");
    const sink = this.parseSinkPattern();

    const sanitizers: SanitizerPattern[] = [];
    if (this.match('COMMA')) {
      do {
        sanitizers.push(this.parseSanitizerPattern());
      } while (this.match('COMMA'));
    }

    this.consume('RPAREN', "Expected ')' after taint expression");

    return {
      type: 'taint',
      source,
      sink,
      sanitizers: sanitizers.length > 0 ? sanitizers : undefined,
    };
  }

  private parseSourcePattern(): SourcePattern {
    this.consume('SOURCE', 'Expected SOURCE keyword');
    this.consume('COLON', "Expected ':' after SOURCE");

    const nodeTypes = this.parseNodeTypes();
    this.consume('LBRACE', "Expected '{' after source node types");

    const patterns: StringPattern[] = [];
    if (!this.check('RBRACE')) {
      do {
        patterns.push(this.parseStringPattern());
      } while (this.match('COMMA'));
    }

    this.consume('RBRACE', "Expected '}' after source patterns");

    // Filter out WildcardPattern for SourcePattern
    const filteredNodeTypes =
      typeof nodeTypes === 'object' && 'type' in nodeTypes ? [] : (nodeTypes as string | string[]);

    return {
      nodeType: filteredNodeTypes,
      patterns,
    };
  }

  private parseSinkPattern(): SinkPattern {
    this.consume('SINK', 'Expected SINK keyword');
    this.consume('COLON', "Expected ':' after SINK");

    const nodeTypes = this.parseNodeTypes();
    this.consume('LBRACE', "Expected '{' after sink node types");

    const patterns: StringPattern[] = [];
    if (!this.check('RBRACE')) {
      do {
        patterns.push(this.parseStringPattern());
      } while (this.match('COMMA'));
    }

    this.consume('RBRACE', "Expected '}' after sink patterns");

    // Filter out WildcardPattern for SinkPattern
    const filteredNodeTypes =
      typeof nodeTypes === 'object' && 'type' in nodeTypes ? [] : (nodeTypes as string | string[]);

    return {
      nodeType: filteredNodeTypes,
      patterns,
    };
  }

  private parseSanitizerPattern(): SanitizerPattern {
    this.consume('SANITIZER', 'Expected SANITIZER keyword');
    this.consume('COLON', "Expected ':' after SANITIZER");

    const nodeTypes = this.parseNodeTypes();
    this.consume('LBRACE', "Expected '{' after sanitizer node types");

    const patterns: StringPattern[] = [];
    if (!this.check('RBRACE')) {
      do {
        patterns.push(this.parseStringPattern());
      } while (this.match('COMMA'));
    }

    this.consume('RBRACE', "Expected '}' after sanitizer patterns");

    // Filter out WildcardPattern for SanitizerPattern
    const filteredNodeTypes =
      typeof nodeTypes === 'object' && 'type' in nodeTypes ? [] : (nodeTypes as string | string[]);

    return {
      nodeType: filteredNodeTypes,
      patterns,
    };
  }

  private parseLogicalExpression(): LogicalExpression {
    let operator: 'AND' | 'OR' | 'NOT';

    if (this.match('AND')) {
      operator = 'AND';
    } else if (this.match('OR')) {
      operator = 'OR';
    } else if (this.match('NOT')) {
      operator = 'NOT';
    } else {
      throw new Error(`Expected logical operator at position ${this.peek().position}`);
    }

    this.consume('LPAREN', `Expected '(' after ${operator}`);

    const operands: EQLQuery[] = [];
    do {
      operands.push({
        expression: this.parseExpression(),
        metadata: {},
      });
    } while (this.match('COMMA'));

    this.consume('RPAREN', `Expected ')' after ${operator} operands`);

    return {
      type: 'logical',
      operator,
      operands,
    };
  }

  private parsePatternExpression(): PatternExpression {
    const pattern = this.parseNodePattern();

    let constraints = undefined;
    if (this.match('LBRACKET')) {
      constraints = [];
      if (!this.check('RBRACKET')) {
        do {
          constraints.push(this.parseConstraint());
        } while (this.match('COMMA'));
      }
      this.consume('RBRACKET', "Expected ']' after constraints");
    }

    return {
      type: 'pattern',
      pattern,
      constraints,
    };
  }

  private parseNodePattern(): NodePattern {
    const nodeType = this.parseNodeTypes();

    let name: StringPattern | undefined;
    let value: ValuePattern | undefined;
    let operator: StringPattern | undefined;
    let properties = undefined;
    let children = undefined;
    let arguments_ = undefined;

    // Parse properties in brackets
    if (this.match('LBRACKET')) {
      properties = [];
      if (!this.check('RBRACKET')) {
        do {
          properties.push(this.parsePropertyPattern());
        } while (this.match('COMMA'));
      }
      this.consume('RBRACKET', "Expected ']' after properties");
    }

    // Parse children in braces
    if (this.match('LBRACE')) {
      children = [];
      if (!this.check('RBRACE')) {
        do {
          children.push({
            pattern: this.parseNodePattern(),
            minCount: 1,
            maxCount: undefined,
            recursive: false,
          });
        } while (this.match('COMMA'));
      }
      this.consume('RBRACE', "Expected '}' after children");
    }

    // Parse arguments in parentheses (for CallExpr)
    if (this.match('LPAREN')) {
      arguments_ = [];
      if (!this.check('RPAREN')) {
        do {
          arguments_.push(this.parseNodePattern());
        } while (this.match('COMMA'));
      }
      this.consume('RPAREN', "Expected ')' after arguments");
    }

    return {
      nodeType,
      name,
      value,
      operator,
      properties,
      children,
      arguments: arguments_,
    };
  }

  private parseNodeTypes(): string | string[] | WildcardPattern {
    if (this.match('WILDCARD')) {
      return {
        type: 'wildcard',
        matches: 'all',
      };
    }

    if (this.check('IDENTIFIER')) {
      const types: string[] = [];
      do {
        if (this.check('IDENTIFIER')) {
          types.push(this.advance().value);
        } else if (this.match('PIPE')) {
          continue;
        } else {
          break;
        }
      } while (this.check('IDENTIFIER') || this.check('PIPE'));

      return types.length === 1 ? types[0] : types;
    }

    throw new Error(`Expected node type at position ${this.peek().position}`);
  }

  private parseStringPattern(): StringPattern {
    let type: StringPattern['type'];
    let value: string;
    const caseSensitive = true;

    if (this.check('CONTAINS')) {
      type = 'contains';
      value = this.advance().value;
    } else if (this.check('STARTS_WITH')) {
      type = 'startsWith';
      value = this.advance().value;
    } else if (this.check('ENDS_WITH')) {
      type = 'endsWith';
      value = this.advance().value;
    } else if (this.check('MATCHES')) {
      type = 'regex';
      value = this.advance().value;
    } else if (this.check('STRING')) {
      type = 'exact';
      value = this.advance().value;
    } else if (this.check('IDENTIFIER')) {
      type = 'exact';
      value = this.advance().value;
    } else {
      throw new Error(`Expected string pattern at position ${this.peek().position}`);
    }

    return {
      type,
      value,
      caseSensitive,
    };
  }

  private parseValuePattern(): ValuePattern {
    let type: ValuePattern['type'];
    let value: any;
    let operator: ValuePattern['operator'] = '=';

    if (this.check('STRING')) {
      type = 'string';
      value = this.advance().value;
    } else if (this.check('NUMBER')) {
      type = 'number';
      value = parseFloat(this.advance().value);
    } else if (this.check('IDENTIFIER')) {
      const ident = this.advance().value.toLowerCase();
      if (ident === 'true' || ident === 'false') {
        type = 'boolean';
        value = ident === 'true';
      } else {
        type = 'string';
        value = ident;
      }
    } else {
      throw new Error(`Expected value at position ${this.peek().position}`);
    }

    // Check for comparison operator
    if (
      this.check('EQ') ||
      this.check('NEQ') ||
      this.check('GT') ||
      this.check('LT') ||
      this.check('GTE') ||
      this.check('LTE')
    ) {
      const opToken = this.advance();
      switch (opToken.type) {
        case 'EQ':
          operator = '=';
          break;
        case 'NEQ':
          operator = '!=';
          break;
        case 'GT':
          operator = '>';
          break;
        case 'LT':
          operator = '<';
          break;
        case 'GTE':
          operator = '>=';
          break;
        case 'LTE':
          operator = '<=';
          break;
      }
    }

    return {
      type,
      value,
      operator,
    };
  }

  private parsePropertyPattern(): any {
    const name = this.consume('IDENTIFIER', 'Expected property name').value;
    this.consume('COLON', "Expected ':' after property name");

    const value = this.parseValuePattern();

    return {
      name,
      value,
      required: true,
    };
  }

  private parseConstraint(): any {
    // For now, return a simple constraint
    const constraintText = this.consume('IDENTIFIER', 'Expected constraint').value;
    return {
      type: 'custom',
      condition: constraintText,
      parameters: {},
    };
  }

  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.peek().type === 'EOF';
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance();

    throw new Error(`${message}. Got ${this.peek().type} at position ${this.peek().position}`);
  }
}

export class QueryValidator {
  validate(query: EQLQuery): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    this.validateExpression(query.expression, errors, warnings);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private validateExpression(
    expression: LogicalExpression | PatternExpression | TaintExpression,
    errors: string[],
    warnings: string[]
  ): void {
    switch (expression.type) {
      case 'logical':
        this.validateLogicalExpression(expression, errors, warnings);
        break;
      case 'pattern':
        this.validatePatternExpression(expression, errors, warnings);
        break;
      case 'taint':
        this.validateTaintExpression(expression, errors, warnings);
        break;
    }
  }

  private validateLogicalExpression(
    expr: LogicalExpression,
    errors: string[],
    warnings: string[]
  ): void {
    if (expr.operands.length === 0) {
      errors.push('Logical expression must have at least one operand');
    }

    for (const operand of expr.operands) {
      this.validateExpression(operand.expression, errors, warnings);
    }
  }

  private validatePatternExpression(
    expr: PatternExpression,
    errors: string[],
    warnings: string[]
  ): void {
    this.validateNodePattern(expr.pattern, errors, warnings);
  }

  private validateTaintExpression(
    expr: TaintExpression,
    errors: string[],
    _warnings: string[]
  ): void {
    if (!expr.source.nodeType || expr.source.patterns.length === 0) {
      errors.push('Taint expression must have a valid source');
    }

    if (!expr.sink.nodeType || expr.sink.patterns.length === 0) {
      errors.push('Taint expression must have a valid sink');
    }
  }

  private validateNodePattern(pattern: NodePattern, errors: string[], warnings: string[]): void {
    if (!pattern.nodeType) {
      errors.push('Node pattern must specify a node type');
    }

    // Validate children recursively
    if (pattern.children) {
      for (const child of pattern.children) {
        this.validateNodePattern(child.pattern, errors, warnings);
      }
    }

    // Validate arguments recursively
    if (pattern.arguments) {
      for (const arg of pattern.arguments) {
        this.validateNodePattern(arg, errors, warnings);
      }
    }
  }
}
