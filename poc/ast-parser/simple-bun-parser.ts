import * as fs from 'fs/promises';

export interface ParseResult {
  filePath: string;
  content: string;
  parseTimeMs: number;
  functions: string[];
  strings: string[];
  variables: string[];
  templates: string[];
}

/**
 * Simple regex-based parser for JavaScript/TypeScript
 * Provides fast, working baseline for benchmarking
 * In production, this would use tree-sitter for AST
 */
export class SimpleBunParser {
  async parseFile(filePath: string): Promise<ParseResult> {
    const startTime = performance.now();
    const content = await fs.readFile(filePath, 'utf-8');
    const endTime = performance.now();

    // Extract JavaScript patterns using regex
    const functions = this.extractFunctions(content);
    const strings = this.extractStrings(content);
    const variables = this.extractVariables(content);
    const templates = this.extractTemplates(content);

    return {
      filePath,
      content,
      parseTimeMs: endTime - startTime,
      functions,
      strings,
      variables,
      templates,
    };
  }

  private extractFunctions(content: string): string[] {
    // Match function declarations and arrow functions
    const functionPattern =
      /(?:function\s+(\w+)|const\s+(\w+)\s*=|async\s+function\s+(\w+)|export\s+(?:async\s+)?function\s+(\w+))/g;
    const matches: string[] = [];
    let match;

    while ((match = functionPattern.exec(content)) !== null) {
      const name = match[1] || match[2] || match[3] || match[4];
      if (name) matches.push(name);
    }

    return matches;
  }

  private extractStrings(content: string): string[] {
    // Match string literals (single, double, and template without interpolation)
    const stringPattern = /["'`]([^"'`\n]{0,100}?)["'`]/g;
    const matches: string[] = [];
    let match;

    while ((match = stringPattern.exec(content)) !== null) {
      matches.push(match[1]);
    }

    return matches;
  }

  private extractVariables(content: string): string[] {
    // Match variable declarations
    const varPattern = /(?:const|let|var)\s+(\w+)/g;
    const matches: string[] = [];
    let match;

    while ((match = varPattern.exec(content)) !== null) {
      matches.push(match[1]);
    }

    return matches;
  }

  private extractTemplates(content: string): string[] {
    // Match template strings (backtick strings with interpolation)
    const templatePattern = /`([^`]*\$\{[^}]*\}[^`]*)`/g;
    const matches: string[] = [];
    let match;

    while ((match = templatePattern.exec(content)) !== null) {
      matches.push(match[1].substring(0, 100)); // Limit to 100 chars
    }

    return matches;
  }
}

export default SimpleBunParser;
