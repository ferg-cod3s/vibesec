# VibeSec Comprehensive Demo Script

**Duration:** 5-7 minutes  
**Target Audience:** Developers, security engineers, AI enthusiasts  
**Goal:** Showcase ALL VibeSec functionality in action

---

## Scene 1: Hook & Problem Statement (0:00-0:30)

**Visual:** Terminal with code editor showing vulnerable code

**Script:**

> "I just asked Claude to build me an API endpoint. It generated perfect-looking code in seconds. But there's a problem - it's full of security vulnerabilities."

**Action:**

1. Show vulnerable-api.ts in editor
2. Highlight the SQL injection vulnerability on line 17
3. Highlight the command injection vulnerability on line 30
4. Highlight the TODO comment (incomplete implementation) on line 35

**Visual Effect:** Zoom in on problematic lines with red highlighting

---

## Scene 2: VibeSec Overview (0:30-1:00)

**Visual:** Terminal showing VibeSec help command

**Script:**

> "This is VibeSec - a security scanner built specifically for AI-generated code. It detects 20+ vulnerability patterns that AI assistants commonly miss."

**Action:**

```bash
$ npx vibesec --help
```

**Show output:**

```
VibeSec - Security Scanner for AI-Generated Code

Usage: vibesec <command> [options]

Commands:
  scan          Scan files/directories for vulnerabilities
  list-rules    Show all detection rules
  init          Initialize VibeSec configuration

Options:
  --format      Output format (json, plain, plaintext, stakeholder)
  --severity    Minimum severity to report (low, medium, high, critical)
  --quiet       Suppress non-error output
  --version     Show version

Examples:
  vibesec scan .
  vibesec scan src/ --format json
  vibesec list-rules
```

---

## Scene 3: List All Detection Rules (1:00-1:45)

**Visual:** Terminal showing all 20 detection rule categories

**Script:**

> "Let me show you all the vulnerability patterns VibeSec can detect. That's 20 different rule categories."

**Action:**

```bash
$ vibesec list-rules
```

**Show output with all categories:**

```
┌─ VibeSec Detection Rules ─────────────────────────────────────────┐
│                                                                    │
│ 🔑 SECRETS & CREDENTIALS (6 rules)                               │
│   • Hardcoded API Keys                                            │
│   • Database Passwords                                             │
│   • Private Keys & Certificates                                   │
│   • JWT Secrets                                                   │
│   • AWS Credentials                                                │
│   • OAuth Tokens                                                  │
│                                                                    │
│ 💉 INJECTION VULNERABILITIES (4 rules)                           │
│   • SQL Injection                                                 │
│   • Command Injection                                              │
│   • XSS/Template Injection                                        │
│   • Eval Code Injection                                           │
│                                                                    │
│ 🔐 AUTHENTICATION & AUTHORIZATION (4 rules)                      │
│   • Missing Authentication                                        │
│   • Weak Password Validation                                      │
│   • Insecure Session Management                                   │
│   • Authorization Bypass Patterns                                 │
│                                                                    │
│ 📁 PATH & FILE ISSUES (3 rules)                                 │
│   • Path Traversal                                                │
│   • Unsafe File Operations                                        │
│   • Insecure File Permissions                                     │
│                                                                    │
│ 🌐 WEB SECURITY (5 rules)                                        │
│   • Missing CORS Headers                                          │
│   • Missing CSP Headers                                            │
│   • Missing HSTS Headers                                          │
│   • CSRF Protection Missing                                       │
│   • Clickjacking Vulnerability                                    │
│                                                                    │
│ 🔒 CRYPTO & ENCODING (2 rules)                                  │
│   • Insecure Cryptography                                         │
│   • Weak Hashing Functions                                        │
│                                                                    │
│ ⚠️ INCOMPLETE IMPLEMENTATIONS (1 rule)                           │
│   • TODO/FIXME Left in Code                                       │
│   • Placeholder Functions                                         │
│   • Stub Implementations                                          │
│                                                                    │
│ 🤖 AI-SPECIFIC RISKS (1 rule)                                   │
│   • Prompt Injection Vulnerabilities                              │
│   • Hallucinated API Calls                                        │
│   • Over-Permissive Defaults                                      │
│                                                                    │
│ 🔗 DEPENDENCY ISSUES (1 rule)                                   │
│   • Known Vulnerable Dependencies                                 │
│   • Deprecated Packages                                            │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘

Total: 20 rule categories covering 50+ specific patterns
```

**Script:**

> "Now let's scan some real vulnerable code to see VibeSec in action."

---

## Scene 4: Full Project Scan (1:45-3:15)

**Visual:** Terminal showing comprehensive scan results

**Script:**

> "Here's the demo-examples directory with intentionally vulnerable code. Let's scan it with VibeSec."

**Action:**

```bash
$ vibesec scan demo-examples/
```

**Show output:**

```
VibeSec Security Scanner
========================

📂 Scanning: demo-examples/
  Files found: 3
  Starting scan...

  ✓ vulnerable-api.ts
  ✓ vulnerable-auth.ts
  ✓ vulnerable-secrets.ts

Scan Complete! 52 vulnerabilities found

┌─ Summary ─────────────────────────────────────────┐
│                                                   │
│ Critical:  13  🔴                                │
│ High:      26  🟠                                │
│ Medium:     1  🟡                                │
│ Low:       12  🔵                                │
│                                                   │
│ Total:     52  ⚠️                                │
│                                                   │
│ Scan took: 0.665 seconds                         │
│ Processing speed: ~3000 lines/second             │
└───────────────────────────────────────────────────┘

By Category:
  • injection (SQL, Command)     : 4 critical
  • web-security (Headers, CORS) : 19 issues
  • auth (Missing, Weak)         : 4 critical
  • secrets (Hardcoded)          : 6 critical
  • incomplete (TODO/FIXME)      : 4 issues
  • ai-specific (Prompt inject)  : 1 issue
  • headers (Security)           : 14 issues
```

**Script:**

> "VibeSec found 52 vulnerabilities including 13 critical issues. Let me show you what each one is."

---

## Scene 5: Detail - SQL Injection (3:15-3:50)

**Visual:** Close-up of SQL injection findings

**Script:**

> "First up: SQL Injection. VibeSec found this vulnerability where user input is directly concatenated into a SQL query."

**Action:**

```bash
$ vibesec scan demo-examples/vulnerable-api.ts --severity critical
```

**Show specific finding:**

```
CRITICAL: SQL Injection Detected [ast-sql-injection]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: demo-examples/vulnerable-api.ts
Line: 17

Vulnerable Code:
  15 |
  16 |   // This allows SQL injection attacks
→ 17 |   const query = `SELECT * FROM users WHERE name = '${name}'`;
  18 |
  19 |   // Simulated database query

Issue:
  SQL injection vulnerabilities detected in query construction.
  The query concatenates user input directly into SQL.
  An attacker could inject: ' OR '1'='1
  This would expose all users in the database.

Recommendation:
  Use parameterized queries or prepared statements instead of string concatenation.

Fix:
  const query = 'SELECT * FROM users WHERE name = ?';
  db.query(query, [name], callback);

References:
  • https://owasp.org/www-community/attacks/SQL_Injection
  • CWE-89: SQL Injection
  • OWASP A03:2021 – Injection
```

---

## Scene 6: Detail - Hardcoded Secrets (3:50-4:20)

**Visual:** Close-up of secrets findings

**Script:**

> "Next: hardcoded API keys and credentials. VibeSec detected multiple exposed secrets in the configuration file."

**Action:**

```bash
$ vibesec scan demo-examples/vulnerable-secrets.ts
```

**Show specific findings:**

```
CRITICAL: Hardcoded API Key Detected [secrets]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: demo-examples/vulnerable-secrets.ts
Line: 5

Vulnerable Code:
  3 | export const config = {
  4 |   // OpenAI API key exposed
→ 5 |   apiKey: 'sk-1234567890abcdefghijklmnopqrstuvwxyz',
  6 |

Issue:
  API key exposed in source code. If this is committed to GitHub,
  attackers can use it to access your API and incur costs.

Recommendation:
  Move to environment variables.

Fix:
  apiKey: process.env.OPENAI_API_KEY || '',

  Then in .env:
  OPENAI_API_KEY=sk-actual-key-here

───────────────────────────────────────────────────

CRITICAL: Database Password Exposed [secrets]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: demo-examples/vulnerable-secrets.ts
Line: 9

Vulnerable Code:
  8 |   database: {
  9 |     user: 'admin',
→ 10 |    password: 'admin123',
  11 |    database: 'production',

Issue:
  Database password exposed in source code.
  Production database is now accessible to anyone with code access.

Recommendation:
  Use environment variables for database credentials.

Fix:
  password: process.env.DB_PASSWORD || '',

───────────────────────────────────────────────────

CRITICAL: JWT Secret Exposed [secrets]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: demo-examples/vulnerable-secrets.ts
Line: 16

Vulnerable Code:
  15 |   jwt: {
→ 16 |     secret: 'my-super-secret-key',
  17 |     expiresIn: '1h',

Issue:
  JWT secret key exposed in source code.
  Attackers can forge valid JWT tokens and impersonate any user.

Recommendation:
  Store JWT secret in environment variables.

Fix:
  secret: process.env.JWT_SECRET || 'default-secret',
```

---

## Scene 7: Detail - Incomplete Implementations (4:20-4:45)

**Visual:** Close-up of AI-specific findings

**Script:**

> "Here's something unique to VibeSec: AI-specific patterns. VibeSec found TODO comments that were never implemented - a common AI mistake."

**Action:**

```bash
$ vibesec scan demo-examples/vulnerable-api.ts --format json | grep -A 10 "incomplete"
```

**Show finding:**

```
MEDIUM: Incomplete Implementation [incomplete]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: demo-examples/vulnerable-api.ts
Line: 35

Vulnerable Code:
  34 |
  35 | // TODO: Add authentication
  36 | // AI often generates this placeholder without implementation
  37 | app.post('/admin', (req, res) => {
  38 |   // Missing authentication check!
  39 |   res.json({ sensitive: 'data' });
  40 | });

Issue:
  TODO/FIXME comments indicate incomplete implementations.
  This endpoint has no authentication, leaving sensitive data exposed.
  AI frequently generates these placeholders that never get completed.

Recommendation:
  Implement the authentication middleware before deployment.

Fix:
  app.post('/admin', authMiddleware, (req, res) => {
    // Now properly authenticated
    res.json({ sensitive: 'data' });
  });
```

---

## Scene 8: Authentication Issues (4:45-5:15)

**Visual:** Close-up of auth findings

**Script:**

> "VibeSec also detects weak authentication patterns. Look at this insecure password validation - it's far too permissive."

**Action:**

```bash
$ vibesec scan demo-examples/vulnerable-auth.ts --severity critical
```

**Show findings:**

```
CRITICAL: Missing Authentication [auth]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: demo-examples/vulnerable-auth.ts
Line: 9

Vulnerable Code:
  8 | app.get('/admin/users', (req, res) => {
  9 |   // TODO: Add authentication
  10 |   // This is a common AI-generated placeholder
→ 11 |   res.json({ users: ['admin', 'user1', 'user2'] });
  12 | });

Issue:
  Admin endpoint exposed without authentication.
  Sensitive user data is accessible to anyone.

───────────────────────────────────────────────────

CRITICAL: Weak Password Validation [auth]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: demo-examples/vulnerable-auth.ts
Line: 18

Vulnerable Code:
  17 | app.post('/register', (req, res) => {
  18 |   const { username, password } = req.body;
  19 |   if (password.length < 3) {
  20 |     return res.status(400).json({ error: 'Password too short' });
  21 |   }

Issue:
  Password requires only 3 characters with no complexity requirements.
  Passwords like "abc" are accepted.
  No uppercase, numbers, or special character requirements.
  Missing: common password check, hashing, rate limiting.

Recommendation:
  Implement strong password requirements.
```

---

## Scene 9: JSON Output Format (5:15-5:45)

**Visual:** Terminal showing JSON output

**Script:**

> "VibeSec supports multiple output formats. Here's the JSON format, perfect for integrating with CI/CD pipelines or IDEs."

**Action:**

```bash
$ vibesec scan demo-examples/vulnerable-api.ts --format json | jq '.findings[0]'
```

**Show output:**

```json
{
  "id": "ast-sql-injection-1762721750675-rt6gzivry",
  "rule": "ast-sql-injection",
  "severity": "critical",
  "category": "injection",
  "title": "SQL Injection Detected",
  "description": "SQL injection vulnerabilities detected in query construction",
  "location": {
    "file": "demo-examples/vulnerable-api.ts",
    "line": 17,
    "column": 17
  },
  "snippet": "→   17 |   const query = `SELECT * FROM users WHERE name = '${name}'`;",
  "fix": {
    "recommendation": "Use parameterized queries or prepared statements",
    "before": "const query = `SELECT * FROM users WHERE name = '${name}'`;",
    "references": [
      "https://owasp.org/www-community/attacks/SQL_Injection",
      "https://cwe.mitre.org/data/definitions/89.html"
    ]
  },
  "metadata": {
    "confidence": 0.9,
    "cwe": "CWE-89",
    "owasp": "A03:2021"
  }
}
```

**Script:**

> "Each finding includes the vulnerability ID, severity, location, code snippet, recommendations, and OWASP/CWE references."

---

## Scene 10: MCP Integration Demo (5:45-6:30)

**Visual:** Claude Code interface showing MCP tool integration

**Script:**

> "Now here's where VibeSec gets really powerful: MCP integration. It works directly inside Claude Code."

**Action - In Claude Code:**

**User asks Claude:**

> "Can you scan demo-examples/vulnerable-api.ts for security issues using VibeSec?"

**Claude responds:**

> "I'll scan that file for security vulnerabilities using VibeSec."

**Claude calls tool:** `vibesec_scan` with parameters:

```json
{
  "path": "demo-examples/vulnerable-api.ts",
  "severity": "all"
}
```

**Claude receives response and provides analysis:**

> "I found 3 critical vulnerabilities in this file:

> 1. **SQL Injection** (Line 17) - The query concatenates user input directly into SQL. An attacker could inject malicious SQL code.
>    Fix: Use parameterized queries: `const query = 'SELECT * FROM users WHERE name = ?';`

> 2. **Command Injection** (Line 30) - The filename is passed unsanitized to a shell command. An attacker could inject shell commands.
>    Fix: Use `execFile` with arguments array instead of template string.

> 3. **Incomplete Implementation** (Line 35) - The /admin endpoint has a TODO comment but no authentication implemented, leaving sensitive data exposed.
>    Fix: Add authentication middleware before this endpoint goes to production."

**Script:**

> "Claude is using VibeSec as a tool, just like it uses web search or file reading. No separate scanning step needed."

---

## Scene 11: Performance & Accuracy (6:30-7:00)

**Visual:** Terminal showing performance metrics

**Script:**

> "VibeSec is fast and accurate. It processes over 3000 lines of code per second with less than 2% false positives."

**Action:**

```bash
$ time vibesec scan examples/large-project/ --format json | tail -5
```

**Show output:**

```
{
  "scan": {
    "path": "examples/large-project/",
    "filesScanned": 247,
    "totalLines": 45892,
    "duration": 1.234,
    "processingSpeed": 37286,
    "timestamp": "2025-11-09T21:00:00.000Z"
  }
}

real    0m1.234s
user    0m1.456s
sys     0m0.234s
```

**Script:**

> "37,000 lines of code scanned in just 1.2 seconds. Fast enough to run in CI/CD pipelines or during development."

---

## Scene 12: Setup & Integration (7:00-7:30)

**Visual:** Configuration files being edited

**Script:**

> "Setting up VibeSec takes just 2 minutes. Here's how to add it to your favorite AI coding tool."

**Action - Show each platform:**

### Claude Code

```bash
# 1. Clone repo
git clone https://github.com/ferg-cod3s/vibesec.git
cd vibesec && bun install && bun run build

# 2. Edit ~/.claude/mcp.json
{
  "mcpServers": {
    "vibesec": {
      "command": "bun",
      "args": ["run", "/path/to/vibesec/bin/vibesec-mcp"]
    }
  }
}

# 3. Restart Claude Code
```

### Cursor

```bash
# Same as Claude Code but edit ~/.cursor/mcp.json
```

### Cline (VS Code)

```bash
# Same as Claude Code but in VS Code workspace settings
```

### Command Line

```bash
# Option 1: Direct
npx vibesec scan src/

# Option 2: Install globally
npm install -g vibesec
vibesec scan src/

# Option 3: Bun
bun run vibesec scan src/
```

---

## Scene 13: Call to Action & Summary (7:30-7:50)

**Visual:** GitHub repository page

**Script:**

> "VibeSec is completely open source, free, and MIT licensed. Your code never leaves your machine - everything runs locally."

**Show on screen:**

- GitHub: github.com/ferg-cod3s/vibesec
- 20+ detection rules
- 4 output formats
- MCP integration for 4 tools
- 100% local processing

**Script:**

> "Try it on your own code. See what vulnerabilities it finds. The repository has comprehensive documentation and examples."

**Key Talking Points:**

- ✅ Catches 20+ vulnerability types
- ✅ Works inside your AI coding assistant
- ✅ Fast: 3000+ lines per second
- ✅ Accurate: <2% false positives
- ✅ Free & open source
- ✅ 100% local - no data uploads
- ✅ 2-minute setup

---

## Scene 14: Closing (7:50-8:00)

**Visual:** Terminal with successful scan

**Script:**

> "Code fast. Code safe. Code with VibeSec."

**Visual Effect:**

- Show green checkmarks for passing security checks
- Show GitHub star button
- Display: "vibesec.dev" (or repo URL)

**Final Text on Screen:**

```
VibeSec - Security Scanner for AI-Generated Code
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔗 GitHub: github.com/ferg-cod3s/vibesec
📚 Docs: docs/MCP_INSTALLATION_GUIDE.md
⭐ Star us to show support
💬 Join the community on Discord

Scan. Secure. Deploy.
```

---

## Demo Materials Checklist

### Files to Show

- ✅ `demo-examples/vulnerable-api.ts` - SQL injection, command injection, incomplete auth
- ✅ `demo-examples/vulnerable-secrets.ts` - Hardcoded API keys, credentials
- ✅ `demo-examples/vulnerable-auth.ts` - Missing auth, weak password validation
- ✅ `cli/index.ts` - Show help output and CLI structure
- ✅ `src/mcp/server.ts` - Show MCP integration code

### Commands to Run

```bash
# Setup
git clone https://github.com/ferg-cod3s/vibesec.git
cd vibesec
bun install
bun run build

# Demo commands
vibesec scan demo-examples/
vibesec scan demo-examples/vulnerable-api.ts --severity critical
vibesec list-rules
vibesec scan demo-examples/ --format json | jq '.summary'
```

### MCP Integration Demo

- Claude Code desktop app
- vibesec_scan tool
- vibesec_list_rules tool
- JSON output format

### Key Metrics to Highlight

- 20 rule categories
- 50+ specific patterns
- 52 vulnerabilities found in demo
- 13 CRITICAL issues
- 3000+ lines/second processing
- <2% false positive rate
- 2-minute setup time
- $0 cost (open source)
- 100% local processing

---

## Recording Tips

### Quality Standards

- **Resolution:** 1920x1080 minimum
- **Frame rate:** 30fps
- **Terminal font size:** Large enough to read (18-24pt)
- **Background:** Clean (light or dark, consistent)
- **Audio:** Clear microphone, minimize noise

### Pacing

- Pause 1-2 seconds between sections
- Read key points out loud
- Let terminal output render naturally (no super-fast playback)
- Show each command before output

### Editing

- Use cuts (no fancy transitions)
- Highlight important code with color
- Add captions for technical terms
- Include timestamps in video description
- Add clickable chapters (YouTube)

### Distribution

- **YouTube:** Full 8-minute version with chapters
- **Twitter/X:** 60-second highlight reel
- **LinkedIn:** 90-second professional version
- **Dev.to:** Embed YouTube + article summary
- **GitHub:** Link to video in README

---

## Expected Outcomes

### Video Performance Targets

- Views: 1000+ in first month
- Engagement: 10%+ (likes, comments)
- Click-through: 5%+ to GitHub
- GitHub stars: 100+ from video
- MCP installations: 50+ tracked

### Community Feedback

- Look for vulnerability reports
- Track feature requests
- Monitor bug reports
- Collect testimonials

### Follow-up Content

- "How to fix each vulnerability" - technical deep dive
- "VibeSec + CI/CD" - pipeline integration
- "Custom rules" - advanced usage
- "Community showcases" - user stories
