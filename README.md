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

### For Developers

```bash
# Install via npm
npm install -g vibesec

# Or use with Bun (recommended for POC)
bun install vibesec

# Scan your project
vibesec scan .

# Get plain language help
vibesec scan --explain

# Generate stakeholder report
vibesec scan -f stakeholder -o report.txt
```

### For Non-Technical Users (PMs, Designers, Product Owners)

VibeSec speaks your language! No security expertise needed.

```bash
# Scan with plain language explanations
vibesec scan . --explain

# What you'll see:
# ✅ Clear "What/Why/How" explanations (no jargon!)
# ✅ Real-world analogies (e.g., "like leaving your door unlocked")
# ✅ Time estimates for each fix (e.g., "15-30 minutes")
# ✅ Who can fix it (e.g., "Any developer")
# ✅ Security score out of 100
```

**First time?** Check out the [Quick Start Guide](docs/QUICK_START.md) for a step-by-step walkthrough.

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
- JavaScript/TypeScript ✅
- Python *(coming soon)*
- Go *(coming soon)*
- Java *(coming soon)*
- Ruby *(coming soon)*
- PHP *(coming soon)*

**Note:** POC currently focuses on JavaScript/TypeScript. Built with TypeScript + Bun runtime. See [TECH_STACK.md](docs/TECH_STACK.md) for details.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     VibeSec CLI                         │
└─────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌──────────────────┐
│ Core Scanner  │   │ Integrations  │   │  Reporters       │
│               │   │               │   │                  │
│ • AST Parser  │   │ • Snyk API    │   │ • Plain Text     │
│ • Detectors   │   │ • Socket.dev  │   │ • JSON           │
│ • Analyzers   │   │ • GitHub      │   │ • Plain Language │
│               │   │               │   │ • Stakeholder    │
└───────────────┘   └───────────────┘   └──────────────────┘
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

**[📚 Complete Documentation Index](docs/INDEX.md)** - Browse all documentation

### Getting Started

- **[Quick Start Guide](docs/QUICK_START.md)** - ⭐ Step-by-step guide for first-time users
- **[Tech Stack](docs/TECH_STACK.md)** - TypeScript/Bun implementation details
- **[API Documentation](docs/API.md)** - CLI and programmatic usage

### Core Documentation

- **[Architecture](docs/ARCHITECTURE.md)** - System design and components
- **[POC Specification](docs/POC_SPEC.md)** - Proof of concept scope
- **[MVP Roadmap](docs/MVP_ROADMAP.md)** - Feature roadmap and timeline
- **[Detection Rules](docs/DETECTION_RULES.md)** - Security pattern library
- **[Integrations](docs/INTEGRATIONS.md)** - Third-party tool integrations
- **[Market Strategy](docs/MARKET_STRATEGY.md)** - Business strategy and positioning
- **[Contributing](docs/CONTRIBUTING.md)** - How to contribute

### Additional Resources

- **[Research](docs/RESEARCH.md)** - Market research and competitive analysis
- **[User Testing Guide](docs/USER_TESTING_GUIDE.md)** - Beta testing instructions
- **[SOP Documentation](docs/sop/)** - Standard operating procedures
- **[Component READMEs](docs/INDEX.md#component-documentation)** - Detailed component docs

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
# Scan current directory
vibesec scan .

# Scan with plain language (for PMs/designers)
vibesec scan --explain

# Only show critical issues
vibesec scan --severity critical

# Generate stakeholder report for board presentation
vibesec scan -f stakeholder -o security-report.txt
```

### Using Security Scorecard
```bash
# Get security score (0-100) with benchmark comparison
vibesec scan --explain

# Output shows:
# Security Score:
#   85/100 (B) - Good
#   Your score is 5 points above the average for small projects
```

### Accessibility Features
```bash
# Disable colors (for screen readers or terminals without color support)
vibesec scan --no-color

# Or use environment variable
NO_COLOR=1 vibesec scan .
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
      - name: Install Bun
        uses: oven-sh/setup-bun@v1
      - name: Install VibeSec
        run: bun install vibesec
      - name: Run Security Scan
        run: bun vibesec scan . --severity high -f json
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
