// Complex SQL injection vulnerability requiring AST analysis
// This demonstrates a vulnerability where user input flows through multiple variables
// and function calls before reaching the SQL query

import express from 'express';
import mysql from 'mysql2/promise';

const app = express();
app.use(express.json());

interface User {
  id: string;
  name: string;
  email: string;
}

class DatabaseService {
  private connection: mysql.Connection;

  constructor(connection: mysql.Connection) {
    this.connection = connection;
  }

  async queryUser(userId: string): Promise<User | null> {
    // This is vulnerable - userId flows through multiple transformations
    const processedId = this.processUserId(userId);
    const sql = `SELECT * FROM users WHERE id = '${processedId}'`; // SQL injection here

    const [rows] = await this.connection.execute(sql);
    return (rows as User[])[0] || null;
  }

  private processUserId(userId: string): string {
    // Multiple transformations that an AST analyzer needs to track
    const sanitized = this.sanitizeInput(userId);
    const formatted = this.formatId(sanitized);
    return formatted;
  }

  private sanitizeInput(input: string): string {
    // This looks like sanitization but doesn't actually prevent SQL injection
    return input.replace(/['"]/g, '');
  }

  private formatId(id: string): string {
    // Another transformation step
    return id.trim().toLowerCase();
  }
}

class UserController {
  private dbService: DatabaseService;

  constructor(dbService: DatabaseService) {
    this.dbService = dbService;
  }

  async getUser(req: express.Request, res: express.Response) {
    try {
      const userId = req.params.id; // User input from URL parameter
      const user = await this.dbService.queryUser(userId); // Flows to vulnerable query

      if (user) {
        res.json(user);
      } else {
        res.status(404).json({ error: 'User not found' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

// Setup routes
const connection = await mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'myapp',
});

const dbService = new DatabaseService(connection);
const userController = new UserController(dbService);

app.get('/users/:id', userController.getUser.bind(userController));

export default app;
