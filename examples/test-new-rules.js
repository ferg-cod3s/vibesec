// Test file for new security rules
const express = require('express');
const app = express();

// Command Injection test
app.get('/exec', (req, res) => {
  const { exec } = require('child_process');
  exec(`git clone ${req.query.repo}`); // Should detect command injection
});

// Path Traversal test
app.get('/file', (req, res) => {
  const fs = require('fs');
  fs.readFile(`./uploads/${req.params.filename}`, (err, data) => {
    res.send(data); // Should detect path traversal
  });
});

// Weak Crypto test
const crypto = require('crypto');
const hash = crypto.createHash('md5').update('password').digest('hex'); // Should detect MD5
const cipher = crypto.createCipher('des', 'mykey'); // Should detect DES

// Insecure Random test
const token = Math.random().toString(36).substr(2); // Should detect weak random

// CSRF test
app.post('/transfer', (req, res) => {
  // Missing CSRF protection
  const amount = req.body.amount;
  transferMoney(amount);
});

// Missing HTTP headers
// Should detect missing CSP, X-Frame-Options, etc.

// Prototype Pollution test
app.post('/config', (req, res) => {
  const config = Object.assign({}, req.body); // Should detect unsafe merge
});

// SSRF test
app.get('/fetch', async (req, res) => {
  const response = await fetch(req.query.url); // Should detect SSRF
  const data = await response.json();
  res.json(data);
});

app.listen(3000);
