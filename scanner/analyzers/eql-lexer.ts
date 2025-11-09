import { Token, TokenType } from './eql-types';

export class EQLLexer {
  private input: string = '';
  private position: number = 0;
  private line: number = 1;
  private column: number = 1;

  // Token specifications
  private static readonly KEYWORDS = new Map<string, TokenType>([
    ['AND', 'AND'],
    ['OR', 'OR'],
    ['NOT', 'NOT'],
    ['TAINT', 'TAINT'],
    ['SOURCE', 'SOURCE'],
    ['SINK', 'SINK'],
    ['SANITIZER', 'SANITIZER'],
    ['EXISTS', 'EXISTS'],
    ['IN', 'IN'],
    ['CONTAINS', 'CONTAINS'],
    ['STARTS_WITH', 'STARTS_WITH'],
    ['ENDS_WITH', 'ENDS_WITH'],
    ['MATCHES', 'MATCHES'],
    ['all', 'WILDCARD'],
    ['any', 'WILDCARD'],
    ['none', 'WILDCARD'],
  ]);

  private static readonly OPERATORS = new Map<string, TokenType>([
    ['==', 'EQ'],
    ['===', 'EQ'],
    ['!=', 'NEQ'],
    ['!==', 'NEQ'],
    ['>=', 'GTE'],
    ['<=', 'LTE'],
    ['>', 'GT'],
    ['<', 'LT'],
    ['=', 'EQ'],
    ['~=', 'MATCHES'],
  ]);

  tokenize(input: string): Token[] {
    this.input = input;
    this.position = 0;
    this.line = 1;
    this.column = 1;

    const tokens: Token[] = [];

    while (this.position < this.input.length) {
      const char = this.input[this.position];

      // Skip whitespace
      if (this.isWhitespace(char)) {
        this.advance();
        continue;
      }

      // Skip comments
      if (char === '#' && (this.position === 0 || this.input[this.position - 1] === '\n')) {
        this.skipComment();
        continue;
      }

      let token: Token | null = null;

      // Try different token types
      token =
        this.tryString() ||
        this.tryRegex() ||
        this.tryNumber() ||
        this.tryIdentifier() ||
        this.tryOperator() ||
        this.tryPunctuation();

      if (token) {
        tokens.push(token);
      } else {
        throw new Error(
          `Unexpected character '${char}' at line ${this.line}, column ${this.column}`
        );
      }
    }

    // Add EOF token
    tokens.push({
      type: 'EOF',
      value: '',
      position: this.position,
      line: this.line,
      column: this.column,
    });

    return tokens;
  }

  private tryString(): Token | null {
    const char = this.input[this.position];
    if (char !== '"' && char !== "'" && char !== '`') {
      return null;
    }

    const quote = char;
    const startPos = this.position;
    const startLine = this.line;
    const startColumn = this.column;
    let value = '';
    let escaped = false;

    this.advance(); // Skip opening quote

    while (this.position < this.input.length) {
      const currentChar = this.input[this.position];

      if (escaped) {
        value += currentChar;
        escaped = false;
        this.advance();
        continue;
      }

      if (currentChar === '\\') {
        escaped = true;
        this.advance();
        continue;
      }

      if (currentChar === quote) {
        this.advance(); // Skip closing quote
        return {
          type: 'STRING',
          value,
          position: startPos,
          line: startLine,
          column: startColumn,
        };
      }

      value += currentChar;
      this.advance();
    }

    throw new Error(`Unterminated string starting at line ${startLine}, column ${startColumn}`);
  }

  private tryRegex(): Token | null {
    if (this.input[this.position] !== '/') {
      return null;
    }

    const startPos = this.position;
    const startLine = this.line;
    const startColumn = this.column;
    let value = '';
    let inCharClass = false;
    let escaped = false;

    this.advance(); // Skip opening slash

    while (this.position < this.input.length) {
      const currentChar = this.input[this.position];

      if (escaped) {
        value += currentChar;
        escaped = false;
        this.advance();
        continue;
      }

      if (currentChar === '\\') {
        escaped = true;
        this.advance();
        continue;
      }

      if (currentChar === '[') {
        inCharClass = true;
      } else if (currentChar === ']') {
        inCharClass = false;
      } else if (currentChar === '/' && !inCharClass) {
        this.advance(); // Skip closing slash

        // Parse flags
        let flags = '';
        while (this.position < this.input.length && /[a-z]/.test(this.input[this.position])) {
          flags += this.input[this.position];
          this.advance();
        }

        return {
          type: 'REGEX',
          value: `/${value}/${flags}`,
          position: startPos,
          line: startLine,
          column: startColumn,
        };
      }

      value += currentChar;
      this.advance();
    }

    throw new Error(`Unterminated regex starting at line ${startLine}, column ${startColumn}`);
  }

  private tryNumber(): Token | null {
    const startPos = this.position;
    const startLine = this.line;
    const startColumn = this.column;
    let value = '';
    let hasDecimal = false;

    while (this.position < this.input.length) {
      const char = this.input[this.position];

      if (/[0-9]/.test(char)) {
        value += char;
        this.advance();
      } else if (char === '.' && !hasDecimal && value.length > 0) {
        hasDecimal = true;
        value += char;
        this.advance();
      } else {
        break;
      }
    }

    if (value === '' || value === '.') {
      // Reset position if we didn't find a valid number
      this.position = startPos;
      this.line = startLine;
      this.column = startColumn;
      return null;
    }

    return {
      type: 'NUMBER',
      value,
      position: startPos,
      line: startLine,
      column: startColumn,
    };
  }

  private tryIdentifier(): Token | null {
    const startPos = this.position;
    const startLine = this.line;
    const startColumn = this.column;
    let value = '';

    while (this.position < this.input.length) {
      const char = this.input[this.position];

      if (/[a-zA-Z0-9_$]/.test(char)) {
        value += char;
        this.advance();
      } else {
        break;
      }
    }

    if (value === '') {
      return null;
    }

    // Check if it's a keyword
    const keywordType = EQLLexer.KEYWORDS.get(value.toUpperCase());
    if (keywordType) {
      return {
        type: keywordType,
        value,
        position: startPos,
        line: startLine,
        column: startColumn,
      };
    }

    return {
      type: 'IDENTIFIER',
      value,
      position: startPos,
      line: startLine,
      column: startColumn,
    };
  }

  private tryOperator(): Token | null {
    const startPos = this.position;
    const startLine = this.line;
    const startColumn = this.column;

    // Try multi-character operators first
    const remaining = this.input.substring(this.position);
    for (const [operator, type] of EQLLexer.OPERATORS) {
      if (remaining.startsWith(operator)) {
        this.advanceBy(operator.length);
        return {
          type,
          value: operator,
          position: startPos,
          line: startLine,
          column: startColumn,
        };
      }
    }

    return null;
  }

  private tryPunctuation(): Token | null {
    const char = this.input[this.position];
    const startPos = this.position;
    const startLine = this.line;
    const startColumn = this.column;

    let type: TokenType | null = null;

    switch (char) {
      case '(':
        type = 'LPAREN';
        break;
      case ')':
        type = 'RPAREN';
        break;
      case '[':
        type = 'LBRACKET';
        break;
      case ']':
        type = 'RBRACKET';
        break;
      case '{':
        type = 'LBRACE';
        break;
      case '}':
        type = 'RBRACE';
        break;
      case ',':
        type = 'COMMA';
        break;
      case '.':
        type = 'DOT';
        break;
      case ':':
        type = 'COLON';
        break;
      case ';':
        type = 'SEMICOLON';
        break;
      case '|':
        type = 'PIPE';
        break;
      case '*':
        type = 'WILDCARD';
        break;
    }

    if (type) {
      this.advance();
      return {
        type,
        value: char,
        position: startPos,
        line: startLine,
        column: startColumn,
      };
    }

    return null;
  }

  private skipComment(): void {
    while (this.position < this.input.length && this.input[this.position] !== '\n') {
      this.advance();
    }
  }

  private isWhitespace(char: string): boolean {
    return /\s/.test(char);
  }

  private advance(): void {
    if (this.position < this.input.length) {
      if (this.input[this.position] === '\n') {
        this.line++;
        this.column = 1;
      } else {
        this.column++;
      }
      this.position++;
    }
  }

  private advanceBy(count: number): void {
    for (let i = 0; i < count; i++) {
      this.advance();
    }
  }
}
