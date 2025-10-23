# Publishing Guide

This document explains how to publish VibeSec to npm and set up automated publishing.

## Prerequisites

1. **npm account** - Create at [npmjs.com](https://www.npmjs.com/signup)
2. **npm access token** - Generate at [npmjs.com/settings/tokens](https://www.npmjs.com/settings/~/tokens)
3. **GitHub repository access** - Admin permissions to set secrets

## One-Time Setup

### 1. Create npm Access Token

1. Go to [npmjs.com/settings/tokens](https://www.npmjs.com/settings/~/tokens)
2. Click "Generate New Token" → "Classic Token"
3. Select "Automation" type (for CI/CD publishing)
4. Copy the token (starts with `npm_...`)

### 2. Add NPM_TOKEN to GitHub Secrets

1. Go to your GitHub repository
2. Navigate to Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Name: `NPM_TOKEN`
5. Value: Paste your npm token
6. Click "Add secret"

### 3. Verify GitHub Actions is Enabled

- Go to Settings → Actions → General
- Ensure "Allow all actions and reusable workflows" is selected
- Check "Read and write permissions" for GITHUB_TOKEN

## Manual Publishing (First Time)

For the initial 0.1.0 release, publish manually:

```bash
# 1. Ensure you're on main branch with latest code
git checkout main
git pull origin main

# 2. Login to npm (if not already)
npm login

# 3. Verify everything is ready
bun test           # All tests pass
bun run build      # Build succeeds
npm publish --dry-run  # Preview package

# 4. Publish!
npm publish --access public

# 5. Verify publication
npm view vibesec
npm install -g vibesec@0.1.0
vibesec --version
```

## Automated Publishing (Subsequent Releases)

After the initial manual publish, GitHub Actions will handle future releases automatically.

### Release Process

1. **Update version** in `package.json`:
   ```bash
   # For bug fixes (0.1.0 → 0.1.1)
   npm version patch

   # For new features (0.1.0 → 0.2.0)
   npm version minor

   # For breaking changes (0.1.0 → 1.0.0)
   npm version major
   ```

2. **Update CHANGELOG.md** with changes in the new version

3. **Commit and push** to main:
   ```bash
   git add package.json CHANGELOG.md
   git commit -m "chore: Release v0.2.0"
   git push origin main
   ```

4. **GitHub Actions automatically**:
   - Detects version change in package.json
   - Runs tests
   - Builds the package
   - Publishes to npm
   - Creates GitHub release with tag

### Workflow Triggers

The publish workflow (`.github/workflows/publish.yml`) triggers on:
- Push to `main` branch
- Changes to: `package.json`, `src/**`, `cli/**`, `bin/**`, `rules/**`
- Only publishes if package.json version changed

## Troubleshooting

### "Permission denied" error
- Check NPM_TOKEN secret is set correctly
- Verify npm token is "Automation" type, not "Read Only"
- Ensure token hasn't expired

### "Package already exists" error
- Version in package.json must be unique
- Can't republish the same version
- Increment version and try again

### Tests fail in CI
- Run `bun test` locally first
- Check GitHub Actions logs for specific error
- Ensure all dependencies are in package.json

### Build fails
- Run `bun run build` locally
- Check for TypeScript errors
- Verify all source files are committed

## Package Scope

VibeSec is published as **public** package `vibesec` (no scope).

Future: Consider moving to scoped package `@vibesec/cli` for better namespace management.

## Version Strategy

Following [Semantic Versioning](https://semver.org/):

- **MAJOR** (1.0.0): Breaking API changes
- **MINOR** (0.1.0): New features, backward compatible
- **PATCH** (0.0.1): Bug fixes, backward compatible

## Publish Checklist

Before publishing manually:

- [ ] All tests pass (`bun test`)
- [ ] Build succeeds (`bun run build`)
- [ ] CHANGELOG.md updated
- [ ] Version bumped in package.json
- [ ] README.md reflects new features
- [ ] Git tags created (`git tag v0.1.0`)
- [ ] Dry-run successful (`npm publish --dry-run`)

## Rollback

If you publish a broken version:

```bash
# Deprecate the broken version
npm deprecate vibesec@0.1.1 "Broken release, use 0.1.2 instead"

# Publish a fix as new version
npm version patch
npm publish
```

**Never unpublish** packages unless they contain security vulnerabilities or secrets. Use deprecation instead.

## Support

- **npm package**: https://www.npmjs.com/package/vibesec
- **GitHub releases**: https://github.com/ferg-cod3s/vibesec-bun-poc/releases
- **Issues**: https://github.com/ferg-cod3s/vibesec-bun-poc/issues
