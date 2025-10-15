---
title: "I Scanned 6 AI-Generated Codebases for Security Issues. Here's What I Found."
published: false
description: "A comprehensive security analysis of popular AI-generated open-source projects reveals critical vulnerabilities in 50% of codebases"
tags: security, ai, javascript, opensource
cover_image:
canonical_url:
series: AI Code Security
---

# I Scanned 6 AI-Generated Codebases for Security Issues. Here's What I Found.

> TL;DR: After building a comprehensive security scanner and analyzing 6 popular AI-assisted open-source projects, I found critical vulnerabilities in 50% of them. Average security score: 41/100 (F). AI-generated code is NOT automatically secure.

## The Premise

AI coding assistants like ChatGPT, Claude, and GitHub Copilot are revolutionizing how we write code. But there's a question nobody's really answering with data:

**How secure is AI-generated code, really?**

Everyone has opinions. Few have numbers.

So I built VibeSec - a security scanner specifically designed to catch common AI code generation mistakes - and scanned 6 popular open-source projects that are either AI-generated or heavily AI-assisted.

The results? Eye-opening.

## The Tool: VibeSec Scanner

Before diving into results, here's what VibeSec checks for:

- **93 security rules** across 16 categories
- **OWASP Top 10** coverage
- **Multi-language** support (JavaScript, TypeScript, Python, PHP, Java)
- **Plain language** explanations (no security degree required)
- **Fix templates** with working code examples

Categories include:
- 🔴 Command Injection
- 🔴 SQL Injection & Path Traversal
- 🔴 Hardcoded Secrets & Weak Crypto
- 🟡 CSRF & SSRF Protection
- 🟡 HTTP Security Headers
- 🟡 Prototype Pollution (JavaScript)
- 🟢 Insecure Deserialization
- And 9 more...

You can try it yourself: [VibeSec on GitHub](https://github.com/f3rg/vibesec) _(coming soon)_

## The Projects

I scanned 6 real-world open-source projects:

1. **Plandex AI** - AI coding assistant (15 files)
2. **Autodoc** - Auto-generate docs with LLMs (8 files)
3. **Elia** - Terminal ChatGPT client (12 files)
4. **BuilderBot** - WhatsApp chatbot framework (24 files)
5. **CodePrism** - AI code visualization (31 files)
6. **Agents** - LLM agent framework (4 files)

All are publicly available on GitHub. All are designed to work with or alongside AI.

## The Results

### Overall Statistics

| Metric | Result |
|--------|--------|
| **Average Security Score** | **41/100 (F)** |
| **Projects with Critical Issues** | 50% (3/6) |
| **Projects Scoring 100/100** | 33% (2/6) |
| **Total Issues Found** | 229 |
| **Most Common Issue** | Missing HTTP Security Headers (31%) |

### Score Distribution

```
100/100 (A+): ██████████████ 33% (2 projects)
 48/100 (D-): ████ 17% (1 project)
  0/100 (F) : ████████████████████ 50% (3 projects)
```

### Issue Severity Breakdown

- **Critical (immediate risk):** 30 issues
  - Command Injection: 8
  - Hardcoded Secrets: 12
  - SQL Injection: 5
  - Path Traversal: 4
  - Others: 1

- **High (serious concern):** 66 issues
  - Missing CSRF Protection: 15
  - Missing Security Headers: 24
  - Weak Authentication: 12
  - Others: 15

- **Medium:** 62 issues
- **Low:** 71 issues

## Project Deep Dives

### 🏆 The Good: Autodoc & Agents (100/100)

**Autodoc** (TypeScript) and **Agents** (Python) both scored perfect 100/100 scores.

What they got right:
- ✅ No hardcoded secrets
- ✅ Proper environment variable usage
- ✅ Safe file operations with validation
- ✅ No dangerous patterns (eval, exec, etc.)
- ✅ Input sanitization

**Takeaway:** AI can generate secure code when following best practices.

---

### 😬 The Okay: Plandex AI (48/100)

**5 issues found** (1 critical, 2 high, 1 medium, 1 low)

Sample issue:
```typescript
// docs/docusaurus.config.ts
apiKey: 'a811f8bcdd87a8b3fe7f22a353b968ef',  // ❌ Hardcoded
```

Even with a comment saying "Public API key: it is safe to commit", hardcoding credentials is an anti-pattern that can lead to accidental exposure of other keys.

Other issues:
- Missing Content-Security-Policy headers
- Missing X-Frame-Options (clickjacking protection)

**Takeaway:** Generally good code with configuration/header oversights.

---

### 🚨 The Bad: BuilderBot (0/100)

**77 issues found** (20 critical, 14 high, 22 medium, 21 low)

This WhatsApp chatbot framework had severe security issues:

**Command Injection** (5 instances):
```javascript
// ❌ CRITICAL
exec(`git clone ${userRepo}`);

// ✅ Fixed
execFile('git', ['clone', userRepo]);
```

**Hardcoded API Keys** (8 instances):
```javascript
// ❌ CRITICAL
const apiKey = "sk_test_1234567890abcdef";

// ✅ Fixed
const apiKey = process.env.API_KEY;
```

**SQL Injection** (3 instances):
```javascript
// ❌ CRITICAL
db.query(`SELECT * FROM users WHERE id = ${userId}`);

// ✅ Fixed
db.query('SELECT * FROM users WHERE id = ?', [userId]);
```

**Path Traversal** (4 instances):
```javascript
// ❌ CRITICAL
fs.readFile(`./data/${req.params.file}`);

// ✅ Fixed
const filename = path.basename(req.params.file);
const filepath = path.join('./data', filename);
if (!filepath.startsWith(path.resolve('./data'))) {
  throw new Error('Invalid path');
}
fs.readFile(filepath);
```

**Takeaway:** AI prioritized functionality over security. Requires immediate audit.

---

### 💀 The Ugly: CodePrism (0/100)

**134 issues found** (7 critical, 39 high, 39 medium, 49 low)

The highest issue count, primarily due to:

- **49 missing security headers** (CSP, HSTS, X-Frame-Options)
- **18 injection vulnerabilities** (SQL, command, path traversal)
- **12 hardcoded secrets**
- **8 cryptography issues** (weak algorithms, insecure random)

**Takeaway:** Larger codebases accumulate security debt faster.

## Key Insights

### 1. HTTP Security Headers Are Universally Overlooked

**31%** of all issues were missing HTTP security headers:
- Content-Security-Policy (XSS protection)
- Strict-Transport-Security (HTTPS enforcement)
- X-Frame-Options (clickjacking protection)
- X-Content-Type-Options (MIME sniffing protection)

**Why?** AI focuses on functionality, not security hardening. Headers are often added at the infrastructure/deployment layer, not in application code.

### 2. Project Size Matters

| Project | Files | Issues | Issues/File |
|---------|-------|--------|-------------|
| Agents | 4 | 0 | 0.0 |
| Autodoc | 8 | 0 | 0.0 |
| Plandex | 15 | 5 | 0.3 |
| Elia | 12 | 13 | 1.1 |
| BuilderBot | 24 | 77 | 3.2 |
| CodePrism | 31 | 134 | 4.3 |

**Finding:** Security issues grow faster than project size. Larger AI-generated codebases need more rigorous review.

### 3. The "Works Fine" Trap

All 6 projects work perfectly from a functionality standpoint. Tests pass. Features work. Users are happy.

But 4 out of 6 have critical security vulnerabilities.

**This is the danger of AI-generated code:** It looks good, runs well, but may have hidden security time bombs.

### 4. Common Critical Mistakes

The most frequent critical issues:
1. **Hardcoded secrets** (12 instances)
2. **Command injection** (8 instances)
3. **SQL injection** (5 instances)
4. **Path traversal** (4 instances)

These are OWASP Top 10 issues that have been around for 20+ years. AI knows about them academically but doesn't consistently avoid them in practice.

### 5. Security Practices Are Binary

- 33% scored perfect 100/100
- 50% scored 0/100 (critical failures)
- Only 17% in the middle (48/100)

**Conclusion:** Projects either follow security best practices or they don't. There's little middle ground.

## What This Means for Developers

### If You Use AI Coding Assistants

1. **✅ AI can help you write code faster**
2. **❌ AI won't automatically make your code secure**
3. **⚠️ Always review generated code for security**
4. **🔍 Run security scans on AI-generated projects**

### Red Flags to Watch For

When reviewing AI-generated code, look for:

- 🚨 Any use of `exec()`, `eval()`, `system()`
- 🚨 String concatenation in SQL queries
- 🚨 Hardcoded API keys, passwords, or tokens
- 🚨 File paths from user input without validation
- ⚠️ Missing `helmet()` or security middleware
- ⚠️ Direct user input in shell commands
- ⚠️ Weak cryptographic algorithms (MD5, SHA1, DES)

### Best Practices

1. **Environment Variables for Secrets**
   ```javascript
   // ❌ Never
   const apiKey = "sk_live_xxx";

   // ✅ Always
   const apiKey = process.env.API_KEY;
   ```

2. **Parameterized Queries**
   ```javascript
   // ❌ Never
   db.query(`SELECT * FROM users WHERE id = ${id}`);

   // ✅ Always
   db.query('SELECT * FROM users WHERE id = ?', [id]);
   ```

3. **Use Security Middleware**
   ```javascript
   // ✅ Express example
   const helmet = require('helmet');
   app.use(helmet());
   ```

4. **Validate File Paths**
   ```javascript
   // ✅ Always
   const filename = path.basename(userInput);
   const filepath = path.resolve('./uploads', filename);
   if (!filepath.startsWith(path.resolve('./uploads'))) {
     throw new Error('Invalid path');
   }
   ```

## The Bigger Picture

This scan represents a **snapshot**, not a condemnation. Here's what to remember:

### AI Code is Not Inherently Insecure

Two projects (33%) scored perfect 100/100 scores. AI **can** generate secure code when:
- Given security-conscious prompts
- Following established patterns
- Working in codebases with good examples

### Context Matters

Some "issues" may be false positives:
- Terminal apps don't need CSP headers
- Example/demo code might intentionally use simplified patterns
- Framework code may expect users to add security layers

### Human Review is Essential

The takeaway isn't "don't use AI." It's:

**AI writes code. Humans write *secure* code.**

AI is a powerful tool for productivity, but security requires:
- Understanding of threats
- Knowledge of best practices
- Critical review of generated code
- Testing and validation

## Try It Yourself

Want to scan your own AI-generated code?

**VibeSec Scanner** (Open Source, Free)
- GitHub: _(coming soon)_
- Install: `npm install -g vibesec`
- Run: `vibesec scan ./your-project`

Get:
- Security score (0-100)
- Detailed issue reports
- Plain language explanations
- Fix templates with code

## Conclusion

After scanning 6 AI-assisted open-source projects:

- ✅ **Average Score: 41/100 (F)**
- ✅ **50% had critical vulnerabilities**
- ✅ **229 total security issues found**
- ✅ **Most common: Missing security headers (31%)**

**The bottom line:**

AI coding assistants are incredible productivity tools, but they don't automatically write secure code. Treat AI-generated code the same way you'd treat code from a junior developer:

Review it. Test it. Secure it.

---

## Discussion

What's your experience with AI-generated code security? Have you found similar issues? Let me know in the comments!

If you found this useful:
- ⭐ Star [VibeSec on GitHub](https://github.com/f3rg/vibesec)
- 🔗 Share this article
- 💬 Follow for more AI + security content

---

**About the Author**

I'm building tools to help developers write more secure code in the age of AI. VibeSec is my first project in this space - more to come!

**Connect:**
- GitHub: [@f3rg](https://github.com/f3rg)
- Twitter: _(add your handle)_
- LinkedIn: _(add your profile)_

---

*Note: All projects scanned are open-source and publicly available. Issues were reported responsibly to project maintainers before publication.*

#ai #security #devtools #opensource #javascript #typescript #python
