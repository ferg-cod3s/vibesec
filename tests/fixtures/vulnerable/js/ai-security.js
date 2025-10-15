// Test fixture: AI-Specific Security Issues
// This file contains common vulnerabilities in AI-generated code

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const app = express();

// VULNERABILITY 1: Overly permissive CORS (permissive-cors)
app.use(cors({
  origin: '*',
  credentials: true
}));

// VULNERABILITY 2: Debug mode enabled (debug-mode-enabled)
app.use(morgan('dev'));

// Alternative CORS vulnerability
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', '*');
  next();
});

// VULNERABILITY 3: Verbose error responses (verbose-error-response)
app.use((err, req, res, next) => {
  console.error('Error occurred:', err.stack);
  res.status(500).json({
    error: err.message,
    stack: err.stack, // Exposing stack trace
    details: err
  });
});

// VULNERABILITY 4: Exposed admin endpoint (exposed-admin-endpoint)
app.get('/admin/users', async (req, res) => {
  const users = await db.getAllUsers();
  res.json(users);
});

// Another unprotected admin route
app.post('/admin/config', (req, res) => {
  updateConfig(req.body);
  res.json({ success: true });
});

// Unprotected dashboard
app.get('/dashboard', (req, res) => {
  res.json({ stats: getSystemStats() });
});

// Error handler that exposes internals
app.get('/api/process', (req, res) => {
  try {
    processData(req.query.input);
    res.json({ success: true });
  } catch (err) {
    res.send(err.stack); // Another verbose error
  }
});

module.exports = app;
