# VibeSec Demo Examples

This directory contains intentionally vulnerable code examples for demonstrating VibeSec's capabilities.

**⚠️ WARNING:** These files contain security vulnerabilities by design. **DO NOT** use this code in production!

---

## Purpose

These examples demonstrate common security issues found in AI-generated code:
- Hardcoded secrets and API keys
- SQL and command injection vulnerabilities
- Incomplete or weak authentication
- Missing authorization checks
- Placeholder TODOs for security features

Use these files for:
- Creating demo videos
- Testing VibeSec functionality
- Training developers on AI code security
- Live presentations and workshops

---

## Example Files

### 1. `vulnerable-api.ts` - Injection Vulnerabilities

**Contains:**
- SQL injection via string concatenation
- Command injection in file conversion
- Missing authentication (TODO placeholder)

**Expected VibeSec Findings:**
```
✗ SQL Injection via String Concatenation (CRITICAL)
  File: vulnerable-api.ts:14
  Pattern: String concatenation in SQL query

✗ Command Injection Risk (CRITICAL)
  File: vulnerable-api.ts:25
  Pattern: Unsanitized user input in shell command

✗ Incomplete Implementation - Security TODO (HIGH)
  File: vulnerable-api.ts:33
  Pattern: TODO comment for authentication
```

**How to Demo:**
1. Show the SQL query concatenation (line 14)
2. Explain: "An attacker could inject: `' OR '1'='1`"
3. Scan with VibeSec: `vibesec scan demo-examples/vulnerable-api.ts`
4. Show detailed findings with fix recommendations

---

### 2. `vulnerable-secrets.ts` - Hardcoded Secrets

**Contains:**
- OpenAI API key
- Database credentials
- JWT secret
- AWS access keys
- RSA private key
- Slack webhook URL
- Stripe secret key

**Expected VibeSec Findings:**
```
✗ Hardcoded API Key Detected (CRITICAL)
  File: vulnerable-secrets.ts:11
  Pattern: OpenAI API key format

✗ Hardcoded Database Password (CRITICAL)
  File: vulnerable-secrets.ts:16
  Pattern: Database configuration with hardcoded password

✗ Hardcoded JWT Secret (HIGH)
  File: vulnerable-secrets.ts:22
  Pattern: JWT secret in configuration

✗ AWS Credentials Exposed (CRITICAL)
  File: vulnerable-secrets.ts:28-29
  Pattern: AWS access key and secret key

✗ Private Key in Source Code (CRITICAL)
  File: vulnerable-secrets.ts:35
  Pattern: RSA private key

✗ Slack Webhook URL (MEDIUM)
  File: vulnerable-secrets.ts:40
  Pattern: Slack webhook endpoint

✗ Stripe Secret Key (CRITICAL)
  File: vulnerable-secrets.ts:43
  Pattern: Stripe secret key format
```

**How to Demo:**
1. Show the config object with multiple secrets
2. Explain: "AI assistants often generate test credentials and forget to remove them"
3. Scan with VibeSec
4. Show how many critical issues are found instantly

---

### 3. `vulnerable-auth.ts` - Authentication Issues

**Contains:**
- Missing authentication on admin endpoints
- Weak password validation
- Insecure JWT implementation
- No rate limiting
- Insecure password reset
- Session management issues
- Authorization bypass

**Expected VibeSec Findings:**
```
✗ Missing Authentication (HIGH)
  File: vulnerable-auth.ts:13
  Pattern: Admin endpoint without authentication

✗ Weak Password Requirements (MEDIUM)
  File: vulnerable-auth.ts:21
  Pattern: Minimal password validation

✗ Insecure JWT Secret (HIGH)
  File: vulnerable-auth.ts:35
  Pattern: Hardcoded JWT secret

✗ Missing Rate Limiting (MEDIUM)
  File: vulnerable-auth.ts:45
  Pattern: Login endpoint without rate limiting

✗ Insecure Password Reset (HIGH)
  File: vulnerable-auth.ts:53
  Pattern: Password reset without verification

✗ Missing Authorization Check (HIGH)
  File: vulnerable-auth.ts:79
  Pattern: Delete operation without authorization
```

**How to Demo:**
1. Show the admin endpoint without auth (line 13)
2. Point out the TODO comment that never got implemented
3. Scan with VibeSec
4. Highlight the incomplete implementation pattern

---

## Using in Demos

### Quick Demo (2 minutes)
```bash
# Scan all examples
vibesec scan demo-examples/

# Expected: 15+ critical/high severity findings
```

### Interactive Demo with Claude Code (5 minutes)
1. Open Claude Code
2. Show vulnerable-secrets.ts
3. Ask Claude: "Can you review this configuration file?"
4. Claude generates response without noticing hardcoded secrets
5. Ask Claude: "Now scan it with VibeSec for security issues"
6. Claude uses vibesec_scan tool
7. Show VibeSec catching all the hardcoded secrets
8. Emphasize: "VibeSec caught what the AI missed"

### Deep Dive Demo (15 minutes)
1. **Setup** - Show MCP configuration
2. **Example 1** - vulnerable-secrets.ts (hardcoded keys)
3. **Example 2** - vulnerable-api.ts (injection attacks)
4. **Example 3** - vulnerable-auth.ts (incomplete auth)
5. **Fix Demonstration** - Show how to fix one vulnerability
6. **Rescan** - Verify fix with VibeSec
7. **Q&A** - Take questions

---

## Creating Your Own Demo Files

When creating additional demo files:

1. **Use realistic patterns** - Base on actual AI-generated code
2. **Add comments** - Explain why each example is vulnerable
3. **Keep it simple** - Each file should demonstrate 2-3 related issues
4. **Test with VibeSec** - Verify VibeSec detects the issues
5. **Document expected findings** - List what VibeSec should catch

### Template:
```typescript
/**
 * Demo Example: [Vulnerability Type]
 *
 * This file demonstrates [what vulnerability pattern]
 */

// VULNERABLE: [Brief description]
export function example() {
  // Vulnerable code here
}
```

---

## Recording Tips

### Screen Recording
- **Terminal font size:** 16-18pt minimum
- **Color scheme:** High contrast (light background recommended)
- **Window size:** 1920x1080 or larger
- **Cursor highlighting:** Enable for visibility

### Narration
- Speak at moderate pace
- Pause after showing each vulnerability
- Emphasize key phrases: "Notice here...", "VibeSec caught..."
- Keep technical jargon minimal

### Editing
- Trim dead time (waiting for scans)
- Add text overlays for key findings
- Zoom in on important code sections
- Use smooth transitions

---

## Live Demo Checklist

Before going live with a demo:

- [ ] Test VibeSec on examples (verify it works)
- [ ] Practice narration 2-3 times
- [ ] Prepare fallback if something breaks
- [ ] Have browser open to GitHub repo
- [ ] Terminal font size readable
- [ ] Internet connection stable (if live streaming)
- [ ] Backup recording if demo fails

---

## Extending These Examples

### Additional Examples to Create:

1. **vulnerable-llm.ts** - AI/LLM specific vulnerabilities
   - Prompt injection risks
   - Data exfiltration through AI
   - Model hallucination security implications

2. **vulnerable-react.ts** - Frontend vulnerabilities
   - XSS via dangerouslySetInnerHTML
   - CSRF missing protection
   - Client-side auth logic

3. **vulnerable-api-keys.ts** - API key management
   - Keys in environment variables (but committed .env)
   - Keys in logs
   - Keys in error messages

4. **vulnerable-regex.ts** - ReDoS vulnerabilities
   - Catastrophic backtracking patterns
   - Unanchored regex
   - Overly complex regex

### Contributing Examples

If you create additional examples:
1. Follow the naming convention: `vulnerable-[category].ts`
2. Add comprehensive comments
3. Document expected findings in this README
4. Test with VibeSec before committing
5. Submit PR with description of what it demonstrates

---

## Safety Notice

**These files are intentionally vulnerable.**

- ❌ Never use in production
- ❌ Never deploy to public servers
- ❌ Never commit actual credentials (even for demos)
- ✅ Use only for local testing and demos
- ✅ Mark clearly as demonstration code
- ✅ Keep in dedicated demo directory

---

## Troubleshooting

### VibeSec not detecting issues?

1. **Check rule files:** `vibesec list-rules`
2. **Verify file types:** Only `.ts` files scanned by default
3. **Check severity filter:** Use `--severity low` to see all issues
4. **Update rules:** `git pull` to get latest detection patterns

### Demo not working?

1. **Restart MCP server:** Kill and restart Claude Code
2. **Check configuration:** Verify `~/.claude/mcp.json`
3. **Test CLI directly:** Run `vibesec scan demo-examples/`
4. **Check logs:** Look for error messages

---

## Resources

- **VibeSec Documentation:** [README.md](../README.md)
- **Demo Script:** [DEMO_SCRIPT.md](../DEMO_SCRIPT.md)
- **Launch Content:** [LAUNCH_CONTENT.md](../LAUNCH_CONTENT.md)
- **Quick Start:** [QUICK_START.md](../QUICK_START.md)

---

**Remember:** These examples show what VibeSec can catch. Real AI-generated vulnerabilities may be more subtle but follow similar patterns.

Good luck with your demo! 🚀
