// Test fixture: SQL Injection
// Should trigger: sql-injection

const express = require('express');
const app = express();

app.get('/user', (req, res) => {
  const query = `SELECT * FROM users WHERE id = ${req.query.id}`;
  db.query(query, (err, results) => {
    res.json(results);
  });
});

app.get('/search', (req, res) => {
  const searchQuery = `SELECT * FROM products WHERE name LIKE '%${req.query.term}%'`;
  db.execute(searchQuery, (err, results) => {
    res.json(results);
  });
});

module.exports = app;
