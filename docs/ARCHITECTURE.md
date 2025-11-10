# VibeSec Architecture

**Version:** 1.0.0
**Last Updated:** 2025-10-09

---

## Overview

VibeSec is designed as a modular, extensible security scanning platform for AI-generated code. The architecture prioritizes:

1. **Modularity** - Independent components that can be developed and tested separately
2. **Extensibility** - Easy to add new detectors, integrations, and output formats
3. **Performance** - Efficient scanning of large codebases
4. **Accessibility** - Plain-language outputs for non-technical users

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLI Interface                            │
│  • Command parsing  • Config loading  • Orchestration           │
└──────────────────────────┬──────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
┌───────────────┐  ┌───────────────┐  ┌──────────────┐
│ Core Scanner  │  │ Integrations  │  │  Reporters   │
└───────────────┘  └───────────────┘  └──────────────┘
        │                  │                  │
        │                  │                  │
        ▼                  ▼                  ▼
┌───────────────┐  ┌───────────────┐  ┌──────────────┐
│  Analyzers    │  │  External     │  │  Output      │
│               │  │  APIs         │  │  Formatters  │
│ • AST Parser  │  │               │  │              │
│ • Regex       │  │ • Snyk        │  │ • JSON       │
│ • Heuristics  │  │ • Socket.dev  │  │ • SARIF      │
└───────────────┘  │ • GitHub      │  │ • HTML       │
        │          └───────────────┘  │ • PlainText  │
        │                             └──────────────┘
        ▼
┌───────────────────────────────────────────────────┐
│                 Detection Engine                  │
│                                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │ Secrets  │  │Injection │  │ AI-Specific  │  │
│  │ Detector │  │ Detector │  │   Detector   │  │
│  └──────────┘  └──────────┘  └──────────────┘  │
│                                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │   Auth   │  │Incomplete│  │    Custom    │  │
│  │ Detector │  │ Detector │  │   Detector   │  │
│  └──────────┘  └──────────┘  └──────────────┘  │
└───────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────┐
│              Rules Database                       │
│  • YAML Rule Definitions                          │
│  • Pattern Matching Logic                         │
│  • Severity Scoring                               │
│  • Fix Recommendations                            │
└───────────────────────────────────────────────────┘
```

---

## Core Components

### 1. CLI Interface (`cli/`)

**Responsibilities:**

- Parse command-line arguments
- Load configuration files
- Orchestrate scanning workflow
- Display progress and results
- Handle errors gracefully

**Key Commands:**

```bash
vibesec scan [path]           # Scan codebase
vibesec report [options]      # Generate reports
vibesec config [action]       # Manage configuration
vibesec update                # Update rules database
vibesec integrate [service]   # Setup integrations
```

**Technologies:**

- Node.js (JavaScript/TypeScript) or Go
- Commander.js / Cobra for CLI framework
- Chalk for colorful output

---

### 2. Core Scanner (`scanner/`)

**Responsibilities:**

- File system traversal
- Code parsing and analysis
- Detector orchestration
- Result aggregation
- Caching for performance

**Subcomponents:**

#### 2.1 Analyzers (`scanner/analyzers/`)

- **AST Parser**: Abstract Syntax Tree parsing for deep code analysis
- **Regex Engine**: Pattern matching for simple detections
- **Heuristic Analyzer**: ML-based confidence scoring for AI-generated code

#### 2.2 Detectors (`scanner/detectors/`)

Each detector is a self-contained module that:

1. Accepts parsed code/files
2. Applies detection rules
3. Returns findings with severity and fix suggestions

**Detector Types:**

| Detector        | Purpose                      | Examples                                           |
| --------------- | ---------------------------- | -------------------------------------------------- |
| **Secrets**     | Hardcoded credentials        | API keys, passwords, tokens                        |
| **Injection**   | Input validation flaws       | SQL injection, XSS, command injection              |
| **Auth**        | Authentication/Authorization | Weak passwords, missing MFA, broken access control |
| **AI-Specific** | AI-generated patterns        | Incomplete implementations, prompt injection       |
| **Incomplete**  | Placeholder code             | TODO comments, unimplemented functions             |

---

### 3. Detection Rules (`rules/`)

**Rule Format (YAML):**

```yaml
id: hardcoded-api-key
name: Hardcoded API Key Detected
description: API keys should be stored in environment variables, not hardcoded
severity: critical
category: secrets
languages:
  - javascript
  - python
  - go

patterns:
  - type: regex
    pattern: '(?i)(api[_-]?key|apikey)\s*=\s*["\']([a-zA-Z0-9]{20,})["\']'
  - type: ast
    query: 'VariableDeclaration[name=/api.*key/i][init.type="StringLiteral"]'

confidence: 0.95

fix:
  recommendation: |
    Move the API key to an environment variable:

    Before:
    const apiKey = "sk_live_abc123..."

    After:
    const apiKey = process.env.API_KEY

  references:
    - https://owasp.org/www-project-top-ten/2017/A3_2017-Sensitive_Data_Exposure
    - https://12factor.net/config

metadata:
  cwe: CWE-798
  owasp: A3:2017
  tags:
    - ai-prone
    - production-blocker
```

**Rule Schema:** `rules/schema.json`

---

### 4. Integrations (`integrations/`)

**Purpose:** Enhance VibeSec findings with data from external security tools.

#### 4.1 Snyk Integration

- **What**: Dependency vulnerability scanning
- **How**: Query Snyk API for package vulnerabilities
- **Output**: Merge Snyk findings with VibeSec report

#### 4.2 Socket.dev Integration

- **What**: Supply chain attack detection
- **How**: Check for malicious packages, typosquatting
- **Output**: Flag risky dependencies

#### 4.3 GitHub Integration

- **What**: CI/CD automation
- **How**: GitHub Action + SARIF upload to Security tab
- **Output**: Pull request checks and annotations

**Integration Interface:**

```typescript
interface Integration {
  name: string;
  enabled: boolean;
  authenticate(config: any): Promise<void>;
  scan(findings: Finding[]): Promise<EnrichedFinding[]>;
}
```

---

### 5. Reporters (`reporters/`)

**Purpose:** Transform scan findings into consumable formats.

#### Output Formats

| Format        | Use Case                         | Audience   |
| ------------- | -------------------------------- | ---------- |
| **JSON**      | CI/CD pipelines, automation      | Machines   |
| **SARIF**     | GitHub Security, IDE integration | Developers |
| **HTML**      | Detailed human-readable reports  | All users  |
| **PlainText** | Terminal output                  | Developers |

**Reporter Interface:**

```typescript
interface Reporter {
  format: string;
  generate(findings: Finding[], config: ReportConfig): Promise<Report>;
  save(report: Report, destination: string): Promise<void>;
}
```

---

## Data Flow

### Scanning Workflow

```
1. User runs: vibesec scan .
             │
             ▼
2. CLI loads config (.vibesec.yaml)
             │
             ▼
3. Core Scanner traverses file system
             │
             ▼
4. For each file:
   ┌────────────────────────────────┐
   │ • Detect language              │
   │ • Select appropriate analyzers │
   │ • Parse code (AST/Regex)       │
   └────────────────────────────────┘
             │
             ▼
5. Detectors run in parallel
   ┌────────────────────────────────┐
   │ Secrets │ Injection │ Auth ... │
   └────────────────────────────────┘
             │
             ▼
6. Findings aggregated & deduplicated
             │
             ▼
7. Integrations enrich findings
   ┌────────────────────────────────┐
   │ Snyk API │ Socket.dev API      │
   └────────────────────────────────┘
             │
             ▼
8. Reporter generates output
   ┌────────────────────────────────┐
   │ JSON │ SARIF │ HTML │ Terminal │
   └────────────────────────────────┘
             │
             ▼
9. Results displayed/saved
```

---

## Performance Considerations

### Optimization Strategies

1. **Parallel Processing**
   - Scan files concurrently (worker pool)
   - Run detectors in parallel per file

2. **Caching**
   - Cache AST parsing results
   - Cache unchanged file scans (git-based diffing)
   - Cache external API responses (15-min TTL)

3. **Smart Scanning**
   - Skip files based on .gitignore
   - Only scan changed files in CI (diff mode)
   - Incremental scanning for large repos

4. **Resource Limits**
   - Max file size threshold (default: 1MB)
   - Timeout per file (default: 5s)
   - Max concurrent workers (default: CPU cores)

**Expected Performance:**

- Small projects (<1K files): <10 seconds
- Medium projects (1K-10K files): <2 minutes
- Large projects (10K+ files): <10 minutes

---

## Security & Privacy

### Data Handling

1. **Local-First**
   - All scanning happens locally
   - No code sent to external servers (except opt-in integrations)

2. **Secrets Management**
   - Integration tokens stored in local config or env vars
   - Never logged or transmitted unencrypted

3. **Telemetry** _(Optional)_
   - Anonymous usage statistics (opt-in)
   - No code snippets or file paths collected

---

## Extensibility

### Adding New Detectors

1. Create detector in `scanner/detectors/[name]/`
2. Implement `Detector` interface:
   ```typescript
   interface Detector {
     name: string;
     category: string;
     detect(code: ParsedCode): Finding[];
   }
   ```
3. Register detector in `scanner/core/registry.ts`
4. Add rules to `rules/default/[language].yaml`

### Adding New Integrations

1. Create integration in `integrations/[name]/`
2. Implement `Integration` interface
3. Add configuration schema to `.vibesec.yaml`
4. Document in `docs/INTEGRATIONS.md`

### Adding New Reporters

1. Create reporter in `reporters/[format]/`
2. Implement `Reporter` interface
3. Register in `reporters/index.ts`

---

## Testing Strategy

### Unit Tests

- Test each detector independently
- Mock code parsing and rule matching
- Verify fix recommendations

### Integration Tests

- Test complete scan workflow
- Verify integration with Snyk/Socket.dev (mocked)
- Test output formats

### Fixture Tests

- `tests/fixtures/vulnerable/` - Known vulnerable code
- `tests/fixtures/secure/` - Secure reference implementations
- Verify detection accuracy (precision/recall)

**Coverage Goal:** >80% for core scanner, >95% for detectors

---

## Deployment Architecture

### POC/MVP (Local)

```
Developer Machine
├── VibeSec CLI
├── Local Rules Database
└── Optional: API tokens for integrations
```

### Enterprise (Future)

```
┌─────────────────────────────────────┐
│       VibeSec Cloud Platform        │
│  • Centralized rule management      │
│  • Team dashboards                  │
│  • Audit logs                       │
│  • SSO/SAML                         │
└─────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────┐
│       Developer Workstations        │
│  • VibeSec CLI agents               │
│  • IDE extensions                   │
└─────────────────────────────────────┘
```

---

## Technology Stack

### Backend/CLI

- **Language:** Node.js (TypeScript) or Go
- **Parsing:** Tree-sitter (multi-language AST), Babel (JS/TS), ast (Python)
- **Regex:** RE2 (safe regex engine)
- **Storage:** SQLite (local cache), YAML (rules)

### Web Dashboard (Future)

- **Frontend:** React + TypeScript
- **Backend API:** Express.js or FastAPI
- **Database:** PostgreSQL
- **Auth:** Auth0 or Firebase Auth

### CI/CD

- **GitHub Actions:** Pre-built action
- **Docker:** Containerized scanner
- **Helm Charts:** Kubernetes deployment (enterprise)

---

## Future Enhancements

### Phase 2 (Post-MVP)

- Machine learning model for AI-generated code detection
- Natural language query interface ("Show me auth issues")
- VS Code / JetBrains IDE extensions
- Automated PR generation for fixes

### Phase 3 (Enterprise)

- SaaS platform with centralized management
- Team collaboration features
- Custom rule marketplace
- White-label for vibe coding platforms (Lovable, Replit)

---

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CWE Database](https://cwe.mitre.org/)
- [SARIF Specification](https://sarifweb.azurewebsites.net/)
- [Tree-sitter](https://tree-sitter.github.io/tree-sitter/)
- [Snyk API Docs](https://snyk.docs.apiary.io/)
- [Socket.dev API](https://socket.dev/docs/api)

---

**Maintained by:** VibeSec Team
**Questions?** Open an issue or join our [Discord](https://discord.gg/vibesec)
