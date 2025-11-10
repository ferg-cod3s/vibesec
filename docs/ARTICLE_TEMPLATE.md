# Article Template: "I Scanned [X] AI-Generated Projects. Here's What I Found."

**Purpose:** Ready-to-publish article template for Dev.to, Medium, or your blog

**Instructions:** Fill in [BRACKETS] with your actual data after scanning projects

---

## Title Options

Pick the most compelling based on your findings:

1. "I Scanned [20] AI-Generated Projects for Security Issues. [73%] Had Critical Vulnerabilities."
2. "Your ChatGPT Code Is Probably Insecure: I Scanned [20] Projects to Prove It"
3. "The Hidden Cost of AI Coding: [X]% of Projects Have Security Flaws"
4. "[X] Security Issues I Found in AI-Generated Code (And How to Fix Them)"
5. "I Built a Security Scanner for AI Code After Finding [X] Hardcoded API Keys"

---

## Article Template (Dev.to / Medium Format)

````markdown
# I Scanned [X] AI-Generated Projects for Security Issues. Here's What I Found.

![Cover image: Screenshot of security scan results]

_TL;DR: AI coding tools are amazing for productivity, but [X]% of the projects I scanned had critical security vulnerabilities. Here's what I found and how to protect yourself._

---

## The Experiment

Like many developers in 2025, I've been using AI coding assistants (ChatGPT, Claude, Cursor) to ship faster. They're incredible for productivity.

But I kept wondering: **Is the code they generate actually secure?**

So I decided to find out. I:

1. 🔍 Searched GitHub for [X] projects that explicitly mentioned being built with AI
2. 🛡️ Scanned each one with VibeSec (a security scanner I built)
3. 📊 Analyzed the results

Spoiler: The results weren't great.

---

## The Results

### 📊 Overall Statistics

After scanning [X] projects (ranging from [small side projects to production apps]):

- **[X]%** had at least one security issue
- **[X]%** had CRITICAL vulnerabilities
- **Average security score:** [XX]/100 (Grade: [C/D/F])
- **Total issues found:** [XXX]

### 🚨 Most Common Vulnerabilities

Here's what I found most often:

| Vulnerability Type                      | % of Projects | Severity    |
| --------------------------------------- | ------------- | ----------- |
| Hardcoded secrets (API keys, passwords) | [X]%          | 🔴 Critical |
| SQL Injection                           | [X]%          | 🔴 Critical |
| Cross-Site Scripting (XSS)              | [X]%          | 🟡 High     |
| Insecure CORS configuration             | [X]%          | 🟡 High     |
| Missing input validation                | [X]%          | 🟠 Medium   |

---

## Case Study 1: The $10K API Key Leak 💸

**Project:** [Anonymous - web app built with ChatGPT]
**Security Score:** [XX]/100

### What I Found

```javascript
// config/database.js
const stripeKey = 'sk_live_51Abc123...'; // 🚨 PRODUCTION KEY
const dbPassword = 'SuperSecret123!'; // 🚨 HARDCODED
```
````

This project had:

- A **production** Stripe API key hardcoded in the repo
- Committed to a **public** GitHub repository
- Processing ~$10K/month in transactions

### The Risk

Anyone who found this repo could:

- Steal customer payment information
- Make charges to connected accounts
- Access sensitive transaction data
- Rack up charges

### The Fix (10 minutes)

```javascript
// ✅ SECURE VERSION
const stripeKey = process.env.STRIPE_SECRET_KEY;
const dbPassword = process.env.DB_PASSWORD;
```

Plus `.env`:

```
STRIPE_SECRET_KEY=sk_live_51Abc123...
DB_PASSWORD=SuperSecret123!
```

And `.gitignore`:

```
.env
```

**Why AI Generated This:**

ChatGPT/Claude often provide "example" code with placeholder secrets. Developers copy it directly without realizing the security implications.

---

## Case Study 2: The Authentication Bypass 🔓

**Project:** [Anonymous - user management system built with Claude]
**Security Score:** [XX]/100

### What I Found

```javascript
// routes/users.js
app.get('/api/user/:id', (req, res) => {
  const query = `SELECT * FROM users WHERE id = ${req.params.id}`;
  //                                              ^^^^^^^^^^^^^^^^
  //                                              🚨 SQL INJECTION

  db.query(query, (err, results) => {
    res.json(results);
  });
});
```

### The Risk

An attacker could manipulate the query:

```bash
# Normal request
GET /api/user/5

# Malicious request
GET /api/user/1%20OR%201=1

# This becomes:
SELECT * FROM users WHERE id = 1 OR 1=1
# Returns ALL users, bypassing authentication
```

They could:

- Dump the entire user database
- Delete all records (`1; DROP TABLE users--`)
- Access admin accounts
- Steal passwords

### The Fix (15 minutes)

```javascript
// ✅ SECURE VERSION using parameterized queries
app.get('/api/user/:id', (req, res) => {
  const query = 'SELECT * FROM users WHERE id = ?';

  db.query(query, [req.params.id], (err, results) => {
    res.json(results);
  });
});
```

**Why AI Generated This:**

AI tools prioritize getting something working quickly. They often skip security best practices for simplicity.

---

## Case Study 3: Actually Secure! ✅

**Project:** [Anonymous - API built with Cursor]
**Security Score:** [9X]/100 ⭐

Not everything was bad! One project got it right:

### What They Did Well

```typescript
// ✅ Environment variables for secrets
const apiKey = process.env.OPENAI_API_KEY;

// ✅ Parameterized queries
const user = await db.query('SELECT * FROM users WHERE email = $1', [email]);

// ✅ Input validation
const schema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
});

// ✅ Rate limiting
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
  })
);
```

**What Made the Difference:**

The developer mentioned they:

1. Explicitly asked the AI to "use security best practices"
2. Reviewed each piece of generated code
3. Ran security scans during development

---

## What This Means for AI Coding

### ⚠️ The Problem

AI coding tools are trained on vast amounts of code - including **insecure** code. They learn patterns from:

- Old StackOverflow answers (pre-2015 security practices)
- Tutorial code (prioritizes simplicity over security)
- Example code with placeholder secrets
- Quick prototypes never meant for production

### 💡 The Reality

**AI is optimizing for:**

- ✅ Code that works
- ✅ Code that's easy to understand
- ✅ Code that matches common patterns

**AI is NOT optimizing for:**

- ❌ Security
- ❌ Production readiness
- ❌ Long-term maintainability

### 🛡️ How to Protect Yourself

1. **Never commit without reviewing**
   - Read every line of AI-generated code
   - Understand what it does before using it

2. **Always use environment variables**

   ```bash
   # Ask AI to use env vars explicitly
   "Write this function using process.env for API keys"
   ```

3. **Use parameterized queries**

   ```bash
   # Be specific in your prompt
   "Use parameterized queries to prevent SQL injection"
   ```

4. **Run security scans**
   - Use tools like VibeSec during development
   - Don't wait until production

5. **Ask AI to prioritize security**
   ```bash
   # Better prompts
   "Write a secure login endpoint with proper input validation
   and parameterized queries. Use environment variables for secrets."
   ```

---

## What I Built: VibeSec

After seeing these results, I built **VibeSec** - a security scanner specifically designed for AI-generated code.

### Why It's Different

**Traditional security scanners:**

- Assume you're a security expert
- Use technical jargon (CWE-798, OWASP A03:2021)
- Require configuration

**VibeSec:**

- ✅ Explains issues in plain language
- ✅ Designed for non-security experts
- ✅ Works out of the box
- ✅ Provides fix time estimates

### Example Output

**Before (traditional scanner):**

```
[CRITICAL] CWE-798: Use of Hard-coded Credentials
Location: config.js:12
CVSS Score: 9.8
```

**After (VibeSec --explain):**

```
🚨 Urgent - Fix Today

Found: API key written directly in code (config.js:12)

What this means:
Your API key is saved directly in the code file.
Think of this like writing your password on a sticky note!

Why it matters:
• Anyone who sees this code can use your API key
• You could get charged for their usage
• Could cost $1000s in unexpected bills

How to fix:
1. Move the key to an environment variable
2. Change the API key (the old one is compromised)
3. Add .env to .gitignore

Time needed: 10-15 minutes
Who can fix: Any developer
```

### Features

- 🎯 **Security Score (0-100)** - Like a credit score for your code
- 📊 **Stakeholder Reports** - Board-ready executive summaries
- ♿ **Accessibility** - Screen reader compatible with --no-color flag
- 🚀 **Fast** - Scans in seconds

### Try It

```bash
# Install
npm install -g vibesec

# Scan your project
vibesec scan .

# Use plain language mode
vibesec scan --explain

# Generate stakeholder report
vibesec scan -f stakeholder -o report.txt
```

[Quick Start Guide](link)

---

## Looking for Beta Testers! 🙋

I'm looking for developers building with AI to beta test VibeSec.

**Ideal if you:**

- Built something with ChatGPT, Claude, or Cursor
- Have a JavaScript/TypeScript codebase
- Want a free security scan + help fixing issues
- Can spare 15-30 minutes for feedback

**What you get:**

- Free security scan
- Help fixing any issues we find
- Early access to new features
- My eternal gratitude 🙏

**Interested?**

- Comment below
- DM me on Twitter: [@yourhandle]
- Email: your@email.com

---

## Key Takeaways

### 🎯 Main Points

1. **AI code is fast but often insecure**
   - [X]% of scanned projects had critical issues
   - Most common: hardcoded secrets, SQL injection

2. **Developers don't realize the risks**
   - AI generates functional code with hidden flaws
   - Most issues are preventable with basic security practices

3. **Simple fixes make a big difference**
   - Environment variables (10 min)
   - Parameterized queries (15 min)
   - Input validation (20 min)

4. **Security scans during development, not after**
   - Catch issues before they reach production
   - Use tools designed for AI-generated code

### 💪 Action Items

**If you're building with AI:**

- [ ] Review all AI-generated code before committing
- [ ] Use environment variables for ALL secrets
- [ ] Use parameterized queries for database access
- [ ] Run security scans during development
- [ ] Be explicit about security in AI prompts

**Right now:**

- [ ] Scan your current project with VibeSec
- [ ] Fix any critical issues found
- [ ] Set up pre-commit hooks for security scanning
- [ ] Share with your team

---

## Discussion

What's been your experience with AI-generated code?

- Have you found security issues?
- What tools do you use to catch them?
- Any horror stories to share?

Let's discuss in the comments! 👇

---

## Resources

- [VibeSec GitHub](link)
- [Quick Start Guide](link)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [SQL Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)
- [Hardcoded Secrets Detection](https://cwe.mitre.org/data/definitions/798.html)

---

_Built with ❤️ for the AI coding community. If this helped you, please share!_

**Tags:** #AI #Security #ChatGPT #ClaudeAI #Cursor #WebDevelopment #JavaScript #TypeScript #DevTools

---

## Share This Article

If you found this useful:

- 🐦 [Tweet it](link)
- 💼 [Share on LinkedIn](link)
- 📧 Forward to your team
- ⭐ Star VibeSec on GitHub

Thanks for reading! Stay secure 🛡️

```

---

## After Publishing: Promotion Checklist

### Day 1 (Publication Day)

- [ ] Publish on Dev.to
- [ ] Cross-post to Medium (if you have account)
- [ ] Tweet with thread (use Template 1 from OUTREACH_TEMPLATES.md)
- [ ] Post on LinkedIn
- [ ] Share in relevant Discord servers
- [ ] Post on r/programming, r/javascript, r/ChatGPT (check subreddit rules first)
- [ ] Share on Hacker News (Submit → Show HN)
- [ ] Email to personal network

### Day 2-3

- [ ] Reply to ALL comments on Dev.to
- [ ] Engage with Twitter replies
- [ ] DM 10-20 people who commented (offer beta testing)
- [ ] Post in IndieHackers
- [ ] Share in relevant Slack communities

### Day 4-7

- [ ] Follow up with interested beta testers
- [ ] Schedule testing sessions
- [ ] Thank everyone who shared
- [ ] Create follow-up content based on feedback

### Metrics to Track

- [ ] Article views
- [ ] Comments
- [ ] Shares
- [ ] Beta tester signups (from article)
- [ ] GitHub stars increase
- [ ] npm downloads (if published)

---

## Alternative Article Ideas

Based on your scan results, you could also write:

1. **"The [X] Most Common Security Mistakes in AI-Generated Code"**
   - List format
   - Each mistake with example
   - How to fix it

2. **"From [40]/100 to [95]/100: How I Secured My AI-Generated App"**
   - Case study format
   - Before/after comparison
   - Step-by-step fixes

3. **"Ask Your AI to Write Secure Code: The Ultimate Prompt Guide"**
   - Collection of security-focused prompts
   - Before/after examples
   - Best practices

4. **"I Found [X] Production API Keys on GitHub (And How You Can Avoid This)"**
   - Focus on hardcoded secrets
   - Real examples (anonymized)
   - Prevention guide

5. **"Security Score: Why Your AI Code Probably Gets an F"**
   - Deep dive into security scoring
   - Industry benchmarks
   - How to improve

---

## SEO Optimization

### Keywords to Target

- AI-generated code security
- ChatGPT code security
- Claude AI security
- Cursor IDE security
- AI coding security issues
- Secure AI-generated code
- AI code vulnerabilities

### Meta Description

```

I scanned [X] AI-generated projects for security issues. [X]% had critical vulnerabilities. Here's what I found and how to protect your code.

```

### URL Slug

```

ai-generated-code-security-issues

```

---

## Visual Assets to Include

1. **Cover Image**
   - Screenshot of security scan
   - Security score visualization
   - Compelling title overlay

2. **Statistics Graphics**
   - Pie chart of vulnerability types
   - Bar chart of severity distribution
   - Score distribution histogram

3. **Code Examples**
   - Before/after comparisons
   - Syntax-highlighted snippets
   - Clear annotations

4. **Screenshots**
   - VibeSec scan output
   - Plain language explanations
   - Stakeholder report example

---

**Ready to write?**

1. Scan 10-20 projects
2. Fill in [BRACKETS] with your data
3. Add real code examples
4. Include screenshots
5. Publish!

Good luck! 🚀
```
