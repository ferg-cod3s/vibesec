# VibeSec Technology Stack

**Last Updated**: 2025-10-10 (Phase 4 Complete)
**Status**: POC (Proof of Concept) - Fully Implemented

---

## Overview

VibeSec is currently implemented as a **TypeScript-based CLI application** using **Bun** as the primary runtime for development. The stack was chosen to enable rapid prototyping while maintaining production-grade code quality.

---

## Core Technology Decisions

### Runtime: Bun 1.0+ (Primary) / Node.js 16+ (Compatible)

**Chosen**: Bun
**Why**:
- ⚡ **Fast iteration**: Near-instant startup and execution
- 🔧 **Built-in tooling**: Native TypeScript support, test runner, bundler
- 📦 **npm compatibility**: Works with existing npm packages
- 🚀 **Production-ready**: Stable 1.0+ release

**Compatibility**:
- All code is compatible with Node.js 16+ for broader deployment
- Users can run VibeSec with either Bun or Node.js
- CI/CD supports both runtimes

**Installation**:
```bash
# Bun (recommended for development)
curl -fsSL https://bun.sh/install | bash

# Node.js (alternative)
# Use nvm, fnm, or official installer
```

---

### Language: TypeScript 5.9+

**Why TypeScript**:
- ✅ **Type safety**: Catch errors at compile-time
- ✅ **IDE support**: Excellent autocomplete and refactoring
- ✅ **Maintainability**: Self-documenting code with types
- ✅ **Ecosystem**: Access to entire npm ecosystem

**Configuration**: See `tsconfig.json`

**Build Target**: ES2022 (modern JavaScript features)

---

### CLI Framework: Commander.js 11.1+

**Why Commander**:
- ✅ **Mature**: Battle-tested in production CLIs
- ✅ **Intuitive API**: Easy to add commands and options
- ✅ **Help generation**: Auto-generated help text
- ✅ **Validation**: Built-in argument and option parsing

**Alternative Considered**: yargs (rejected for complexity)

**Usage**:
```typescript
import { Command } from 'commander';

const program = new Command();
program
  .command('scan')
  .option('--explain', 'Use plain language')
  .action(scanCommand);
```

---

### Terminal Output: Chalk 4.1.2

**Why Chalk 4.x**:
- ✅ **CommonJS compatible**: Works with current setup
- ✅ **Simple API**: Easy color and styling
- ✅ **Wide adoption**: Industry standard

**Note**: Chalk 5.x is ESM-only; staying on 4.x for POC

**Upgrade Path**: When moving to full ESM, upgrade to Chalk 5.x

**Usage**:
```typescript
import chalk from 'chalk';

console.log(chalk.red('Error:'), 'Something went wrong');
console.log(chalk.green.bold('Success!'));
```

---

### File System Operations: fast-glob 3.3+

**Why fast-glob**:
- ✅ **Performance**: Fast file pattern matching
- ✅ **Cross-platform**: Works on Windows/Mac/Linux
- ✅ **Flexible**: Supports complex glob patterns

**Usage**:
```typescript
import fg from 'fast-glob';

const files = await fg(['**/*.ts', '**/*.js'], {
  ignore: ['node_modules/**', 'dist/**']
});
```

---

### Configuration: js-yaml 4.1+

**Why js-yaml**:
- ✅ **Standard**: YAML is familiar to developers
- ✅ **Readable**: Human-friendly config files
- ✅ **Flexible**: Supports complex configurations

**Usage**: Parse detection rules from YAML files

---

### Progress Indicators: ora 6.3.1 ✅ IMPLEMENTED

**Why ora 6.x**:
- ✅ **CommonJS compatible**: Works with current setup
- ✅ **Beautiful spinners**: Professional terminal UX
- ✅ **Simple API**: Easy to add progress feedback

**Note**: ora 7.x is ESM-only; using 6.x for POC

**Implementation** (Phase 2):
```typescript
import ora from 'ora';

// cli/commands/scan.ts
const spinner = !isJson ? ora('Initializing scan...').start() : null;

if (spinner) spinner.text = 'Finding files to scan...';
const result = await scanner.scan();

if (spinner) {
  spinner.succeed(chalk.green('Scan complete!'));
}
```

---

## Project Structure

```
vibesec/
├── cli/                    # CLI entry points and commands
│   ├── index.ts           # Main CLI entry
│   └── commands/          # Command implementations
│       ├── scan.ts
│       └── init.ts
│
├── scanner/               # Core scanning engine
│   ├── core/             # Scanner engine and types
│   └── analyzers/        # Language-specific analyzers
│
├── reporters/            # Output formatters
│   ├── plaintext.ts     # Technical text output
│   ├── json.ts          # JSON output
│   ├── plain-language.ts # Plain language output ✅ (456 lines, Phase 1)
│   └── stakeholder.ts   # Stakeholder reports ✅ (348 lines, Phase 3)
│
├── rules/                # Detection rules
│   └── default/         # Built-in security rules
│
├── lib/                  # Shared utilities
│   ├── errors/          # Error handling ✅
│   │   └── friendly-handler.ts # Friendly errors (189 lines, Phase 1)
│   └── utils/           # Utility functions ✅
│       └── security-score.ts # Security scorecard (202 lines, Phase 3)
│
├── tests/               # Test suites
│   ├── cli/
│   ├── scanner/
│   └── reporters/
│
├── docs/                # Documentation
│   ├── plans/          # Implementation plans
│   └── sop/            # Standard operating procedures
│
└── dist/               # Compiled output (gitignored)
```

---

## Build & Development

### Development Workflow

```bash
# Install dependencies
bun install

# Run in development mode
bun run dev

# Build for production
bun run build

# Run tests
bun test

# Lint code
bun run lint

# Format code
bun run format
```

### Build Output

**Source**: TypeScript files in `cli/`, `scanner/`, `reporters/`
**Target**: JavaScript in `dist/` directory
**Entry Point**: `dist/cli/index.js` (executable)

**Build Process**:
1. TypeScript compilation (`tsc`)
2. Asset copying (`copy-assets.js`)
3. Shebang preserved for CLI execution

---

## Testing Stack

### Test Runner: Bun Test (Built-in)

**Why Bun Test**:
- ✅ **Fast**: Native test runner, no Jest overhead
- ✅ **TypeScript**: Direct TS support, no transpilation
- ✅ **Jest-compatible**: Familiar API (describe, it, expect)

**Alternative**: Jest (available as fallback for Node.js users)

### Test Organization

```typescript
// Unit tests: tests/reporters/plaintext.test.ts
describe('PlainTextReporter', () => {
  it('formats findings correctly', () => {
    const reporter = new PlainTextReporter();
    const result = reporter.generate(mockScanResult);
    expect(result).toContain('VibeSec Security Scan Results');
  });
});

// Integration tests: tests/cli/scan.test.ts
describe('scan command', () => {
  it('scans a directory and reports findings', async () => {
    const output = await runCLI(['scan', './fixtures/vulnerable']);
    expect(output).toContain('CRITICAL');
  });
});
```

---

## Linting & Formatting

### ESLint 8.56+ with TypeScript Support

**Configuration**: `.eslintrc.js`
**Plugins**:
- `@typescript-eslint/eslint-plugin`
- `@typescript-eslint/parser`
- `eslint-config-prettier` (disable conflicting rules)

**Rules**: Strict mode for code quality

### Prettier 3.1+

**Configuration**: `.prettierrc.json`
**Files**: TypeScript, JSON, Markdown

**Settings**:
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "printWidth": 100
}
```

---

## Dependencies

### Production Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| chalk | ^4.1.2 | Terminal colors and styling |
| commander | ^11.1.0 | CLI framework |
| fast-glob | ^3.3.2 | File pattern matching |
| js-yaml | ^4.1.0 | YAML parsing for rules |
| ora | ^6.3.1 | Progress spinners (Phase 2) |

### Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| typescript | ^5.9.3 | TypeScript compiler |
| @types/node | ^20.19.20 | Node.js type definitions |
| @types/js-yaml | ^4.0.9 | js-yaml type definitions |
| eslint | ^8.56.0 | Code linting |
| prettier | ^3.1.1 | Code formatting |
| @typescript-eslint/* | ^6.17.0 | TypeScript linting |

---

## Why Not Python?

**Question**: Some documentation references Python. Why TypeScript?

**Answer**:
Early documentation was exploratory and referenced Python patterns from security scanning tools (like Bandit, Semgrep). However, for the POC:

✅ **TypeScript chosen** for:
- Faster iteration with Bun
- Strong typing for maintainability
- Better CLI tooling ecosystem (Commander, chalk, ora)
- Team familiarity
- npm ecosystem access

❌ **Python not chosen** because:
- Slower iteration during POC phase
- Additional setup complexity (Poetry, venv)
- Target users already have Node.js from AI tools
- TypeScript better for future web dashboard integration

**Future**: Language choice may be revisited post-POC based on performance needs, but TypeScript is suitable for production.

---

## Installation Methods (Planned)

### Current (POC)
```bash
# Clone and build from source
git clone https://github.com/vibesec/vibesec
cd vibesec
bun install
bun run build
bun link
```

### Planned (Production)

**npm Registry**:
```bash
npm install -g vibesec
```

**Homebrew** (macOS/Linux):
```bash
brew install vibesec
```

**Binary Distribution**:
```bash
# Download pre-built binary
curl -fsSL https://vibesec.dev/install.sh | bash
```

**Docker**:
```bash
docker run vibesec/vibesec scan .
```

---

## Future Considerations

### Potential Technology Changes

**When to Upgrade to ESM**:
- Move from CommonJS to full ES Modules
- Upgrade chalk 4.x → 5.x
- Upgrade ora 6.x → 8.x
- Update build tooling

**When to Consider Rust/Go**:
- If scanning performance becomes bottleneck
- If binary size reduction needed
- If cross-compilation required
- Likely: Keep TypeScript CLI, rewrite scanner core

**When to Add Web UI**:
- After POC validation
- Technology: Astro/React for static site
- API: REST endpoints from existing scanner
- Share reporters between CLI and web

---

## Version Support

### Minimum Versions

- **Node.js**: 16.0.0+ (LTS)
- **Bun**: 1.0.0+
- **TypeScript**: 5.9+ (for development)
- **npm**: 7+ (for package installation)

### Operating Systems

- ✅ **macOS**: 11+ (Big Sur and later)
- ✅ **Linux**: Ubuntu 20.04+, Debian 11+, RHEL 8+
- ✅ **Windows**: 10/11 (WSL recommended, native supported)

### Terminal Support

- ✅ **macOS**: Terminal.app, iTerm2
- ✅ **Linux**: GNOME Terminal, Konsole, Alacritty
- ✅ **Windows**: Windows Terminal, PowerShell, CMD, WSL

**Note**: Full color support requires ANSI-capable terminal. Fallback to `--no-color` mode for limited terminals.

---

## Migration Notes

### Updating Documentation from Python to TypeScript

**Files Affected**:
- ❌ `docs/IMPLEMENTATION_QUICK_REFERENCE.md` - Has Python code examples
- ✅ Other docs are language-agnostic

**Update Strategy**:
1. Replace `.py` file extensions with `.ts`
2. Update `src/` paths to match TypeScript structure
3. Convert Python syntax to TypeScript syntax
4. Update package manager commands (pip → npm/bun)
5. Fix installation instructions

**Example Conversion**:
```diff
- # Add import at top
- from src.reporters.plain_language_reporter import PlainLanguageReporter
+ // Add import at top
+ import { PlainLanguageReporter } from '../reporters/plain-language';

- @click.option('--explain', is_flag=True, help='Use plain language')
- def scan(path, explain):
+ program
+   .command('scan')
+   .option('--explain', 'Use plain language')
+   .action((path, options) => {
```

---

## Questions & Decisions

### Q: Why Bun over Node.js for development?
**A**: Faster iteration, built-in TypeScript, better DX. Node.js remains supported for compatibility.

### Q: Will we switch languages later?
**A**: Unlikely. TypeScript is suitable for production. May add Rust/Go for performance-critical scanner core if needed.

### Q: Why not use existing tools (like Semgrep)?
**A**: VibeSec targets non-technical users with plain language output and AI-generated code patterns. Different audience and UX goals.

### Q: What about Windows support?
**A**: Fully supported. All dependencies are cross-platform. WSL recommended but not required.

---

## Useful Commands

```bash
# Check versions
node --version
bun --version
npm --version

# Install Bun (if not installed)
curl -fsSL https://bun.sh/install | bash

# Install dependencies
bun install          # or: npm install

# Development
bun run dev          # Run in dev mode
bun run build        # Build for production
bun test             # Run tests
bun run lint         # Lint code
bun run format       # Format code

# Testing installation
bun link             # Link CLI globally
vibesec --version    # Verify installation
vibesec scan .       # Test scan

# Cleanup
rm -rf node_modules dist
bun install
```

---

**Document Status**: ✅ Complete
**Last Updated**: 2025-10-10
**Maintained By**: VibeSec Team
**Questions**: See `/docs/INDEX.md` for contact info
