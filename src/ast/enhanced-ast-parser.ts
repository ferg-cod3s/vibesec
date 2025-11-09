import { readFile } from 'fs/promises';

export interface ASTNode {
  type: string;
  name?: string;
  line: number;
  column: number;
  content: string;
  children: ASTNode[];
  // Enhanced fields for advanced analysis
  parent?: ASTNode;
  scope?: string; // function/module scope identifier
  value?: any; // literal values (strings, numbers, booleans)
  operator?: string; // for binary expressions
  arguments?: ASTNode[]; // for function calls
  properties?: Record<string, ASTNode>; // for object properties
  endLine?: number;
  endColumn?: number;
}

export class EnhancedASTParser {
  async parseFile(filePath: string): Promise<{ ast: ASTNode[]; parseTimeMs: number }> {
    const start = performance.now();
    const content = await readFile(filePath, 'utf-8');
    const ext = filePath.split('.').pop()?.toLowerCase();

    let language = 'javascript';
    if (ext === 'ts' || ext === 'tsx') language = 'typescript';
    else if (ext === 'py') language = 'python';
    else if (ext === 'go') language = 'go';

    const ast = this.parseContent(content, language);
    const parseTimeMs = performance.now() - start;

    return { ast, parseTimeMs };
  }

  private findMatchingParen(content: string, start: number): number {
    let depth = 1;
    let i = start + 1; // Start after the opening paren
    while (i < content.length && depth > 0) {
      if (content[i] === '(') depth++;
      else if (content[i] === ')') depth--;
      i++;
    }
    return i; // Return position after the closing paren
  }

  private extractArguments(argsContent: string, line: number): ASTNode[] {
    const args: ASTNode[] = [];
    if (!argsContent.trim()) return args;

    // Better argument parsing that handles nested structures
    let depth = 0;
    let current = '';
    let inString = false;
    let stringChar = '';

    for (let i = 0; i < argsContent.length; i++) {
      const char = argsContent[i];

      if (!inString && (char === '"' || char === "'" || char === '`')) {
        inString = true;
        stringChar = char;
        current += char;
      } else if (inString && char === stringChar) {
        inString = false;
        stringChar = '';
        current += char;
      } else if (!inString && (char === '(' || char === '[' || char === '{')) {
        depth++;
        current += char;
      } else if (!inString && (char === ')' || char === ']' || char === '}')) {
        depth--;
        current += char;
      } else if (!inString && char === ',' && depth === 0) {
        const arg = current.trim();
        if (arg) {
          args.push({
            type: 'Identifier',
            name: arg,
            line,
            column: 0,
            content: arg,
            children: [],
          });
        }
        current = '';
      } else {
        current += char;
      }
    }

    // Add the last argument
    const lastArg = current.trim();
    if (lastArg) {
      args.push({
        type: 'Identifier',
        name: lastArg,
        line,
        column: 0,
        content: lastArg,
        children: [],
      });
    }

    return args;
  }

  parseContent(content: string, language: string): ASTNode[] {
    switch (language) {
      case 'javascript':
      case 'typescript':
        return this.extractJavaScript(content);
      case 'python':
        return this.extractPython(content);
      case 'go':
        return this.extractGo(content);
      default:
        return [];
    }
  }

  private extractJavaScript(content: string): ASTNode[] {
    const nodes: ASTNode[] = [];

    // Function declarations
    const funcRegex = /^\s*(export\s+)?(async\s+)?function\s+(\w+)\s*\(/gm;
    let match: RegExpExecArray | null;
    while ((match = funcRegex.exec(content)) !== null) {
      const line = content.substring(0, match.index).split('\n').length;
      nodes.push({
        type: 'FunctionDecl',
        name: match[3],
        line,
        column: match.index - content.lastIndexOf('\n', match.index),
        content: match[0],
        children: [],
      });
    }

    // Arrow functions
    const arrowRegex = /^\s*(export\s+)?(const|let|var)\s+(\w+)\s*=\s*(async\s+)?\([^)]*\)\s*=>/gm;
    while ((match = arrowRegex.exec(content)) !== null) {
      const line = content.substring(0, match.index).split('\n').length;
      nodes.push({
        type: 'FunctionDecl',
        name: match[3],
        line,
        column: match.index - content.lastIndexOf('\n', match.index),
        content: match[0],
        children: [],
      });
    }

    // Class declarations
    const classRegex = /^\s*(export\s+)?class\s+(\w+)/gm;
    while ((match = classRegex.exec(content)) !== null) {
      const line = content.substring(0, match.index).split('\n').length;
      nodes.push({
        type: 'ClassDecl',
        name: match[2],
        line,
        column: match.index - content.lastIndexOf('\n', match.index),
        content: match[0],
        children: [],
      });
    }

    // Imports
    const importRegex = /^\s*import\s+.+\s+from\s+['"][^'"]+['"]/gm;
    while ((match = importRegex.exec(content)) !== null) {
      const line = content.substring(0, match.index).split('\n').length;
      nodes.push({
        type: 'Import',
        line,
        column: match.index - content.lastIndexOf('\n', match.index),
        content: match[0],
        children: [],
      });
    }

    // Variable assignments
    const assignRegex = /^\s*(export\s+)?(const|let|var)\s+(\w+)\s*=/gm;
    while ((match = assignRegex.exec(content)) !== null) {
      const line = content.substring(0, match.index).split('\n').length;
      if (!nodes.some((n) => n.line === line && n.type === 'FunctionDecl')) {
        nodes.push({
          type: 'Assignment',
          name: match[3],
          line,
          column: match.index - content.lastIndexOf('\n', match.index),
          content: match[0],
          children: [],
        });
      }
    }

    // Function calls (CallExpr) - Enhanced AST node type
    const callRegex = /(\w+(?:\.\w+)*)\s*\(/g;
    let callMatch: RegExpExecArray | null;
    while ((callMatch = callRegex.exec(content)) !== null) {
      const line = content.substring(0, callMatch.index).split('\n').length;
      const funcName = callMatch[1];

      // Extract arguments for the function call
      const argsStart = callMatch.index + callMatch[0].length - 1; // Position of opening paren
      const argsEnd = this.findMatchingParen(content, argsStart);
      const argsContent = content.substring(argsStart + 1, argsEnd - 1); // Exclude parentheses
      const args = this.extractArguments(argsContent, line);

      nodes.push({
        type: 'CallExpr',
        name: funcName,
        line,
        column: callMatch.index - content.lastIndexOf('\n', callMatch.index),
        content: callMatch[0] + argsContent + ')',
        arguments: args,
        children: [],
      });
    }

    // Template literals - Enhanced AST node type
    const templateRegex = /`([^`]*)`/g;
    let templateMatch: RegExpExecArray | null;
    while ((templateMatch = templateRegex.exec(content)) !== null) {
      const line = content.substring(0, templateMatch.index).split('\n').length;
      const templateContent = templateMatch[1];

      // Extract expressions from template
      const expressions: ASTNode[] = [];
      const exprRegex = /\$\{([^}]+)\}/g;
      let exprMatch: RegExpExecArray | null;
      while ((exprMatch = exprRegex.exec(templateContent)) !== null) {
        expressions.push({
          type: 'Identifier',
          name: exprMatch[1].trim(),
          line,
          column: templateMatch.index + exprMatch.index,
          content: exprMatch[0],
          children: [],
        });
      }

      nodes.push({
        type: 'TemplateLiteral',
        value: templateContent,
        line,
        column: templateMatch.index - content.lastIndexOf('\n', templateMatch.index),
        content: templateMatch[0],
        children: expressions,
      });
    }

    // Binary expressions - Enhanced AST node type (excluding assignment operators)
    const binaryRegex =
      /([a-zA-Z_$][a-zA-Z0-9_$]*)\s*([+\-*/<>!&|^]+)\s*([a-zA-Z0-9_$"'[\]{}().]+)/g;
    let binaryMatch: RegExpExecArray | null;
    while ((binaryMatch = binaryRegex.exec(content)) !== null) {
      const line = content.substring(0, binaryMatch.index).split('\n').length;
      const leftOperand = binaryMatch[1].trim();
      const operator = binaryMatch[2].trim();
      let rightOperand = binaryMatch[3].trim();

      // Extract just the first term from the right operand
      const rightMatch = rightOperand.match(
        /^([a-zA-Z_$][a-zA-Z0-9_$]*|\d+|"[^"]*"|'[^']*'|`[^`]*`|\[[^\]]*\]|\([^)]*\))/
      );
      if (rightMatch) {
        rightOperand = rightMatch[1];
      }

      // Skip if this looks like an assignment or part of a string
      if (operator === '=' || leftOperand.includes('"') || leftOperand.includes("'")) {
        continue;
      }

      nodes.push({
        type: 'BinaryExpr',
        operator: operator,
        line,
        column: binaryMatch.index - content.lastIndexOf('\n', binaryMatch.index),
        content: binaryMatch[0],
        children: [
          {
            type: 'Identifier',
            name: leftOperand,
            line,
            column: binaryMatch.index - content.lastIndexOf('\n', binaryMatch.index),
            content: leftOperand,
            children: [],
          },
          {
            type: 'Identifier',
            name: rightOperand,
            line,
            column: binaryMatch.index + leftOperand.length + operator.length + 2,
            content: rightOperand,
            children: [],
          },
        ],
      });
    }

    // Member expressions (property access) - Enhanced AST node type
    const memberRegex = /([a-zA-Z_$][a-zA-Z0-9_$]*)(\.[a-zA-Z_$][a-zA-Z0-9_$]*)+/g;
    let memberMatch: RegExpExecArray | null;
    while ((memberMatch = memberRegex.exec(content)) !== null) {
      const line = content.substring(0, memberMatch.index).split('\n').length;
      const fullExpression = memberMatch[0];

      // Split into object and property parts
      const parts = fullExpression.split('.');
      const object = parts[0];
      const property = parts[parts.length - 1];

      nodes.push({
        type: 'MemberExpr',
        name: fullExpression,
        line,
        column: memberMatch.index - content.lastIndexOf('\n', memberMatch.index),
        content: fullExpression,
        properties: {
          object: {
            type: 'Identifier',
            name: object,
            line,
            column: memberMatch.index - content.lastIndexOf('\n', memberMatch.index),
            content: object,
            children: [],
          },
          property: {
            type: 'Identifier',
            name: property,
            line,
            column: memberMatch.index + object.length + 1,
            content: property,
            children: [],
          },
        },
        children: [],
      });
    }

    // Return statements - Enhanced AST node type
    const returnRegex = /^\s*return\s+([^;]+)/gm;
    let returnMatch: RegExpExecArray | null;
    while ((returnMatch = returnRegex.exec(content)) !== null) {
      const line = content.substring(0, returnMatch.index).split('\n').length;
      const returnValue = returnMatch[1].trim();

      nodes.push({
        type: 'ReturnStmt',
        value: returnValue,
        line,
        column: returnMatch.index - content.lastIndexOf('\n', returnMatch.index),
        content: returnMatch[0],
        children: [
          {
            type: 'Identifier',
            name: returnValue,
            line,
            column: returnMatch.index + 7, // After "return "
            content: returnValue,
            children: [],
          },
        ],
      });
    }

    return nodes;
  }

  private extractPython(content: string): ASTNode[] {
    const nodes: ASTNode[] = [];

    // Function definitions
    const funcRegex = /^\s*def\s+(\w+)\s*\(/gm;
    let match: RegExpExecArray | null;
    while ((match = funcRegex.exec(content)) !== null) {
      const line = content.substring(0, match.index).split('\n').length;
      nodes.push({
        type: 'FunctionDecl',
        name: match[1],
        line,
        column: match.index - content.lastIndexOf('\n', match.index),
        content: match[0],
        children: [],
      });
    }

    // Class definitions
    const classRegex = /^\s*class\s+(\w+)/gm;
    while ((match = classRegex.exec(content)) !== null) {
      const line = content.substring(0, match.index).split('\n').length;
      nodes.push({
        type: 'ClassDecl',
        name: match[1],
        line,
        column: match.index - content.lastIndexOf('\n', match.index),
        content: match[0],
        children: [],
      });
    }

    // Imports
    const importRegex = /^\s*(from\s+\S+\s+)?import\s+.+/gm;
    while ((match = importRegex.exec(content)) !== null) {
      const line = content.substring(0, match.index).split('\n').length;
      nodes.push({
        type: 'Import',
        line,
        column: match.index - content.lastIndexOf('\n', match.index),
        content: match[0],
        children: [],
      });
    }

    // Assignments
    const assignRegex = /^\s*(\w+)\s*=/gm;
    while ((match = assignRegex.exec(content)) !== null) {
      const line = content.substring(0, match.index).split('\n').length;
      if (
        !nodes.some((n) => n.line === line && (n.type === 'FunctionDecl' || n.type === 'ClassDecl'))
      ) {
        nodes.push({
          type: 'Assignment',
          name: match[1],
          line,
          column: match.index - content.lastIndexOf('\n', match.index),
          content: match[0],
          children: [],
        });
      }
    }

    return nodes;
  }

  private extractGo(content: string): ASTNode[] {
    const nodes: ASTNode[] = [];

    // Function declarations
    const funcRegex = /^\s*func\s+(\w+)\s*\(/gm;
    let match: RegExpExecArray | null;
    while ((match = funcRegex.exec(content)) !== null) {
      const line = content.substring(0, match.index).split('\n').length;
      nodes.push({
        type: 'FunctionDecl',
        name: match[1],
        line,
        column: match.index - content.lastIndexOf('\n', match.index),
        content: match[0],
        children: [],
      });
    }

    // Method declarations
    const methodRegex = /^\s*func\s+\([^)]+\)\s+(\w+)\s*\(/gm;
    while ((match = methodRegex.exec(content)) !== null) {
      const line = content.substring(0, match.index).split('\n').length;
      nodes.push({
        type: 'FunctionDecl',
        name: match[1],
        line,
        column: match.index - content.lastIndexOf('\n', match.index),
        content: match[0],
        children: [],
      });
    }

    // Type/Struct declarations
    const typeRegex = /^\s*type\s+(\w+)\s+(struct|interface)/gm;
    while ((match = typeRegex.exec(content)) !== null) {
      const line = content.substring(0, match.index).split('\n').length;
      nodes.push({
        type: 'ClassDecl',
        name: match[1],
        line,
        column: match.index - content.lastIndexOf('\n', match.index),
        content: match[0],
        children: [],
      });
    }

    // Imports
    const importRegex = /^\s*import\s+(\([\s\S]*?\)|"[^"]+"|`[^`]+`)/gm;
    while ((match = importRegex.exec(content)) !== null) {
      const line = content.substring(0, match.index).split('\n').length;
      nodes.push({
        type: 'Import',
        line,
        column: match.index - content.lastIndexOf('\n', match.index),
        content: match[0],
        children: [],
      });
    }

    // Variable declarations
    const varRegex = /^\s*(var|const)\s+(\w+)/gm;
    while ((match = varRegex.exec(content)) !== null) {
      const line = content.substring(0, match.index).split('\n').length;
      nodes.push({
        type: 'Assignment',
        name: match[2],
        line,
        column: match.index - content.lastIndexOf('\n', match.index),
        content: match[0],
        children: [],
      });
    }

    return nodes;
  }
}
