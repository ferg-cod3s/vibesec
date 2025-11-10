# VibeSec User Testing Guide

## Welcome Testers! 👋

Thank you for helping test VibeSec, a security scanner designed to make vulnerability detection accessible to developers of all skill levels. This guide will walk you through installation, usage, and what to look for during testing.

## Testing Objectives

We want to validate that VibeSec:

1. **Comprehension**: Findings are clear and actionable for junior developers
2. **Usability**: Installation and usage are straightforward
3. **Effectiveness**: Correctly identifies real vulnerabilities without overwhelming false positives
4. **Performance**: Scans complete in reasonable time (<5s for small projects)

## Prerequisites

- **Node.js**: Version 18 or higher ([Download here](https://nodejs.org/))
- **Terminal/Command Line**: Basic familiarity with running commands
- **10-15 minutes**: To complete the testing session

## Installation

### Step 1: Install VibeSec

```bash
npm install -g vibesec
```

**Verify installation:**

```bash
vibesec --version
```

You should see the version number (e.g., `0.1.0`).

### Step 2: Download Sample Vulnerable Code

We've prepared a sample API with intentional security issues for testing:

```bash
# Clone the VibeSec repository
git clone https://github.com/your-org/vibesec.git
cd vibesec/examples/sample-api
```

**OR** use your own codebase if you prefer!

## Running Your First Scan

### Basic Scan

Scan the sample vulnerable API:

```bash
vibesec scan .
```

**Expected output:** You should see a plain-text report listing several security findings.

### JSON Output

For machine-readable results:

```bash
vibesec scan . --format json
```

**Expected output:** Structured JSON with findings, metadata, and statistics.

### Scan Specific Files

```bash
vibesec scan src/routes/users.js
```

## Understanding the Output

### Plain Text Format

```
=== VibeSec Security Scan Report ===
Scan completed: 2025-01-09T10:30:45.123Z
Files scanned: 8
Total findings: 5

HIGH | SQL Injection | src/routes/users.js:23
  Database query constructed with unsanitized user input
  Code: const query = `SELECT * FROM users WHERE id = ${req.params.id}`;
  Fix: Use parameterized queries: db.query('SELECT * FROM users WHERE id = ?', [req.params.id])
```

**Key Elements:**

- **Severity**: HIGH, MEDIUM, LOW, INFO
- **Category**: Type of vulnerability (SQL Injection, XSS, etc.)
- **Location**: File path and line number
- **Description**: What the issue is
- **Code Snippet**: The problematic code
- **Remediation**: How to fix it

### JSON Format

```json
{
  "findings": [
    {
      "severity": "HIGH",
      "category": "sql-injection",
      "message": "Database query constructed with unsanitized user input",
      "file": "src/routes/users.js",
      "line": 23,
      "code": "const query = `SELECT * FROM users WHERE id = ${req.params.id}`;",
      "remediation": "Use parameterized queries..."
    }
  ],
  "metadata": {
    "timestamp": "2025-01-09T10:30:45.123Z",
    "filesScanned": 8,
    "totalFindings": 5
  }
}
```

## Sample Vulnerable Code Walkthrough

The `examples/sample-api` project contains several intentional vulnerabilities:

### 1. SQL Injection (HIGH)

**File**: `src/routes/users.js`

```javascript
const query = `SELECT * FROM users WHERE id = ${req.params.id}`;
```

**Why it's vulnerable**: User input directly concatenated into SQL query.

### 2. Cross-Site Scripting (HIGH)

**File**: `src/routes/comments.js`

```javascript
res.send(`<div>${req.body.comment}</div>`);
```

**Why it's vulnerable**: User input rendered without sanitization.

### 3. Hardcoded Secrets (MEDIUM)

**File**: `src/config/database.js`

```javascript
const password = 'MySecretP@ssw0rd123';
```

**Why it's vulnerable**: Credentials should be in environment variables.

### 4. Command Injection (HIGH)

**File**: `src/routes/files.js`

```javascript
exec(`cat ${req.query.filename}`);
```

**Why it's vulnerable**: User input passed to shell command.

### 5. Insecure CORS (MEDIUM)

**File**: `src/server.js`

```javascript
app.use(cors({ origin: '*' }));
```

**Why it's vulnerable**: Allows requests from any origin.

## What to Test

### ✅ Checklist

1. **Installation**
   - [ ] Installation completed without errors
   - [ ] `vibesec --version` works
   - [ ] `vibesec scan --help` shows usage info

2. **Basic Scanning**
   - [ ] Scan completes in <5 seconds
   - [ ] All 5 vulnerabilities detected
   - [ ] No false positives on secure code
   - [ ] Output is readable and clear

3. **Finding Comprehension**
   - [ ] Severity levels make sense
   - [ ] Descriptions are clear
   - [ ] Code snippets are helpful
   - [ ] Remediation advice is actionable

4. **Output Formats**
   - [ ] Plain text is easy to read
   - [ ] JSON is properly formatted
   - [ ] JSON can be parsed by tools (e.g., `jq`)

5. **Usability**
   - [ ] Commands are intuitive
   - [ ] Error messages are helpful
   - [ ] Documentation is sufficient

## Troubleshooting

### Issue: `vibesec: command not found`

**Solution**: Ensure npm global bin directory is in your PATH:

```bash
npm config get prefix
# Add <prefix>/bin to your PATH
export PATH="$(npm config get prefix)/bin:$PATH"
```

### Issue: `EACCES: permission denied`

**Solution**: Install with proper permissions:

```bash
sudo npm install -g vibesec
# OR use a node version manager like nvm
```

### Issue: No findings detected

**Checklist**:

- Are you scanning the correct directory?
- Does the directory contain JavaScript or Python files?
- Try scanning the sample-api: `vibesec scan examples/sample-api`

### Issue: Too many false positives

**This is important feedback!** Please note:

- Which files triggered false positives
- Why you believe they're false positives
- Include in the feedback form

## Next Steps

After completing your testing session:

1. **Fill out the feedback form**: [User Feedback Form Link]
2. **Share your scan results**: Include JSON output if possible
3. **Report bugs**: Open issues on GitHub for any problems
4. **Suggest improvements**: We want to hear your ideas!

## Sample Testing Script

Run these commands in sequence and note any issues:

```bash
# 1. Verify installation
vibesec --version
vibesec --help

# 2. Scan sample API
cd examples/sample-api
vibesec scan .

# 3. Test JSON output
vibesec scan . --format json > results.json
cat results.json | jq '.findings | length'

# 4. Test single file scan
vibesec scan src/routes/users.js

# 5. Test on secure code
cd ../secure-example
vibesec scan .  # Should find 0 vulnerabilities
```

## Questions or Issues?

- **Email**: security@vibesec.dev
- **GitHub Issues**: https://github.com/your-org/vibesec/issues
- **Discord**: [Community Server Link]

## Thank You! 🙏

Your feedback is invaluable in making VibeSec better for developers everywhere. We appreciate your time and insights!

---

**Estimated Testing Time**: 10-15 minutes  
**Version**: 0.1.0  
**Last Updated**: 2025-01-09
