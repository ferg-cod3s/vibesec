# Sample Vulnerable API - VibeSec Testing

This is an **intentionally vulnerable** Express.js API designed for testing VibeSec's detection capabilities. **DO NOT use this code in production!**

## Overview

This sample API demonstrates common security vulnerabilities that VibeSec should detect:

1. **SQL Injection** - Unsanitized database queries
2. **Cross-Site Scripting (XSS)** - Unescaped user input in HTML
3. **Hardcoded Secrets** - Credentials in source code
4. **Command Injection** - User input in shell commands
5. **Insecure CORS** - Overly permissive cross-origin configuration

## Structure

```
sample-api/
├── src/
│   ├── server.js           # Main server with CORS vulnerability
│   ├── routes/
│   │   ├── users.js        # SQL injection vulnerability
│   │   ├── comments.js     # XSS vulnerability
│   │   └── files.js        # Command injection vulnerability
│   ├── config/
│   │   └── database.js     # Hardcoded secrets
│   └── middleware/
│       └── auth.js         # (Secure - for contrast)
├── package.json
└── README.md
```

## Installation

```bash
cd examples/sample-api
npm install
```

## Running the API (Optional)

**Warning**: This API contains real vulnerabilities. Only run in isolated environments for testing purposes.

```bash
npm start
```

The API will start on `http://localhost:3000`

## Scanning with VibeSec

From the `sample-api` directory:

```bash
# Scan all files
vibesec scan .

# Scan with JSON output
vibesec scan . --format json

# Scan specific file
vibesec scan src/routes/users.js
```

## Expected Findings

VibeSec should detect **5 vulnerabilities**:

### 1. SQL Injection (HIGH) - `src/routes/users.js:23`
```javascript
const query = `SELECT * FROM users WHERE id = ${req.params.id}`;
```
**Issue**: User input directly concatenated into SQL query allows attackers to execute arbitrary SQL.

**Fix**: Use parameterized queries:
```javascript
const query = 'SELECT * FROM users WHERE id = ?';
db.query(query, [req.params.id]);
```

### 2. Cross-Site Scripting (HIGH) - `src/routes/comments.js:15`
```javascript
res.send(`<div>${req.body.comment}</div>`);
```
**Issue**: User input rendered in HTML without sanitization allows script injection.

**Fix**: Sanitize or escape output:
```javascript
const sanitized = escapeHtml(req.body.comment);
res.send(`<div>${sanitized}</div>`);
```

### 3. Hardcoded Secret (MEDIUM) - `src/config/database.js:5`
```javascript
const password = "MySecretP@ssw0rd123";
```
**Issue**: Credentials in source code can be exposed if code is leaked or committed to public repos.

**Fix**: Use environment variables:
```javascript
const password = process.env.DB_PASSWORD;
```

### 4. Command Injection (HIGH) - `src/routes/files.js:18`
```javascript
exec(`cat ${req.query.filename}`);
```
**Issue**: User input in shell commands allows arbitrary command execution.

**Fix**: Use safe APIs or validate input:
```javascript
const allowedFiles = ['log.txt', 'data.csv'];
if (!allowedFiles.includes(req.query.filename)) {
  return res.status(400).send('Invalid file');
}
fs.readFile(req.query.filename, callback);
```

### 5. Insecure CORS (MEDIUM) - `src/server.js:12`
```javascript
app.use(cors({ origin: '*' }));
```
**Issue**: Allows requests from any origin, potentially exposing sensitive data.

**Fix**: Restrict to specific origins:
```javascript
app.use(cors({ origin: 'https://yourdomain.com' }));
```

## Testing Notes

### True Positives
All 5 vulnerabilities above should be detected by VibeSec.

### False Negatives to Watch For
If VibeSec misses any of these, it indicates a detection gap.

### False Positives to Check
The `src/middleware/auth.js` file contains **secure** code and should **not** trigger any findings. If it does, please report as a false positive.

## Educational Value

Each vulnerability includes:
- **Code example**: The problematic pattern
- **Explanation**: Why it's vulnerable
- **Remediation**: How to fix it securely

This helps developers understand not just *what* is wrong, but *why* and *how to fix it*.

## Contrast with Secure Code

For comparison, see `examples/secure-example/` which contains similar functionality implemented securely. Scanning secure code should produce 0 findings.

## Contributing

Found issues with this sample or have suggestions? Open an issue or PR!

## License

MIT - Use for education and testing only. Never deploy vulnerable code to production.

---

**Last Updated**: 2025-01-09  
**VibeSec Version**: 0.1.0
