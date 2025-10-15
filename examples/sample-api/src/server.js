/**
 * Sample Vulnerable API Server
 * WARNING: Contains intentional security vulnerabilities for testing purposes
 * DO NOT use this code in production!
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();

// VULNERABILITY #5: Insecure CORS configuration (MEDIUM severity)
// Allows requests from ANY origin, potentially exposing sensitive data
app.use(cors({ origin: '*' }));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Import routes (these contain additional vulnerabilities)
const usersRouter = require('./routes/users');
const commentsRouter = require('./routes/comments');
const filesRouter = require('./routes/files');

// Mount routes
app.use('/api/users', usersRouter);
app.use('/api/comments', commentsRouter);
app.use('/api/files', filesRouter);

// Health check endpoint (secure)
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`⚠️  WARNING: Vulnerable API running on port ${PORT}`);
  console.log('This server contains intentional security vulnerabilities.');
  console.log('For testing purposes ONLY. Do not expose to the internet!');
});

module.exports = app;
