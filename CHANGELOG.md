# Changelog

All notable changes to VibeSec will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-10-21

### Added

#### MCP Server Integration
- **Complete MCP (Model Context Protocol) server implementation** for AI assistant integration
- `vibesec-mcp` binary for running VibeSec as an MCP server
- Integration with Claude Code, Cursor, and other MCP-compatible AI assistants
- Two MCP tools:
  - `vibesec_scan` - Scan code files for security vulnerabilities
  - `vibesec_list_rules` - List and filter available detection rules
- Comprehensive MCP setup documentation in `docs/MCP_SETUP.md`
- `.mcp.json.example` configuration file

#### Core Security Scanner (POC)
- Multi-detector system with 19 security detection rules:
  - Secrets detection (API keys, tokens, passwords, database URLs, private keys, AWS credentials, generic secrets)
  - Injection vulnerabilities (SQL injection, command injection, path traversal, XSS)
  - Authentication issues (hardcoded credentials, weak authentication, missing authorization)
  - AI-specific patterns (incomplete implementations, TODO security, placeholder code)
- AST-based parsing for accurate detection
- Parallel file scanning for performance
- Security scorecard (0-100 grading system)

#### CLI & User Experience
- Interactive CLI with progress indicators
- Multiple output formats:
  - Plain text (developer-friendly)
  - JSON (machine-readable)
  - Plain language (non-technical users)
  - Stakeholder reports (executive summaries)
- Severity filtering (critical, high, medium, low)
- Accessibility support (NO_COLOR, screen reader friendly)
- Comprehensive help text and examples

#### Observability & Monitoring
- Sentry integration for error tracking and performance monitoring
- Metrics collection system
- Structured logging with context
- Self-hosted Sentry support

#### Documentation
- Complete README with quick start guide
- Detailed architecture documentation
- MCP server setup guide
- Environment configuration examples
- API documentation

#### Testing
- 46+ unit tests covering MCP tools and core functionality
- Integration tests for MCP server
- 82% code coverage
- Test fixtures for realistic scenarios

### Technical Details

#### Dependencies
- TypeScript 5.9.3
- Bun 1.0+ runtime
- Commander.js for CLI
- web-tree-sitter for AST parsing
- @sentry/bun for observability
- chalk and ora for terminal UI

#### Build System
- TypeScript compilation to CommonJS
- Source maps and declaration files
- Asset copying (detection rules)
- Pre-publish validation (build + test)

#### Package Configuration
- Dual entry points: `vibesec` (CLI) and `vibesec-mcp` (MCP server)
- Explicit files list for npm publishing
- .npmignore for clean packages
- MIT license

### Changed
- N/A (initial release)

### Deprecated
- N/A (initial release)

### Removed
- N/A (initial release)

### Fixed
- N/A (initial release)

### Security
- All security scanning rules are active by default
- No credentials stored in package
- Environment-based configuration for sensitive data
- Sentry integration follows security best practices

---

## [Unreleased]

### Planned
- Enhanced AST parsing with tree-sitter
- AI-specific confidence scoring
- Integration with Snyk and Socket.dev
- HTML/Markdown report formats
- Auto-fix suggestions
- IDE integrations (VS Code, JetBrains)
- Additional language support (Python, Go, Ruby, PHP)
- Community rule marketplace

---

## Release Notes

### Version 0.1.0 - First Public Release

VibeSec is now available as an npm package with full MCP server support! This release includes:

✅ **MCP Integration** - Use VibeSec directly in Claude Code and other AI assistants
✅ **19 Security Rules** - Detect hardcoded secrets, injection vulnerabilities, and AI-specific issues
✅ **Plain Language Reports** - Security results anyone can understand
✅ **Production Ready** - 46+ tests, comprehensive error handling, and observability

**Installation:**
```bash
npm install -g vibesec
```

**MCP Setup (Claude Code):**
```json
{
  "mcpServers": {
    "vibesec": {
      "command": "vibesec-mcp"
    }
  }
}
```

For full documentation, visit: https://github.com/vibesec/vibesec

---

[0.1.0]: https://github.com/vibesec/vibesec/releases/tag/v0.1.0
