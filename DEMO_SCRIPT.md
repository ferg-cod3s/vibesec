# VibeSec Demo Video Script

**Duration:** 2-3 minutes
**Target Audience:** Developers using AI coding assistants
**Goal:** Show VibeSec catching vulnerabilities that AI assistants miss

---

## Scene 1: Hook (0:00-0:10)

**Visual:** Terminal with Claude Code open

**Script:**

> "I just built a security scanner that works INSIDE my AI coding assistant. Watch it catch a vulnerability that Claude missed..."

**Action:** Show Claude Code interface

---

## Scene 2: The Problem (0:10-0:30)

**Visual:** Split screen - Claude Code generating code with vulnerability

**Script:**

> "AI coding assistants like Claude Code, Cursor, and Copilot are amazing for productivity. But sometimes they generate code with security issues."

**Action:**

1. Ask Claude: "Create a simple Express API endpoint that queries users by name"
2. Show Claude generating code like:

```typescript
app.get('/users', (req, res) => {
  const name = req.query.name;
  const query = `SELECT * FROM users WHERE name = '${name}'`;
  db.query(query, (err, results) => {
    res.json(results);
  });
});
```

**Script:**

> "This looks fine, right? But there's a critical SQL injection vulnerability here."

---

## Scene 3: The Solution (0:30-1:30)

**Visual:** Using VibeSec to scan the code

**Script:**

> "This is where VibeSec comes in. It integrates directly with Claude Code through MCP - the Model Context Protocol."

**Action:**

1. In Claude Code, type: "Can you scan this file for security issues using VibeSec?"
2. Show Claude invoking `vibesec_scan` tool
3. Show VibeSec results:

```
Found 1 critical vulnerability:
  - SQL Injection via String Concatenation
  - File: src/api.ts:3
  - Severity: CRITICAL

The query concatenates user input directly into SQL.
An attacker could inject malicious SQL code.

Recommendation: Use parameterized queries instead:
  const query = 'SELECT * FROM users WHERE name = ?';
  db.query(query, [name], ...);
```

**Script:**

> "VibeSec caught it immediately. It not only identifies the vulnerability, but explains WHY it's dangerous and HOW to fix it."

---

## Scene 4: What Makes VibeSec Different (1:30-2:00)

**Visual:** Show vibesec_list_rules tool

**Script:**

> "VibeSec is built specifically for AI-generated code. It catches patterns that AI assistants commonly miss:"

**Action:** Run `vibesec_list_rules` to show detection categories

**Show list:**

- 🔑 Hardcoded secrets & API keys
- 💉 SQL injection vulnerabilities
- 🖥️ Command injection risks
- 📁 Path traversal issues
- ⚠️ Incomplete implementations (TODOs)
- 🔐 Auth/authorization flaws
- 🤖 AI-specific risks (prompt injection)

**Script:**

> "And it works IN your workflow - not as a separate tool you have to remember to run."

---

## Scene 5: Setup (2:00-2:30)

**Visual:** Show configuration file

**Script:**

> "Setup takes 2 minutes. Just add VibeSec to your MCP configuration:"

**Action:** Show `~/.claude/mcp.json`:

```json
{
  "mcpServers": {
    "vibesec": {
      "command": "bun",
      "args": ["run", "/path/to/vibesec/bin/vibesec-mcp"]
    }
  }
}
```

**Script:**

> "Restart Claude Code, and you're done. That's it."

---

## Scene 6: Call to Action (2:30-2:50)

**Visual:** GitHub repo README

**Script:**

> "VibeSec is open source and completely free. Your code never leaves your machine - everything runs locally."

**Show on screen:**

- GitHub: github.com/ferg-cod3s/vibesec
- MIT License
- 100% Local Scanning
- Works with Claude Code, Cursor, Cline

**Script:**

> "Try it yourself. Link in the description. What vulnerabilities will it find in YOUR code?"

---

## Scene 7: Closing (2:50-3:00)

**Visual:** Terminal showing successful scan

**Script:**

> "Code fast. Code safe. Code with VibeSec."

**Show:** Star button on GitHub repo

---

## Recording Tips

### Camera Setup

- **Screen recording:** OBS Studio or Loom
- **Resolution:** 1920x1080 minimum
- **Frame rate:** 30fps
- **Audio:** Clear mic, minimize background noise

### Editing

- **Tool:** DaVinci Resolve (free) or Loom (no editing)
- **Transitions:** Simple cuts, no fancy effects
- **Text overlays:** Key points and URLs
- **Background music:** Optional, keep it subtle

### Best Practices

- Practice the script 2-3 times before recording
- Speak clearly and at moderate pace
- Show real vulnerabilities, not contrived examples
- Keep terminal text readable (increase font size)
- Add captions for accessibility

---

## Variations for Different Platforms

### YouTube (Full 3-minute version)

- Include all scenes
- Add intro/outro bumpers
- Detailed explanations
- Links in description

### Twitter/X (30-second clip)

- Hook + Problem + Solution only
- Fast-paced editing
- Text overlays for context
- Direct link to GitHub in thread

### LinkedIn (90-second professional version)

- Hook + Solution + Business value
- Emphasize security and compliance
- Professional tone
- Focus on team/enterprise benefits

---

## Key Messages to Emphasize

1. **AI coding is productive but risky** - 45% of AI-generated code has security issues
2. **VibeSec works IN your workflow** - Not a separate tool to remember
3. **Built specifically for AI code** - Catches patterns AI assistants miss
4. **Setup is instant** - 2 minutes to full security scanning
5. **100% local** - Your code never leaves your machine
6. **Open source & free** - No vendor lock-in, community-driven

---

## Demo Files to Prepare

Create these example files before recording:

### 1. `vulnerable-api.ts` (SQL Injection)

```typescript
import express from 'express';
import { db } from './database';

const app = express();

app.get('/users', (req, res) => {
  const name = req.query.name;
  const query = `SELECT * FROM users WHERE name = '${name}'`;
  db.query(query, (err, results) => {
    res.json(results);
  });
});
```

### 2. `vulnerable-secrets.ts` (Hardcoded Secrets)

```typescript
const config = {
  apiKey: 'sk-1234567890abcdef',
  dbPassword: 'admin123',
  jwtSecret: 'my-secret-key',
};

export default config;
```

### 3. `vulnerable-command.ts` (Command Injection)

```typescript
import { exec } from 'child_process';

export function processFile(filename: string) {
  exec(`convert ${filename} output.png`, (error, stdout) => {
    console.log(stdout);
  });
}
```

---

## Success Metrics

Track these after publishing:

- **Views:** 500+ in first week
- **Engagement:** 10%+ like/comment rate
- **Click-through:** 5%+ to GitHub repo
- **Stars:** 50+ GitHub stars
- **Conversions:** 10+ MCP installations

---

## Distribution Checklist

- [ ] Upload to YouTube
- [ ] Share full video on Twitter/X with thread
- [ ] Post 30-second clip on LinkedIn
- [ ] Submit to r/ClaudeAI subreddit
- [ ] Share in Claude Discord #show-and-tell
- [ ] Post in Cursor community
- [ ] Share in relevant Slack/Discord communities
- [ ] Email to 5-10 developer friends
- [ ] Add video embed to GitHub README

---

## Backup Plan (If Video is Too Much)

If creating a polished video is too time-consuming, do this instead:

1. **Record raw screen capture** (no editing, 5 minutes)
2. **Write detailed blog post** with screenshots
3. **Create GIF demo** for README (30 seconds, looping)
4. **Screenshots + captions** for Twitter thread

The key is to SHOW the tool working, not have perfect production quality.
