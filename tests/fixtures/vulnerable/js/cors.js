// Test fixture: Over-permissive CORS
// Will need AI-specific rules (not yet created)

const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors({
  origin: '*',
  credentials: true
}));

app.get('/api/data', (req, res) => {
  res.json({ secret: 'data' });
});

module.exports = app;
