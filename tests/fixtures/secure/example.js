// Secure JavaScript code - no vulnerabilities
// This file should NOT trigger any security warnings

const express = require('express');
const app = express();

// Secure database query with parameterization
app.get('/user/:id', async (req, res) => {
  const userId = req.params.id;
  // Using parameterized query
  const result = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
  res.json(result);
});

// Secure environment variable usage
const apiKey = process.env.API_KEY;
const dbPassword = process.env.DB_PASSWORD;

// Proper input validation
function validateUsername(username) {
  const allowedPattern = /^[a-zA-Z0-9_]{3,20}$/;
  return allowedPattern.test(username);
}

// Secure command execution with validation
const { execFile } = require('child_process');

function processFile(filename) {
  // Validate input first
  if (!validateFilename(filename)) {
    throw new Error('Invalid filename');
  }
  // Use execFile instead of exec for safety
  execFile('cat', [filename], (error, stdout) => {
    console.log(stdout);
  });
}

// Proper error handling without exposing internals
app.use((err, req, res, next) => {
  console.error(err); // Log internally
  res.status(500).json({ message: 'Internal server error' }); // Generic message
});

module.exports = app;
