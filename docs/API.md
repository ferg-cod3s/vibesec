# VibeSec API Documentation

**Version:** 1.0.0
**Last Updated:** 2025-10-10

---

## Overview

VibeSec provides both a **CLI interface** and a **programmatic API** for integrating security scanning into your applications, CI/CD pipelines, and custom workflows.

---

## Table of Contents

- [Installation](#installation)
- [CLI API](#cli-api)
- [Programmatic API (Node.js)](#programmatic-api-nodejs)
- [Programmatic API (Python)](#programmatic-api-python)
- [REST API (Future)](#rest-api-future)
- [Configuration](#configuration)
- [Output Formats](#output-formats)
- [Integration Examples](#integration-examples)

---

## Installation

### Node.js / NPM

```bash
npm install -g vibesec
# or for programmatic use
npm install vibesec --save-dev
```

### Python / PyPI

```bash
pip install vibesec
# or for programmatic use
pip install vibesec
```

### Docker

```bash
docker pull vibesec/vibesec:latest
docker run -v $(pwd):/app vibesec/vibesec scan /app
```

---

## CLI API

### Basic Commands

#### `vibesec scan [path]`

Scan a directory or file for security vulnerabilities.

**Usage:**

```bash
vibesec scan .
vibesec scan src/
vibesec scan src/api/auth.js
```

**Options:**

| Option           | Type                          | Default         | Description                        |
| ---------------- | ----------------------------- | --------------- | ---------------------------------- |
| `--format`       | `json\|text\|html\|sarif`     | `text`          | Output format                      |
| `--severity`     | `critical\|high\|medium\|low` | all             | Minimum severity to report         |
| `--output`       | `string`                      | stdout          | Output file path                   |
| `--config`       | `string`                      | `.vibesec.yaml` | Config file path                   |
| `--exclude`      | `string[]`                    | `[]`            | Patterns to exclude                |
| `--integrations` | `string[]`                    | `[]`            | Enable integrations (snyk, socket) |
| `--fail-on`      | `critical\|high\|medium\|low` | none            | Exit code 1 if issues found        |
| `--verbose`      | `boolean`                     | `false`         | Verbose output                     |
| `--quiet`        | `boolean`                     | `false`         | Suppress non-error output          |

**Examples:**

```bash
# Scan current directory with JSON output
vibesec scan . --format json --output report.json

# Scan and fail CI if critical/high issues found
vibesec scan . --fail-on high

# Scan with Snyk integration
vibesec scan . --integrations snyk

# Scan specific files only
vibesec scan src/**/*.js --exclude "*.test.js"

# Verbose scanning
vibesec scan . --verbose
```

**Exit Codes:**

- `0` - Success (no issues or below fail-on threshold)
- `1` - Issues found (at or above fail-on threshold)
- `2` - Scanning error

---

#### `vibesec report [options]`

Generate a report from previous scan results.

**Usage:**

```bash
vibesec report --input scan-results.json --format html
```

**Options:**

| Option     | Type                    | Default  | Description             |
| ---------- | ----------------------- | -------- | ----------------------- |
| `--input`  | `string`                | required | Input JSON scan results |
| `--format` | `html\|markdown\|sarif` | `html`   | Output format           |
| `--output` | `string`                | stdout   | Output file path        |

**Examples:**

```bash
# Generate HTML report
vibesec report --input results.json --format html --output report.html

# Generate SARIF for GitHub Security
vibesec report --input results.json --format sarif --output results.sarif
```

---

#### `vibesec config [action]`

Manage VibeSec configuration.

**Actions:**

- `init` - Create default `.vibesec.yaml`
- `validate` - Validate existing config
- `show` - Display current config

**Examples:**

```bash
# Initialize config
vibesec config init

# Validate config
vibesec config validate

# Show current config
vibesec config show
```

---

#### `vibesec update-rules`

Update detection rules from community repository.

**Usage:**

```bash
vibesec update-rules
```

**Options:**

| Option     | Type      | Default                     | Description                     |
| ---------- | --------- | --------------------------- | ------------------------------- |
| `--source` | `string`  | `https://rules.vibesec.dev` | Rules repository URL            |
| `--force`  | `boolean` | `false`                     | Force update even if up-to-date |

---

#### `vibesec validate-rule [path]`

Validate a custom detection rule.

**Usage:**

```bash
vibesec validate-rule rules/custom/my-rule.yaml
```

---

## Programmatic API (Node.js)

### Installation

```bash
npm install vibesec
```

### Basic Usage

```typescript
import { scan, ScanOptions, ScanResult } from 'vibesec';

const options: ScanOptions = {
  path: './src',
  severity: 'high',
  format: 'json',
  integrations: ['snyk', 'socket'],
};

const results: ScanResult = await scan(options);

console.log(results.summary);
// { total: 27, critical: 3, high: 7, medium: 12, low: 5 }
```

---

### API Reference

#### `scan(options: ScanOptions): Promise<ScanResult>`

Scan a directory or file for security issues.

**Parameters:**

```typescript
interface ScanOptions {
  path: string; // Path to scan
  format?: 'json' | 'text'; // Output format (default: 'json')
  severity?: SeverityLevel; // Minimum severity
  exclude?: string[]; // Exclude patterns
  integrations?: string[]; // Enable integrations
  config?: string; // Config file path
  failOn?: SeverityLevel; // Fail threshold
  verbose?: boolean; // Verbose output
}

type SeverityLevel = 'critical' | 'high' | 'medium' | 'low';
```

**Returns:**

```typescript
interface ScanResult {
  version: string;
  scan: {
    path: string;
    filesScanned: number;
    duration: number;
    timestamp: string;
  };
  summary: {
    total: number;
    bySeverity: {
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
  };
  findings: Finding[];
}

interface Finding {
  id: string;
  rule: string;
  severity: SeverityLevel;
  category: string;
  title: string;
  description: string;
  location: {
    file: string;
    line: number;
    column: number;
  };
  snippet: string;
  fix: {
    recommendation: string;
    before: string;
    after: string;
    references: string[];
  };
  metadata: {
    cwe?: string;
    owasp?: string;
    confidence: number;
  };
}
```

---

#### `loadConfig(path: string): Promise<Config>`

Load configuration from file.

```typescript
import { loadConfig } from 'vibesec';

const config = await loadConfig('.vibesec.yaml');
```

---

#### `generateReport(results: ScanResult, format: string): Promise<string>`

Generate a report from scan results.

```typescript
import { generateReport } from 'vibesec';

const htmlReport = await generateReport(results, 'html');
const sarifReport = await generateReport(results, 'sarif');
```

---

### Advanced Usage

#### Custom Detectors

```typescript
import { Detector, Finding, registerDetector } from 'vibesec';

class MyCustomDetector implements Detector {
  name = 'my-custom-detector';
  category = 'injection';

  async detect(code: string, file: string): Promise<Finding[]> {
    const findings: Finding[] = [];

    // Your detection logic
    if (code.includes('dangerousFunction(')) {
      findings.push({
        id: 'custom-001',
        rule: 'dangerous-function',
        severity: 'high',
        // ... other fields
      });
    }

    return findings;
  }
}

registerDetector(new MyCustomDetector());
```

---

#### Event Hooks

```typescript
import { scan, on } from 'vibesec';

// Listen to scan events
on('scan:start', (data) => {
  console.log(`Starting scan of ${data.path}`);
});

on('scan:file', (data) => {
  console.log(`Scanning ${data.file}`);
});

on('scan:finding', (finding) => {
  console.log(`Found issue: ${finding.title}`);
});

on('scan:complete', (results) => {
  console.log(`Scan complete: ${results.summary.total} issues found`);
});

await scan({ path: './src' });
```

---

## Programmatic API (Python)

### Installation

```bash
pip install vibesec
```

### Basic Usage

```python
from vibesec import scan, ScanOptions, ScanResult

options = ScanOptions(
    path='./src',
    severity='high',
    format='json',
    integrations=['snyk', 'socket']
)

results: ScanResult = scan(options)

print(results.summary)
# { 'total': 27, 'critical': 3, 'high': 7, 'medium': 12, 'low': 5 }
```

---

### API Reference

#### `scan(options: ScanOptions) -> ScanResult`

Scan a directory or file for security issues.

**Parameters:**

```python
from dataclasses import dataclass
from typing import List, Optional

@dataclass
class ScanOptions:
    path: str
    format: Optional[str] = 'json'
    severity: Optional[str] = None
    exclude: Optional[List[str]] = None
    integrations: Optional[List[str]] = None
    config: Optional[str] = '.vibesec.yaml'
    fail_on: Optional[str] = None
    verbose: bool = False
```

**Returns:**

```python
@dataclass
class ScanResult:
    version: str
    scan: dict
    summary: dict
    findings: List[Finding]

@dataclass
class Finding:
    id: str
    rule: str
    severity: str
    category: str
    title: str
    description: str
    location: dict
    snippet: str
    fix: dict
    metadata: dict
```

---

#### `load_config(path: str) -> dict`

Load configuration from file.

```python
from vibesec import load_config

config = load_config('.vibesec.yaml')
```

---

#### `generate_report(results: ScanResult, format: str) -> str`

Generate a report from scan results.

```python
from vibesec import generate_report

html_report = generate_report(results, 'html')
sarif_report = generate_report(results, 'sarif')
```

---

## REST API (Future)

**Coming in v2.0:** VibeSec will offer a REST API for cloud-based scanning.

### Planned Endpoints

```
POST   /api/v1/scan              - Initiate scan
GET    /api/v1/scan/:id          - Get scan status
GET    /api/v1/scan/:id/results  - Get scan results
POST   /api/v1/report            - Generate report
GET    /api/v1/rules             - List available rules
POST   /api/v1/rules/validate    - Validate custom rule
```

Stay tuned for updates!

---

## Configuration

### `.vibesec.yaml` Schema

```yaml
version: 1

scan:
  paths:
    - src/
    - lib/
  exclude:
    - node_modules/
    - vendor/
    - '*.test.js'
    - '**/__tests__/**'

severity:
  fail_on: high # critical|high|medium|low

detectors:
  secrets: true
  injection: true
  auth: true
  ai-specific: true
  incomplete: true
  crypto: true
  config: true

rules:
  disabled:
    - hardcoded-api-key # Disable specific rules
  overrides:
    hardcoded-password:
      severity: high # Override severity

integrations:
  snyk:
    enabled: true
    token: ${SNYK_TOKEN}
  socket:
    enabled: true
    token: ${SOCKET_TOKEN}

output:
  format: json
  file: vibesec-report.json
  verbose: false
```

---

## Output Formats

### JSON

```json
{
  "version": "1.0.0",
  "scan": {
    "path": "/home/user/project",
    "filesScanned": 127,
    "duration": 3.2,
    "timestamp": "2025-10-10T14:30:00Z"
  },
  "summary": {
    "total": 27,
    "bySeverity": {
      "critical": 3,
      "high": 7,
      "medium": 12,
      "low": 5
    }
  },
  "findings": [...]
}
```

### SARIF (Static Analysis Results Interchange Format)

Compatible with GitHub Security, VS Code, and other SARIF-compliant tools.

```json
{
  "$schema": "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json",
  "version": "2.1.0",
  "runs": [
    {
      "tool": {
        "driver": {
          "name": "VibeSec",
          "version": "1.0.0"
        }
      },
      "results": [...]
    }
  ]
}
```

### HTML

Interactive web-based report with:

- Searchable findings
- Collapsible code snippets
- Filter by severity/category
- Copy-paste fix recommendations

### Plain Text

Terminal-friendly colorized output:

```
═══════════════════════════════════════════════════
              VibeSec Security Scan Results
═══════════════════════════════════════════════════

📁 Scanned: /home/user/my-project
📊 Files scanned: 127
⏱️  Duration: 3.2s

🔴 CRITICAL Issues: 3
🟡 HIGH Issues: 7
🟢 MEDIUM Issues: 12
⚪ LOW Issues: 5
```

---

## Integration Examples

### GitHub Actions

```yaml
# .github/workflows/vibesec.yml
name: VibeSec Security Scan
on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Run VibeSec Scan
        uses: vibesec/action@v1
        with:
          fail-on: high
          integrations: snyk,socket
          output-format: sarif
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
          SOCKET_TOKEN: ${{ secrets.SOCKET_TOKEN }}

      - name: Upload SARIF
        uses: github/codeql-action/upload-sarif@v2
        if: always()
        with:
          sarif_file: vibesec-results.sarif
```

---

### GitLab CI/CD

```yaml
# .gitlab-ci.yml
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
```

---

### CircleCI

```yaml
# .circleci/config.yml
version: 2.1

jobs:
  security-scan:
    docker:
      - image: vibesec/vibesec:latest
    steps:
      - checkout
      - run:
          name: VibeSec Scan
          command: vibesec scan . --fail-on high
      - store_artifacts:
          path: vibesec-report.json

workflows:
  version: 2
  build-and-scan:
    jobs:
      - security-scan
```

---

### Jenkins

```groovy
// Jenkinsfile
pipeline {
  agent any

  stages {
    stage('Security Scan') {
      steps {
        sh 'npm install -g vibesec'
        sh 'vibesec scan . --fail-on high --format json --output vibesec-report.json'
      }
      post {
        always {
          archiveArtifacts artifacts: 'vibesec-report.json'
        }
      }
    }
  }
}
```

---

### Pre-commit Hook

```bash
#!/bin/sh
# .git/hooks/pre-commit

echo "Running VibeSec scan..."
vibesec scan . --fail-on critical --quiet

if [ $? -ne 0 ]; then
  echo "❌ VibeSec found critical security issues. Commit blocked."
  echo "Run 'vibesec scan .' to see details."
  exit 1
fi

echo "✅ VibeSec scan passed"
```

---

### NPM Script

```json
{
  "scripts": {
    "security:scan": "vibesec scan .",
    "security:ci": "vibesec scan . --fail-on high --format json",
    "security:report": "vibesec scan . --format html --output security-report.html"
  }
}
```

---

### Custom Node.js Integration

```typescript
import { scan } from 'vibesec';
import { sendSlackNotification } from './notifications';

async function runSecurityScan() {
  try {
    const results = await scan({
      path: './src',
      failOn: 'high',
    });

    if (results.summary.critical > 0 || results.summary.high > 0) {
      await sendSlackNotification({
        channel: '#security-alerts',
        message: `⚠️ Security scan found ${results.summary.critical} critical and ${results.summary.high} high severity issues!`,
        findings: results.findings.filter(
          (f) => f.severity === 'critical' || f.severity === 'high'
        ),
      });
    }

    return results;
  } catch (error) {
    console.error('Scan failed:', error);
    process.exit(1);
  }
}

runSecurityScan();
```

---

## Error Handling

### Common Errors

#### `CONFIG_NOT_FOUND`

```json
{
  "error": "CONFIG_NOT_FOUND",
  "message": "Configuration file .vibesec.yaml not found",
  "suggestion": "Run 'vibesec config init' to create a default config"
}
```

#### `INVALID_PATH`

```json
{
  "error": "INVALID_PATH",
  "message": "Scan path does not exist: /invalid/path",
  "suggestion": "Verify the path exists and is accessible"
}
```

#### `INTEGRATION_AUTH_FAILED`

```json
{
  "error": "INTEGRATION_AUTH_FAILED",
  "message": "Snyk authentication failed",
  "suggestion": "Check your SNYK_TOKEN environment variable"
}
```

---

## Rate Limits

### Community Rules API

- **Free Tier:** 100 rule updates/day
- **Pro Tier:** Unlimited updates

### Integration APIs

Rate limits are determined by third-party services:

- **Snyk:** Varies by plan
- **Socket.dev:** Varies by plan

---

## Versioning

VibeSec follows [Semantic Versioning](https://semver.org/):

- **Major:** Breaking API changes
- **Minor:** New features (backward compatible)
- **Patch:** Bug fixes

Current version: **1.0.0**

---

## Support

- **Documentation:** [docs.vibesec.dev](https://docs.vibesec.dev)
- **GitHub Issues:** [github.com/vibesec/vibesec/issues](https://github.com/vibesec/vibesec/issues)
- **Discord:** [discord.gg/vibesec](https://discord.gg/vibesec)
- **Email:** [email protected]

---

**Built with ❤️ for the vibe coding community**
