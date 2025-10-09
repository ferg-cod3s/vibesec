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

## Development

Coming soon - scanner implementation will be added in POC phase.
