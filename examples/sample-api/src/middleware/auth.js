/**
 * Authentication Middleware - SECURE CODE (for contrast)
 * This file should NOT trigger any security findings
 * 
 * Purpose: Demonstrate that VibeSec doesn't flag secure code patterns
 */

const jwt = require('jsonwebtoken');

/**
 * Secure JWT authentication middleware
 * Uses environment variables for secrets (correct pattern)
 */
function authenticateToken(req, res, next) {
  // Get token from Authorization header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Verify token using environment variable (SECURE)
  const secret = process.env.JWT_SECRET;
  
  if (!secret) {
    console.error('JWT_SECRET environment variable not set');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  jwt.verify(token, secret, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    req.user = user;
    next();
  });
}

/**
 * Secure role-based access control
 */
function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.user.role !== role) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
}

/**
 * Secure rate limiting metadata (no actual secrets)
 */
const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
};

/**
 * Input validation example (secure pattern)
 */
function validateInput(req, res, next) {
  const { username, email } = req.body;

  // Proper validation without exposing vulnerabilities
  if (!username || username.length < 3) {
    return res.status(400).json({ error: 'Username must be at least 3 characters' });
  }

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email required' });
  }

  next();
}

module.exports = {
  authenticateToken,
  requireRole,
  rateLimitConfig,
  validateInput
};
