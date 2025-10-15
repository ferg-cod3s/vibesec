/**
 * Users Route - Contains SQL Injection Vulnerability
 * WARNING: This code is intentionally vulnerable for testing purposes
 */

const express = require('express');
const router = express.Router();

// Mock database connection (not a real DB for this example)
const db = {
  query: (sql, callback) => {
    console.log('Executing query:', sql);
    callback(null, [{ id: 1, username: 'testuser', email: 'test@example.com' }]);
  }
};

// GET /api/users/:id
// VULNERABILITY #1: SQL Injection (HIGH severity)
router.get('/:id', (req, res) => {
  // Dangerous: User input directly concatenated into SQL query
  // An attacker could pass: 1 OR 1=1 -- to dump all users
  // Or: 1; DROP TABLE users; -- to delete the entire table
  const query = `SELECT * FROM users WHERE id = ${req.params.id}`;
  
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});

// POST /api/users/search
// Another SQL injection variant
router.post('/search', (req, res) => {
  const searchTerm = req.body.username;
  
  // Also vulnerable to SQL injection through username parameter
  const query = `SELECT * FROM users WHERE username LIKE '%${searchTerm}%'`;
  
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});

// SECURE EXAMPLE (for contrast - should not trigger alerts)
router.get('/secure/:id', (req, res) => {
  // Correct: Using parameterized query
  const query = 'SELECT * FROM users WHERE id = ?';
  
  db.query(query, [req.params.id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});

module.exports = router;
