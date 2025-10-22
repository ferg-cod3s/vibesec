# VibeSec

**Security Scanner for AI-Generated Code**

Catches vulnerabilities your AI assistant missed. Integrates directly with Claude Code, Cursor, and Cline via MCP (Model Context Protocol).

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

```bash
# Install VibeSec globally
npm install -g vibesec

# Add to Claude Code MCP configuration
echo '{"mcpServers":{"vibesec":{"command":"vibesec-mcp"}}}' >> ~/.claude/mcp.json

# Restart Claude Code - done!
```

**Prerequisites for MCP Server:**
- Bun runtime (install: `curl -fsSL https://bun.sh/install | bash`)
- VibeSec installed globally or locally

## ✨ New: AI Assistant Integration

VibeSec now works **inside** your AI coding assistant through MCP integration:

- 🔍 **Real-time scanning** as Claude/Cursor generates code
- 🤖 **AI-aware detection** for prompt injection, incomplete implementations, hallucinated APIs
- ⚡ **Zero friction** - works directly in your existing workflow
- 🔒 **100% local** - your code never leaves your machine

**Demo:**
```
You: "Claude, can you scan this file for security issues using VibeSec?"
Claude: *uses vibesec_scan tool* "Found 2 critical issues:
  1. Hardcoded API key on line 23
  2. SQL injection risk in query builder..."
```

[See it in action →](./docs/demo.gif)

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

### Installation

**Prerequisites:**
- Node.js 16+ (for CLI)
- Bun 1.0+ (for MCP server only) - [Install Bun](https://bun.sh/install)

```bash
# Install globally (recommended)
npm install -g vibesec

# Or install locally in your project
npm install --save-dev vibesec

# Verify installation
vibesec --version
```

### Basic Usage

```bash
# Scan your project
vibesec scan .

# Scan with severity filter
vibesec scan --severity critical

# Get plain language explanations
vibesec scan --explain

# Generate stakeholder report
vibesec scan -f stakeholder -o report.txt

# JSON output for CI/CD
vibesec scan -f json -o results.json
```

### MCP Server Setup (AI Assistant Integration)

**1. Install Bun (if not already installed):**
```bash
curl -fsSL https://bun.sh/install | bash
```

**2. Configure Claude Code:**

Add to `~/.claude/mcp.json`:
```json
{
  "mcpServers": {
    "vibesec": {
      "command": "vibesec-mcp"
    }
  }
}
```

**3. Restart Claude Code**

**4. Test the integration:**
```
You: "Claude, what MCP tools do you have?"
Claude: "I have access to vibesec_scan and vibesec_list_rules..."

You: "Scan this file for security issues"
Claude: *uses vibesec_scan* "Found 2 critical vulnerabilities..."
```

For detailed MCP setup, see [docs/MCP_SETUP.md](docs/MCP_SETUP.md)

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

### Environment Configuration

VibeSec works out of the box with no configuration! However, you can optionally configure:

**Optional Environment Variables:**
```bash
# Copy the example file
cp .env.example .env

# Edit .env to configure (all optional):
# - SENTRY_DSN: Error monitoring and performance tracking
# - NODE_ENV: Environment (development, staging, production)
# - LOG_LEVEL: Logging verbosity (debug, info, warn, error)
# - ENABLE_METRICS: Performance metrics collection (default: true)
```

**No environment variables are required!** VibeSec works perfectly without any configuration. See [.env.example](./.env.example) for complete documentation.

### Troubleshooting

**MCP Server not appearing in Claude Code:**
1. Verify Bun is installed: `bun --version`
2. Check `~/.claude/mcp.json` is valid JSON
3. Restart Claude Code completely
4. Check Claude Code logs for errors

**CLI command not found:**
```bash
# If installed globally
npm list -g vibesec

# If not found, reinstall
npm install -g vibesec

# Or use npx (no installation)
npx vibesec scan .
```

**"Cannot find module" errors:**
```bash
# Reinstall dependencies
npm install

# Or use the binary directly
node ./dist/cli/index.js scan .
```

**MCP server won't start:**
```bash
# Test MCP server directly
vibesec-mcp

# Should wait for stdin input (Ctrl+C to exit)
# If errors occur, check:
# 1. Bun is installed and in PATH
# 2. All TypeScript source files exist in src/
```

For more help, see [docs/MCP_SETUP.md](docs/MCP_SETUP.md) or [open an issue](https://github.com/vibesec/vibesec/issues).

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

**📋 Active Planning:** [GitHub Project Board](https://github.com/users/ferg-cod3s/projects/4)

### POC (Weeks 1-2) ✅ COMPLETE
- [x] Core scanner engine with 19 security rules
- [x] Multi-detector system (secrets, injection, auth, incomplete code, AI-specific)
- [x] CLI tool with progress indicators
- [x] Plain-language and stakeholder reporters
- [x] Security scorecard (0-100 grading)
- [x] Comprehensive test suite (67 tests, 82% coverage)
- [x] User testing materials and feedback forms

### MVP (Weeks 3-8) 🚧 IN PROGRESS
Track progress on our [GitHub Project](https://github.com/users/ferg-cod3s/projects/4):
- [ ] Enhanced Scanner (Tree-sitter AST, incremental scanning)
- [ ] AI-Specific Detection Engine (confidence scoring, heuristics)
- [ ] Integration Layer (Snyk, Socket.dev, GitHub Actions)
- [ ] Reporting & UX (HTML/Markdown reports, auto-fix suggestions)
- [ ] Web Dashboard (optional, React + Express + SQLite)
- [ ] Polish & Launch (docs, examples, beta testing)

### Post-MVP 🔮
- [ ] IDE Integrations (VS Code, JetBrains)
- [ ] Language Expansion (Ruby, PHP, Java, C#, Swift)
- [ ] AI Chatbot ("Ask VibeSec")
- [ ] Machine Learning for detection
- [ ] Community rule marketplace
- [ ] Enterprise features (SSO, audit logs, white-label)

**Planning docs migrated to GitHub Projects for better collaboration.** See [docs/archive/](docs/archive/) for historical planning documents.

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
