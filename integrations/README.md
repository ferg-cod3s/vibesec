# VibeSec Integrations

External tool integrations to enrich VibeSec findings.

## Structure

```
integrations/
├── snyk/       # Snyk dependency vulnerability integration
├── socket/     # Socket.dev supply chain security integration
└── github/     # GitHub Actions and Security tab integration
```

## Supported Integrations

### Snyk
- **Purpose**: Dependency vulnerability scanning
- **Features**: CVE database, package vulnerability detection
- **Status**: Planned for MVP

### Socket.dev
- **Purpose**: Supply chain attack detection
- **Features**: Malicious package detection, typosquatting
- **Status**: Planned for MVP

### GitHub
- **Purpose**: CI/CD automation
- **Features**: GitHub Action, SARIF upload, PR annotations
- **Status**: Planned for MVP

## Development

See [MVP_ROADMAP.md](../docs/MVP_ROADMAP.md) for integration timeline.
