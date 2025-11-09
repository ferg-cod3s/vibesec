import { EnhancedASTParser } from '../../src/ast/enhanced-ast-parser';

describe('EnhancedASTParser', () => {
  let parser: EnhancedASTParser;

  beforeEach(() => {
    parser = new EnhancedASTParser();
  });

  describe('Enhanced Node Types', () => {
    it('should extract CallExpr nodes with arguments', () => {
      const code = `
        const userId = req.params.id;
        db.query('SELECT * FROM users WHERE id = ?', [userId]);
        fetch(userUrl);
      `;

      const ast = parser.parseContent(code, 'javascript');
      const callExprs = ast.filter((node) => node.type === 'CallExpr');

      expect(callExprs).toHaveLength(2);

      // Check db.query call
      const dbQuery = callExprs.find((node) => node.name === 'db.query');
      expect(dbQuery).toBeDefined();
      expect(dbQuery?.arguments).toHaveLength(2);
      expect(dbQuery?.arguments?.[0].content).toContain('SELECT * FROM users');
      expect(dbQuery?.arguments?.[1].content).toBe('[userId]');

      // Check fetch call
      const fetchCall = callExprs.find((node) => node.name === 'fetch');
      expect(fetchCall).toBeDefined();
      expect(fetchCall?.arguments).toHaveLength(1);
      expect(fetchCall?.arguments?.[0].content).toBe('userUrl');
    });

    it('should extract TemplateLiteral nodes with expressions', () => {
      const code = `
        const userId = req.params.id;
        const sql = \`SELECT * FROM users WHERE id = \${userId}\`;
        const message = \`User \${userId} logged in at \${new Date()}\`;
      `;

      const ast = parser.parseContent(code, 'javascript');
      const templates = ast.filter((node) => node.type === 'TemplateLiteral');

      expect(templates).toHaveLength(2);

      // Check SQL template
      const sqlTemplate = templates.find((node) => node.content?.includes('SELECT'));
      expect(sqlTemplate).toBeDefined();
      expect(sqlTemplate?.value).toContain('SELECT * FROM users WHERE id =');
      expect(sqlTemplate?.children).toHaveLength(1);
      expect(sqlTemplate?.children?.[0].name).toBe('userId');

      // Check message template
      const messageTemplate = templates.find((node) => node.content?.includes('User'));
      expect(messageTemplate).toBeDefined();
      expect(messageTemplate?.children).toHaveLength(2);
      expect(messageTemplate?.children?.[0].name).toBe('userId');
      expect(messageTemplate?.children?.[1].name).toBe('new Date()');
    });

    it('should extract BinaryExpr nodes with operators', () => {
      const code = `
        const result = a + b;
        const comparison = x > 5;
        const complex = y * 2;
      `;

      const ast = parser.parseContent(code, 'javascript');
      const binaryExprs = ast.filter((node) => node.type === 'BinaryExpr');

      expect(binaryExprs.length).toBeGreaterThanOrEqual(2);

      // Check addition
      const addition = binaryExprs.find((node) => node.operator === '+');
      expect(addition).toBeDefined();
      expect(addition?.children).toHaveLength(2);
      expect(addition?.children?.[0].name).toBe('a');
      expect(addition?.children?.[1].name).toBe('b');

      // Check comparison
      const comparison = binaryExprs.find((node) => node.operator === '>');
      expect(comparison).toBeDefined();
      expect(comparison?.children?.[0].name).toBe('x');
      expect(comparison?.children?.[1].name).toBe('5');

      // Check multiplication
      const multiplication = binaryExprs.find((node) => node.operator === '*');
      expect(multiplication).toBeDefined();
      expect(multiplication?.children?.[0].name).toBe('y');
      expect(multiplication?.children?.[1].name).toBe('2');
    });

    it('should maintain backward compatibility with existing node types', () => {
      const code = `
        function getUser(id) {
          return db.findUser(id);
        }
        
        class UserService {
          constructor() {}
        }
        
        import express from 'express';
        
        const config = require('./config');
      `;

      const ast = parser.parseContent(code, 'javascript');

      // Should still extract FunctionDecl
      const functions = ast.filter((node) => node.type === 'FunctionDecl');
      expect(functions.length).toBeGreaterThan(0);
      expect(functions[0].name).toBe('getUser');

      // Should still extract ClassDecl
      const classes = ast.filter((node) => node.type === 'ClassDecl');
      expect(classes).toHaveLength(1);
      expect(classes[0].name).toBe('UserService');

      // Should still extract Import
      const imports = ast.filter((node) => node.type === 'Import');
      expect(imports).toHaveLength(1);

      // Should still extract Assignment
      const assignments = ast.filter((node) => node.type === 'Assignment');
      expect(assignments.length).toBeGreaterThan(0);
    });
  });

  describe('Enhanced Node Properties', () => {
    it('should include enhanced fields in AST nodes', () => {
      const code = `fetch(url);`;
      const ast = parser.parseContent(code, 'javascript');
      const callExpr = ast.find((node) => node.type === 'CallExpr');

      expect(callExpr).toBeDefined();
      expect(callExpr?.arguments).toBeDefined();
      expect(callExpr?.name).toBe('fetch');
      expect(callExpr?.line).toBeGreaterThan(0);
      expect(callExpr?.column).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Multi-language Support', () => {
    it('should parse TypeScript with enhanced nodes', () => {
      const code = `
        interface User {
          id: number;
          name: string;
        }
        
        async function getUser(id: number): Promise<User> {
          return await db.query(\`SELECT * FROM users WHERE id = \${id}\`);
        }
      `;

      const ast = parser.parseContent(code, 'typescript');
      expect(ast.length).toBeGreaterThan(0);

      // Should find function declaration
      const functions = ast.filter((node) => node.type === 'FunctionDecl');
      expect(functions.length).toBeGreaterThan(0);

      // Should find template literal
      const templates = ast.filter((node) => node.type === 'TemplateLiteral');
      expect(templates.length).toBeGreaterThan(0);
    });

    it('should parse Python with basic nodes', () => {
      const code = `
        def get_user(user_id):
            query = f"SELECT * FROM users WHERE id = {user_id}"
            return db.execute(query)
      `;

      const ast = parser.parseContent(code, 'python');
      expect(ast.length).toBeGreaterThan(0);

      // Should find function definition
      const functions = ast.filter((node) => node.type === 'FunctionDecl');
      expect(functions.length).toBeGreaterThan(0);
      expect(functions[0].name).toBe('get_user');
    });

    it('should parse Go with basic nodes', () => {
      const code = `
        func GetUser(id int) (*User, error) {
            query := fmt.Sprintf("SELECT * FROM users WHERE id = %d", id)
            return db.Query(query)
        }
      `;

      const ast = parser.parseContent(code, 'go');
      expect(ast.length).toBeGreaterThan(0);

      // Should find function declaration
      const functions = ast.filter((node) => node.type === 'FunctionDecl');
      expect(functions.length).toBeGreaterThan(0);
      expect(functions[0].name).toBe('GetUser');
    });
  });

  describe('Performance', () => {
    it('should parse files within performance targets', async () => {
      const code = `
        // Complex JavaScript file with multiple patterns
        function processData(data) {
          const sql = \`INSERT INTO logs VALUES ('\${data}')\`;
          db.query(sql);
          fetch(\`/api/process/\${data}\`);
          return result + processed;
        }
      `;

      const start = performance.now();
      const ast = parser.parseContent(code, 'javascript');
      const parseTime = performance.now() - start;

      expect(ast.length).toBeGreaterThan(10); // Should extract many nodes
      expect(parseTime).toBeLessThan(5); // Should be very fast
    });
  });
});
