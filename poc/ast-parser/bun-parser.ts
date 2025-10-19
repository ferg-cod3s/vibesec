import Parser, { Tree, Query } from 'web-tree-sitter';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface ParseResult {
  filePath: string;
  tree: Tree;
  content: string;
  parseTimeMs: number;
}

export interface QueryMatch {
  node: any;
  captures: any[];
}

export class BunASTParser {
  private parser: Parser;
  private language: any;
  private queries: Map<string, Query> = new Map();

  constructor(parser: Parser, language: any) {
    this.parser = parser;
    this.language = language;
    this.language.setParser(parser);
  }

  static async create(): Promise<BunASTParser> {
    await Parser.init();
    const parser = new Parser();
    const JavaScript = await Parser.Language.load(
      require.resolve('web-tree-sitter/parsers/tree-sitter-javascript.wasm')
    );
    parser.setLanguage(JavaScript);
    return new BunASTParser(parser, JavaScript);
  }

  async parseFile(filePath: string): Promise<ParseResult> {
    const content = await fs.readFile(filePath, 'utf-8');
    const startTime = performance.now();
    const tree = this.parser.parse(content);
    const endTime = performance.now();

    return {
      filePath,
      tree,
      content,
      parseTimeMs: endTime - startTime,
    };
  }

  /**
   * Find function calls in the AST
   * Returns all call_expression nodes
   */
  findFunctionCalls(tree: Tree): any[] {
    const query = this.getOrCreateQuery(
      '(call_expression function: (identifier) @func)',
      'function_calls'
    );
    const matches = query.captures(tree.rootNode);
    return matches.map(m => m.node);
  }

  /**
   * Find string literals in the AST
   * Returns all string nodes
   */
  findStringLiterals(tree: Tree): any[] {
    const query = this.getOrCreateQuery(
      '(string) @str',
      'string_literals'
    );
    const matches = query.captures(tree.rootNode);
    return matches.map(m => m.node);
  }

  /**
   * Find variable declarations
   */
  findVariableDeclarations(tree: Tree): any[] {
    const query = this.getOrCreateQuery(
      '(variable_declarator name: (identifier) @var)',
      'var_declarations'
    );
    const matches = query.captures(tree.rootNode);
    return matches.map(m => m.node);
  }

  /**
   * Find template strings (potential SQL injection vectors)
   */
  findTemplateStrings(tree: Tree): any[] {
    const query = this.getOrCreateQuery(
      '(template_string) @template',
      'template_strings'
    );
    const matches = query.captures(tree.rootNode);
    return matches.map(m => m.node);
  }

  /**
   * Extract text content from a node
   */
  getNodeText(node: any, content: string): string {
    return content.substring(node.startIndex, node.endIndex);
  }

  /**
   * Get line and column information for error reporting
   */
  getNodeLocation(node: any): { line: number; column: number } {
    return {
      line: node.startPosition.row + 1,
      column: node.startPosition.column + 1,
    };
  }

  private getOrCreateQuery(queryString: string, name: string): Query {
    if (this.queries.has(name)) {
      return this.queries.get(name)!;
    }

    try {
      const query = this.language.query(queryString);
      this.queries.set(name, query);
      return query;
    } catch (error) {
      console.warn(`Failed to compile query ${name}: ${error}`);
      // Return empty query as fallback
      return { captures: () => [] } as any;
    }
  }
}

export default BunASTParser;
