# VibeSec JSON Output Schema

**Version:** 1.0.0
**Last Updated:** 2025-10-10

## Overview

VibeSec can output scan results in machine-readable JSON format for integration with CI/CD pipelines, security dashboards, and automated workflows.

### Usage

```bash
# Output JSON to stdout
vibesec scan /path/to/code --format json

# Save JSON to file
vibesec scan /path/to/code --format json > results.json

# Parse with jq
vibesec scan /path/to/code --format json | jq '.summary.bySeverity'

# Use in CI/CD
vibesec scan . --format json | jq '.summary.bySeverity.critical' | grep -q '^0$'
```

---

## Root Schema

```json
{
  "version": "string",
  "scan": { ... },
  "summary": { ... },
  "findings": [ ... ]
}
```

### Root Fields

| Field | Type | Description |
|-------|------|-------------|
| `version` | string | VibeSec scanner version (e.g., "0.1.0") |
| `scan` | object | Metadata about the scan execution |
| `summary` | object | Aggregate statistics of findings |
| `findings` | array | Detailed list of all security issues found |

---

## Scan Metadata Object

Contains information about the scan execution.

```json
{
  "scan": {
    "path": "/home/user/myproject",
    "filesScanned": 42,
    "duration": 1.234,
    "timestamp": "2025-10-09T23:00:00.000Z",
    "version": "0.1.0"
  }
}
```

### Scan Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `path` | string | ✅ | Absolute or relative path that was scanned |
| `filesScanned` | number | ✅ | Total number of files analyzed |
| `duration` | number | ✅ | Scan duration in seconds (float) |
| `timestamp` | string | ✅ | ISO 8601 timestamp when scan started |
| `version` | string | ✅ | VibeSec version used for scan |

---

## Summary Object

Aggregated statistics of all findings.

```json
{
  "summary": {
    "total": 15,
    "bySeverity": {
      "critical": 5,
      "high": 8,
      "medium": 2,
      "low": 0
    },
    "byCategory": {
      "injection": 4,
      "secrets": 3,
      "auth": 5,
      "incomplete": 2,
      "ai-specific": 1
    }
  }
}
```

### Summary Fields

| Field | Type | Description |
|-------|------|-------------|
| `total` | number | Total number of findings |
| `bySeverity` | object | Breakdown by severity level |
| `bySeverity.critical` | number | Count of CRITICAL issues |
| `bySeverity.high` | number | Count of HIGH issues |
| `bySeverity.medium` | number | Count of MEDIUM issues |
| `bySeverity.low` | number | Count of LOW issues |
| `byCategory` | object | Breakdown by vulnerability category |
| `byCategory.*` | number | Count per category (keys: secrets, injection, auth, incomplete, ai-specific, custom) |

---

## Findings Array

Array of finding objects, each representing a detected security issue.

```json
{
  "findings": [
    {
      "id": "sql-injection-1760051481099-5tdb8ckx1",
      "rule": "sql-injection",
      "severity": "critical",
      "category": "injection",
      "title": "SQL Injection Vulnerability",
      "description": "Unsanitized user input is used directly in SQL queries...",
      "location": { ... },
      "snippet": "...",
      "fix": { ... },
      "metadata": { ... }
    }
  ]
}
```

### Finding Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✅ | Unique identifier for this finding |
| `rule` | string | ✅ | Rule ID that triggered (e.g., "sql-injection") |
| `severity` | string | ✅ | Severity level: "critical", "high", "medium", "low" |
| `category` | string | ✅ | Category: "secrets", "injection", "auth", "incomplete", "ai-specific", "custom" |
| `title` | string | ✅ | Human-readable title of the vulnerability |
| `description` | string | ✅ | Detailed explanation of the security risk |
| `location` | object | ✅ | Source code location of the issue |
| `snippet` | string | ✅ | Code snippet showing the vulnerability in context |
| `fix` | object | ✅ | Remediation guidance |
| `metadata` | object | ✅ | Additional metadata (CWE, OWASP, confidence) |

---

## Location Object

Identifies the exact location of a finding in source code.

```json
{
  "location": {
    "file": "/home/user/project/src/api.js",
    "line": 42,
    "column": 17,
    "endLine": 42,
    "endColumn": 50
  }
}
```

### Location Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | string | ✅ | Absolute path to the file containing the issue |
| `line` | number | ✅ | Line number where issue starts (1-indexed) |
| `column` | number | ✅ | Column number where issue starts (0-indexed) |
| `endLine` | number | ❌ | Line number where issue ends (1-indexed) |
| `endColumn` | number | ❌ | Column number where issue ends (0-indexed) |

---

## Fix Object

Provides remediation guidance and references.

```json
{
  "fix": {
    "recommendation": "Use parameterized queries or prepared statements...",
    "before": "const query = `SELECT * FROM users WHERE id = ${req.query.id}`;",
    "after": "const query = 'SELECT * FROM users WHERE id = ?'; db.query(query, [req.query.id]);",
    "references": [
      "https://owasp.org/www-project-top-ten/2017/A1_2017-Injection",
      "https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html"
    ]
  }
}
```

### Fix Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `recommendation` | string | ✅ | High-level guidance on how to fix the issue |
| `before` | string | ✅ | The vulnerable code line |
| `after` | string | ❌ | Example of fixed code (may be empty for complex fixes) |
| `references` | array | ✅ | URLs to documentation, CVEs, or resources |

---

## Metadata Object

Additional metadata about the finding.

```json
{
  "metadata": {
    "confidence": 0.89,
    "cwe": "CWE-89",
    "owasp": "A1:2017"
  }
}
```

### Metadata Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `confidence` | number | ✅ | Confidence score (0.0-1.0) for detection accuracy |
| `cwe` | string | ❌ | Common Weakness Enumeration identifier (e.g., "CWE-89") |
| `owasp` | string | ❌ | OWASP Top 10 classification (e.g., "A1:2017") |

### Confidence Score Interpretation

| Range | Interpretation |
|-------|----------------|
| 0.9 - 1.0 | Very High - Almost certainly a real vulnerability |
| 0.8 - 0.9 | High - Likely a real vulnerability |
| 0.7 - 0.8 | Medium - May require manual review |
| < 0.7 | Low - Higher chance of false positive |

---

## Complete Example

```json
{
  "version": "0.1.0",
  "scan": {
    "path": "/home/user/myproject",
    "filesScanned": 42,
    "duration": 1.234,
    "timestamp": "2025-10-09T23:00:00.000Z",
    "version": "0.1.0"
  },
  "summary": {
    "total": 2,
    "bySeverity": {
      "critical": 1,
      "high": 1,
      "medium": 0,
      "low": 0
    },
    "byCategory": {
      "injection": 1,
      "secrets": 1
    }
  },
  "findings": [
    {
      "id": "sql-injection-1760051481099-5tdb8ckx1",
      "rule": "sql-injection",
      "severity": "critical",
      "category": "injection",
      "title": "SQL Injection Vulnerability",
      "description": "Unsanitized user input is used directly in SQL queries, allowing attackers to manipulate database queries",
      "location": {
        "file": "/home/user/myproject/src/api.js",
        "line": 42,
        "column": 17
      },
      "snippet": "    40 | \n    41 | app.get('/user', (req, res) => {\n→   42 |   const query = `SELECT * FROM users WHERE id = ${req.query.id}`;\n    43 |   db.query(query, (err, results) => {\n    44 |     res.json(results);",
      "fix": {
        "recommendation": "Use parameterized queries or prepared statements. Never concatenate user input directly into SQL queries.",
        "before": "const query = `SELECT * FROM users WHERE id = ${req.query.id}`;",
        "after": "",
        "references": [
          "https://owasp.org/www-project-top-ten/2017/A1_2017-Injection",
          "https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html",
          "https://cwe.mitre.org/data/definitions/89.html"
        ]
      },
      "metadata": {
        "confidence": 0.89,
        "cwe": "CWE-89",
        "owasp": "A1:2017"
      }
    },
    {
      "id": "hardcoded-secrets-1760051481205-a8kf3jdx2",
      "rule": "hardcoded-secret",
      "severity": "high",
      "category": "secrets",
      "title": "Hardcoded Secret or API Key",
      "description": "Credentials or API keys are hardcoded in source code, risking exposure in version control",
      "location": {
        "file": "/home/user/myproject/src/config.js",
        "line": 5,
        "column": 21
      },
      "snippet": "     3 | \n     4 | const config = {\n→    5 |   apiKey: 'sk_live_1234567890abcdef',\n     6 |   dbUrl: process.env.DATABASE_URL\n     7 | };",
      "fix": {
        "recommendation": "Store secrets in environment variables or secure vaults. Never commit secrets to version control.",
        "before": "apiKey: 'sk_live_1234567890abcdef',",
        "after": "apiKey: process.env.API_KEY,",
        "references": [
          "https://owasp.org/www-project-top-ten/2021/A07_2021-Identification_and_Authentication_Failures",
          "https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html"
        ]
      },
      "metadata": {
        "confidence": 0.85,
        "cwe": "CWE-798",
        "owasp": "A7:2021"
      }
    }
  ]
}
```

---

## CI/CD Integration Examples

### GitHub Actions

```yaml
name: Security Scan

on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install VibeSec
        run: npm install -g vibesec
      
      - name: Run Security Scan
        run: vibesec scan . --format json > results.json
      
      - name: Check for Critical Issues
        run: |
          CRITICAL=$(jq '.summary.bySeverity.critical' results.json)
          if [ "$CRITICAL" -gt 0 ]; then
            echo "❌ Found $CRITICAL critical security issues"
            jq '.findings[] | select(.severity=="critical") | .title' results.json
            exit 1
          fi
      
      - name: Upload Results
        uses: actions/upload-artifact@v3
        with:
          name: security-results
          path: results.json
```

### GitLab CI

```yaml
security_scan:
  stage: test
  script:
    - npm install -g vibesec
    - vibesec scan . --format json > results.json
    - |
      CRITICAL=$(jq '.summary.bySeverity.critical' results.json)
      if [ "$CRITICAL" -gt 0 ]; then
        echo "❌ Found $CRITICAL critical issues"
        exit 1
      fi
  artifacts:
    reports:
      codequality: results.json
    paths:
      - results.json
```

### Jenkins Pipeline

```groovy
pipeline {
  agent any
  
  stages {
    stage('Security Scan') {
      steps {
        sh 'npm install -g vibesec'
        sh 'vibesec scan . --format json > results.json'
        
        script {
          def results = readJSON file: 'results.json'
          if (results.summary.bySeverity.critical > 0) {
            error("Found ${results.summary.bySeverity.critical} critical issues")
          }
        }
      }
    }
  }
  
  post {
    always {
      archiveArtifacts artifacts: 'results.json'
    }
  }
}
```

### Pre-commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit

echo "Running security scan..."
vibesec scan . --format json > /tmp/vibesec-results.json

CRITICAL=$(jq '.summary.bySeverity.critical' /tmp/vibesec-results.json)
HIGH=$(jq '.summary.bySeverity.high' /tmp/vibesec-results.json)

if [ "$CRITICAL" -gt 0 ]; then
  echo "❌ Cannot commit: $CRITICAL critical security issues found"
  jq -r '.findings[] | select(.severity=="critical") | "  - \(.title) at \(.location.file):\(.location.line)"' /tmp/vibesec-results.json
  exit 1
fi

if [ "$HIGH" -gt 5 ]; then
  echo "⚠️  Warning: $HIGH high-severity issues found"
fi

echo "✅ Security scan passed"
exit 0
```

---

## JQ Query Examples

### Count Issues by Severity
```bash
jq '.summary.bySeverity' results.json
```

### List All Critical Issues
```bash
jq '.findings[] | select(.severity=="critical") | {title, file: .location.file, line: .location.line}' results.json
```

### Find All SQL Injection Issues
```bash
jq '.findings[] | select(.rule=="sql-injection")' results.json
```

### Get Total Issue Count
```bash
jq '.summary.total' results.json
```

### Extract File Paths with Issues
```bash
jq -r '.findings[].location.file' results.json | sort -u
```

### Group by Category
```bash
jq '.summary.byCategory' results.json
```

### Filter High Confidence Issues
```bash
jq '.findings[] | select(.metadata.confidence > 0.8)' results.json
```

### Export CSV Format
```bash
jq -r '.findings[] | [.severity, .category, .title, .location.file, .location.line] | @csv' results.json > issues.csv
```

---

## TypeScript Types

For TypeScript projects, VibeSec exports type definitions:

```typescript
interface ScanResult {
  version: string;
  scan: ScanMetadata;
  summary: ScanSummary;
  findings: Finding[];
}

interface ScanMetadata {
  path: string;
  filesScanned: number;
  duration: number;
  timestamp: string;
  version: string;
}

interface ScanSummary {
  total: number;
  bySeverity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  byCategory: Record<string, number>;
}

interface Finding {
  id: string;
  rule: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: 'secrets' | 'injection' | 'auth' | 'incomplete' | 'ai-specific' | 'custom';
  title: string;
  description: string;
  location: Location;
  snippet: string;
  fix: FixRecommendation;
  metadata: FindingMetadata;
}

interface Location {
  file: string;
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
}

interface FixRecommendation {
  recommendation: string;
  before: string;
  after: string;
  references: string[];
}

interface FindingMetadata {
  confidence: number;
  cwe?: string;
  owasp?: string;
}
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 0.1.0 | 2025-10-09 | Initial JSON schema with CWE/OWASP metadata |

---

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Common Weakness Enumeration (CWE)](https://cwe.mitre.org/)
- [SARIF Format](https://docs.github.com/en/code-security/code-scanning/integrating-with-code-scanning/sarif-support-for-code-scanning) (future support)
- [GitHub Advanced Security](https://docs.github.com/en/get-started/learning-about-github/about-github-advanced-security)

---

**Questions or Issues?**  
Report issues at: [VibeSec GitHub Issues](https://github.com/yourusername/vibesec/issues)
