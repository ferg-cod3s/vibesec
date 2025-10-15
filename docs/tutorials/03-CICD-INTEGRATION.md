# Video Tutorial Script: CI/CD Integration

**Duration:** 10 minutes
**Target Audience:** Developers and DevOps engineers
**Prerequisites:** Basic GitHub Actions or CI/CD knowledge

---

## Script Outline

### [00:00-00:30] Introduction

**Visual:** Code pipeline visualization

**Narration:**
> "Welcome! In this tutorial, we'll integrate VibeSec into your CI/CD pipeline to automatically scan every pull request and commit. By the end, you'll have security checks running automatically, catching issues before they reach production. Let's get started!"

**Screen:**
```
Continuous Security with VibeSec

What you'll learn:
  • GitHub Actions integration
  • PR comments and annotations
  • Blocking builds on security issues
  • SARIF integration with GitHub Security

Duration: 10 minutes
```

---

### [00:30-02:00] GitHub Actions - Basic Setup

**Visual:** GitHub repository, then workflow file

**Narration:**
> "We'll start with GitHub Actions since it's the most popular CI platform. First, let's create a workflow file."

**Screen:**
```bash
# Create workflow directory
$ mkdir -p .github/workflows

# Create workflow file
$ touch .github/workflows/vibesec.yml
```

**Narration (continued):**
> "Now let's add our security scanning workflow. This will run on every push and pull request."

**Screen - Editor showing `.github/workflows/vibesec.yml`:**
```yaml
name: Security Scan

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  security-scan:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Bun
        uses: oven-sh/setup-bun@v1

      - name: Install VibeSec
        run: npm install -g vibesec

      - name: Run Security Scan
        run: vibesec scan . --format json --output report.json

      - name: Upload Results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: security-report
          path: report.json
```

**Text overlay:** "✅ Basic workflow complete!"

---

### [02:00-03:30] Blocking Builds on Critical Issues

**Visual:** Split screen - workflow file + GitHub UI

**Narration:**
> "Now let's make this workflow actually block builds when critical or high-severity issues are found. We'll add a script that checks the results."

**Screen - Add new step to workflow:**
```yaml
      - name: Check for Critical Issues
        run: |
          # Parse JSON and count critical/high issues
          CRITICAL=$(jq '.summary.bySeverity.critical' report.json)
          HIGH=$(jq '.summary.bySeverity.high' report.json)

          echo "Critical issues: $CRITICAL"
          echo "High issues: $HIGH"

          if [ "$CRITICAL" -gt 0 ] || [ "$HIGH" -gt 0 ]; then
            echo "❌ Build blocked: Found $CRITICAL critical and $HIGH high severity issues"
            exit 1
          fi

          echo "✅ Security scan passed"
```

**Visual:** Show GitHub PR with failed check

**Screen - GitHub PR view:**
```
Checks
  ❌ Security Scan - Failed
     Critical issues: 2
     High issues: 1

  This pull request cannot be merged until security
  issues are resolved.
```

**Text overlay:** "🛡️ Your code is now protected!"

---

### [03:30-05:00] PR Comments and Annotations

**Visual:** GitHub PR interface

**Narration:**
> "Let's make our security scans even more useful by adding automatic comments to pull requests. We'll use a GitHub Action to post findings directly in the PR."

**Screen - Add PR comment step:**
```yaml
      - name: Comment on PR
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v6
        with:
          script: |
            const fs = require('fs');
            const report = JSON.parse(fs.readFileSync('report.json', 'utf8'));

            const body = `
            ## 🔒 VibeSec Security Scan Results

            **Status:** ${report.summary.total === 0 ? '✅ No issues found' : '⚠️ Issues found'}

            | Severity | Count |
            |----------|-------|
            | Critical | ${report.summary.bySeverity.critical} |
            | High | ${report.summary.bySeverity.high} |
            | Medium | ${report.summary.bySeverity.medium} |
            | Low | ${report.summary.bySeverity.low} |

            **Total Issues:** ${report.summary.total}

            ${report.findings.slice(0, 5).map(f => `
            ### ${f.severity.toUpperCase()}: ${f.title}
            **Location:** \`${f.location.file}:${f.location.line}\`

            ${f.description}

            **Fix:** ${f.fix.recommendation}
            `).join('\n\n')}

            ${report.summary.total > 5 ? `\n*... and ${report.summary.total - 5} more issues*` : ''}

            [View Full Report](https://github.com/${{github.repository}}/actions/runs/${{github.run_id}})
            `;

            github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
              body: body
            });
```

**Visual:** Show PR with VibeSec comment

**Screen - GitHub PR comment:**
```
vibesec-bot commented 2 minutes ago

🔒 VibeSec Security Scan Results

Status: ⚠️ Issues found

| Severity | Count |
|----------|-------|
| Critical | 0     |
| High     | 2     |
| Medium   | 1     |
| Low      | 0     |

Total Issues: 3

### HIGH: Hardcoded API Key
Location: `src/config/api.js:12`

Found hardcoded API key that should be moved to
environment variables.

Fix: Use process.env.API_KEY instead
```

---

### [05:00-06:30] SARIF Integration with GitHub Security

**Visual:** GitHub Security tab

**Narration:**
> "GitHub has a built-in Security tab that can show your security findings in a beautiful interface. Let's integrate with it using SARIF format."

**Screen - Update workflow to use SARIF:**
```yaml
      - name: Run Security Scan (SARIF)
        run: vibesec scan . --format sarif --output results.sarif

      - name: Upload SARIF to GitHub Security
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: results.sarif
          category: vibesec
```

**Visual:** Navigate to Security tab

**Screen - GitHub Security tab:**
```
Security › Code scanning alerts

🔒 VibeSec
  ⚠️  2 High severity alerts
  📋 1 Medium severity alert
  📊 Last scan: 2 minutes ago

Alerts:
  🔴 Hardcoded API Key
     src/config/api.js:12
     Opened 2 minutes ago

  🟠 SQL Injection Vulnerability
     src/api/users.js:42
     Opened 2 minutes ago
```

**Text overlay:** "Professional security tracking! 🎯"

---

### [06:30-08:00] GitLab CI/CD Integration

**Visual:** GitLab interface

**Narration:**
> "Using GitLab? No problem! Here's how to set up VibeSec in GitLab CI/CD."

**Screen - Create `.gitlab-ci.yml`:**
```yaml
security-scan:
  stage: test
  image: node:18
  script:
    - npm install -g vibesec
    - vibesec scan . --format json --output report.json

    # Check for critical/high issues
    - |
      CRITICAL=$(jq '.summary.bySeverity.critical' report.json)
      HIGH=$(jq '.summary.bySeverity.high' report.json)

      if [ "$CRITICAL" -gt 0 ] || [ "$HIGH" -gt 0 ]; then
        echo "❌ Security scan failed"
        exit 1
      fi

  artifacts:
    reports:
      # GitLab security report format
      sast: gl-sast-report.json
    paths:
      - report.json
    when: always

  only:
    - merge_requests
    - main
```

**Visual:** GitLab MR with security widget

**Screen - GitLab MR view:**
```
Security scanning detected 2 potential vulnerabilities

🔴 1 critical
🟠 1 high
🟡 0 medium

[View detailed report →]
```

---

### [08:00-09:00] Advanced: Custom Checks and Rules

**Visual:** Config file + workflow

**Narration:**
> "For advanced users, you can customize which issues block your builds using a config file."

**Screen - Create `.vibesec.yaml`:**
```yaml
version: 1

ci:
  fail_on: high  # Fail build if high or critical issues found
  allow_list:
    - rule-id-123  # Temporarily allow specific findings

scan:
  exclude:
    - node_modules/**
    - dist/**
    - "*.test.js"

severity:
  # Treat specific categories as more severe
  elevate:
    secrets: critical
    injection: high
```

**Visual:** Show workflow using config

**Screen - Simplified workflow:**
```yaml
      - name: Run Security Scan
        run: vibesec scan . --config .vibesec.yaml --format json

      # Config file handles blocking logic automatically!
```

---

### [09:00-09:40] Monitoring and Notifications

**Visual:** Slack/Discord integration

**Narration:**
> "Finally, let's add Slack or Discord notifications so your team knows about security issues immediately."

**Screen - Add notification step:**
```yaml
      - name: Notify Slack
        if: failure()
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "🚨 Security scan failed on ${{ github.repository }}",
              "attachments": [{
                "color": "danger",
                "fields": [
                  {
                    "title": "Branch",
                    "value": "${{ github.ref }}",
                    "short": true
                  },
                  {
                    "title": "Commit",
                    "value": "${{ github.sha }}",
                    "short": true
                  }
                ],
                "actions": [{
                  "type": "button",
                  "text": "View Report",
                  "url": "${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}"
                }]
              }]
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

**Visual:** Show Slack notification

**Screen - Slack message:**
```
VibeSec Bot  2:34 PM
🚨 Security scan failed on acme/api-service

Branch: feature/user-auth
Commit: abc123d

[View Report]
```

---

### [09:40-10:00] Closing

**Visual:** Summary checklist

**Narration:**
> "Great job! You've now got automated security scanning in your CI/CD pipeline. Every commit is checked, PRs are annotated, and your team is notified of issues. Your code is now much safer!"

**Screen:**
```
✅ What you've learned:
  • GitHub Actions integration
  • Blocking builds on security issues
  • PR comments and annotations
  • SARIF integration with GitHub Security
  • GitLab CI/CD integration
  • Slack/Discord notifications

🔗 Next steps:
  • Set up branch protection rules
  • Configure .vibesec.yaml for your team
  • Create custom detection rules

📚 More tutorials:
  → Custom Rules (7 min)
  → Plain Language Reports (3 min)

💬 Questions? discord.gg/vibesec
```

---

## Production Notes

### Visual Style
- **Dark IDE theme:** Use VS Code or similar for file editing
- **Split screens:** Show code + result simultaneously when possible
- **Highlight changes:** Use diff view or annotations
- **Animated arrows:** Point out important configuration options

### Pacing
- **Technical audience:** Can move faster than beginner tutorials
- **Pause on configs:** Allow 5-6 seconds to read YAML files
- **Show real results:** Use actual GitHub/GitLab UI, not mockups

### Accessibility
- **Code contrast:** Ensure syntax highlighting is readable
- **Captions:** Include command names and file paths
- **Shortcuts:** Show keyboard shortcuts being used
- **Zoom:** Zoom in on small text or icons

### Demo Environment
- **Real repository:** Use actual project, not fake examples
- **Show failures:** Demo both passing and failing scans
- **Live results:** Show real GitHub Actions running
- **Actual PRs:** Use genuine pull request interface

### B-Roll Suggestions
- GitHub Actions tab showing running workflow
- Security tab with findings
- PR with checks pending/failed/passed
- Slack notification arriving in real-time
- Team reviewing security findings together

---

## Key Takeaways

By the end of this tutorial, viewers should be able to:
1. ✅ Set up VibeSec in GitHub Actions
2. ✅ Block builds when security issues are found
3. ✅ Add PR comments and annotations
4. ✅ Integrate with GitHub Security tab (SARIF)
5. ✅ Configure GitLab CI/CD pipelines
6. ✅ Set up Slack/Discord notifications
7. ✅ Customize blocking rules with config files

---

## Platform-Specific Variations

### GitHub Actions (Covered)
- ✅ Basic workflow
- ✅ PR comments
- ✅ SARIF upload
- ✅ Slack notifications

### GitLab CI/CD (Covered)
- ✅ .gitlab-ci.yml
- ✅ Security reports
- ✅ MR widgets

### CircleCI (Brief mention)
```yaml
version: 2.1
jobs:
  security-scan:
    docker:
      - image: node:18
    steps:
      - checkout
      - run: npm install -g vibesec
      - run: vibesec scan . --fail-on high
```

### Jenkins (Brief mention)
```groovy
pipeline {
  agent any
  stages {
    stage('Security Scan') {
      steps {
        sh 'npm install -g vibesec'
        sh 'vibesec scan . --format json --output report.json'
      }
    }
  }
}
```

---

## Related Tutorials

- **Previous:** [Plain Language Walkthrough (3 min)](./02-PLAIN-LANGUAGE-WALKTHROUGH.md)
- **Next:** [Custom Rules (7 min)](./04-CUSTOM-RULES.md)
- [Getting Started (5 min)](./01-GETTING-STARTED.md)

---

**Last Updated:** 2025-10-15
**Status:** Ready for Production
**Target:** Developers and DevOps Engineers
