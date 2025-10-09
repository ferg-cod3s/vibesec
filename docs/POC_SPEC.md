# VibeSec POC Specification

**Version:** 1.0.0
**Timeline:** 2 weeks
**Goal:** Validate core value proposition with functional prototype

---

## Objectives

The Proof of Concept (POC) aims to demonstrate that VibeSec can:

1. ✅ **Detect real security vulnerabilities** in AI-generated code
2. ✅ **Generate plain-language reports** accessible to non-technical users
3. ✅ **Provide actionable fix recommendations**
4. ✅ **Integrate into developer workflows** (CLI-based)

---

## Scope

### In Scope ✅

#### 1. Core Scanner Engine
- File system traversal with configurable paths
- Basic code parsing (regex + simple AST for JS/Python)
- Detection rule engine (YAML-based)
- Finding aggregation and deduplication

#### 2. Essential Detectors

| Detector | Purpose | Priority |
|----------|---------|----------|
| **Secrets** | Hardcoded API keys, passwords, tokens | 🔴 Critical |
| **Injection** | SQL injection, XSS, command injection | 🔴 Critical |
| **Auth** | Weak auth patterns, missing validation | 🟡 High |
| **Incomplete** | TODO/FIXME comments in security-critical code | 🟡 High |
| **AI-Specific** | Over-permissive CORS, generic error handlers | 🟢 Medium |

#### 3. CLI Tool
```bash
vibesec scan [path]              # Scan directory/file
vibesec scan . --format json     # Output JSON
vibesec scan . --severity high   # Filter by severity
```

#### 4. Output Formats
- **Plain Text**: Terminal-friendly, human-readable
- **JSON**: Machine-readable for CI/CD integration

#### 5. Test Fixtures
- 10 vulnerable code samples (5 JavaScript, 5 Python)
- Known vulnerabilities across all detector categories
- Validation: Each detector must find ≥5 issues

---

### Out of Scope ❌

- ❌ External integrations (Snyk, Socket.dev) → MVP
- ❌ Web dashboard → MVP
- ❌ SARIF output → MVP
- ❌ GitHub Action → MVP
- ❌ Advanced AST parsing → MVP
- ❌ Multi-language support beyond JS/Python → MVP
- ❌ Automated fix generation (PR creation) → Post-MVP
- ❌ Configuration file support (.vibesec.yaml) → MVP
- ❌ Caching and incremental scans → Post-MVP

---

## Success Criteria

### Functional Requirements

| ID | Requirement | Validation |
|----|-------------|------------|
| F1 | Scan a directory recursively | Successfully scans 100+ file repo |
| F2 | Detect hardcoded secrets | Finds API keys with <5% false positives |
| F3 | Detect injection vulnerabilities | Identifies SQL injection patterns in test fixtures |
| F4 | Generate plain-text report | Non-technical user can understand findings |
| F5 | Output JSON format | Valid JSON schema, parseable by CI tools |
| F6 | Provide fix recommendations | Each finding includes a "how to fix" section |

### Performance Requirements

| Metric | Target |
|--------|--------|
| Scan speed | <30 seconds for 1000 files |
| Memory usage | <500MB for typical project |
| CLI startup time | <2 seconds |

### Quality Requirements

| Metric | Target |
|--------|--------|
| Detection accuracy | ≥90% precision (low false positives) |
| Test coverage | ≥70% for core scanner |
| False positive rate | <10% on test fixtures |

---

## Deliverables

### Week 1: Core Infrastructure

**Day 1-2: Project Setup**
- ✅ Repository structure
- ✅ Documentation (this file)
- ✅ Basic CLI skeleton (argument parsing)
- ✅ File system traversal

**Day 3-4: Detection Engine**
- Rule loading from YAML
- Regex-based pattern matching
- Finding data structure and aggregation

**Day 5: First Detectors**
- Secrets detector (API keys, passwords)
- Basic injection detector (SQL, XSS)

---

### Week 2: Detectors & Reporting

**Day 6-7: Additional Detectors**
- Auth detector (weak passwords, missing validation)
- Incomplete code detector (TODO in security contexts)
- AI-specific patterns (CORS, error handlers)

**Day 8-9: Reporting**
- Plain-text formatter (colorized terminal output)
- JSON formatter
- Fix recommendation engine

**Day 10: Testing & Validation**
- Create test fixtures (vulnerable code)
- Run full test suite
- Validate against success criteria
- Bug fixes and polish

---

## Technical Implementation

### Tech Stack

**Language:** Node.js + TypeScript (for rapid development)

**Key Libraries:**
- `commander` - CLI framework
- `glob` - File system traversal
- `js-yaml` - Rule parsing
- `chalk` - Colorized output
- `fast-glob` - Fast file matching

**File Structure:**
```
vibesec/
├── cli/
│   └── cmd/
│       └── scan.ts           # Main scan command
├── scanner/
│   ├── core/
│   │   ├── engine.ts         # Orchestration
│   │   ├── rule-loader.ts    # Load YAML rules
│   │   └── finding.ts        # Finding data structure
│   ├── detectors/
│   │   ├── secrets.ts
│   │   ├── injection.ts
│   │   ├── auth.ts
│   │   ├── incomplete.ts
│   │   └── ai-specific.ts
│   └── analyzers/
│       └── regex.ts          # Regex pattern matching
├── reporters/
│   ├── plaintext.ts
│   └── json.ts
├── rules/
│   └── default/
│       ├── javascript.yaml   # JS-specific rules
│       └── python.yaml       # Python-specific rules
└── tests/
    └── fixtures/
        └── vulnerable/       # Test cases
```

---

## Sample Output

### Plain Text Report

```
╔═══════════════════════════════════════════════════════════╗
║               VibeSec Security Scan Results               ║
╚═══════════════════════════════════════════════════════════╝

📁 Scanned: /home/user/my-project
📊 Files scanned: 127
⏱️  Duration: 3.2s

🔴 CRITICAL Issues: 3
🟡 HIGH Issues: 7
🟢 MEDIUM Issues: 12
⚪ LOW Issues: 5

════════════════════════════════════════════════════════════

🔴 CRITICAL: Hardcoded API Key Detected

📍 Location: src/config/api.ts:12
📝 Code:
    const API_KEY = "sk_live_1234567890abcdef"

⚠️  Risk: Exposed credentials can be used by attackers to access
your API. This is a production-blocker security issue.

✅ Fix:
Move the API key to an environment variable:

  Before:
  const API_KEY = "sk_live_1234567890abcdef"

  After:
  const API_KEY = process.env.API_KEY

📚 References:
  - https://owasp.org/www-project-top-ten/2017/A3_2017-Sensitive_Data_Exposure
  - CWE-798: Use of Hard-coded Credentials

════════════════════════════════════════════════════════════

[... more findings ...]

════════════════════════════════════════════════════════════

📋 Summary:
  ✓ 27 security issues detected
  ✓ 3 require immediate attention (CRITICAL)
  ✓ All issues include fix recommendations

💡 Next Steps:
  1. Fix CRITICAL issues immediately
  2. Review HIGH severity issues
  3. Run 'vibesec scan .' again to verify fixes

════════════════════════════════════════════════════════════
```

---

### JSON Output

```json
{
  "version": "0.1.0",
  "scan": {
    "path": "/home/user/my-project",
    "filesScanned": 127,
    "duration": 3.2,
    "timestamp": "2025-10-09T14:30:00Z"
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
  "findings": [
    {
      "id": "secrets-001",
      "rule": "hardcoded-api-key",
      "severity": "critical",
      "category": "secrets",
      "title": "Hardcoded API Key Detected",
      "description": "API keys should be stored in environment variables, not hardcoded",
      "location": {
        "file": "src/config/api.ts",
        "line": 12,
        "column": 7
      },
      "snippet": "const API_KEY = \"sk_live_1234567890abcdef\"",
      "fix": {
        "recommendation": "Move the API key to an environment variable",
        "before": "const API_KEY = \"sk_live_1234567890abcdef\"",
        "after": "const API_KEY = process.env.API_KEY",
        "references": [
          "https://owasp.org/www-project-top-ten/2017/A3_2017-Sensitive_Data_Exposure",
          "https://cwe.mitre.org/data/definitions/798.html"
        ]
      },
      "metadata": {
        "cwe": "CWE-798",
        "owasp": "A3:2017",
        "confidence": 0.98
      }
    }
  ]
}
```

---

## Test Fixtures

### JavaScript Examples

**1. Hardcoded Secret** (`tests/fixtures/vulnerable/js/hardcoded-secret.js`)
```javascript
const apiKey = "sk_live_abc123def456";
const dbPassword = "MySuperSecretPassword123!";
```

**2. SQL Injection** (`tests/fixtures/vulnerable/js/sql-injection.js`)
```javascript
app.get('/user', (req, res) => {
  const query = `SELECT * FROM users WHERE id = ${req.query.id}`;
  db.query(query, (err, results) => {
    res.json(results);
  });
});
```

**3. XSS Vulnerability** (`tests/fixtures/vulnerable/js/xss.js`)
```javascript
app.get('/search', (req, res) => {
  res.send(`<h1>Results for: ${req.query.term}</h1>`);
});
```

**4. Weak Authentication** (`tests/fixtures/vulnerable/js/weak-auth.js`)
```javascript
function login(username, password) {
  // TODO: Add proper password hashing
  return password === "admin123";
}
```

**5. Over-permissive CORS** (`tests/fixtures/vulnerable/js/cors.js`)
```javascript
app.use(cors({
  origin: '*',
  credentials: true
}));
```

---

### Python Examples

**1. Hardcoded Credentials** (`tests/fixtures/vulnerable/py/hardcoded-creds.py`)
```python
DB_PASSWORD = "postgres123"
API_SECRET = "fake_stripe_test_key_1234567890EXAMPLE"  # FAKE key for testing
```

**2. SQL Injection** (`tests/fixtures/vulnerable/py/sql-injection.py`)
```python
@app.route('/user/<user_id>')
def get_user(user_id):
    query = f"SELECT * FROM users WHERE id = {user_id}"
    return db.execute(query)
```

**3. Command Injection** (`tests/fixtures/vulnerable/py/command-injection.py`)
```python
import os
def ping_host(host):
    os.system(f"ping -c 1 {host}")
```

**4. Incomplete Security** (`tests/fixtures/vulnerable/py/incomplete-auth.py`)
```python
def authenticate(user, password):
    # FIXME: Implement proper JWT validation
    return True
```

**5. Generic Error Handler** (`tests/fixtures/vulnerable/py/error-handler.py`)
```python
@app.errorhandler(Exception)
def handle_error(e):
    return str(e), 500  # Exposes stack trace to users
```

---

## Validation Plan

### Manual Testing
1. Run `vibesec scan tests/fixtures/vulnerable/`
2. Verify all 10 test cases are detected
3. Check false positive rate on secure code samples
4. Validate fix recommendations are clear and correct

### Automated Testing
```bash
npm test                          # Run unit tests
npm test -- --coverage            # Generate coverage report
npm run test:integration          # Test full scan workflow
```

### User Testing
- 3 non-technical users (PMs, designers) review sample reports
- Can they understand the issues?
- Are fix recommendations actionable?

---

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| High false positive rate | Users lose trust | Tune regex patterns, add confidence scoring |
| Poor performance on large repos | Users abandon tool | Implement file filtering, parallel processing |
| Unclear fix recommendations | Users don't know what to do | User testing, iterate on wording |
| Detection rules too simplistic | Miss real vulnerabilities | Start with high-confidence patterns, expand in MVP |

---

## Post-POC Next Steps

After successful POC validation:

1. **Gather Feedback** from 10 alpha testers
2. **Prioritize MVP Features** based on user needs
3. **Plan Integrations** (Snyk, Socket.dev, GitHub)
4. **Refine Architecture** for scalability
5. **Begin MVP Development** (8-week sprint)

---

## Success Metrics

POC is considered successful if:

✅ All 10 test fixtures are detected (100% recall)
✅ False positive rate <10% on secure code samples
✅ 8/10 users can understand and act on reports
✅ Scan completes in <30s for 1000 files
✅ CLI is stable with no crashes

---

**Document Owner:** VibeSec Team
**Last Updated:** 2025-10-09
**Status:** 🟢 Ready for Implementation
