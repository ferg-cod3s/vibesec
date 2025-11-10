# VibeSec Scanner

Core scanning engine for detecting security vulnerabilities in AI-generated code.

## Structure

```
scanner/
├── core/              # Core scanning engine and orchestration
├── detectors/         # Security pattern detectors
│   ├── secrets/       # Hardcoded secrets detection
│   ├── injection/     # SQL/XSS/prompt injection
│   ├── auth/          # Authentication patterns
│   ├── ai-specific/   # AI-generated code patterns
│   └── incomplete/    # TODO/placeholder detection
└── analyzers/         # Code analyzers (AST, regex)
```

## Detectors

Each detector is responsible for identifying specific security patterns:

- **Secrets**: API keys, passwords, tokens
- **Injection**: SQL injection, XSS, command injection
- **Auth**: Weak authentication, broken access control
- **AI-Specific**: Prompt injection, data leakage, over-permissive configs
- **Incomplete**: TODO/FIXME in security-critical code

## Architecture

See [ARCHITECTURE.md](../docs/ARCHITECTURE.md) for detailed design documentation.

## Implementation Status

✅ **Implemented** - Core scanner engine is fully functional with the following components:

### Core Components

**Scanner Engine** (`core/engine.ts`)

- File discovery with fast-glob
- Parallel and sequential scanning modes
- Language detection from file extensions
- Severity filtering
- Performance metrics tracking

**Rule Loader** (`core/rule-loader.ts`)

- YAML-based rule definitions
- Runtime rule validation
- Support for multiple rule formats
- Metadata parsing (CWE, OWASP, tags)

**Type System** (`core/types.ts`)

- Comprehensive TypeScript types
- Severity enum (CRITICAL, HIGH, MEDIUM, LOW)
- Category enum for security classifications
- Finding, Rule, and ScanResult interfaces

### Analyzers

**Regex Analyzer** (`analyzers/regex.ts`)

- Pattern-based detection
- Confidence scoring
- Context snippet generation
- Multi-pattern support

**Dependency Analyzer** (`analyzers/dependency.ts`)

- npm audit integration
- cargo-audit for Rust projects
- pip-audit for Python projects
- Vulnerability aggregation

### Detection Rules

Located in `/rules/default/`:

- Secrets detection (API keys, tokens, passwords)
- Injection vulnerabilities (SQL, XSS, command injection)
- Authentication issues
- Incomplete code patterns
- AI-specific vulnerabilities

**Total Rules**: 16 YAML rule files covering JavaScript, TypeScript, Python, Go, and more.

## Usage

```typescript
import { Scanner } from './scanner/core/engine';
import { Severity } from './scanner/core/types';

// Basic scan
const scanner = new Scanner({
  path: './src',
  quiet: false,
});

const result = await scanner.scan();

// Filter by severity
const scanner = new Scanner({
  path: './src',
  severityFilter: Severity.HIGH,
});

// Scan specific files
const scanner = new Scanner({
  files: ['file1.js', 'file2.ts'],
  basePath: './src',
});
```

## See Also

- [Detection Rules](../docs/DETECTION_RULES.md) - Complete rule documentation
- [Architecture](../docs/ARCHITECTURE.md) - System design
- [API Documentation](../docs/API.md) - CLI and programmatic usage
