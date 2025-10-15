// Secure API Implementation Examples
// These should NOT trigger any security vulnerabilities

const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const db = require('./db');

const app = express();

// ===== SECURE CORS CONFIGURATION =====
// Properly configured CORS with specific origins
app.use((req, res, next) => {
  const allowedOrigins = ['https://app.example.com', 'https://www.example.com'];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// ===== SECURE ERROR HANDLING =====
// Production error handler - no stack traces
app.use((err, req, res, next) => {
  // Log detailed error internally
  console.error('Internal error:', err.stack);
  
  // Send generic error to client
  res.status(err.status || 500).json({
    error: 'An error occurred processing your request',
    requestId: req.id
  });
});

// ===== PROPER ENVIRONMENT CONFIGURATION =====
const config = {
  env: process.env.NODE_ENV || 'production',
  debug: false, // Never enabled in production
  apiKey: process.env.API_KEY, // From environment, not hardcoded
  dbUrl: process.env.DATABASE_URL
};

// Security middleware
app.use(helmet());
app.use(express.json({ limit: '10kb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api/', limiter);

// ===== SECURE SQL QUERIES =====
// Using parameterized queries to prevent SQL injection
app.get('/api/users/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    // Parameterized query - safe from SQL injection
    const user = await db.query(
      'SELECT id, username, email FROM users WHERE id = ?',
      [userId]
    );
    
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ===== SECURE INPUT VALIDATION =====
app.post('/api/users', [
  body('email').isEmail().normalizeEmail(),
  body('username').isAlphanumeric().trim().isLength({ min: 3, max: 20 }),
  body('age').optional().isInt({ min: 0, max: 150 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const { email, username, age } = req.body;
  
  // Parameterized insert
  await db.query(
    'INSERT INTO users (email, username, age) VALUES (?, ?, ?)',
    [email, username, age]
  );
  
  res.status(201).json({ message: 'User created' });
});

// ===== SECURE AUTHENTICATION =====
const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
}

// ===== SECURE ADMIN ENDPOINTS =====
// Admin routes properly protected with authentication
app.get('/admin/dashboard', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  res.json({ message: 'Admin dashboard' });
});

// ===== SECURE FILE OPERATIONS =====
const path = require('path');
const fs = require('fs').promises;

app.get('/api/files/:filename', authenticateToken, async (req, res) => {
  try {
    // Sanitize filename to prevent path traversal
    const safeFilename = path.basename(req.params.filename);
    const allowedDir = path.resolve('./uploads');
    const filePath = path.join(allowedDir, safeFilename);
    
    // Verify path is within allowed directory
    if (!filePath.startsWith(allowedDir)) {
      return res.status(400).json({ error: 'Invalid file path' });
    }
    
    const content = await fs.readFile(filePath, 'utf8');
    res.send(content);
  } catch (err) {
    res.status(404).json({ error: 'File not found' });
  }
});

// ===== SECURE COMMAND EXECUTION =====
// Using allowlist instead of executing arbitrary commands
const allowedCommands = {
  backup: ['pg_dump', '-U', 'postgres', 'mydb'],
  status: ['systemctl', 'status', 'myapp']
};

app.post('/api/admin/command', authenticateToken, async (req, res) => {
  const { command } = req.body;
  
  if (!allowedCommands[command]) {
    return res.status(400).json({ error: 'Invalid command' });
  }
  
  const { spawn } = require('child_process');
  const proc = spawn(allowedCommands[command][0], allowedCommands[command].slice(1));
  
  res.json({ message: 'Command executed' });
});

module.exports = app;
