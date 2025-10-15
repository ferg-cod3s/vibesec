// Vulnerable Authentication Implementation
// Should trigger: weak-password-validation, missing-rate-limiting, insecure-session-config, missing-jwt-verification

const express = require('express');
const jwt = require('jsonwebtoken');
const app = express();

// Issue 1: Weak password validation
function isValidPassword(password) {
  // Only checking if length is greater than 5 - too weak!
  if (password.length < 6) {
    return false;
  }
  return true;
}

// Issue 2: Missing rate limiting on login endpoint
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  
  if (!isValidPassword(password)) {
    return res.status(400).json({ error: 'Invalid password' });
  }
  
  const user = await db.findUser(username, password);
  
  if (user) {
    // Issue 3: Insecure session cookie - missing httpOnly, secure, sameSite
    res.cookie('sessionId', user.sessionToken);
    
    // Issue 4: JWT decoded without verification
    const tokenData = jwt.decode(user.token);
    
    res.json({ success: true, user: tokenData });
  } else {
    res.status(401).json({ error: 'Authentication failed' });
  }
});

// Another weak password check
function validateUserPassword(pwd) {
  return pwd.length >= 4; // Even weaker!
}

module.exports = { isValidPassword, validateUserPassword };
