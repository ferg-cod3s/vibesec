# Video Tutorial Script: Creating Custom Rules

**Duration:** 7 minutes
**Target Audience:** Developers and security engineers
**Prerequisites:** Basic regex knowledge, YAML familiarity

---

## Script Outline

### [00:00-00:30] Introduction

**Visual:** Code editor with YAML file

**Narration:**
> "Hey everyone! While VibeSec comes with 90+ built-in security rules, sometimes you need to detect patterns specific to your codebase - internal APIs, deprecated functions, or company security policies. In this tutorial, we'll create custom detection rules from scratch. Let's get started!"

**Screen:**
```
Creating Custom VibeSec Rules

What you'll learn:
  • Rule file structure (YAML)
  • Pattern matching with regex
  • Testing your custom rules
  • Sharing rules with your team

Duration: 7 minutes
```

---

### [00:30-01:30] Rule File Structure

**Visual:** Split screen - empty file → completed rule

**Narration:**
> "Custom rules are defined in YAML files. Let's create our first rule to detect usage of a deprecated internal API."

**Screen - Create rules directory:**
```bash
$ mkdir -p .vibesec/rules
$ touch .vibesec/rules/my-custom-rules.yaml
```

**Narration (continued):**
> "Every rule needs six essential fields: id, name, description, severity, category, and patterns. Let's build one together."

**Screen - Editor showing `.vibesec/rules/my-custom-rules.yaml`:**
```yaml
# Empty file with just comments
# VibeSec Custom Rules
# Created: 2025-10-15
```

**Text overlay:** "Let's fill this in step by step! 📝"

---

### [01:30-03:00] Building Your First Rule

**Visual:** Type out rule field by field with explanations

**Narration:**
> "We'll detect usage of our deprecated 'oldAuth' API. First, give it a unique ID and name."

**Screen - Add ID and name:**
```yaml
id: deprecated-old-auth-api
name: Usage of Deprecated oldAuth API
```

**Narration (continued):**
> "Next, add a clear description so developers know what the issue is."

**Screen - Add description:**
```yaml
description: |
  The oldAuth API has been deprecated since v2.0 and will be
  removed in v3.0. Use the new authentication module instead.
```

**Narration (continued):**
> "Set the severity - since this is a deprecation warning, 'medium' is appropriate."

**Screen - Add severity:**
```yaml
severity: medium
```

**Narration (continued):**
> "Choose a category. Since this is company-specific, we'll use 'custom'."

**Screen - Add category:**
```yaml
category: custom
```

**Narration (continued):**
> "Now the important part - the regex pattern that matches the problematic code."

**Screen - Add pattern:**
```yaml
patterns:
  - regex: oldAuth\.(login|logout|verify)
    flags: g
```

**Text overlay shows what the pattern matches:**
```javascript
// Matches:
oldAuth.login(...)
oldAuth.logout(...)
oldAuth.verify(...)

// Does not match:
newAuth.login(...)
oldAuthentication.login(...)
```

**Narration (continued):**
> "Specify which languages this rule applies to."

**Screen - Add languages:**
```yaml
languages:
  - javascript
  - typescript
```

**Narration (continued):**
> "And finally, provide a fix recommendation with helpful links."

**Screen - Complete rule:**
```yaml
fix:
  template: |
    Replace with the new authentication module:
    Old: oldAuth.login(user, pass)
    New: import { auth } from '@company/auth'
         auth.authenticate(user, pass)
  references:
    - https://docs.company.com/auth-migration
    - https://github.com/company/auth-module

metadata:
  cwe: CWE-477
  tags:
    - deprecated
    - internal-api
    - migration-needed

enabled: true
```

**Text overlay:** "✅ Your first custom rule is complete!"

---

### [03:00-04:00] Testing Your Rule

**Visual:** Terminal + test file

**Narration:**
> "Before rolling out your rule, let's test it. Create a simple test file with the pattern you're trying to catch."

**Screen - Create test file `test-deprecated.js`:**
```javascript
// test-deprecated.js
import { oldAuth } from './legacy';

function loginUser(username, password) {
  // This should trigger our rule
  return oldAuth.login(username, password);
}

function verifyToken(token) {
  // This should also trigger
  return oldAuth.verify(token);
}
```

**Narration (continued):**
> "Now run VibeSec with your custom rules directory."

**Screen - Terminal:**
```bash
$ vibesec scan test-deprecated.js --rules .vibesec/rules

🔍 Loading custom rules from .vibesec/rules
✓ Loaded 1 custom rule

Scanning...

Medium: Usage of Deprecated oldAuth API
────────────────────────────────────────────────
The oldAuth API has been deprecated since v2.0

📍 Location: test-deprecated.js:6
💡 Found: oldAuth.login

  return oldAuth.login(username, password);
         ^^^^^^^^^^^^^^

Fix: Replace with the new authentication module
🔗 https://docs.company.com/auth-migration

────────────────────────────────────────────────

Found 2 issues (0 critical, 0 high, 2 medium, 0 low)
```

**Text overlay:** "🎯 Rule works perfectly!"

---

### [04:00-05:00] Advanced Pattern Matching

**Visual:** Side-by-side code examples

**Narration:**
> "Let's create a more complex rule that detects insecure random number generation."

**Screen - New rule:**
```yaml
id: insecure-random
name: Insecure Random Number Generation
description: |
  Math.random() is not cryptographically secure and should not
  be used for security-sensitive operations like tokens or passwords.

severity: high
category: cryptography

patterns:
  # Match Math.random() in security contexts
  - regex: (token|password|secret|key|id).*Math\.random\(\)
    flags: gi
    multiline: true

  # Also catch the reverse pattern
  - regex: Math\.random\(\).*(token|password|secret|key|id)
    flags: gi
    multiline: true

languages:
  - javascript
  - typescript

fix:
  template: |
    Use crypto.randomBytes() for cryptographic operations:
    const crypto = require('crypto');
    const token = crypto.randomBytes(32).toString('hex');
  references:
    - https://nodejs.org/api/crypto.html#cryptorandombytessize-callback

metadata:
  cwe: CWE-338
  owasp: A02:2021-Cryptographic Failures
  tags:
    - cryptography
    - random
    - security-sensitive

enabled: true
```

**Visual:** Show examples this catches

**Screen - Test code:**
```javascript
// ❌ These will be caught:
const token = Math.random().toString();
const password = generatePassword(Math.random());
const secret = `secret_${Math.random()}`;

// ✅ These are fine:
const animationDelay = Math.random() * 1000;
const colorIndex = Math.floor(Math.random() * colors.length);
```

---

### [05:00-05:45] Multiple Patterns in One Rule

**Visual:** Editor showing rule with multiple patterns

**Narration:**
> "You can define multiple patterns in a single rule to catch different variations of the same issue."

**Screen:**
```yaml
id: hardcoded-production-urls
name: Hardcoded Production URLs
description: Production URLs should come from environment config

severity: medium
category: custom

patterns:
  # API endpoints
  - regex: https?://api\.production\.company\.com
    flags: gi

  # Database connections
  - regex: prod-db-\d+\.company\.com
    flags: gi

  # S3 buckets
  - regex: s3://company-prod-bucket
    flags: gi

languages:
  - javascript
  - typescript
  - python
  - yaml
  - json

fix:
  template: |
    Use environment variables:
    const API_URL = process.env.API_URL || 'https://api.dev.company.com';
  references:
    - https://12factor.net/config

enabled: true
```

**Text overlay:** "One rule, many patterns! 🎯"

---

### [05:45-06:30] Organizing and Sharing Rules

**Visual:** File structure

**Narration:**
> "For team collaboration, organize rules into separate files by category."

**Screen - File structure:**
```
.vibesec/
├── rules/
│   ├── deprecated-apis.yaml
│   ├── company-security.yaml
│   ├── internal-patterns.yaml
│   └── README.md
└── .vibesec.yaml
```

**Narration (continued):**
> "Add a README to document your custom rules."

**Screen - `.vibesec/rules/README.md`:**
```markdown
# Company Custom Security Rules

## deprecated-apis.yaml
Rules for detecting deprecated internal APIs.
Update this file when APIs are deprecated.

## company-security.yaml
Company-specific security policies and patterns.
Maintained by: Security Team

## internal-patterns.yaml
Internal code patterns that should be avoided.
Maintained by: Platform Team

## Adding New Rules
1. Create rule in appropriate file
2. Test with `vibesec scan --rules .vibesec/rules`
3. Submit PR for team review
4. Document in this README
```

**Visual:** Show git commit

**Screen:**
```bash
$ git add .vibesec/
$ git commit -m "Add custom security rules for internal APIs"
$ git push origin main
```

**Text overlay:** "✅ Rules are now shared with your team!"

---

### [06:30-06:55] Rule Configuration

**Visual:** Config file

**Narration:**
> "Finally, configure your project to always use these custom rules."

**Screen - `.vibesec.yaml`:**
```yaml
version: 1

scan:
  paths:
    - src/
    - lib/
  exclude:
    - node_modules/**
    - dist/**

# Custom rules directory
rules:
  path: .vibesec/rules
  # Optionally disable specific rules
  disabled:
    - rule-id-to-disable

# Severity handling
severity:
  fail_on: high
  # Elevate custom rules to higher severity
  elevate:
    deprecated-old-auth-api: high
```

**Text overlay:** "Configure once, use everywhere! 🎯"

---

### [06:55-07:00] Closing

**Visual:** Summary checklist

**Narration:**
> "Perfect! You can now create custom rules tailored to your codebase and security policies. Happy rule writing!"

**Screen:**
```
✅ You've learned:
  • Rule file structure (YAML)
  • Pattern matching with regex
  • Testing custom rules
  • Advanced pattern techniques
  • Organizing and sharing rules
  • Project configuration

🔗 Resources:
  • Rule Examples: docs.vibesec.dev/examples
  • Regex Tester: regex101.com
  • Community Rules: github.com/vibesec/rules

📚 More tutorials:
  → Getting Started (5 min)
  → CI/CD Integration (10 min)
  → Plain Language Reports (3 min)

💬 Share your rules: discord.gg/vibesec
```

---

## Production Notes

### Visual Style
- **Syntax highlighting:** Use proper YAML highlighting
- **Diff view:** Show before/after when editing rules
- **Test results:** Show actual scan output, not mocked
- **Regex visualization:** Consider using regex101.com for pattern explanation

### Pacing
- **YAML files:** Allow 4-5 seconds to read each complete rule
- **Pattern matching:** Pause to explain regex patterns
- **Test output:** Show full scan results with enough time to read

### Accessibility
- **Captions:** Include regex patterns in captions
- **Color coding:** Use consistent colors for severity levels
- **Annotations:** Point out important YAML keys
- **Examples:** Show concrete code that matches patterns

### Code Examples
Use real, production-quality examples:
- Actual deprecated API patterns
- Real security vulnerabilities
- Genuine company-specific patterns
- Practical fix recommendations

### B-Roll Suggestions
- Developer writing rules in VS Code
- Team reviewing rule PRs on GitHub
- Security scan catching custom rule violations
- Before/after: code with issue → fixed code
- Regex testing on regex101.com

### Common Pitfalls to Address
1. **Regex escaping:** Mention need to escape special chars
2. **False positives:** Show how to make patterns specific
3. **Performance:** Warn about complex multiline patterns
4. **Testing:** Emphasize testing before deployment

---

## Key Takeaways

By the end of this tutorial, viewers should be able to:
1. ✅ Create custom detection rules in YAML format
2. ✅ Write regex patterns to match problematic code
3. ✅ Test custom rules before deployment
4. ✅ Use advanced features (multiple patterns, multiline)
5. ✅ Organize rules for team collaboration
6. ✅ Configure projects to use custom rules
7. ✅ Share rules via version control

---

## Example Rules Library

Include links to example rules:

### Security Patterns
```yaml
# Detect hardcoded credentials
- regex: (password|secret|key)\s*=\s*['"]\w+['"]
```

### Deprecated APIs
```yaml
# Detect old function calls
- regex: oldFunction\(
```

### Code Quality
```yaml
# Detect console.log in production
- regex: console\.(log|debug|info)\(
```

### Company Policies
```yaml
# Require specific import patterns
- regex: import.*from\s+['"](?!@company/)
```

---

## Troubleshooting Guide

**Problem:** Rule not triggering
**Solution:** Check regex with regex101.com, ensure flags are correct

**Problem:** Too many false positives
**Solution:** Make pattern more specific, add context words

**Problem:** Rule runs slowly
**Solution:** Avoid complex multiline patterns, split into multiple rules

---

## Related Tutorials

- **Previous:** [CI/CD Integration (10 min)](./03-CICD-INTEGRATION.md)
- [Getting Started (5 min)](./01-GETTING-STARTED.md)
- [Plain Language Walkthrough (3 min)](./02-PLAIN-LANGUAGE-WALKTHROUGH.md)

---

## Advanced Topics (Not Covered, Link Only)

- AST-based rules (future)
- Data flow analysis (future)
- Inter-procedural analysis (future)
- Machine learning rules (future)

---

**Last Updated:** 2025-10-15
**Status:** Ready for Production
**Target:** Developers and Security Engineers
