# VibeSec Usage Guide

## 🎯 Quick Start

### CLI Usage

```bash
# Scan current directory
vibesec scan .

# Scan specific file
vibesec scan src/app.ts

# Scan with explanations (for non-technical users)
vibesec scan . --explain

# Generate stakeholder report
vibesec scan . -f stakeholder -o security-report.txt

# Only show critical issues
vibesec scan . --severity critical

# Use custom rules
vibesec scan . --rules ./custom-security-rules/
```

### MCP Usage (AI Assistants)

In Claude Code, Cursor, or Cline:

```
# Scan a file
Claude, use vibesec_scan to check src/auth.ts for security issues

# List available rules
Claude, show me all available security rules using vibesec_list_rules

# Scan before committing
Claude, before I commit, scan all my changed files for vulnerabilities

# Get specific rule details
Claude, use vibesec_list_rules to find rules related to authentication
```

---

## 📊 Command Line Options

### Basic Commands

| Command      | Description                                | Example              |
| ------------ | ------------------------------------------ | -------------------- |
| `scan`       | Scan files/directories for vulnerabilities | `vibesec scan src/`  |
| `list-rules` | List all available detection rules         | `vibesec list-rules` |
| `benchmark`  | Run performance benchmarks                 | `vibesec benchmark`  |
| `--help`     | Show help information                      | `vibesec --help`     |
| `--version`  | Show version information                   | `vibesec --version`  |

### Scan Options

| Option       | Short | Description                                          | Example                                |
| ------------ | ----- | ---------------------------------------------------- | -------------------------------------- |
| `--explain`  | `-e`  | Show plain-language explanations                     | `vibesec scan . --explain`             |
| `--format`   | `-f`  | Output format (json, plaintext, stakeholder)         | `vibesec scan . -f json`               |
| `--output`   | `-o`  | Output file path                                     | `vibesec scan . -o report.txt`         |
| `--severity` | `-s`  | Minimum severity level (low, medium, high, critical) | `vibesec scan . --severity high`       |
| `--rules`    | `-r`  | Custom rules directory                               | `vibesec scan . --rules ./custom/`     |
| `--exclude`  | `-x`  | Exclude patterns                                     | `vibesec scan . --exclude "*.test.ts"` |
| `--no-color` |       | Disable colored output                               | `vibesec scan . --no-color`            |

---

## 🔍 MCP Tools Reference

### vibesec_scan

Scans files or directories for security vulnerabilities.

**Parameters:**

- `file` (string, required): Path to file or directory to scan
- `severity` (string, optional): Minimum severity level (low, medium, high, critical)
- `rules` (string, optional): Custom rules directory path
- `explain` (boolean, optional): Include plain-language explanations

**Examples:**

```
# Basic scan
vibesec_scan --file "src/auth.ts"

# Scan with high severity threshold
vibesec_scan --file "src/" --severity "high"

# Scan with explanations
vibesec_scan --file "src/" --explain true

# Scan with custom rules
vibesec_scan --file "src/" --rules "./custom-rules/"
```

### vibesec_list_rules

Lists all available security detection rules.

**Parameters:**

- `category` (string, optional): Filter by rule category
- `severity` (string, optional): Filter by severity level
- `search` (string, optional): Search term in rule descriptions

**Examples:**

```
# List all rules
vibesec_list_rules

# List authentication rules
vibesec_list_rules --category "auth"

# List high severity rules
vibesec_list_rules --severity "high"

# Search for SQL injection rules
vibesec_list_rules --search "sql"
```

---

## 📋 Output Formats

### 1. Default Output

Human-readable colored output with severity indicators:

```
🔍 Scanning ./src/auth.ts...
⚠️  [MEDIUM] Hardcoded secret detected
   → Line 23: const API_KEY = "sk-1234567890abcdef";
   → Risk: API keys exposed in source code
   → Fix: Use environment variables or secret management

🚨 [HIGH] SQL injection vulnerability
   → Line 45: const query = `SELECT * FROM users WHERE id = ${userId}`;
   → Risk: SQL injection through string concatenation
   → Fix: Use parameterized queries

✅ Scan completed: 2 issues found (1 high, 1 medium)
```

### 2. JSON Output

Machine-readable JSON format:

```bash
vibesec scan . -f json
```

```json
{
  "summary": {
    "total_issues": 2,
    "severity_breakdown": {
      "critical": 0,
      "high": 1,
      "medium": 1,
      "low": 0
    },
    "security_score": 75
  },
  "issues": [
    {
      "id": "hardcoded-secret-001",
      "rule": "auth-hardcoded-secrets",
      "severity": "medium",
      "file": "src/auth.ts",
      "line": 23,
      "column": 15,
      "message": "Hardcoded secret detected",
      "description": "API keys exposed in source code",
      "recommendation": "Use environment variables or secret management",
      "code_snippet": "const API_KEY = \"sk-1234567890abcdef\";"
    }
  ]
}
```

### 3. Stakeholder Output

Plain-language report for non-technical stakeholders:

```bash
vibesec scan . -f stakeholder -o report.txt
```

```
SECURITY ASSESSMENT REPORT
========================

Project: My Web Application
Date: October 22, 2025
Overall Security Score: 75/100 (Good)

EXECUTIVE SUMMARY
-----------------
We found 2 security issues that need attention:
- 1 HIGH priority issue that should be fixed this week
- 1 MEDIUM priority issue that should be fixed this month

WHAT WE FOUND
-------------

HIGH: SQL Injection Risk (Fix this week)
What: User input is directly inserted into database queries
Why: Attackers could steal or modify all user data
How to fix: Use parameterized queries instead of string concatenation
Who can fix: Any backend developer (1-2 hours)
Impact: Prevents data breaches and protects customer information

MEDIUM: Hardcoded API Keys (Fix this month)
What: Secret API keys are visible in the source code
Why: If the code is leaked, attackers can access external services
How to fix: Move API keys to environment variables
Who can fix: Any developer (30 minutes)
Impact: Prevents unauthorized access to third-party services

RECOMMENDATIONS
----------------
1. Fix the HIGH priority SQL injection issue immediately
2. Move all hardcoded secrets to environment variables
3. Set up automated security scanning in your deployment pipeline
4. Schedule quarterly security assessments

NEXT STEPS
-----------
1. This week: Fix SQL injection vulnerability
2. This month: Move all secrets to environment variables
3. Next quarter: Implement automated security scanning
```

---

## 🎯 Common Use Cases

### 1. Development Workflow

```bash
# Before committing changes
git add .
vibesec scan $(git diff --cached --name-only)

# As a git pre-commit hook
#!/bin/sh
vibesec scan $(git diff --cached --name-only)
if [ $? -ne 0 ]; then
  echo "Security issues found. Please fix before committing."
  exit 1
fi
```

### 2. CI/CD Integration

```yaml
# .github/workflows/security.yml
name: Security Scan
on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install VibeSec
        run: npm install -g vibesec
      - name: Run Security Scan
        run: vibesec scan . -f json -o security-report.json
      - name: Upload Results
        uses: actions/upload-artifact@v3
        with:
          name: security-report
          path: security-report.json
```

### 3. AI Assistant Integration

```
# Daily workflow with Claude Code
Claude, every morning I want you to:
1. Scan all files I changed yesterday for security issues
2. Explain any high or critical findings in plain English
3. Suggest specific code fixes for each issue
4. Create a checklist of security tasks for today

# Before deploying
Claude, please run vibesec_scan on the entire codebase and:
1. Check for any new security issues
2. Compare with last week's security score
3. Generate a stakeholder report for the team
4. Flag anything that would block production deployment
```

### 4. Team Collaboration

```bash
# Generate team-friendly reports
vibesec scan . -f stakeholder -o weekly-security-report.txt

# Create security tickets
vibesec scan . -f json | jq '.issues[] | select(.severity == "high")' | \
  while read issue; do
    # Create GitHub issue for each high-severity finding
    gh issue create \
      --title "Security: $(echo $issue | jq -r '.message')" \
      --body "$(echo $issue | jq -r '.description')" \
      --label "security,high-priority"
  done
```

---

## 🔧 Advanced Configuration

### Project Configuration (.vibesec.yaml)

```yaml
# .vibesec.yaml
version: 1

# Scan configuration
scan:
  paths:
    - src/
    - lib/
  exclude:
    - node_modules/
    - '*.test.ts'
    - '*.spec.ts'
    - dist/

# Severity settings
severity:
  fail_on: high # Fail CI if high/critical issues found
  score_threshold: 70 # Minimum security score

# Detector settings
detectors:
  secrets:
    enabled: true
    patterns:
      - api_key
      - password
      - token

  injection:
    enabled: true
    check_sql: true
    check_xss: true
    check_command_injection: true

  auth:
    enabled: true
    check_hardcoded_secrets: true
    check_weak_passwords: true

# Output settings
output:
  format: plaintext
  include_code_snippets: true
  max_issues_per_file: 10

# Integration settings
integrations:
  sentry:
    enabled: true
    dsn: ${SENTRY_DSN}

  github:
    enabled: true
    create_issues: true
    issue_label: 'security'
```

### Custom Rules

Create custom detection rules in YAML:

```yaml
# custom-rules/company-specific.yaml
rules:
  - id: 'company-internal-api'
    name: 'Internal API Exposure'
    category: 'data-exposure'
    severity: 'high'
    description: 'Internal API endpoints exposed in production code'
    patterns:
      - regex: "api\\.internal\\.company\\.com"
        languages: ['javascript', 'typescript']
    recommendation: 'Remove internal API references from production code'

  - id: 'debug-code-in-production'
    name: 'Debug Code in Production'
    category: 'best-practices'
    severity: 'medium'
    description: 'Debug statements found in production code'
    patterns:
      - regex: "console\\.(log|debug|warn)"
        languages: ['javascript', 'typescript']
        exclude_files: ['*.test.ts', '*.spec.ts']
    recommendation: 'Remove debug statements before deployment'
```

Use custom rules:

```bash
vibesec scan . --rules ./custom-rules/
```

---

## 📈 Performance Tips

### 1. Optimize Scan Speed

```bash
# Scan only changed files
vibesec scan $(git diff --name-only HEAD~1)

# Exclude test files and dependencies
vibesec scan . --exclude "*.test.ts" --exclude "node_modules/"

# Use higher severity threshold for faster scans
vibesec scan . --severity high
```

### 2. Parallel Processing

VibeSec automatically processes files in parallel. For large codebases:

```bash
# Limit parallelism to reduce memory usage
VIBESEC_WORKERS=4 vibesec scan .

# Use Bun for better performance (if installed)
bun run vibesec scan .
```

### 3. Incremental Scanning

For CI/CD, scan only changed files:

```bash
#!/bin/bash
# Scan only files changed in last commit
CHANGED_FILES=$(git diff --name-only HEAD~1 HEAD)
if [ -n "$CHANGED_FILES" ]; then
  vibesec scan $CHANGED_FILES
fi
```

---

## 🎨 Customization

### Output Themes

Set environment variable for different themes:

```bash
# Dark theme
VIBESEC_THEME=dark vibesec scan .

# High contrast
VIBESEC_THEME=high-contrast vibesec scan .

# No colors (for scripts)
VIBESEC_THEME=none vibesec scan .
```

### Custom Report Templates

Create custom Jinja2 templates for reports:

```html
<!-- custom-template.html -->
<!DOCTYPE html>
<html>
  <head>
    <title>Security Report - {{ date }}</title>
  </head>
  <body>
    <h1>Security Assessment</h1>
    <p>Security Score: {{ security_score }}/100</p>

    {% for issue in issues %}
    <div class="issue {{ issue.severity }}">
      <h3>{{ issue.message }}</h3>
      <p><strong>File:</strong> {{ issue.file }}:{{ issue.line }}</p>
      <p><strong>Severity:</strong> {{ issue.severity }}</p>
      <p><strong>Description:</strong> {{ issue.description }}</p>
      <p><strong>Fix:</strong> {{ issue.recommendation }}</p>
    </div>
    {% endfor %}
  </body>
</html>
```

Use custom template:

```bash
vibesec scan . --template custom-template.html -o report.html
```

---

## 🔍 Troubleshooting

### Common Issues

1. **No issues found but vulnerabilities exist**
   - Check if file patterns are included in scan
   - Verify custom rules are loaded correctly
   - Ensure severity threshold isn't too high

2. **Too many false positives**
   - Adjust rule patterns in custom rules
   - Use exclude patterns for known safe code
   - Report false positives to improve detection

3. **Performance issues**
   - Limit scan scope with specific paths
   - Exclude large directories (node_modules, dist)
   - Reduce worker count: `VIBESEC_WORKERS=2`

4. **MCP server not responding**
   - Check file paths in MCP configuration
   - Verify Node.js/Bun installation
   - Restart AI assistant completely

### Debug Mode

Enable detailed logging:

```bash
# CLI debugging
DEBUG=vibesec:* vibesec scan .

# MCP server debugging
export DEBUG=vibesec:*
# Then restart your AI assistant
```

### Getting Help

- **Documentation**: [docs.vibesec.dev](https://docs.vibesec.dev)
- **GitHub Issues**: [Report a problem](https://github.com/vibesec/vibesec/issues)
- **Community**: [Discord Server](https://discord.gg/vibesec)
- **Email**: support@vibesec.dev

---

## 🚀 Best Practices

### Development Workflow

1. **Scan Early, Scan Often**
   - Run `vibesec scan .` before each commit
   - Set up git pre-commit hooks
   - Integrate with your IDE

2. **Fix Issues Promptly**
   - Address critical issues immediately
   - Plan fixes for high/medium issues
   - Track security debt alongside technical debt

3. **Team Communication**
   - Share stakeholder reports with PMs
   - Discuss security findings in team meetings
   - Educate team on secure coding practices

### Security Mindset

1. **Defense in Depth**
   - Use VibeSec alongside other security tools
   - Implement multiple layers of security testing
   - Don't rely on a single tool

2. **Continuous Improvement**
   - Review and update custom rules regularly
   - Stay informed about new vulnerability patterns
   - Contribute rules back to the community

3. **Security by Design**
   - Consider security during architecture decisions
   - Use VibeSec findings to improve coding standards
   - Make security part of your definition of done

Happy secure coding! 🛡️
