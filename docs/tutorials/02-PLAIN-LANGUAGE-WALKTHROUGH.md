# Video Tutorial Script: Plain Language Walkthrough

**Duration:** 3 minutes
**Target Audience:** Non-technical users (PMs, designers, product owners, stakeholders)
**Prerequisites:** None - perfect for complete beginners

---

## Script Outline

### [00:00-00:20] Introduction

**Visual:** Friendly, modern interface (not intimidating terminal)

**Narration:**
> "Hey there! Are you a PM, designer, or product owner who needs to understand security scan results but doesn't speak 'developer'? This tutorial is for you. VibeSec's plain-language mode translates technical security jargon into everyday English. Let's dive in!"

**Screen:**
```
┌─────────────────────────────────────────┐
│  VibeSec Plain Language Mode            │
│                                          │
│  🎯 For: PMs, Designers, Product Owners │
│  ⏱️  Duration: 3 minutes                 │
│  📚 No technical knowledge needed        │
└─────────────────────────────────────────┘
```

---

### [00:20-00:45] What is Plain Language Mode?

**Visual:** Side-by-side comparison

**Narration:**
> "When developers scan code, they see technical terms like 'SQL injection' and 'CWE-79'. But what does that actually mean? Plain-language mode turns this:"

**Screen - Left side (Technical):**
```
Critical: SQL Injection Vulnerability
CWE-89: Improper Neutralization of Special Elements
Location: src/api/users.js:42
Risk: Arbitrary SQL execution via unsanitized input
```

**Narration (continued):**
> "Into this:"

**Screen - Right side (Plain Language):**
```
What's wrong?
  Your database query is accepting text directly from users
  without checking if it's safe. It's like letting someone
  write their own prescription at a pharmacy.

Why does this matter?
  A malicious user could delete your entire database, steal
  customer data, or take over user accounts.

How urgent is this?
  🚨 CRITICAL - Fix immediately before launch
```

---

### [00:45-01:30] Running a Plain Language Scan

**Visual:** Terminal with clear, friendly prompts

**Narration:**
> "Running a plain-language scan is simple. Open your terminal and type 'vibesec scan' followed by the --explain flag."

**Screen:**
```bash
$ vibesec scan . --explain

🔍 Scanning your project for security issues...

✨ Using plain language mode
   (Perfect for non-technical team members!)

📁 Scanning 42 files...

Done! Found 5 issues. Let's walk through them together.
```

---

### [01:30-02:15] Understanding a Real Example

**Visual:** Full-screen view of one finding with annotations

**Narration:**
> "Let's look at an actual finding. VibeSec breaks it down into four simple sections: What, Why, How, and Who."

**Screen:**
```
Issue 1 of 5 - CRITICAL
══════════════════════════════════════════

What's wrong?
  Your code contains a password written directly in the
  source code file. This is like writing your PIN number
  on your credit card.

Why does this matter?
  • Anyone with access to the code can see the password
  • It could be accidentally shared on GitHub
  • Past versions of the code will always have the password
  • You can't change it without changing the code

How do I fix it?
  Move the password to a .env file (a special file that
  stores secrets separately from your code). Your developer
  can do this in about 15 minutes.

  Example:
  ❌ Before: password = "MySuperSecret123"
  ✅ After:  password = process.env.DB_PASSWORD

Who should fix this?
  Any developer on your team

Time to fix: 15-30 minutes
```

**Text overlays with arrows:**
- "What" → "Plain English description"
- "Why" → "Real-world consequences"
- "How" → "Actionable fix with example"
- "Who" → "Who can help"

---

### [02:15-02:40] Security Score

**Visual:** Security scorecard with visual grade

**Narration:**
> "VibeSec also gives you an overall security score from 0 to 100, just like a test grade. This makes it easy to track improvements over time and communicate with stakeholders."

**Screen:**
```
═══════════════════════════════════════════════════════
Security Score: 73/100 (C)
═══════════════════════════════════════════════════════

What does this mean?
  Your project has some security issues that should be
  addressed, but it's not in critical danger. Think of
  it like a car inspection - you can still drive, but
  you should fix these issues soon.

Comparison:
  Industry average (small projects):   68/100
  Your score:                          73/100
  ✓ You're doing better than average! 👍

To improve your score:
  1. Fix the 1 critical issue (+15 points → 88/100)
  2. Address the 2 high-priority issues (+8 points → 96/100)
  3. Clean up medium/low issues (+4 points → 100/100)
```

---

### [02:40-02:55] Sharing with Your Team

**Visual:** Example stakeholder report

**Narration:**
> "You can also generate executive summaries perfect for sharing with leadership. These focus on business impact, not technical details."

**Screen:**
```bash
$ vibesec scan -f stakeholder -o report.txt

✓ Report saved to report.txt

───────────────────────────────────────────
Executive Security Summary
Generated: October 15, 2025
───────────────────────────────────────────

Status: ⚠️  NEEDS ATTENTION

Key Findings:
• 1 critical issue requires immediate attention
• 2 high-priority issues should be addressed this sprint
• Overall security score: 73/100 (C)

Business Impact:
• Data breach risk: MEDIUM
• Compliance readiness: 85%
• Production readiness: Not recommended until critical
  issue is resolved

Recommendation:
Address critical issue before next deployment.
Estimated developer time: 2-3 hours.

Next Steps:
1. Assign critical issue to developer
2. Schedule fix for current sprint
3. Re-scan before deployment
```

---

### [02:55-03:00] Closing

**Visual:** Quick summary card

**Narration:**
> "And that's it! You're now empowered to understand security scan results without needing a computer science degree. Happy scanning!"

**Screen:**
```
✨ You've learned:
  ✓ How to run plain-language scans
  ✓ Understanding security findings in everyday terms
  ✓ Reading security scores
  ✓ Generating stakeholder reports

🔗 Next Tutorial: CI/CD Integration (10 min)

💬 Questions? Join our community:
   → Discord: discord.gg/vibesec
   → Docs: docs.vibesec.dev
```

---

## Production Notes

### Visual Style
- **Warm, friendly colors:** Use blues and greens, avoid alarming reds
- **Large text:** All text should be readable even on mobile
- **Icons:** Use friendly icons (🎯 ✨ 💡) to create approachable feel
- **Minimal jargon:** No technical terms without immediate explanation

### Pacing
- **Slower pace:** Allow 4-5 seconds for reading text blocks
- **Friendly tone:** Conversational, encouraging, non-intimidating
- **Real examples:** Use relatable analogies (credit cards, house keys)

### Accessibility
- **Captions:** Full transcript with emphasized keywords
- **Audio description:** Describe all visual elements
- **Plain language:** Avoid technical jargon entirely
- **Visual hierarchy:** Clear sections with plenty of white space

### Analogies Used
- **Hardcoded secrets** = Writing PIN on credit card
- **SQL injection** = Letting someone write their own prescription
- **Security score** = Test grade or car inspection
- **Environment variables** = Safe deposit box for secrets

### B-Roll Suggestions
- Team meeting with PM reviewing security report
- Designer and developer discussing an issue
- Product owner checking off security tasks
- Before/after: confused face → understanding/nodding

---

## Key Takeaways

By the end of this tutorial, non-technical viewers should be able to:
1. ✅ Run a plain-language security scan
2. ✅ Understand security findings without technical knowledge
3. ✅ Interpret security scores (0-100)
4. ✅ Generate and share stakeholder reports
5. ✅ Communicate with developers about security issues

---

## FAQs to Address

**Q: Do I need to know how to code?**
A: Nope! Plain-language mode is designed for non-developers.

**Q: Can I share these reports with my boss?**
A: Absolutely! Use the stakeholder report format for executives.

**Q: How long does fixing issues take?**
A: Each finding includes an estimated fix time (usually 15-60 min).

**Q: What if I don't understand a finding?**
A: Our Discord community is here to help explain anything.

---

## Related Tutorials

- **Previous:** [Getting Started (5 min)](./01-GETTING-STARTED.md)
- **Next:** [CI/CD Integration (10 min)](./03-CICD-INTEGRATION.md)
- [Custom Rules (7 min)](./04-CUSTOM-RULES.md)

---

**Last Updated:** 2025-10-15
**Status:** Ready for Production
**Target:** Non-technical users
