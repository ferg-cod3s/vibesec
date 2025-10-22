# VibeSec Publishing Guide

Complete guide for publishing VibeSec to npm.

## ✅ Pre-Publish Checklist

All of these items have been completed and verified:

- [x] **Build system configured**
  - TypeScript compilation working
  - MCP server compiles to dist/src/mcp/
  - CLI compiles to dist/cli/
  - Asset copying (rules/) working

- [x] **Package configuration**
  - `files` field in package.json lists all necessary files
  - `.npmignore` excludes development files
  - `prepublishOnly` script runs build + tests
  - `prepack` script runs build
  - `bin` scripts point to correct files

- [x] **Documentation**
  - README.md has complete installation instructions
  - CHANGELOG.md created with version 0.1.0 details
  - .env.example clearly marks REQUIRED vs OPTIONAL variables
  - MCP setup guide at docs/MCP_SETUP.md
  - Troubleshooting section in README

- [x] **Testing**
  - All tests pass (46+ tests)
  - npm pack tested locally
  - CLI works from packaged tarball
  - MCP server files present in package

## 📦 Package Contents

The npm package includes:

```
vibesec-0.1.0.tgz (153.3 KB)
├── dist/               # Compiled JavaScript
│   ├── cli/           # CLI entry point
│   ├── src/mcp/       # MCP server compiled
│   ├── scanner/       # Core scanner
│   ├── reporters/     # Output formatters
│   ├── rules/         # Detection rules (copied)
│   └── lib/           # Utilities
├── bin/               # Executable scripts
│   └── vibesec-mcp    # Bun-based MCP server
├── src/               # TypeScript sources (for bun)
│   ├── mcp/          # MCP server TypeScript
│   └── observability/
├── cli/               # CLI TypeScript sources
├── scanner/           # Scanner TypeScript sources
├── reporters/         # Reporter TypeScript sources
├── rules/             # Detection rules (source)
├── README.md
├── LICENSE
├── .env.example
└── .mcp.json.example
```

**Total:** 201 files, 816.3 KB unpacked

## 🚀 Publishing Steps

### 1. Version Bump (if needed)

```bash
# For patch version (0.1.0 -> 0.1.1)
npm version patch

# For minor version (0.1.0 -> 0.2.0)
npm version minor

# For major version (0.1.0 -> 1.0.0)
npm version major
```

### 2. Pre-Publish Verification

```bash
# Run tests (happens automatically with prepublishOnly)
bun test

# Build (happens automatically with prepublishOnly)
bun run build

# Verify dist/ contains all compiled files
ls -R dist/

# Test package locally
npm pack
tar -tzf vibesec-*.tgz | wc -l  # Should show 201 files
```

### 3. Publish to npm

**First time setup:**
```bash
# Login to npm
npm login

# Verify you're logged in
npm whoami
```

**Publish:**
```bash
# Dry run (recommended first)
npm publish --dry-run

# Publish to npm
npm publish

# Or for scoped package (if needed)
npm publish --access public
```

### 4. Post-Publish Verification

```bash
# Install globally to test
npm install -g vibesec

# Verify version
vibesec --version

# Test CLI
vibesec scan --help

# Test MCP server (requires Bun)
vibesec-mcp
# (Ctrl+C to exit)

# Uninstall test installation
npm uninstall -g vibesec
```

### 5. Create GitHub Release

```bash
# Tag the release
git tag v0.1.0

# Push tag
git push origin v0.1.0

# Create GitHub release
gh release create v0.1.0 \
  --title "v0.1.0 - Initial Release" \
  --notes-file CHANGELOG.md
```

## 🔄 Update Process

For subsequent releases:

1. **Update version in package.json**: `npm version [patch|minor|major]`
2. **Update CHANGELOG.md**: Add new version section
3. **Commit changes**: `git commit -am "chore: bump version to X.Y.Z"`
4. **Publish**: `npm publish`
5. **Tag and release**: `git tag vX.Y.Z && git push --tags`

## 📊 Package Statistics

**Current Package:**
- Size: 153.3 kB (tarball)
- Unpacked: 816.3 kB
- Files: 201
- Dependencies: 6 production dependencies
  - @sentry/bun
  - chalk
  - commander
  - fast-glob
  - js-yaml
  - ora

## 🛡️ Security

**Before Publishing:**
- No .env files in package ✅
- No .mcp.json files in package ✅
- No credentials in code ✅
- .npmignore properly configured ✅

**Credentials Management:**
- Use `.env` for local development
- Never commit `.env` to git
- Environment variables documented in `.env.example`

## 🐛 Common Issues

### "npm ERR! 402 Payment Required"
- You're trying to publish to a scope that requires payment
- Use `npm publish --access public` for scoped packages

### "npm ERR! 403 Forbidden"
- Not logged in: `npm login`
- Wrong permissions: Verify you own the package name

### "Module not found" after publishing
- Verify `files` field in package.json includes all necessary files
- Check that `dist/` is included
- Test with `npm pack` before publishing

### Package too large
- Current size (153.3 kB) is acceptable
- If it grows, exclude unnecessary files in .npmignore

## 📞 Support

**Issues:**
- GitHub Issues: https://github.com/vibesec/vibesec/issues
- Email: support@vibesec.dev

**Documentation:**
- Main README: /README.md
- MCP Setup: /docs/MCP_SETUP.md
- Changelog: /CHANGELOG.md

---

**Last Updated:** 2025-10-21
**Package Version:** 0.1.0
**Maintainer:** VibeSec Team
