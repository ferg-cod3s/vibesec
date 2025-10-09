# VibeSec

**Security for Vibe Coders Building with AI**

VibeSec is a comprehensive security platform specifically designed for developers, PMs, designers, and anyone building products with agentic AI. It detects security vulnerabilities in AI-generated code and provides plain-language fixes that anyone can understand.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

---

## 🎯 Why VibeSec?

The rise of vibe coding has democratized software development, but **45% of AI-generated code fails security tests** (Veracode 2025). VibeSec bridges the gap between rapid AI-assisted development and production-ready security.

### Key Problems We Solve

- **AI-Specific Vulnerabilities**: Detects patterns unique to AI-generated code (incomplete implementations, placeholder TODOs, over-permissive configs)
- **Non-Technical Accessibility**: Plain-language reports that PMs and designers can understand
- **Integration-First**: Works alongside Snyk, Socket.dev, and your existing security tools
- **Always Up-to-Date**: Auto-updating vulnerability database with latest AI-specific threats

---

## 🚀 Quick Start

```bash
# Install VibeSec CLI
npm install -g vibesec
# or
pip install vibesec

# Scan your project
vibesec scan .

# View results
vibesec report --format html
```

---

## 📊 What VibeSec Detects

### AI-Generated Code Patterns
- ✅ Hardcoded secrets and API keys
- ✅ Missing input validation (SQL injection, XSS)
- ✅ Insecure authentication patterns
- ✅ TODO/placeholder security features
- ✅ Generic error handlers exposing sensitive info
- ✅ Over-permissive CORS and permissions
- ✅ Prompt injection vulnerabilities
- ✅ Data exfiltration risks

### Language Support
- JavaScript/TypeScript
- Python
- Go
- Java
- Ruby *(coming soon)*
- PHP *(coming soon)*

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     VibeSec CLI                         │
└─────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌──────────────┐
│ Core Scanner  │   │ Integrations  │   │  Reporters   │
│               │   │               │   │              │
│ • AST Parser  │   │ • Snyk API    │   │ • JSON       │
│ • Detectors   │   │ • Socket.dev  │   │ • SARIF      │
│ • Analyzers   │   │ • GitHub      │   │ • HTML       │
└───────────────┘   └───────────────┘   └──────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────┐
│              Detection Rules Database                   │
│  • Built-in Rules  • Community Rules  • Custom Rules   │
└─────────────────────────────────────────────────────────┘
```

See [ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed design documentation.

---

## 🔧 Configuration

Create a `.vibesec.yaml` file in your project root:

```yaml
# .vibesec.yaml
version: 1

scan:
  paths:
    - src/
    - lib/
  exclude:
    - node_modules/
    - vendor/
    - "*.test.js"

severity:
  fail_on: high  # fail CI if high/critical issues found

detectors:
  secrets: true
  injection: true
  auth: true
  ai-specific: true

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
```

---

## 📖 Documentation

- **[Architecture](docs/ARCHITECTURE.md)** - System design and components
- **[POC Specification](docs/POC_SPEC.md)** - Proof of concept scope
- **[MVP Roadmap](docs/MVP_ROADMAP.md)** - Feature roadmap and timeline
- **[Detection Rules](docs/DETECTION_RULES.md)** - Security pattern library
- **[API Documentation](docs/API.md)** - Programmatic usage
- **[Integrations](docs/INTEGRATIONS.md)** - Third-party tool integrations
- **[Contributing](docs/CONTRIBUTING.md)** - How to contribute

---

## 🤝 Integrations

### Current
- ✅ GitHub Actions
- ✅ Snyk (dependency vulnerabilities)
- ✅ Socket.dev (supply chain security)

### Roadmap
- ⏳ GitLab CI/CD
- ⏳ CircleCI
- ⏳ Jenkins
- ⏳ Slack notifications
- ⏳ Discord webhooks
- ⏳ JIRA integration

---

## 🎯 Roadmap

### POC (Weeks 1-2) ✅
- [x] Core scanner engine
- [x] Basic detectors (secrets, injection, auth)
- [x] CLI tool
- [x] Plain-text reports

### MVP (Weeks 3-8)
- [ ] AI-specific pattern detection
- [ ] Snyk/Socket.dev integration
- [ ] Web dashboard
- [ ] SARIF output for GitHub Security
- [ ] One-click fix generation

### Post-MVP
- [ ] VS Code extension
- [ ] Community rule marketplace
- [ ] Enterprise SSO and audit logs
- [ ] White-label for vibe coding platforms

See [MVP_ROADMAP.md](docs/MVP_ROADMAP.md) for detailed timeline.

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test suite
npm test -- scanner/detectors/secrets

# Run with coverage
npm test -- --coverage
```

---

## 📝 Examples

### Basic Scan
```bash
cd examples/basic-scan
vibesec scan . --output-format json
```

### CI/CD Integration
```yaml
# .github/workflows/vibesec.yml
name: VibeSec Security Scan
on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: vibesec/action@v1
        with:
          fail-on: high
          integrations: snyk,socket
```

See [examples/](examples/) for more use cases.

---

## 🌍 Community

- **Discord**: [Join our community](https://discord.gg/vibesec)
- **Twitter**: [@vibesec_dev](https://twitter.com/vibesec_dev)
- **Blog**: [vibesec.dev/blog](https://vibesec.dev/blog)

---

## 📜 License

VibeSec is open-source software licensed under the [MIT License](LICENSE).

---

## 🙏 Acknowledgments

VibeSec is built on research from:
- Veracode's 2025 GenAI Code Security Report
- NYU/Stanford AI-assisted coding security research
- OWASP AI Security & Privacy Guide
- Community contributions from vibe coders worldwide

---

## 🚨 Security Issues

If you discover a security vulnerability within VibeSec itself, please email security@vibesec.dev. All security vulnerabilities will be promptly addressed.

---

**Built with ❤️ for the vibe coding community**
