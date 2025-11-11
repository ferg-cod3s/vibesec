# Quick Start Guide - VibeSec

**Welcome!** This guide will help you run your first security scan with VibeSec in under 5 minutes.

No security expertise required. VibeSec speaks plain language.

---

## 📋 What You'll Learn

By the end of this guide, you'll know how to:

1. Install VibeSec on your machine
2. Run your first security scan
3. Understand the results
4. Generate reports for stakeholders
5. Fix common security issues

---

## 🎯 Who This Guide Is For

- **Product Managers** - Understand security risks in your product
- **Designers** - Check if your prototypes have security issues
- **Non-Technical Founders** - Assess code security before launch
- **Developers** - Get security feedback quickly
- **Anyone using AI** to generate code

---

## ⚡ Quick Install

### Option 1: npm (Most Common)

```bash
npm install -g vibesec
```

### Option 2: Bun (Recommended for POC)

```bash
# Install Bun first (if not installed)
curl -fsSL https://bun.sh/install | bash

# Install VibeSec
bun install -g vibesec
```

### Verify Installation

```bash
vibesec --version
# Should show: 0.1.0 or higher
```

---

## 🚀 Your First Scan

### Step 1: Navigate to Your Project

```bash
cd /path/to/your/project
```

### Step 2: Run a Basic Scan

```bash
vibesec scan .
```

**What happens:**

- VibeSec scans all code files in the current directory
- Looks for security vulnerabilities
- Shows results in your terminal

**Example output:**

```
✔ Scan complete!

══════════════════════════════════════════════════════════════════════
               VibeSec Security Scan Results
══════════════════════════════════════════════════════════════════════

🔴 CRITICAL Issues: 2
🟡 HIGH Issues: 3
🟢 MEDIUM Issues: 1
⚪ LOW Issues: 0

💡 Next steps:
   1. Fix critical issues immediately
   2. Run scan again after making fixes
```

---

## 🗣️ Using Plain Language Mode

**Best for non-technical users!**

```bash
vibesec scan --explain
```

### What Changes?

Instead of technical jargon like "CWE-798" or "SQL Injection", you'll see:

✅ **Clear explanations** in everyday language
✅ **Real-world analogies** (e.g., "like leaving your door unlocked")
✅ **Time estimates** for each fix (e.g., "15-30 minutes")
✅ **Who can fix it** (e.g., "Any developer" or "Backend developer")
✅ **Security score** out of 100

### Example Plain Language Output

```
🚨 [1] Urgent - Fix Today

Found:
Hardcoded API Key Detected in config/database.js:9

What this means:
API keys should be stored in environment variables, not hardcoded in source code.
Exposed credentials can be used by attackers to access your API.

Think of this like having a password written on a sticky note on your monitor.

Why it matters:
High risk of data breach, legal liability, and financial loss

If this code is shared (GitHub, email, etc.), anyone who sees it can:
  • Use your API keys and credentials
  • Rack up charges on your accounts
  • Access your private data

How to fix:
Move the API key to an environment variable using process.env or equivalent

Practical details:
• Time needed: 10-15 minutes
• Who can fix: Any developer
• Priority: immediately
```

---

## 📊 Understanding Your Security Score

When you use `--explain`, you'll see a security score:

```
Security Score:
  85/100 (B) - Good
  Your score is 5 points above the average for small projects (avg: 80/100)
```

### What the Scores Mean

| Score  | Grade | Meaning                              |
| ------ | ----- | ------------------------------------ |
| 98-100 | A+    | Excellent - Outstanding security     |
| 90-97  | A     | Very Good - Strong security posture  |
| 80-89  | B     | Good - Some improvements needed      |
| 70-79  | C     | Fair - Security needs attention      |
| 60-69  | D     | Poor - Significant concerns          |
| 0-59   | F     | Critical - Immediate action required |

### How Scores Are Calculated

VibeSec deducts points based on severity:

- **Critical issue** = -25 points
- **High issue** = -10 points
- **Medium issue** = -5 points
- **Low issue** = -2 points

**Example:** If you have 2 critical issues and 1 high issue:

- Start: 100 points
- 2 critical × 25 = -50 points
- 1 high × 10 = -10 points
- **Final score: 40/100 (F)**

---

## 📈 Generating Stakeholder Reports

Need to present security status to your boss, board, or investors?

### Generate Executive Report

```bash
vibesec scan -f stakeholder -o security-report.txt
```

This creates a board-ready report with:

- ✅ Executive summary
- ✅ Security score with benchmark
- ✅ Risk assessment (HIGH/MODERATE/LOW)
- ✅ Business impact analysis
- ✅ Remediation cost estimates
- ✅ No technical jargon

### What the Report Looks Like

```
══════════════════════════════════════════════════════════════════════
           SECURITY ASSESSMENT REPORT
══════════════════════════════════════════════════════════════════════

EXECUTIVE SUMMARY
──────────────────────────────────────────────────────────────────────

Project: myapp
Assessment Date: 10/10/2025
Files Analyzed: 42
Analysis Duration: 0.3 seconds

SECURITY SCORE
──────────────────────────────────────────────────────────────────────

Overall Score: 75/100 (C)
Security Rating: Fair

Benchmark: Your score is 5 points below the average for medium projects

RISK ASSESSMENT
──────────────────────────────────────────────────────────────────────

Risk Level: MODERATE

The codebase has some security concerns that should be addressed.
Prioritize fixing high-severity issues to reduce potential security risks.

BUSINESS IMPACT
──────────────────────────────────────────────────────────────────────

Potential Risks if Unaddressed:
  • MODERATE RISK: Vulnerabilities exploitable by attackers
  • Potential for data exposure or unauthorized access
  • Compliance concerns depending on industry
  • Increased attack surface

Cost of Remediation:
  Estimated engineering time: 3-9 hours
```

**Pro Tip:** Email this report to stakeholders or paste it into presentation slides.

---

## 🎨 Accessibility Features

### Disable Colors

Some terminals don't support colors well, or you may be using a screen reader.

```bash
# Option 1: Use the flag
vibesec scan --no-color

# Option 2: Set environment variable
NO_COLOR=1 vibesec scan .
```

This removes all color codes, making output friendly for:

- Screen readers
- Terminals without color support
- Screen recording tools
- Copy/paste into documentation

---

## 🔧 Common Scanning Options

### Scan Specific Directory

```bash
vibesec scan ./src
```

### Filter by Severity

```bash
# Only show critical issues
vibesec scan --severity critical

# Show critical and high
vibesec scan --severity high

# Show everything (default)
vibesec scan --severity low
```

### Save Output to File

```bash
# Plain text report
vibesec scan -o report.txt

# JSON format (for tooling)
vibesec scan -f json -o report.json

# Stakeholder report
vibesec scan -f stakeholder -o board-report.txt
```

### Exclude Files

```bash
vibesec scan --exclude node_modules tests
```

### Include Only Specific Files

```bash
vibesec scan --include "*.js" "*.ts"
```

---

## 🛠️ What to Do When Issues Are Found

### Step 1: Prioritize by Severity

1. **Critical (🚨)** - Fix TODAY
   - Hardcoded secrets
   - SQL injection
   - Command injection

2. **High (⚠️)** - Fix THIS WEEK
   - XSS vulnerabilities
   - Insecure authentication
   - CORS misconfigurations

3. **Medium (📋)** - Fix THIS MONTH
   - Missing rate limiting
   - Incomplete error handling

4. **Low (ℹ️)** - Fix WHEN CONVENIENT
   - Best practice improvements
   - Code quality issues

### Step 2: Share with Your Team

```bash
# Generate developer-friendly report
vibesec scan --explain -o fixes-needed.txt

# Share the file with your developer
# They'll see exactly what to fix and how
```

### Step 3: Verify Fixes

After your developer makes changes:

```bash
vibesec scan --explain

# You should see:
# ✅ Fewer issues
# ✅ Higher security score
# ✅ Green checkmarks for resolved items
```

---

## 💡 Real-World Examples

### Example 1: PM Checking AI-Generated Code

**Scenario:** Your AI tool generated a user registration endpoint. Is it secure?

```bash
# Scan the generated code
vibesec scan src/auth --explain

# Look for:
# 🚨 Hardcoded passwords or keys
# ⚠️ Missing input validation
# 📋 Weak authentication patterns
```

**Result:** Found 3 issues. Shared report with engineer. Fixed in 45 minutes.

### Example 2: Founder Preparing for Investor Demo

**Scenario:** Investor asks about security. You need a report.

```bash
# Generate stakeholder report
vibesec scan -f stakeholder -o investor-report.txt

# Email the report showing:
# ✅ 95/100 security score
# ✅ Only 2 low-severity issues
# ✅ 1 hour estimated fix time
```

**Result:** Investor impressed by proactive security approach.

### Example 3: Designer Checking Prototype Code

**Scenario:** You coded a simple prototype with AI help. Want to ensure it's safe before sharing.

```bash
vibesec scan prototype/ --explain

# Found issues:
# 🚨 API key exposed in code
# ⚠️ No input sanitization
```

**Action:** Fixed both issues following the "How to fix" instructions. Score improved from 40/100 to 95/100.

---

## 🎓 Understanding Common Issues

### Hardcoded Secrets

**What it is:** Passwords, API keys, or tokens written directly in code

**Why it matters:** Anyone with access to code can steal your credentials

**How to fix:** Use environment variables

```javascript
// ❌ BAD
const apiKey = 'sk_live_1234567890';

// ✅ GOOD
const apiKey = process.env.API_KEY;
```

### SQL Injection

**What it is:** User input directly in database queries

**Why it matters:** Attackers can read/modify/delete your data

**How to fix:** Use parameterized queries

```javascript
// ❌ BAD
const query = `SELECT * FROM users WHERE id = ${userId}`;

// ✅ GOOD
const query = 'SELECT * FROM users WHERE id = ?';
db.query(query, [userId]);
```

### XSS (Cross-Site Scripting)

**What it is:** User input displayed without sanitization

**Why it matters:** Attackers can inject malicious scripts

**How to fix:** Sanitize all user input

```javascript
// ❌ BAD
res.send(`<div>${userInput}</div>`);

// ✅ GOOD
const sanitized = escapeHtml(userInput);
res.send(`<div>${sanitized}</div>`);
```

---

## 🆘 Getting Help

### Something Not Working?

1. **Check the version:**

   ```bash
   vibesec --version
   ```

2. **View all options:**

   ```bash
   vibesec scan --help
   ```

3. **Run with verbose output:**
   ```bash
   vibesec scan --explain
   ```

### Common Issues

**"vibesec: command not found"**

- Solution: Install VibeSec first: `npm install -g vibesec`

**"Cannot find path"**

- Solution: Check you're in the right directory: `pwd`

**"No files to scan"**

- Solution: Make sure you're in a code directory with .js/.ts files

**Colors not working**

- Solution: Use `--no-color` flag

---

## 🎯 Next Steps

After completing this guide, you can:

1. **Explore Advanced Features**
   - [API Documentation](API.md) - Integrate VibeSec into your workflow
   - [Tech Stack](TECH_STACK.md) - Understand the implementation

2. **Learn More About Security**
   - [Detection Rules](DETECTION_RULES.md) - What VibeSec looks for
   - [OWASP Top 10](https://owasp.org/www-project-top-ten/) - Common vulnerabilities

3. **Contribute**
   - [Contributing Guide](CONTRIBUTING.md) - Help improve VibeSec
   - Report issues on [GitHub](https://github.com/vibesec/vibesec)

---

## 📚 Quick Reference Card

Save this for future reference:

```bash
# Basic scan
vibesec scan .

# Plain language (recommended for non-technical users)
vibesec scan --explain

# Stakeholder report
vibesec scan -f stakeholder -o report.txt

# Critical issues only
vibesec scan --severity critical

# No colors (for screen readers)
vibesec scan --no-color

# Save to file
vibesec scan -o results.txt

# Get help
vibesec scan --help
```

---

## 🎉 You're Ready!

Congratulations! You now know how to:

- ✅ Run security scans
- ✅ Read plain language reports
- ✅ Generate stakeholder reports
- ✅ Understand security scores
- ✅ Fix common security issues

**Questions?** Check the [complete documentation](INDEX.md) or ask your development team.

**Happy scanning!** 🛡️

---

**Built with ❤️ for the vibe coding community**
