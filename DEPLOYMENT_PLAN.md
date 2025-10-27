# VibeSec Deployment Plan

**Date:** 2025-10-22
**Goal:** Production-ready deployment within 3 days
**Status:** Action plan for critical fixes and deployment infrastructure

---

## Overview

This document provides a step-by-step plan to take VibeSec from current state to production-ready deployment.

**Total Estimated Time:** 22 hours (~3 days)
**Critical Path:** Fix tests → Standardize build → Add CI/CD → Deploy

---

## Phase 1: Critical Blockers (Day 1 - 7 hours)

### Task 1.1: Fix Test Suite ⏱️ 3 hours

**Priority:** P0 - BLOCKING
**Assigned To:** Developer

**Steps:**

1. **Fix MCP Integration Tests** (1.5 hours)

   ```bash
   # File: tests/mcp/integration.test.ts

   # Issue: 'lastResponse.result' is of type 'unknown'
   # Lines affected: 254-257, 403, 421, 446-448

   # Solution: Add type guards
   ```

   Changes needed:

   ```typescript
   // Before
   expect(lastResponse.result.findings).toBeInstanceOf(Array);

   // After
   const result = lastResponse.result as {
     findings: any[];
     summary: any;
     scan: any;
     status: string;
   };
   expect(result.findings).toBeInstanceOf(Array);
   ```

   Do for all instances of `lastResponse.result` and `toolsResponse.result`.

2. **Fix Reporter Tests** (1 hour)

   ```bash
   # File: tests/unit/reporters.test.ts

   # Issue 1: Category enum mismatch (line 10)
   # Issue 2: Timestamp type mismatch (line 36)
   # Issue 3: Category values don't match enum (lines 51-54)
   ```

   Changes needed:

   ```typescript
   // Line 10: Change 'injection' to Category.INJECTION
   category: Category.INJECTION,

   // Line 36: Convert Date to ISO string
   timestamp: new Date('2025-01-01T00:00:00Z').toISOString(),

   // Lines 51-54: Remove invalid categories
   // Delete: crypto, auth-authz, insecure-config, data-exposure
   // Use only valid Category enum values from scanner/core/types.ts
   ```

3. **Verify All Tests Pass** (0.5 hours)

   ```bash
   npx jest --no-cache
   npx jest --coverage

   # Ensure:
   # - All test suites pass
   # - Coverage > 70% (as defined in jest.config.js)
   ```

**Deliverables:**

- [ ] All 7 test suites passing
- [ ] Coverage report generated
- [ ] No TypeScript compilation errors

**Acceptance Criteria:**

```bash
$ npx jest
# Expected output:
# Test Suites: 7 passed, 7 total
# Tests:       XX passed, XX total
# Snapshots:   0 total
# Time:        X.XXXs
```

---

### Task 1.2: Standardize Build Process ⏱️ 0.5 hours

**Priority:** P0 - BLOCKING
**Assigned To:** Developer

**Steps:**

1. **Update package.json Build Script**

   ```bash
   # File: package.json
   ```

   Change:

   ```json
   "scripts": {
     "build": "tsc && bun copy-assets.js"
   }
   ```

   To:

   ```json
   "scripts": {
     "build": "tsc && node copy-assets.js",
     "build:bun": "tsc && bun copy-assets.js"
   }
   ```

2. **Update MCP Entry Point Shebang**

   ```bash
   # File: bin/vibesec-mcp
   ```

   Change:

   ```bash
   #!/usr/bin/env bun
   ```

   To:

   ```bash
   #!/usr/bin/env node
   ```

   And update imports from:

   ```typescript
   import { MCPServer } from '../src/mcp/server';
   ```

   To:

   ```typescript
   // CommonJS require or ESM with proper extension
   const { MCPServer } = require('../dist/src/mcp/server');
   ```

3. **Test Build Process**

   ```bash
   npm run build
   ls -la dist/

   # Verify dist/ contains:
   # - cli/
   # - scanner/
   # - reporters/
   # - src/
   # - rules/
   ```

**Deliverables:**

- [ ] Build works with `npm run build`
- [ ] No dependency on Bun for standard build
- [ ] Bun build still available via `npm run build:bun`

---

### Task 1.3: Exclude Tests from Production Build ⏱️ 0.5 hours

**Priority:** P0
**Assigned To:** Developer

**Steps:**

1. **Update tsconfig.json**

   ```json
   {
     "compilerOptions": {
       "outDir": "./dist"
     },
     "include": ["cli/**/*", "scanner/**/*", "reporters/**/*", "src/**/*", "lib/**/*"],
     "exclude": [
       "node_modules",
       "dist",
       "**/*.test.ts",
       "tests/**/*",
       "poc/**/*",
       "demo-examples/**/*"
     ]
   }
   ```

2. **Verify Clean Build**

   ```bash
   rm -rf dist/
   npm run build

   # dist/ should NOT contain:
   # - tests/
   # - poc/
   # - demo-examples/
   ```

**Deliverables:**

- [ ] Production build excludes test files
- [ ] Build size reduced
- [ ] No test code in dist/

---

### Task 1.4: Create Dockerfile ⏱️ 1 hour

**Priority:** P0 - BLOCKING
**Assigned To:** DevOps

**Steps:**

1. **Create Dockerfile**

   ```dockerfile
   # File: Dockerfile

   FROM node:20-alpine AS builder

   WORKDIR /app

   # Copy package files
   COPY package*.json ./

   # Install dependencies
   RUN npm ci --only=production

   # Copy source code
   COPY . .

   # Build
   RUN npm run build

   # Production stage
   FROM node:20-alpine

   WORKDIR /app

   # Copy only production dependencies and built files
   COPY --from=builder /app/package*.json ./
   COPY --from=builder /app/dist ./dist
   COPY --from=builder /app/node_modules ./node_modules

   # Create non-root user
   RUN addgroup -g 1001 vibesec && \
       adduser -D -u 1001 -G vibesec vibesec

   USER vibesec

   # Expose MCP port (if needed for future HTTP transport)
   # EXPOSE 3000

   # Health check
   HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
     CMD node -e "console.log('healthy')" || exit 1

   # Default command (can be overridden)
   CMD ["node", "dist/cli/index.js", "--help"]
   ```

2. **Create .dockerignore**

   ```
   # File: .dockerignore

   node_modules
   dist
   .git
   .github
   .env
   .env.*
   *.log
   npm-debug.log*
   coverage
   .DS_Store
   Thumbs.db
   *.md
   !README.md
   tests
   poc
   demo-examples
   demo-automation
   benchmark-results
   .claude
   ```

3. **Build and Test Docker Image**

   ```bash
   docker build -t vibesec:latest .

   # Test CLI
   docker run --rm vibesec:latest node dist/cli/index.js --version

   # Test MCP server
   docker run --rm -i vibesec:latest node bin/vibesec-mcp
   ```

**Deliverables:**

- [ ] Dockerfile created
- [ ] .dockerignore created
- [ ] Docker image builds successfully
- [ ] Image size < 200MB
- [ ] CLI and MCP server work in container

---

### Task 1.5: Create GitHub Actions CI/CD ⏱️ 2 hours

**Priority:** P0 - BLOCKING
**Assigned To:** DevOps

**Steps:**

1. **Create CI Workflow**

   ```yaml
   # File: .github/workflows/ci.yml

   name: CI

   on:
     push:
       branches: [main, dev, 'claude/**']
     pull_request:
       branches: [main, dev]

   jobs:
     test:
       runs-on: ubuntu-latest

       strategy:
         matrix:
           node-version: [18.x, 20.x, 22.x]

       steps:
         - uses: actions/checkout@v4

         - name: Setup Node.js ${{ matrix.node-version }}
           uses: actions/setup-node@v4
           with:
             node-version: ${{ matrix.node-version }}
             cache: 'npm'

         - name: Install dependencies
           run: npm ci

         - name: Build
           run: npm run build

         - name: Run tests
           run: npm test -- --coverage

         - name: Upload coverage
           uses: codecov/codecov-action@v4
           if: matrix.node-version == '20.x'
           with:
             files: ./coverage/lcov.info
             flags: unittests
             name: vibesec-coverage

     lint:
       runs-on: ubuntu-latest

       steps:
         - uses: actions/checkout@v4

         - name: Setup Node.js
           uses: actions/setup-node@v4
           with:
             node-version: '20.x'
             cache: 'npm'

         - name: Install dependencies
           run: npm ci

         - name: Lint
           run: npm run lint

         - name: Format check
           run: npm run format:check

     security:
       runs-on: ubuntu-latest

       steps:
         - uses: actions/checkout@v4

         - name: Setup Node.js
           uses: actions/setup-node@v4
           with:
             node-version: '20.x'
             cache: 'npm'

         - name: Install dependencies
           run: npm ci

         - name: Run npm audit
           run: npm audit --audit-level=moderate

         - name: Run Snyk security scan
           uses: snyk/actions/node@master
           continue-on-error: true
           env:
             SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

     build-docker:
       runs-on: ubuntu-latest
       needs: [test, lint, security]

       steps:
         - uses: actions/checkout@v4

         - name: Set up Docker Buildx
           uses: docker/setup-buildx-action@v3

         - name: Build Docker image
           uses: docker/build-push-action@v5
           with:
             context: .
             push: false
             tags: vibesec:test
             cache-from: type=gha
             cache-to: type=gha,mode=max
   ```

2. **Create Publish Workflow**

   ```yaml
   # File: .github/workflows/publish.yml

   name: Publish

   on:
     release:
       types: [published]

   jobs:
     publish-npm:
       runs-on: ubuntu-latest

       steps:
         - uses: actions/checkout@v4

         - name: Setup Node.js
           uses: actions/setup-node@v4
           with:
             node-version: '20.x'
             registry-url: 'https://registry.npmjs.org'

         - name: Install dependencies
           run: npm ci

         - name: Build
           run: npm run build

         - name: Publish to npm
           run: npm publish
           env:
             NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}

     publish-docker:
       runs-on: ubuntu-latest

       steps:
         - uses: actions/checkout@v4

         - name: Set up Docker Buildx
           uses: docker/setup-buildx-action@v3

         - name: Login to Docker Hub
           uses: docker/login-action@v3
           with:
             username: ${{ secrets.DOCKERHUB_USERNAME }}
             password: ${{ secrets.DOCKERHUB_TOKEN }}

         - name: Extract version
           id: version
           run: echo "VERSION=${GITHUB_REF#refs/tags/v}" >> $GITHUB_OUTPUT

         - name: Build and push
           uses: docker/build-push-action@v5
           with:
             context: .
             push: true
             tags: |
               vibesec/vibesec:${{ steps.version.outputs.VERSION }}
               vibesec/vibesec:latest
             cache-from: type=gha
             cache-to: type=gha,mode=max
   ```

3. **Create PR Template**

   ```markdown
   # File: .github/pull_request_template.md

   ## Description

   <!-- Describe your changes in detail -->

   ## Type of Change

   - [ ] Bug fix (non-breaking change which fixes an issue)
   - [ ] New feature (non-breaking change which adds functionality)
   - [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
   - [ ] Documentation update

   ## Testing

   - [ ] All tests pass (`npm test`)
   - [ ] Lint passes (`npm run lint`)
   - [ ] Build succeeds (`npm run build`)
   - [ ] Manual testing completed

   ## Checklist

   - [ ] My code follows the project's style guidelines
   - [ ] I have performed a self-review of my own code
   - [ ] I have commented my code, particularly in hard-to-understand areas
   - [ ] I have made corresponding changes to the documentation
   - [ ] My changes generate no new warnings
   - [ ] I have added tests that prove my fix is effective or that my feature works
   - [ ] New and existing unit tests pass locally with my changes
   ```

**Deliverables:**

- [ ] CI workflow created
- [ ] Publish workflow created
- [ ] PR template created
- [ ] Workflows pass on test push

---

## Phase 2: Testing & Validation (Day 1-2 - 4 hours)

### Task 2.1: Comprehensive Testing ⏱️ 2 hours

**Priority:** P0
**Assigned To:** QA/Developer

**Steps:**

1. **Unit Test Validation**

   ```bash
   npm test -- --coverage

   # Verify coverage thresholds met:
   # - Branches: >= 70%
   # - Functions: >= 70%
   # - Lines: >= 70%
   # - Statements: >= 70%
   ```

2. **Integration Testing**

   ```bash
   # Build the project
   npm run build

   # Test CLI
   node dist/cli/index.js --version
   node dist/cli/index.js scan examples/sample-api --format json

   # Test MCP server
   echo '{"jsonrpc":"2.0","method":"initialize","params":{},"id":1}' | node bin/vibesec-mcp
   ```

3. **Docker Testing**

   ```bash
   docker build -t vibesec:test .

   # Test CLI in container
   docker run --rm vibesec:test node dist/cli/index.js --help

   # Test MCP in container
   echo '{"jsonrpc":"2.0","method":"ping","params":{},"id":1}' | \
     docker run --rm -i vibesec:test node bin/vibesec-mcp
   ```

4. **Performance Benchmarking**

   ```bash
   npm run benchmark

   # Verify:
   # - Scan time for sample-api < 5 seconds
   # - Memory usage < 200MB
   # - No memory leaks
   ```

**Deliverables:**

- [ ] All tests pass
- [ ] Coverage meets thresholds
- [ ] CLI works in all environments
- [ ] MCP server functional
- [ ] Performance acceptable

---

### Task 2.2: Security Validation ⏱️ 1 hour

**Priority:** P1
**Assigned To:** Security

**Steps:**

1. **Dependency Audit**

   ```bash
   npm audit
   npm audit fix

   # Ensure 0 high/critical vulnerabilities
   ```

2. **Secret Scanning**

   ```bash
   # Install gitleaks
   docker run --rm -v $(pwd):/path zricethezav/gitleaks:latest detect --source=/path -v

   # Ensure no secrets committed
   ```

3. **SAST Scanning**

   ```bash
   # Use VibeSec on itself
   node dist/cli/index.js scan . --severity high

   # Address any findings
   ```

**Deliverables:**

- [ ] No dependency vulnerabilities
- [ ] No committed secrets
- [ ] No high/critical security issues

---

### Task 2.3: Manual QA Testing ⏱️ 1 hour

**Priority:** P1
**Assigned To:** QA

**Test Cases:**

1. **Installation Test**

   ```bash
   # In fresh directory
   npm install -g ./path/to/vibesec
   vibesec --version
   vibesec scan ./sample-project
   ```

2. **MCP Integration Test**

   ```bash
   # Configure in Claude Code
   # Restart Claude Code
   # Ask: "What MCP tools do you have?"
   # Verify: vibesec_scan and vibesec_list_rules appear
   ```

3. **Error Handling Test**

   ```bash
   # Invalid input
   vibesec scan /nonexistent
   # Should show friendly error, not crash

   # Invalid config
   vibesec scan . --config /bad/config.yaml
   # Should show helpful message
   ```

4. **Output Format Test**
   ```bash
   vibesec scan examples/sample-api --format json > output.json
   vibesec scan examples/sample-api --format stakeholder > report.txt
   vibesec scan examples/sample-api --explain
   ```

**Deliverables:**

- [ ] All test cases pass
- [ ] No crashes or errors
- [ ] User experience is smooth

---

## Phase 3: Documentation Updates (Day 2 - 3 hours)

### Task 3.1: Fix Critical Documentation Issues ⏱️ 1.5 hours

**Priority:** P1
**Assigned To:** Technical Writer

**Steps:**

1. **Fix README Issues**

   - Remove or create `./docs/demo.gif` (line 34)
   - Update installation instructions to use npm-published package
   - Clarify runtime requirements (Node.js primary, Bun optional)
   - Update MCP setup to use `npx vibesec-mcp`

2. **Update Component READMEs**

   ```bash
   # Files to update:
   # - cli/README.md
   # - scanner/README.md
   # - integrations/README.md

   # Remove "Coming soon" messages
   # Add actual implementation details
   ```

3. **Consolidate Status Documentation**
   - Update STATUS.md as single source of truth
   - Remove outdated phase completion documents
   - Update README to reference STATUS.md

**Deliverables:**

- [ ] No broken links in documentation
- [ ] Accurate implementation status
- [ ] Clear installation instructions

---

### Task 3.2: Create Deployment Documentation ⏱️ 1.5 hours

**Priority:** P1
**Assigned To:** Technical Writer

**Documents to Create:**

1. **docs/DEPLOYMENT.md**

   ```markdown
   # Deployment Guide

   ## Prerequisites

   ## Installation Methods

   ## Configuration

   ## Running in Production

   ## Monitoring

   ## Troubleshooting
   ```

2. **docs/ENVIRONMENT_VARIABLES.md**

   ```markdown
   # Environment Variables

   ## Required Variables

   ## Optional Variables

   ## Integration Tokens

   ## Security Considerations
   ```

3. **docs/TROUBLESHOOTING.md**

   ```markdown
   # Troubleshooting Guide

   ## Installation Issues

   ## Build Failures

   ## Runtime Errors

   ## MCP Connection Issues

   ## Performance Problems
   ```

4. **docs/RELEASE_PROCESS.md**

   ```markdown
   # Release Process

   ## Versioning Strategy

   ## Creating a Release

   ## Publishing to npm

   ## Docker Image Publishing

   ## Changelog Management
   ```

**Deliverables:**

- [ ] Deployment guide complete
- [ ] Environment variables documented
- [ ] Troubleshooting guide created
- [ ] Release process documented

---

## Phase 4: Deployment Infrastructure (Day 2-3 - 6 hours)

### Task 4.1: npm Package Preparation ⏱️ 2 hours

**Priority:** P0
**Assigned To:** Developer

**Steps:**

1. **Update package.json for Publishing**

   ```json
   {
     "name": "vibesec",
     "version": "0.1.0",
     "description": "Security scanner for AI-generated code",
     "main": "dist/index.js",
     "types": "dist/index.d.ts",
     "bin": {
       "vibesec": "./dist/cli/index.js",
       "vibesec-mcp": "./bin/vibesec-mcp"
     },
     "files": ["dist/**/*", "bin/**/*", "!dist/**/*.test.*", "!dist/tests/**/*"],
     "repository": {
       "type": "git",
       "url": "https://github.com/ferg-cod3s/vibesec.git"
     },
     "keywords": [
       "security",
       "scanner",
       "ai-code",
       "vulnerability",
       "static-analysis",
       "sast",
       "mcp",
       "claude-code"
     ],
     "author": "VibeSec Team",
     "license": "MIT",
     "homepage": "https://github.com/ferg-cod3s/vibesec#readme",
     "bugs": {
       "url": "https://github.com/ferg-cod3s/vibesec/issues"
     }
   }
   ```

2. **Create .npmignore**

   ```
   # Source files
   cli/
   scanner/
   reporters/
   src/
   tests/
   poc/

   # Build artifacts
   *.ts
   !*.d.ts
   tsconfig.json
   jest.config.js

   # Development files
   .github/
   .env*
   *.log
   coverage/
   benchmark-results/
   demo-examples/
   demo-automation/

   # Documentation (keep only essential)
   docs/archive/
   *.md
   !README.md
   !LICENSE
   ```

3. **Test npm Package Locally**

   ```bash
   npm pack
   # Creates vibesec-0.1.0.tgz

   # Test installation
   cd /tmp/test-install
   npm install /path/to/vibesec-0.1.0.tgz
   npx vibesec --version
   npx vibesec-mcp --help
   ```

4. **Dry Run Publish**

   ```bash
   npm publish --dry-run

   # Review:
   # - Package size
   # - Included files
   # - Entry points
   ```

**Deliverables:**

- [ ] package.json configured for npm
- [ ] .npmignore created
- [ ] Local package test successful
- [ ] Dry run publish successful

---

### Task 4.2: Docker Registry Setup ⏱️ 1 hour

**Priority:** P1
**Assigned To:** DevOps

**Steps:**

1. **Create Docker Hub Repository**

   - Create account/organization: `vibesec`
   - Create repository: `vibesec/vibesec`
   - Set description and README

2. **Test Manual Docker Push**

   ```bash
   docker build -t vibesec/vibesec:0.1.0 .
   docker tag vibesec/vibesec:0.1.0 vibesec/vibesec:latest

   docker login
   docker push vibesec/vibesec:0.1.0
   docker push vibesec/vibesec:latest
   ```

3. **Create Docker Compose for Testing**

   ```yaml
   # File: docker-compose.yml

   version: '3.8'

   services:
     vibesec-cli:
       image: vibesec/vibesec:latest
       command: node dist/cli/index.js scan /workspace
       volumes:
         - ./examples/sample-api:/workspace
       environment:
         - LOG_LEVEL=debug

     vibesec-mcp:
       image: vibesec/vibesec:latest
       command: node bin/vibesec-mcp
       stdin_open: true
       tty: true
       environment:
         - SENTRY_DSN=${SENTRY_DSN}
         - LOG_LEVEL=info
   ```

**Deliverables:**

- [ ] Docker Hub repository created
- [ ] Docker image published
- [ ] docker-compose.yml created
- [ ] Docker pull works: `docker pull vibesec/vibesec:latest`

---

### Task 4.3: GitHub Secrets Configuration ⏱️ 0.5 hours

**Priority:** P0
**Assigned To:** Admin

**Secrets to Add:**

```
NPM_TOKEN              # npm publishing
DOCKERHUB_USERNAME     # Docker Hub login
DOCKERHUB_TOKEN        # Docker Hub password
SNYK_TOKEN             # Security scanning
CODECOV_TOKEN          # Coverage reports (optional)
```

**Steps:**

1. Go to GitHub repository settings
2. Navigate to Secrets and variables → Actions
3. Add each secret
4. Test with workflow dispatch

**Deliverables:**

- [ ] All secrets configured
- [ ] Test workflow runs successfully

---

### Task 4.4: Create Release Automation ⏱️ 1.5 hours

**Priority:** P1
**Assigned To:** DevOps

**Steps:**

1. **Create Release Script**

   ```bash
   # File: scripts/release.sh

   #!/bin/bash
   set -e

   # Validate version
   if [ -z "$1" ]; then
     echo "Usage: ./scripts/release.sh <version>"
     exit 1
   fi

   VERSION=$1

   # Ensure we're on main branch
   BRANCH=$(git branch --show-current)
   if [ "$BRANCH" != "main" ]; then
     echo "Error: Must be on main branch"
     exit 1
   fi

   # Ensure working directory is clean
   if ! git diff-index --quiet HEAD --; then
     echo "Error: Working directory not clean"
     exit 1
   fi

   # Run tests
   echo "Running tests..."
   npm test

   # Build
   echo "Building..."
   npm run build

   # Update version in package.json
   npm version $VERSION --no-git-tag-version

   # Commit version bump
   git add package.json package-lock.json
   git commit -m "chore: bump version to $VERSION"

   # Create tag
   git tag -a "v$VERSION" -m "Release v$VERSION"

   # Push
   git push origin main
   git push origin "v$VERSION"

   echo "✅ Release v$VERSION created!"
   echo "GitHub Actions will now publish to npm and Docker Hub"
   ```

2. **Add to package.json**

   ```json
   {
     "scripts": {
       "release": "bash scripts/release.sh"
     }
   }
   ```

3. **Create CHANGELOG.md Template**

   ```markdown
   # Changelog

   All notable changes to this project will be documented in this file.

   The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
   and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

   ## [Unreleased]

   ## [0.1.0] - 2025-10-22

   ### Added

   - Initial release
   - MCP server integration
   - Core scanning engine
   - 16 security detection rules
   - Multiple output formats
   - Plain language reporting
   ```

**Deliverables:**

- [ ] Release script created and tested
- [ ] CHANGELOG.md created
- [ ] Version bump process documented

---

### Task 4.5: Monitoring & Alerts ⏱️ 1 hour

**Priority:** P2
**Assigned To:** DevOps

**Steps:**

1. **Configure Sentry Project**

   - Create project in Sentry
   - Get DSN
   - Configure alerts

2. **Set Up GitHub Status Checks**

   ```yaml
   # File: .github/workflows/status-check.yml

   name: Status Check

   on:
     pull_request:
       types: [opened, synchronize]

   jobs:
     required-checks:
       runs-on: ubuntu-latest
       steps:
         - name: Check CI Status
           run: |
             # Wait for CI to complete
             # Fail if CI failed
   ```

3. **Create Health Check Endpoint (Future)**
   - Add HTTP server to MCP for health checks
   - Expose metrics endpoint

**Deliverables:**

- [ ] Sentry configured
- [ ] GitHub status checks configured
- [ ] Monitoring plan documented

---

## Phase 5: Publishing & Launch (Day 3 - 2 hours)

### Task 5.1: Pre-Launch Validation ⏱️ 0.5 hours

**Priority:** P0
**Assigned To:** Lead Developer

**Checklist:**

```bash
# ✅ Critical Pre-Launch Checks

- [ ] All tests pass (npm test)
- [ ] Build succeeds (npm run build)
- [ ] Docker image builds (docker build -t vibesec:test .)
- [ ] CLI works (node dist/cli/index.js --help)
- [ ] MCP server starts (node bin/vibesec-mcp)
- [ ] No high/critical security issues
- [ ] Documentation is accurate
- [ ] LICENSE file present
- [ ] README has correct installation commands
- [ ] CHANGELOG is up to date
- [ ] Version number is correct
- [ ] GitHub Actions workflows configured
- [ ] npm secrets configured
- [ ] Docker Hub credentials configured
```

**Deliverables:**

- [ ] All checklist items verified
- [ ] Sign-off from team lead

---

### Task 5.2: npm Publication ⏱️ 0.5 hours

**Priority:** P0
**Assigned To:** Maintainer

**Steps:**

1. **Create npm Account** (if needed)

   ```bash
   npm adduser
   ```

2. **Publish Package**

   ```bash
   # Ensure you're on main branch with clean working directory
   git checkout main
   git pull

   # Build
   npm run build

   # Publish (first time)
   npm publish --access public

   # Or use release script
   npm run release 0.1.0
   ```

3. **Verify Publication**

   ```bash
   # Check on npm
   npm view vibesec

   # Test installation
   npm install -g vibesec
   vibesec --version
   ```

**Deliverables:**

- [ ] Package published to npm
- [ ] Installation verified
- [ ] npm page looks correct

---

### Task 5.3: Docker Image Publication ⏱️ 0.5 hours

**Priority:** P1
**Assigned To:** DevOps

**Steps:**

1. **Manual Push (if not using CI/CD)**

   ```bash
   docker build -t vibesec/vibesec:0.1.0 .
   docker tag vibesec/vibesec:0.1.0 vibesec/vibesec:latest
   docker push vibesec/vibesec:0.1.0
   docker push vibesec/vibesec:latest
   ```

2. **Verify Pull**
   ```bash
   docker pull vibesec/vibesec:latest
   docker run --rm vibesec/vibesec:latest node dist/cli/index.js --version
   ```

**Deliverables:**

- [ ] Docker image published
- [ ] Pull and run verified
- [ ] Docker Hub page updated

---

### Task 5.4: GitHub Release ⏱️ 0.5 hours

**Priority:** P1
**Assigned To:** Maintainer

**Steps:**

1. **Create GitHub Release**

   - Go to GitHub repository
   - Click "Releases" → "Create a new release"
   - Tag: `v0.1.0`
   - Title: `VibeSec v0.1.0 - Initial Release`
   - Description: (from CHANGELOG.md)

   ````markdown
   ## 🎉 Initial Release

   VibeSec is a security scanner for AI-generated code with MCP integration.

   ### ✨ Features

   - 🔍 16 security detection rules
   - 🤖 MCP server for Claude Code integration
   - 📊 Multiple output formats (JSON, text, stakeholder)
   - 🎯 Plain-language reporting for non-technical users
   - ⚡ Fast scanning with parallel processing

   ### 📦 Installation

   ```bash
   npm install -g vibesec
   ```
   ````

   ### 🐳 Docker

   ```bash
   docker pull vibesec/vibesec:latest
   ```

   ### 📚 Documentation

   See [README.md](https://github.com/ferg-cod3s/vibesec#readme) for full documentation.

   ### 🙏 Thanks

   Thanks to all contributors and testers!

   ```

   ```

2. **Attach Release Assets**
   - Attach `vibesec-0.1.0.tgz` (npm package)
   - Attach `CHANGELOG.md`

**Deliverables:**

- [ ] GitHub release created
- [ ] Release notes published
- [ ] Assets attached

---

## Post-Deployment Tasks

### Immediate (Week 1)

1. **Monitor for Issues** ⏱️ Ongoing

   - Watch GitHub issues
   - Monitor Sentry for errors
   - Check npm download stats
   - Respond to user feedback

2. **Documentation Updates** ⏱️ 2 hours

   - Add "Getting Started" video
   - Create troubleshooting FAQ
   - Add more examples

3. **Community Engagement** ⏱️ Ongoing
   - Post on Reddit (r/ClaudeAI, r/programming)
   - Tweet about launch
   - Post on Hacker News
   - Share in Discord communities

### Short-Term (Month 1)

1. **Bug Fixes** ⏱️ As needed

   - Address reported issues
   - Fix edge cases
   - Improve error messages

2. **Performance Optimization** ⏱️ 4 hours

   - Add regex caching
   - Optimize file scanning
   - Reduce memory usage

3. **Testing Improvements** ⏱️ 4 hours
   - Increase test coverage to 85%
   - Add integration tests
   - Add performance tests

### Medium-Term (Months 2-3)

1. **Feature Additions**

   - Additional language support (Python, Go)
   - More detection rules
   - Auto-fix suggestions
   - IDE integrations

2. **Documentation Expansion**

   - Video tutorials
   - Blog posts
   - Case studies
   - API documentation

3. **Community Building**
   - Contributor onboarding
   - Community rules
   - Regular releases

---

## Risk Mitigation

### High Risks

| Risk                      | Impact | Probability | Mitigation                          |
| ------------------------- | ------ | ----------- | ----------------------------------- |
| Tests fail in production  | High   | Low         | Run full test suite before publish  |
| npm package broken        | High   | Medium      | Test local install before publish   |
| Docker image doesn't work | Medium | Low         | Test pull and run before announcing |
| Documentation outdated    | Medium | Medium      | Review all docs before launch       |
| Security vulnerability    | High   | Low         | Run npm audit, Snyk before publish  |

### Rollback Plan

**If critical issue found after publish:**

1. **Immediate Actions**

   ```bash
   # Unpublish if within 72 hours
   npm unpublish vibesec@0.1.0

   # Or deprecate
   npm deprecate vibesec@0.1.0 "Critical bug, use 0.1.1"
   ```

2. **Fix and Republish**

   - Fix issue
   - Increment version (0.1.1)
   - Run full test suite
   - Republish

3. **Communication**
   - Post issue on GitHub
   - Update release notes
   - Notify via Twitter/Reddit

---

## Success Metrics

### Week 1 Goals

- ✅ 50+ npm downloads
- ✅ 20+ GitHub stars
- ✅ 5+ installations with Claude Code
- ✅ 3+ GitHub issues filed
- ✅ 0 critical bugs

### Month 1 Goals

- ✅ 200+ npm downloads
- ✅ 100+ GitHub stars
- ✅ 20+ Claude Code users
- ✅ 10+ GitHub issues resolved
- ✅ 1+ contributor PR merged

---

## Timeline Summary

| Phase     | Duration     | Key Deliverable                           |
| --------- | ------------ | ----------------------------------------- |
| Phase 1   | 7 hours      | Tests pass, build works, CI/CD configured |
| Phase 2   | 4 hours      | Full validation complete                  |
| Phase 3   | 3 hours      | Documentation updated                     |
| Phase 4   | 6 hours      | npm and Docker ready                      |
| Phase 5   | 2 hours      | Published and announced                   |
| **Total** | **22 hours** | **Production deployment**                 |

**Recommended Schedule:**

- Day 1: Phases 1-2 (11 hours)
- Day 2: Phases 3-4 (9 hours)
- Day 3: Phase 5 + buffer (2 hours + testing)

---

## Next Actions

**Immediate (Start Now):**

1. ✅ Fix test suite TypeScript errors
2. ✅ Update build script to use Node instead of Bun
3. ✅ Create Dockerfile

**This Week:**

1. ✅ Set up GitHub Actions CI/CD
2. ✅ Fix documentation issues
3. ✅ Prepare npm package
4. ✅ First release (v0.1.0)

**This Month:**

1. Monitor for issues
2. Fix bugs
3. Add features based on feedback
4. Grow community

---

**Ready to Deploy?** Follow this plan step-by-step and VibeSec will be production-ready in 3 days! 🚀
