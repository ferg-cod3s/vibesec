/**
 * Demo Example: SQL Injection Vulnerability
 *
 * This file demonstrates a common vulnerability pattern in AI-generated code:
 * SQL query concatenation with user input
 */

import express from 'express';

const app = express();

// VULNERABLE: SQL Injection via string concatenation
app.get('/users', (req, res) => {
  const name = req.query.name as string;

  // This allows SQL injection attacks
  const query = `SELECT * FROM users WHERE name = '${name}'`;

  // Simulated database query
  console.log('Executing:', query);

  res.json({ message: 'Query executed' });
});

// VULNERABLE: Command injection
app.post('/convert', (req, res) => {
  const filename = req.body.filename;

  // This allows command injection
  const command = `convert ${filename} output.png`;

  console.log('Executing:', command);

  res.json({ message: 'Conversion started' });
});

// TODO: Add authentication
// AI often generates this placeholder without implementation
app.post('/admin', (req, res) => {
  // Missing authentication check!
  res.json({ sensitive: 'data' });
});

export default app;
