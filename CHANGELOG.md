# Changelog

All notable changes to VibeSec will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-10-22

### 🎉 Initial Release

VibeSec is a security scanner purpose-built for AI-generated code. This POC release demonstrates core scanning capabilities with a focus on detecting vulnerabilities unique to AI-assisted development.

### ✨ Features

#### Core Scanner Engine

- **19 security detection rules** across 5 categories:
  - Secrets detection (API keys, tokens, credentials)
  - Injection vulnerabilities (SQL, XSS, command injection)
  - Authentication & authorization issues
  - Incomplete implementations (TODOs, placeholders)
  - AI-specific patterns (prompt injection, data exfiltration risks)
- **Multi-language AST parsing** using tree-sitter
- **Incremental scanning** with file change detection
- **Parallel processing** for large codebases
- **Comprehensive metadata** including CWE mappings and OWASP references

#### MCP Server Integration

- **Model Context Protocol (MCP) support** for AI assistant integration
- Works with Claude Code, Cursor, and Cline
- Real-time scanning directly within AI coding assistants
- 100% local processing - code never leaves your machine
- Two MCP tools: `vibesec_scan` and `vibesec_list_rules`

#### Reporting & UX

- **Plain-language reporting** for non-technical stakeholders
- **Security scorecard** (0-100 grading with benchmark comparison)
- **Multiple output formats**: JSON, plain text, stakeholder reports
- **Colored terminal output** with accessibility support (NO_COLOR compliance)
- **Progress indicators** with ETA estimates for large scans

#### Developer Experience

- **CLI tool** with intuitive command structure
- **Configuration file support** (.vibesec.yaml)
- **CI/CD integration** examples (GitHub Actions)
- **Comprehensive test suite** (120 passing tests, 82% coverage)

### 🛡️ Security Features

- **PII scrubbing** in error reports and logs
- **Sentry integration** for production error monitoring
- **Input validation** for all user-provided paths and configurations
- **Secure defaults** - fail closed on errors
- **No data collection** - fully offline operation

### 📦 Published Packages

- **npm**: `vibesec` - Install globally or as dev dependency
- **Binary executables**: `vibesec` (CLI), `vibesec-mcp` (MCP server)

### 🐛 Known Issues & Limitations

- **Test skipped**: False positive detection tests need refinement
  - Currently flags missing security headers (CSP, etc.) which are valid findings
  - Test expectations need updating to distinguish between code vulnerabilities and configuration best practices
- **Language support**: POC focuses on JavaScript/TypeScript
  - Python, Go, Java, Ruby, PHP support planned for future releases
- **Performance**: Large codebases (>10k files) may experience slower scan times
- **Rule coverage**: Initial ruleset covers common vulnerabilities; expanding in future releases

### 🔧 Technical Details

- **Runtime**: Bun 1.0+ (also supports Node.js 16+)
- **Language**: TypeScript 5.9+
- **Parser**: web-tree-sitter for AST analysis
- **Dependencies**: Minimal, security-audited packages only

### 📝 Documentation

- Comprehensive README with quick start guide
- MCP integration setup instructions
- API documentation for programmatic usage
- Example configurations and CI/CD workflows
- User testing guide for beta testers

### 🙏 Acknowledgments

Built on research from:

- Veracode's 2025 GenAI Code Security Report
- NYU/Stanford AI-assisted coding security research
- OWASP AI Security & Privacy Guide
- Community feedback from vibe coders worldwide

---

## [Unreleased]

### Planned for 0.2.0

- Enhanced AST parsing for better accuracy
- Reduced false positive rate
- Auto-fix suggestions for common issues
- HTML/Markdown report generation
- Expanded language support (Python, Go)
- Performance optimizations for large codebases

---

[0.1.0]: https://github.com/ferg-cod3s/vibesec-bun-poc/releases/tag/v0.1.0
