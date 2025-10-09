# VibeSec User Testing - Recruitment Email Templates

**Purpose**: Ready-to-use email templates for recruiting beta testers

**Last Updated**: 2025-10-10

---

## Template 1: Pilot Testing Invitation (Trusted Testers)

**Subject**: Help test VibeSec - Security scanner for junior devs (15 min, early access reward)

**Body**:

```
Hi [Name],

I'm reaching out because I value your feedback and technical expertise.

I've been working on **VibeSec** - a security scanner designed specifically for junior developers. Unlike traditional tools that overwhelm beginners with jargon, VibeSec explains vulnerabilities in clear, educational language.

**I need your help testing it** before the public launch.

### What I'm asking:
- ⏱️ **15 minutes** of your time
- Install VibeSec via npm
- Run it on a sample vulnerable API (provided)
- Complete a short feedback form

### What you'll get:
- 🎁 Early access to VibeSec Pro features (worth $50/year)
- 🏆 Special "Founding Tester" badge on our website
- 🙏 My sincere gratitude for helping improve security education

### Testing Guide:
[Link to USER_TESTING_GUIDE.md]

### Feedback Form:
[Google Form Link - INSERT AFTER CREATION]

**Deadline**: [3 days from now - e.g., Friday, Oct 13]

This is **pilot testing**, so if you encounter bugs or unclear instructions, that's exactly what I need to know!

Questions? Just reply to this email.

Thanks for considering,
[Your Name]

P.S. - If you know other developers (especially juniors) who might be interested in the main testing wave, feel free to forward this!
```

---

## Template 2: Main Testing Wave (Broader Audience)

**Subject**: 🚀 Beta test VibeSec - Help improve security for junior developers

**Body**:

```
Hi there!

Are you a **junior developer** learning about security? Or do you mentor juniors?

I'm launching beta testing for **VibeSec** - a security scanner that explains vulnerabilities in beginner-friendly language (not enterprise jargon).

### Why VibeSec?
Most security tools assume you already know what "CWE-79" means. VibeSec explains it like a senior developer would: clearly, with examples, and actionable fixes.

**Example Finding**:
```
🔴 HIGH: Cross-Site Scripting (XSS) Detected

Your code renders user input as HTML without sanitization.
An attacker could inject <script> tags to steal user sessions.

❌ Vulnerable: innerHTML = userInput
✅ Secure: textContent = userInput (or use DOMPurify)
```

### I need your feedback:
- ⏱️ **10-15 minutes**
- Install via npm
- Scan a sample vulnerable API
- Complete a feedback form

### What you'll get:
- 🎁 **Early access** to VibeSec Pro (first 50 testers)
- 🏆 **Contributor badge** on our site
- 🧠 Learn about 5 common vulnerabilities hands-on

### Get Started:
1. **Testing Guide**: [Link to USER_TESTING_GUIDE.md]
2. **Feedback Form**: [Google Form Link]

**Deadline**: [2 weeks from now - e.g., Friday, Oct 25]

### Who This Is For:
- Junior developers (0-2 years experience)
- Bootcamp grads learning security
- Self-taught developers
- Security tool enthusiasts

Even if you're not a "junior" anymore, your perspective is valuable!

### Questions?
- Email: feedback@vibesec.dev
- GitHub Issues: [github.com/your-org/vibesec/issues]

Thanks for helping make security more accessible!

Best,
[Your Name]

---

**P.S.** - Know someone who'd benefit? Forward this email or share on Twitter/Reddit!

**P.P.S.** - VibeSec is 100% open-source and free. No credit card, no signup wall, no tracking.
```

---

## Template 3: Reminder Email (Non-Respondents)

**Subject**: Reminder: VibeSec beta testing (15 min, early access reward)

**Body**:

```
Hi [Name],

Just a friendly reminder about the VibeSec beta testing I sent last week!

**Quick recap**:
- ⏱️ 15 minutes
- Test a security scanner for junior devs
- 🎁 Get early access to Pro features

### Links:
- **Testing Guide**: [Link]
- **Feedback Form**: [Google Form Link]

**New deadline**: [Extended by 3-5 days]

No worries if you're too busy - I completely understand! If you know anyone else who might be interested (juniors, bootcamp grads, mentors), feel free to forward this.

Thanks!
[Your Name]

---

**Can't participate?** No problem - just reply "Not interested" and I'll remove you from the list.
```

---

## Template 4: Thank You Email (After Submission)

**Subject**: Thank you for testing VibeSec! 🎉

**Body**:

```
Hi [Name],

**Thank you** for completing the VibeSec beta test! Your feedback is incredibly valuable.

### What's Next:

**1. Early Access Code** (If promised)  
I'll send your VibeSec Pro early access code within **2 weeks** via email. Keep an eye out!

**2. Contributor Badge**  
You'll be featured on our "Founding Testers" page:  
[Link to contributors page - TBD]

**3. Results & Changes**  
I'll share a summary of all feedback and how we're improving VibeSec in early November. Stay tuned!

### Want to Help More?

If you enjoyed testing VibeSec:
- ⭐ Star us on GitHub: [github link]
- 🐦 Share on Twitter: "Just tested @VibeSec - a security scanner for junior devs. Check it out!"
- 👥 Recommend to colleagues who might benefit

### Questions or Issues?

If you encountered any bugs or have follow-up thoughts, feel free to reply to this email or open a GitHub issue.

Thanks again for being part of the VibeSec community!

Best,
[Your Name]

---

**P.S.** - If you never received an early access code after 2 weeks, email me at feedback@vibesec.dev
```

---

## Template 5: Social Media Post (Twitter/X)

```
🚀 Calling junior developers!

I'm beta testing VibeSec - a security scanner that explains vulnerabilities in plain English (not enterprise jargon).

✅ 15 min testing
✅ Early access reward
✅ Learn about XSS, SQL injection, etc.

Guide: [short link]
Form: [short link]

RT to help! 🙏

#DevTools #InfoSec #JavaScript #Python
```

---

## Template 6: Reddit Post (r/learnprogramming, r/webdev)

**Title**: [Beta Testing] VibeSec - Security scanner for junior developers (need feedback!)

**Body**:

```
Hey everyone!

I've been working on **VibeSec**, a security scanner designed specifically for **junior developers**. Most security tools are built for enterprise teams and assume you already know what "CWE-89" or "OWASP A03:2021" means. VibeSec explains vulnerabilities like a senior developer would - clearly and with actionable examples.

### Example Output:
```
🔴 HIGH: SQL Injection Detected

Your code constructs SQL queries using template literals with user input.
An attacker could input: ' OR '1'='1 to bypass authentication.

❌ Vulnerable: `SELECT * FROM users WHERE id = ${userId}`
✅ Secure: Use parameterized queries or an ORM
```

### I need beta testers!

**What I'm asking**:
- 15 minutes of your time
- Install via npm, scan a sample vulnerable API, complete feedback form

**What you get**:
- Early access to VibeSec Pro features
- Contributor badge
- Hands-on learning about 5 common vulnerabilities

### Get Started:
- **Testing Guide**: [link to USER_TESTING_GUIDE.md]
- **Feedback Form**: [Google Form short link]

**Target audience**: Junior devs (0-2 years), bootcamp grads, self-taught developers

### Tech Stack:
- Node.js 18+
- Scans JavaScript & Python
- CLI tool (no IDE required)

**Deadline**: [2 weeks from posting]

I'm especially interested in feedback on:
- Clarity of vulnerability descriptions
- Usefulness of remediation suggestions
- False positive rate

Thanks for considering! Happy to answer questions in the comments.

---

**Mods**: Let me know if this violates any rules. I'm not selling anything - VibeSec is 100% open-source and free.
```

---

## Template 7: Discord/Slack Message (Dev Communities)

```
👋 Hey everyone!

I'm looking for **beta testers** for VibeSec - a security scanner built for junior developers.

🎯 **What makes it different?**
Unlike Snyk or SonarQube, VibeSec explains vulnerabilities in plain English with educational examples. Think "security mentor in a CLI tool".

⏱️ **Time commitment**: 15 minutes
🎁 **Reward**: Early access to Pro features + contributor badge

📋 **Testing Guide**: [link]
📝 **Feedback Form**: [short link]

**Target audience**: Junior devs, bootcamp grads, anyone learning security

**Deadline**: [date]

DM me if you have questions! Thanks 🙏
```

---

## Tracking Recruitment

### Recommended Spreadsheet

**File**: `docs/RECRUITMENT_TRACKER.md`

| Channel | Date Sent | Recipients | Responses | Conversion Rate |
|---------|-----------|------------|-----------|-----------------|
| Email (pilot) | 2025-10-10 | 5 | 4 | 80% |
| Email (main) | 2025-10-15 | 20 | 8 | 40% |
| Reddit | 2025-10-15 | ~1000 views | 3 | 0.3% |
| Twitter | 2025-10-15 | 150 impressions | 1 | 0.6% |
| Discord | 2025-10-16 | 200 members | 2 | 1% |
| **TOTAL** | - | - | **18** | - |

**Target**: 15-20 responses  
**Current**: ____ responses  
**Status**: 🟢 On track / 🟡 Needs boost / 🔴 Behind

---

## Best Practices

### Timing
- **Pilot**: Tuesday-Thursday (best response rates)
- **Main wave**: Avoid Mondays (inbox overload) and weekends
- **Reminder**: Send 3-5 days before deadline

### Personalization
- Use recipient's first name when possible
- Reference specific context (e.g., "I saw you're active on r/learnprogramming")
- Mention mutual connections if applicable

### Subject Line A/B Testing
If you have a large email list, test 2 subject lines:

**Version A (Specific)**:  
"Help test VibeSec - Security scanner for junior devs (15 min, early access reward)"

**Version B (Curiosity)**:  
"I need 15 minutes of your time (security tool feedback)"

Track which gets higher open rate.

### Follow-Up Cadence
- **Pilot**: 1 reminder after 3 days
- **Main**: 1 reminder after 7 days, final reminder at day 12
- **Max**: 2 reminders total (avoid spam perception)

---

## Compliance & Ethics

### GDPR Considerations
- Only email people who opted in or have prior relationship
- Include unsubscribe option in every email
- Don't share email addresses with third parties
- Delete test data after Phase 4 completes (unless consent given)

### Anti-Spam
- BCC recipients (don't expose emails to each other)
- Use professional email (not Gmail/Yahoo if possible)
- Include physical mailing address (required by CAN-SPAM)
- Honor opt-out requests within 48 hours

---

**Document Owner**: VibeSec Core Team  
**Created**: 2025-10-10  
**Last Updated**: 2025-10-10
