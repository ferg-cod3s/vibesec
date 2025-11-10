# Video Tutorial Script: Getting Started with VibeSec

**Duration:** 5 minutes
**Target Audience:** All users (developers, PMs, designers)
**Prerequisites:** Basic terminal knowledge

---

## Script Outline

### [00:00-00:30] Introduction

**Visual:** VibeSec logo and title screen

**Narration:**

> "Hi! Welcome to VibeSec - the security scanner built specifically for teams building with AI. Whether you're a developer, PM, or designer, VibeSec helps you catch security vulnerabilities in AI-generated code before they reach production. In this 5-minute tutorial, we'll get you up and running with your first security scan."

**Screen:**

- VibeSec logo
- "Getting Started with VibeSec"
- "⏱️ 5 minutes"

---

### [00:30-01:15] Installation

**Visual:** Terminal window

**Narration:**

> "First, let's install VibeSec. If you're using Node.js, it's as simple as running npm install. We'll install it globally so you can use it anywhere on your system."

**Screen:**

```bash
# Show terminal
$ npm install -g vibesec

# Installation progress
⠋ Installing vibesec...
✓ Installed vibesec@0.1.0
```

**Narration (continued):**

> "And let's verify the installation by checking the version."

**Screen:**

```bash
$ vibesec --version
vibesec/0.1.0
```

**Text overlay:** "✅ VibeSec installed successfully!"

---

### [01:15-02:30] Your First Scan

**Visual:** Terminal, then file tree, then back to terminal

**Narration:**

> "Now let's run your first security scan. Navigate to any project directory - I'll use a sample Node.js application here."

**Screen:**

```bash
$ cd my-app
$ ls
src/  tests/  package.json  README.md
```

**Narration (continued):**

> "To scan your project, simply run 'vibesec scan' followed by a dot for the current directory."

**Screen:**

```bash
$ vibesec scan .

⠋ Scanning for security issues...
📁 Found 42 files to scan
🔍 Analyzing...

Security Scan Results
──────────────────────

⚠️  Found 5 security issues

Critical: 1
High:     2
Medium:   1
Low:      1

Scanned: 42 files in 1.23s
```

**Text overlay:** "Your first scan complete! ⚡"

---

### [02:30-03:30] Understanding Results

**Visual:** Split screen - terminal output on left, explanation on right

**Narration:**

> "Let's look at what VibeSec found. Each finding includes the severity level, a description, and exactly where in your code the issue exists."

**Screen:**

```bash
Critical: Hardcoded API Key
────────────────────────────────
Found hardcoded API key in source code

📍 Location: src/config/api.js:5
💡 Risk: API key exposure could lead to unauthorized access

const apiKey = "sk_live_abc123...";
               ^^^^^^^^^^^^^^^^^^^

Fix: Move to environment variables
🔗 Learn more: https://vibesec.dev/docs/secrets
```

**Text overlay points at different parts:**

- Arrow to "Critical" → "Severity level"
- Arrow to location → "Exact file and line"
- Arrow to code snippet → "Problematic code"
- Arrow to "Fix" → "How to resolve"

---

### [03:30-04:15] Plain Language Mode (for non-technical users)

**Visual:** Terminal with --explain flag

**Narration:**

> "If you're not a developer, VibeSec has a special plain-language mode that explains security issues in everyday terms. Just add the --explain flag."

**Screen:**

```bash
$ vibesec scan . --explain

🔒 Security Issues Found (Explained Simply)

Issue 1 of 5 - CRITICAL
═══════════════════════

What's wrong?
  Your code contains an API key written directly in the source code.
  Think of this like writing your house key on the front door.

Why does this matter?
  Anyone who sees your code (including on GitHub) can access your
  services and rack up charges or steal data.

How do I fix it?
  Move the API key to a .env file and use environment variables.
  Any developer on your team can help with this - it takes about
  15 minutes.

Who should fix this?
  Any developer

How urgent is this?
  🚨 CRITICAL - Fix before deploying
```

**Text overlay:** "Perfect for PMs, designers, and non-technical team members!"

---

### [04:15-04:45] Next Steps

**Visual:** Split screen with multiple options

**Narration:**

> "Great job! You've completed your first VibeSec scan. From here, you have several options:"

**Screen:** Shows 4 panels:

```
┌─────────────────────┐  ┌─────────────────────┐
│  Fix Issues         │  │  CI/CD Integration  │
│                     │  │                     │
│  Work through each  │  │  Add to GitHub      │
│  finding and apply  │  │  Actions for        │
│  the recommended    │  │  automated scans    │
│  fixes              │  │                     │
└─────────────────────┘  └─────────────────────┘

┌─────────────────────┐  ┌─────────────────────┐
│  Custom Rules       │  │  Team Reports       │
│                     │  │                     │
│  Create rules for   │  │  Generate reports   │
│  your specific      │  │  for stakeholders   │
│  security needs     │  │  and executives     │
└─────────────────────┘  └─────────────────────┘
```

---

### [04:45-05:00] Closing

**Visual:** VibeSec logo with links

**Narration:**

> "Thanks for watching! Check out our other tutorials for CI/CD integration, plain language reports, and custom rules. Happy secure coding!"

**Screen:**

```
🔗 More Tutorials
   → CI/CD Integration (10 min)
   → Plain Language Reports (3 min)
   → Custom Rules (7 min)

📚 Documentation: https://docs.vibesec.dev
💬 Community: https://discord.gg/vibesec
⭐ GitHub: https://github.com/vibesec/vibesec

✨ VibeSec - Security for Vibe Coders
```

---

## Production Notes

### Visual Style

- **Color scheme:** Dark terminal background (#1e1e1e) with syntax highlighting
- **Font:** Monospace for code (Fira Code), sans-serif for overlays (Inter)
- **Animations:** Smooth transitions, typing effects for commands
- **Callouts:** Use arrows and highlights to draw attention

### Pacing

- Allow 2-3 seconds after each command for viewers to read
- Pause on important findings for 5-6 seconds
- Use slow typing animation for commands (not instant)

### Accessibility

- **Captions:** Full transcript as closed captions
- **Screen reader:** Descriptive narration of all visual elements
- **Colors:** High contrast, colorblind-friendly palette
- **Speed:** Moderate pace, clear pronunciation

### B-Roll Suggestions

- Code editor showing the vulnerable code
- GitHub repository view
- Team members reviewing results together
- Before/after comparison of fixed code

### Music

- Background music: Soft, non-distracting tech ambience
- Volume: -30dB under narration
- Genre: Lo-fi electronic, subtle beats

---

## Key Takeaways

By the end of this tutorial, viewers should be able to:

1. ✅ Install VibeSec on their system
2. ✅ Run their first security scan
3. ✅ Understand scan results and severity levels
4. ✅ Use plain-language mode for non-technical users
5. ✅ Know where to go next for advanced features

---

## Related Tutorials

- **Next:** [Plain Language Walkthrough (3 min)](./02-PLAIN-LANGUAGE-WALKTHROUGH.md)
- [CI/CD Integration (10 min)](./03-CICD-INTEGRATION.md)
- [Custom Rules (7 min)](./04-CUSTOM-RULES.md)

---

**Last Updated:** 2025-10-15
**Status:** Ready for Production
