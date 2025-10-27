# VibeSec Integrations

**Version:** 1.0.0
**Last Updated:** 2025-10-10

---

## Overview

VibeSec integrates with leading security tools, CI/CD platforms, and developer workflows to provide comprehensive protection for AI-generated code. This document covers all supported integrations and how to set them up.

---

## Table of Contents

- [Security Tool Integrations](#security-tool-integrations)
  - [Snyk](#snyk)
  - [Socket.dev](#socketdev)
- [CI/CD Integrations](#cicd-integrations)
  - [GitHub Actions](#github-actions)
  - [GitLab CI/CD](#gitlab-cicd)
  - [CircleCI](#circleci)
  - [Jenkins](#jenkins)
- [IDE Integrations](#ide-integrations)
  - [VS Code](#vs-code-future)
  - [JetBrains](#jetbrains-future)
- [Notification Integrations](#notification-integrations)
  - [Slack](#slack)
  - [Discord](#discord)
- [Issue Tracking](#issue-tracking)
  - [JIRA](#jira-future)
  - [Linear](#linear-future)
- [Custom Integrations](#custom-integrations)

---

## Security Tool Integrations

### Snyk

**Purpose:** Enrich VibeSec findings with dependency vulnerability data

#### Features

- Dependency vulnerability scanning
- License compliance checking
- Container security (future)
- Infrastructure as Code scanning (future)

#### Setup

**1. Get Snyk API Token**

```bash
# Sign up at https://snyk.io
# Navigate to Settings > General > API Token
# Copy your token
```

**2. Configure VibeSec**

Add to `.vibesec.yaml`:

```yaml
integrations:
  snyk:
    enabled: true
    token: ${SNYK_TOKEN} # Use environment variable

    # Optional settings
    severity_threshold: high # Only report high/critical
    fail_on_issues: true # Fail scan if Snyk finds issues
    organization: my-org # Snyk organization slug
```

**3. Set Environment Variable**

```bash
export SNYK_TOKEN="your-token-here"
```

**4. Run Scan**

```bash
vibesec scan . --integrations snyk
```

#### Output

Snyk findings are merged into VibeSec reports:

```json
{
  "findings": [
    {
      "id": "snyk-001",
      "source": "snyk",
      "title": "Prototype Pollution in lodash",
      "severity": "high",
      "package": "lodash@4.17.15",
      "fix": {
        "recommendation": "Upgrade to lodash@4.17.21 or higher"
      },
      "metadata": {
        "cve": "CVE-2020-8203",
        "snyk_id": "SNYK-JS-LODASH-590103"
      }
    }
  ]
}
```

#### Pricing

- **Free:** 200 tests/month
- **Team:** $52/developer/month
- **Enterprise:** Custom pricing

---

### Socket.dev

**Purpose:** Supply chain security and malicious package detection

#### Features

- Malicious package detection
- Typosquatting protection
- License risk analysis
- Dependency change monitoring

#### Setup

**1. Get Socket.dev API Key**

```bash
# Sign up at https://socket.dev
# Navigate to Settings > API Keys
# Create new API key
```

**2. Configure VibeSec**

Add to `.vibesec.yaml`:

```yaml
integrations:
  socket:
    enabled: true
    token: ${SOCKET_TOKEN}

    # Optional settings
    block_malicious: true # Block scan on malicious packages
    check_licenses: true # Check license compatibility
    alert_on_changes: true # Alert on dependency changes
```

**3. Set Environment Variable**

```bash
export SOCKET_TOKEN="your-token-here"
```

**4. Run Scan**

```bash
vibesec scan . --integrations socket
```

#### Output

Socket.dev findings include supply chain risk scores:

```json
{
  "findings": [
    {
      "id": "socket-001",
      "source": "socket",
      "title": "High-risk dependency detected",
      "severity": "high",
      "package": "malicious-package@1.0.0",
      "risk_score": 85,
      "issues": ["Contains obfuscated code", "Makes network requests to suspicious domains"],
      "fix": {
        "recommendation": "Remove this package and find an alternative"
      }
    }
  ]
}
```

#### Pricing

- **Free:** Open source projects
- **Pro:** $10/developer/month
- **Enterprise:** Custom pricing

---

## CI/CD Integrations

### GitHub Actions

**Purpose:** Automated security scanning in GitHub workflows

#### Quick Start

Create `.github/workflows/vibesec.yml`:

```yaml
name: VibeSec Security Scan
on:
  push:
    branches: [main, dev]
  pull_request:
    branches: [main]

jobs:
  security:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Run VibeSec
        uses: vibesec/action@v1
        with:
          fail-on: high
          integrations: snyk,socket
          output-format: sarif
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
          SOCKET_TOKEN: ${{ secrets.SOCKET_TOKEN }}

      - name: Upload to GitHub Security
        uses: github/codeql-action/upload-sarif@v2
        if: always()
        with:
          sarif_file: vibesec-results.sarif
```

#### Action Inputs

| Input           | Required | Default         | Description                  |
| --------------- | -------- | --------------- | ---------------------------- |
| `fail-on`       | No       | `none`          | Severity level to fail on    |
| `integrations`  | No       | `[]`            | Comma-separated integrations |
| `output-format` | No       | `sarif`         | Output format                |
| `config-path`   | No       | `.vibesec.yaml` | Config file path             |
| `exclude`       | No       | `[]`            | Patterns to exclude          |

#### PR Annotations

VibeSec automatically adds inline comments to pull requests:

````markdown
⚠️ **Security Issue Found** (High)

**Hardcoded API Key Detected**

API keys should be stored in environment variables, not hardcoded.

📍 Location: `src/config/api.ts:12`

🔧 **Fix:**

```typescript
// Before
const API_KEY = 'sk_live_abc123';

// After
const API_KEY = process.env.API_KEY;
```
````

🔗 References:

- [OWASP A3:2017](https://owasp.org/www-project-top-ten/2017/A3_2017-Sensitive_Data_Exposure)

````

#### Security Tab Integration

Upload SARIF to see findings in GitHub Security tab:

1. Findings appear in Code Scanning Alerts
2. Filterable by severity, category, tool
3. Dismissable with reason
4. Tracked over time

---

### GitLab CI/CD

**Purpose:** Automated security scanning in GitLab pipelines

#### Setup

Add to `.gitlab-ci.yml`:

```yaml
include:
  - template: Security/SAST.gitlab-ci.yml

vibesec:
  stage: test
  image: vibesec/vibesec:latest

  script:
    - vibesec scan . --fail-on high --format json --output vibesec-report.json

  artifacts:
    reports:
      vibesec: vibesec-report.json
    paths:
      - vibesec-report.json
    expire_in: 1 week

  rules:
    - if: '$CI_COMMIT_BRANCH == "main"'
    - if: '$CI_PIPELINE_SOURCE == "merge_request_event"'
````

#### Security Dashboard Integration

Convert to GitLab security format:

```yaml
vibesec:
  script:
    - vibesec scan . --format gitlab-sast --output gl-sast-report.json

  artifacts:
    reports:
      sast: gl-sast-report.json
```

Findings appear in:

- Merge Request Security Widget
- Security Dashboard
- Vulnerability Report

---

### CircleCI

**Purpose:** Security scanning in CircleCI workflows

#### Setup

Add to `.circleci/config.yml`:

```yaml
version: 2.1

orbs:
  vibesec: vibesec/vibesec@1.0.0

workflows:
  build-and-scan:
    jobs:
      - vibesec/scan:
          fail-on: high
          integrations: snyk,socket
          context: security-tokens
```

#### Manual Configuration

```yaml
jobs:
  security-scan:
    docker:
      - image: vibesec/vibesec:latest

    steps:
      - checkout

      - run:
          name: VibeSec Security Scan
          command: |
            vibesec scan . \
              --fail-on high \
              --format json \
              --output vibesec-report.json

      - store_artifacts:
          path: vibesec-report.json
          destination: security-reports

      - store_test_results:
          path: vibesec-report.json
```

---

### Jenkins

**Purpose:** Security scanning in Jenkins pipelines

#### Setup (Declarative Pipeline)

```groovy
pipeline {
  agent any

  environment {
    SNYK_TOKEN = credentials('snyk-token')
    SOCKET_TOKEN = credentials('socket-token')
  }

  stages {
    stage('Security Scan') {
      steps {
        script {
          sh 'npm install -g vibesec'

          def scanResult = sh(
            script: 'vibesec scan . --fail-on high --format json',
            returnStatus: true
          )

          if (scanResult != 0) {
            error('Security issues found!')
          }
        }
      }
    }
  }

  post {
    always {
      archiveArtifacts artifacts: 'vibesec-report.json', allowEmptyArchive: true
      publishHTML([
        reportDir: '.',
        reportFiles: 'vibesec-report.html',
        reportName: 'VibeSec Security Report'
      ])
    }
  }
}
```

#### Jenkins Plugin (Future)

Coming soon: Native Jenkins plugin with:

- Dashboard widget
- Trend analysis
- Build failure thresholds
- Email notifications

---

## IDE Integrations

### VS Code (Future)

**Status:** Planned for MVP Phase

#### Planned Features

- Real-time inline security warnings
- Quick fixes with one-click apply
- Security panel with all findings
- Integration with VS Code problems panel

#### Preview

```typescript
// Extension will highlight issues inline:
const apiKey = 'sk_live_abc123'; // ⚠️ Hardcoded API key detected
```

---

### JetBrains (Future)

**Status:** Planned for Post-MVP

#### Planned Features

- IntelliJ IDEA, WebStorm, PyCharm support
- Inspection tool integration
- Quick fix suggestions
- Security tool window

---

## Notification Integrations

### Slack

**Purpose:** Send security alerts to Slack channels

#### Setup

**1. Create Slack Webhook**

1. Go to https://api.slack.com/apps
2. Create new app → Incoming Webhooks
3. Activate webhooks and add to workspace
4. Copy webhook URL

**2. Configure VibeSec**

Add to `.vibesec.yaml`:

```yaml
integrations:
  slack:
    enabled: true
    webhook_url: ${SLACK_WEBHOOK_URL}

    # Optional settings
    channel: '#security-alerts'
    notify_on:
      - critical
      - high
    include_summary: true
```

**3. Set Environment Variable**

```bash
export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/..."
```

#### Notification Format

```
🚨 VibeSec Security Alert

Project: my-awesome-app
Branch: main
Scan Duration: 3.2s

📊 Summary:
🔴 Critical: 3
🟡 High: 7
🟢 Medium: 12

🔗 View full report: https://github.com/user/repo/actions/runs/123

Top Issues:
1. Hardcoded API Key (src/config/api.ts:12)
2. SQL Injection (src/api/users.ts:45)
3. XSS Vulnerability (src/views/profile.tsx:89)
```

---

### Discord

**Purpose:** Send security alerts to Discord channels

#### Setup

**1. Create Discord Webhook**

1. Server Settings → Integrations → Webhooks
2. New Webhook
3. Copy webhook URL

**2. Configure VibeSec**

```yaml
integrations:
  discord:
    enabled: true
    webhook_url: ${DISCORD_WEBHOOK_URL}

    # Optional settings
    notify_on:
      - critical
      - high
    username: 'VibeSec Bot'
    avatar_url: 'https://vibesec.dev/logo.png'
```

#### Notification Format

Rich embeds with:

- Color-coded severity
- Finding details
- Links to reports
- Quick action buttons

---

## Issue Tracking

### JIRA (Future)

**Status:** Planned for Enterprise

#### Planned Features

- Auto-create JIRA tickets for findings
- Link findings to existing tickets
- Update ticket status based on fixes
- Custom field mapping

#### Preview Configuration

```yaml
integrations:
  jira:
    enabled: true
    url: https://yourcompany.atlassian.net
    email: [email protected]
    api_token: ${JIRA_API_TOKEN}

    project_key: SEC
    issue_type: Security Issue

    severity_mapping:
      critical: Blocker
      high: Critical
      medium: Major
      low: Minor
```

---

### Linear (Future)

**Status:** Planned for Post-MVP

#### Planned Features

- Auto-create Linear issues
- Link to cycles and projects
- Status sync
- Priority mapping

---

## Custom Integrations

### Webhooks

Send findings to custom endpoints.

```yaml
integrations:
  webhooks:
    - name: custom-webhook
      url: https://api.example.com/security/findings
      method: POST
      headers:
        Authorization: Bearer ${API_TOKEN}
        Content-Type: application/json

      # Filter findings
      filters:
        severity: [critical, high]
        category: [secrets, injection]

      # Transform payload
      payload_template: |
        {
          "findings": {{ findings }},
          "project": "{{ project_name }}",
          "timestamp": "{{ timestamp }}"
        }
```

### API Integration

Use VibeSec programmatically:

```typescript
import { scan, on } from 'vibesec';

// Custom integration handler
on('scan:complete', async (results) => {
  // Send to custom API
  await fetch('https://api.example.com/security', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      findings: results.findings,
      summary: results.summary,
    }),
  });

  // Send email notifications
  if (results.summary.critical > 0) {
    await sendEmail({
      to: '[email protected]',
      subject: `CRITICAL: ${results.summary.critical} security issues found`,
      body: formatFindings(results.findings),
    });
  }
});

await scan({ path: './src' });
```

---

## Integration Best Practices

### 1. Use Environment Variables for Secrets

```yaml
# ✅ Good
integrations:
  snyk:
    token: ${SNYK_TOKEN}

# ❌ Bad
integrations:
  snyk:
    token: "sk_live_abc123"  # Never hardcode tokens!
```

---

### 2. Configure Appropriate Thresholds

```yaml
# Development environment
severity:
  fail_on: medium  # Catch more issues early

# Production CI/CD
severity:
  fail_on: critical  # Don't block on low-severity issues
```

---

### 3. Use Multiple Integrations

Combine VibeSec, Snyk, and Socket.dev for comprehensive coverage:

```yaml
integrations:
  snyk:
    enabled: true
    token: ${SNYK_TOKEN}

  socket:
    enabled: true
    token: ${SOCKET_TOKEN}
```

---

### 4. Monitor Integration Health

Check integration status:

```bash
vibesec integrations status

# Output:
✅ Snyk: Connected (last scan: 2 hours ago)
✅ Socket.dev: Connected (last scan: 2 hours ago)
⚠️  Slack: Webhook failed (check URL)
```

---

## Troubleshooting

### Common Issues

#### Snyk Authentication Failed

```
Error: Snyk authentication failed
```

**Solution:**

- Verify `SNYK_TOKEN` is set correctly
- Check token hasn't expired
- Ensure token has appropriate permissions

---

#### Socket.dev Rate Limit

```
Error: Socket.dev rate limit exceeded
```

**Solution:**

- Wait for rate limit to reset
- Upgrade to higher tier
- Reduce scan frequency

---

#### GitHub Action Timeout

```
Error: GitHub Action timed out
```

**Solution:**

- Increase timeout: `timeout-minutes: 15`
- Optimize scan with excludes
- Use incremental scanning

---

#### Slack Webhook 404

```
Error: Slack webhook returned 404
```

**Solution:**

- Regenerate webhook URL
- Check webhook wasn't deleted
- Verify channel exists

---

## Integration Roadmap

### Q1 2026

- ✅ Snyk
- ✅ Socket.dev
- ✅ GitHub Actions
- ✅ GitLab CI/CD
- ✅ Slack
- ✅ Discord

### Q2 2026

- 🔄 VS Code extension
- 🔄 CircleCI orb
- 🔄 Jenkins plugin
- 🔄 JIRA integration

### Q3 2026

- ⏳ JetBrains plugin
- ⏳ Linear integration
- ⏳ Azure DevOps
- ⏳ Bitbucket Pipelines

### Q4 2026

- ⏳ Enterprise SSO integrations
- ⏳ Custom webhook transformations
- ⏳ Advanced notification rules
- ⏳ Integration marketplace

---

## Support

Need help with integrations?

- **Documentation:** [docs.vibesec.dev/integrations](https://docs.vibesec.dev/integrations)
- **GitHub Issues:** [github.com/vibesec/vibesec/issues](https://github.com/vibesec/vibesec/issues)
- **Discord:** [discord.gg/vibesec](https://discord.gg/vibesec)
- **Email:** [email protected]

---

**Built with ❤️ for the vibe coding community**
