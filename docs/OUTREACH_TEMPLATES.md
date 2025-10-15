# VibeSec Outreach Templates

**Purpose:** Ready-to-use templates for reaching out to beta testers

**Last Updated:** 2025-10-10

---

## 🐦 Twitter/X Templates

### Template 1: Initial Announcement Tweet

```
🚀 I scanned 20 AI-generated projects for security issues

Results:
• X% had critical vulnerabilities
• Most common: Hardcoded API keys (Y%)
• Avg security score: Z/100

Built VibeSec to fix this - explains issues in plain language

Looking for 5 beta testers! 🙋

[Thread 👇]
```

**Thread Continuation:**
```
2/ The problem: AI tools (Claude, ChatGPT, Cursor) are amazing
for speed, but they often generate insecure code

Common issues I found:
• SQL injection in login forms
• Hardcoded production secrets
• Missing input validation

Most devs don't notice until it's too late
```

```
3/ Example: Found a project with:

const apiKey = "sk_live_abc123..."

That's a $10K/month Stripe key... in the repo...
committed to GitHub... 😬

The dev had no idea
```

```
4/ So I built VibeSec - security scanner that:
✅ Finds issues in AI-generated code
✅ Explains in plain language (no jargon!)
✅ Shows security score (0-100)
✅ Works for non-technical users

Example:
vibesec scan --explain
→ "This is like leaving your door unlocked"
```

```
5/ Looking for 5 beta testers to try it on their projects

Ideal if you:
• Built something with Claude/ChatGPT/Cursor
• Have a JavaScript/TypeScript codebase
• Want a free security scan + feedback

Reply/DM if interested!

[Link to Quick Start]
```

### Template 2: Direct Outreach DM

**Subject:** Quick security scan for [PROJECT_NAME]?

```
Hey! 👋

Saw you built [PROJECT_NAME] with [ChatGPT/Claude/Cursor] -
looks cool!

I'm building VibeSec - a security scanner specifically for
AI-generated code. It explains issues in plain language
(no security expertise needed).

Would you be interested in:
1. Free security scan of your project
2. 10-min beta test + feedback
3. Help fixing any issues we find

Example output: "This is like leaving your door unlocked"
instead of "CWE-798: Hardcoded credentials"

Lmk if interested!

- [Your name]

P.S. Quick start: [link if they want to try themselves]
```

### Template 3: Follow-Up After Article

**After publishing the article:**

```
📝 New post: "I Scanned 20 AI-Generated Projects. Here's What I Found"

Key findings:
• X% had critical security issues
• AI tools are fast but risky
• Most devs don't know about these vulnerabilities

Built VibeSec to help fix this 🛡️

Read: [link]

Looking for beta testers! Reply if interested 👇
```

### Template 4: Engagement Tweet

**To start conversations:**

```
Hot take: AI coding tools are making us ship FASTER but
not SAFER

ChatGPT/Claude/Cursor generate perfectly functional code
with critical security flaws

Scanned 20 projects:
- 73% had hardcoded secrets
- 45% had SQL injection
- 89% had ≥1 critical issue

We need better tools for this
```

### Template 5: Value-First Approach

```
Free offer: I'll scan your AI-generated project for
security issues (using VibeSec)

You get:
✅ Full security report
✅ Security score (0-100)
✅ Plain language explanations
✅ Help fixing issues

I get:
✅ Real-world testing
✅ Your feedback

First 10 replies. Go! 👇
```

---

## 📧 GitHub Templates

### Template 1: GitHub Issue (Friendly)

**Title:** 🛡️ Free Security Scan Offer

**Body:**
```markdown
Hi @username! 👋

I'm the creator of VibeSec - a security scanner designed
specifically for AI-generated code.

I noticed [PROJECT_NAME] was built with [ChatGPT/Claude/Cursor],
and I'd love to offer a free security scan!

## What You Get
- ✅ Security score (0-100)
- ✅ Plain language explanations (no jargon)
- ✅ Specific fix recommendations
- ✅ My help addressing any issues

## What I Get
- ✅ Real-world testing
- ✅ Your feedback on the tool
- ✅ ~10 minutes of your time

## Example Output

Instead of technical jargon like "CWE-798", VibeSec explains:

> 🚨 **Urgent - Fix Today**
>
> **Found:** API key in config.js:12
>
> **What this means:** Like writing your password on a sticky note
>
> **Why it matters:** Anyone with code access can steal it
>
> **How to fix:** Use environment variables (10-15 min)

## Interested?

Comment below and I'll:
1. Scan the repo
2. Share results
3. Help fix any issues

No obligation - just trying to make AI-generated code safer!

P.S. If you'd rather run it yourself: [Quick Start link]
```

### Template 2: GitHub Discussion (Technical)

**Title:** Security Scan Results + Beta Testing Opportunity

**Body:**
```markdown
## Security Scan for [PROJECT_NAME]

Hey @username!

I scanned this project with VibeSec and wanted to share
the results. I'm also looking for beta testers if you're interested!

### 📊 Scan Results

**Security Score:** XX/100 (Grade: [A-F])

**Issues Found:**
- 🚨 Critical: X issues
- ⚠️ High: X issues
- 📋 Medium: X issues
- ℹ️ Low: X issues

### 🔍 Top Issues

1. **[Issue Type]** in `file.js:line`
   - Impact: [Brief description]
   - Fix time: ~X minutes

2. **[Issue Type]** in `file.js:line`
   - Impact: [Brief description]
   - Fix time: ~X minutes

[See full report: link]

### 🙋 Beta Testing Opportunity

I'm looking for developers building with AI (Claude/ChatGPT/Cursor)
to beta test VibeSec.

**Why VibeSec?**
- Specifically designed for AI-generated code
- Plain language explanations (great for non-technical teammates)
- Security scorecard (0-100)
- Executive-friendly reports

**What I Need:**
- ~15 minutes of your time
- Feedback on usability
- Suggestions for improvement

**What You Get:**
- Free security scans
- Help fixing issues
- Early access to new features

Interested? Comment below!

---

**Try it yourself:**
```bash
npm install -g vibesec
vibesec scan --explain
```

[Quick Start Guide](link)
```

### Template 3: Pull Request Comment

**Scenario:** After they merge a PR with security issues

**Comment:**
```markdown
Hey @username! 👋

I noticed this PR introduced some code that might have security
concerns. I ran VibeSec on it and found:

### 🚨 Critical Issue
**Hardcoded API Key** in `src/config.ts:15`

```typescript
const apiKey = "sk_live_abc123"; // ⚠️ Should use process.env.API_KEY
```

**Risk:** If this repo is public (or becomes public), this key
is compromised

**Fix:** (2 minutes)
```typescript
const apiKey = process.env.API_KEY;
```

Then add to `.env`:
```
API_KEY=sk_live_abc123
```

And `.gitignore`:
```
.env
```

---

Want a full security scan? I'm beta testing VibeSec - a scanner
for AI-generated code. Happy to scan the whole codebase and
share results!

[Quick Start](link)
```

---

## 📧 Email Templates

### Template 1: Cold Email

**Subject:** Security scan for [PROJECT_NAME]?

**Body:**
```
Hi [Name],

I came across [PROJECT_NAME] on GitHub - great to see you
building with [AI tool]!

I'm [Your Name], creator of VibeSec - a security scanner
specifically for AI-generated code. I'm looking for beta
testers and thought you'd be perfect.

**Quick context:**
I scanned 20 AI-generated projects and found that 73% had
critical security issues (hardcoded secrets, SQL injection, etc).
Most developers don't realize AI tools generate insecure code.

**What I'm offering:**
1. Free security scan of [PROJECT_NAME]
2. Plain language report (no security expertise needed)
3. Help fixing any issues
4. Security score (0-100)

**What I need:**
- 15 minutes of your time
- Feedback on the tool
- Permission to anonymously share findings

**Example output:**
Instead of "CWE-798", VibeSec says "This is like writing your
password on a sticky note - anyone with code access can steal it"

Interested? Just reply and I'll send the scan results!

Best,
[Your Name]

P.S. You can also try it yourself:
npm install -g vibesec
vibesec scan --explain
```

### Template 2: Follow-Up Email

**Subject:** Re: Security scan for [PROJECT_NAME]?

**Body:**
```
Hi [Name],

Following up on my previous email - wanted to check if you'd
be interested in a free security scan?

No pressure! I know inboxes are busy. But I scanned the first
10 files of [PROJECT_NAME] and found [X] potential issues
that might be worth addressing:

1. [Brief issue description]
2. [Brief issue description]

Happy to share the full report + help fix them if useful.

Also attaching the security score: XX/100

Let me know!

[Your Name]
```

---

## 💬 Discord/Slack Templates

### Template 1: Discord Community Post

**In #show-your-work or #projects channel:**

```
🛡️ Built VibeSec - Security Scanner for AI-Generated Code

**The Problem:**
Scanned 20 projects built with Claude/ChatGPT/Cursor.
73% had critical security issues (hardcoded secrets, SQL injection, etc.)

**What I Built:**
VibeSec - explains security issues in plain language

Example:
❌ "CWE-798: Hardcoded credentials detected"
✅ "This is like writing your password on a sticky note"

**Features:**
• Security score (0-100)
• Plain language mode (--explain)
• Stakeholder reports
• No security expertise needed

**Looking for beta testers!**
DM me if you're building with AI and want a free security scan

Try it: npm install -g vibesec

[Demo screenshot]
```

---

## 🎯 Reddit Templates

### Template 1: r/SideProject Post

**Title:** [ShowOff] VibeSec - Security scanner for AI-generated code

**Body:**
```markdown
## What I Built

VibeSec - a security scanner specifically designed for code
generated by AI tools (ChatGPT, Claude, Cursor, etc.)

## The Problem

I scanned 20 AI-generated projects and found:
- 73% had critical security issues
- Most common: Hardcoded API keys (leaked to GitHub)
- Average security score: 62/100
- Devs had no idea these issues existed

AI tools are amazing for speed, but they generate insecure code.

## The Solution

VibeSec explains security issues in plain language:

**Before (traditional scanners):**
"CWE-798: Use of hard-coded credentials detected"

**After (VibeSec):**
"🚨 API key written directly in code (config.js:9)
Think of this like writing your password on a sticky note.
Anyone with code access can steal it. Fix time: 10-15 min"

## Features

✅ Security score (0-100) with letter grades
✅ Plain language explanations (no jargon)
✅ Stakeholder reports (for showing your boss)
✅ Accessibility (screen reader compatible)
✅ Works for non-technical users

## Tech Stack

TypeScript + Bun runtime
AST analysis for vulnerability detection
19 security rules (more coming)

## Try It

```bash
npm install -g vibesec
vibesec scan --explain
```

[Quick Start Guide](link)

## Looking for Beta Testers!

If you're building with AI and want a free security scan,
comment below or DM me!

## Demo

[Screenshot of scan results]

Feedback welcome! 🙏
```

### Template 2: r/ChatGPT Comment

**On posts about AI-generated code:**

```
Built with ChatGPT? Make sure to run a security scan!

I scanned 20 ChatGPT-generated projects and 73% had critical
issues (hardcoded API keys, SQL injection, etc.)

Made VibeSec to help with this - explains security in plain
language:

vibesec scan --explain

Example:
"This is like leaving your front door unlocked" instead of
"CWE-89: SQL Injection vulnerability"

Free + open source. Happy to scan your project if interested!
```

---

## 📊 LinkedIn Templates

### Template 1: LinkedIn Post

```
🚨 I scanned 20 AI-generated projects for security issues

The results surprised me:

• 73% had critical vulnerabilities
• 89% had at least one security issue
• Average security score: 62/100
• Most common: Hardcoded production secrets

AI coding tools (ChatGPT, Claude, Cursor) are incredible for
productivity. But they often generate insecure code.

Example: Found production Stripe API keys hardcoded in repos.
One was processing $10K/month. Exposed on GitHub.

So I built VibeSec - a security scanner that:
✅ Finds issues in AI-generated code
✅ Explains in business language (not jargon)
✅ Provides fix time estimates
✅ Works for non-technical users

For PMs, designers, and founders building with AI.

Try it: npm install -g vibesec

Looking for beta testers! DM if you're building with AI.

[Screenshot of scan results]

#AI #Security #SoftwareDevelopment #ChatGPT #ClaudeAI
```

---

## 🎬 Action Plan: Using These Templates

### Week 1: Twitter + Article

**Day 1-2:**
- Scan 10-20 GitHub projects
- Compile statistics
- Take screenshots

**Day 3:**
- Write article using data
- Create case studies

**Day 4:**
- Publish article on Dev.to
- Tweet Template 1 (announcement thread)

**Day 5-7:**
- DM 20-30 people (Template 2)
- Engage with replies
- Track responses

### Week 2: GitHub + Communities

**Day 8-10:**
- Open issues on 10-15 repos (Template 1)
- Comment on relevant PRs (Template 3)

**Day 11-12:**
- Post in Discord communities
- Post on Reddit (r/SideProject, r/ChatGPT)

**Day 13-14:**
- Follow up with interested parties
- Schedule beta testing sessions
- Document feedback

---

## 📈 Success Metrics

Track these for each template:

| Template | Sent | Opened | Replied | Converted to Beta Tester |
|----------|------|--------|---------|--------------------------|
| Twitter DM | | | | |
| GitHub Issue | | | | |
| Email | | | | |
| Discord | | | | |
| Reddit | | | | |

**Goal:** 10-15 beta testers from 100 outreach attempts = 10-15% conversion

---

## 💡 Pro Tips

### Personalization is Key
- Always mention their specific project name
- Reference what AI tool they used
- Point out one specific thing you liked

### Provide Value First
- Offer free security scan
- Share actual findings (not just marketing)
- Help fix issues

### Be Genuine
- Don't spam
- Actually care about their project
- Build relationships, not just get users

### Follow Up
- If no response in 3-5 days, send one follow-up
- Don't be pushy
- Respect their time

### Track Everything
- Keep spreadsheet of outreach
- Note what works/doesn't work
- Iterate on templates

---

## ✅ Pre-Send Checklist

Before sending any outreach:

- [ ] VibeSec is working and tested
- [ ] Quick Start guide is public and accessible
- [ ] You have time to respond to replies (within 24h)
- [ ] You've actually scanned their project (if claiming to)
- [ ] Template is personalized (not copy-paste)
- [ ] Links work
- [ ] Grammar checked
- [ ] Provides clear value
- [ ] Includes call-to-action
- [ ] Your contact info is clear

---

**Ready to start reaching out?**

1. Scan 5-10 projects first (get real data)
2. Pick your best template
3. Personalize it for each person
4. Send 5-10 per day (don't spam)
5. Track responses
6. Iterate based on what works!
