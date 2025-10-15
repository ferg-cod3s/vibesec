// Test fixture: XSS vulnerability
// Should trigger: xss-vulnerability

const express = require('express');
const app = express();

app.get('/search', (req, res) => {
  res.send(`<h1>Results for: ${req.query.term}</h1>`);
});

app.get('/profile', (req, res) => {
  const username = req.query.name;
  document.getElementById('user').innerHTML = `Welcome ${username}`;
});

module.exports = app;
