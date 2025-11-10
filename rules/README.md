# VibeSec Detection Rules

YAML-based security detection rules for VibeSec scanner.

## Structure

```
rules/
├── default/        # Built-in rules (maintained by VibeSec)
│   ├── javascript.yaml
│   ├── python.yaml
│   ├── go.yaml
│   └── ai-patterns.yaml
├── community/      # Community-contributed rules
└── schema.json     # Rule definition schema
```

## Rule Categories

- **secrets**: Hardcoded credentials (API keys, passwords)
- **injection**: Input validation flaws (SQL injection, XSS)
- **auth**: Authentication/authorization issues
- **ai-specific**: AI-generated code patterns
- **incomplete**: Placeholder/TODO code
- **crypto**: Cryptographic weaknesses
- **config**: Misconfigurations (CORS, debug mode)

## Creating Rules

See [DETECTION_RULES.md](../docs/DETECTION_RULES.md) for:

- Rule schema documentation
- Examples of built-in rules
- How to create custom rules
- Testing and validation

## Contributing

We welcome community-contributed rules! See [CONTRIBUTING.md](../docs/CONTRIBUTING.md) for:

- Submission guidelines
- Quality standards
- Bounty program details

## Rule Updates

Update community rules:

```bash
vibesec update-rules
```

This pulls the latest rules from the VibeSec community repository.
