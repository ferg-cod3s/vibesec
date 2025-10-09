# Contributing to VibeSec

Thank you for your interest in contributing to VibeSec! We welcome contributions from everyone, whether you're a security expert, developer, or vibe coder looking to make AI-generated code more secure.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Contributing Detection Rules](#contributing-detection-rules)
- [Code Style Guidelines](#code-style-guidelines)
- [Submitting Changes](#submitting-changes)
- [Community](#community)

---

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct:

- **Be respectful** and inclusive of all contributors
- **Be constructive** in feedback and discussions
- **Be collaborative** and help others learn
- **No harassment** or discriminatory behavior will be tolerated

---

## How Can I Contribute?

### 1. Report Bugs 🐛

Found a bug? Please open an issue with:

- **Clear title** and description
- **Steps to reproduce** the issue
- **Expected vs. actual behavior**
- **Environment details** (OS, Node version, etc.)
- **Sample code** that triggers the bug (if applicable)

**Template:**
```markdown
## Bug Description
Brief description of the issue

## Steps to Reproduce
1. Run `vibesec scan .`
2. ...

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- OS: macOS 14.0
- Node: 20.5.0
- VibeSec: 0.1.0
```

---

### 2. Suggest Features 💡

Have an idea for a new feature? Open an issue with:

- **Use case**: What problem does this solve?
- **Proposed solution**: How would it work?
- **Alternatives considered**: What else did you think about?
- **Target users**: Who benefits from this feature?

**Label:** `enhancement`

---

### 3. Contribute Detection Rules 🔍

One of the most valuable contributions! See [Contributing Detection Rules](#contributing-detection-rules) below.

---

### 4. Improve Documentation 📖

Documentation improvements are always welcome:

- Fix typos or unclear explanations
- Add examples and use cases
- Translate documentation to other languages
- Create video tutorials

---

### 5. Write Code 💻

Contribute to the core scanner, detectors, integrations, or reporters.

---

## Getting Started

### Prerequisites

- **Node.js**: ≥18.0.0 (or Python ≥3.9 if contributing to Python components)
- **Git**: Latest version
- **Code editor**: VS Code recommended

### Setup

1. **Fork the repository**
   ```bash
   # Click "Fork" on GitHub
   ```

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/vibesec.git
   cd vibesec
   ```

3. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/vibesec/vibesec.git
   ```

4. **Install dependencies**
   ```bash
   npm install
   # or
   pip install -e ".[dev]"
   ```

5. **Run tests**
   ```bash
   npm test
   ```

6. **Build the project**
   ```bash
   npm run build
   ```

---

## Development Workflow

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

**Branch Naming:**
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `test/` - Test additions/fixes
- `refactor/` - Code refactoring

---

### 2. Make Changes

- Write clear, concise code
- Follow the [Code Style Guidelines](#code-style-guidelines)
- Add tests for new functionality
- Update documentation as needed

---

### 3. Run Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- scanner/detectors/secrets.test.ts

# Run with coverage
npm test -- --coverage

# Run linter
npm run lint

# Auto-fix linting issues
npm run lint:fix
```

---

### 4. Commit Changes

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
git add .
git commit -m "feat: add prompt injection detector"
```

**Commit Types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `test:` - Test additions/updates
- `refactor:` - Code refactoring
- `perf:` - Performance improvements
- `chore:` - Build/config changes

**Examples:**
```bash
feat: add SQL injection detector for Python
fix: resolve false positives in secrets detector
docs: update ARCHITECTURE.md with new detector flow
test: add integration tests for GitHub Action
refactor: simplify rule loading logic
```

---

### 5. Push Changes

```bash
git push origin feature/your-feature-name
```

---

### 6. Open a Pull Request

1. Go to your fork on GitHub
2. Click "New Pull Request"
3. Fill out the PR template:

```markdown
## Description
Brief description of changes

## Related Issue
Fixes #123

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Tests pass locally
- [ ] Documentation updated
- [ ] No new warnings introduced
```

---

## Contributing Detection Rules

Detection rules are the heart of VibeSec! Here's how to contribute:

### 1. Rule Structure

Create a YAML file in `rules/community/`:

```yaml
id: custom-rule-id
name: Human-Readable Rule Name
description: Clear explanation of what this detects
severity: critical|high|medium|low
category: secrets|injection|auth|ai-specific|incomplete
languages:
  - javascript
  - python

patterns:
  - type: regex
    pattern: 'your-regex-pattern-here'
  - type: ast
    query: 'AST query (optional)'

confidence: 0.85  # 0.0-1.0

fix:
  recommendation: |
    Detailed fix instructions in markdown.

    Before:
    ```javascript
    // bad code
    ```

    After:
    ```javascript
    // good code
    ```

  references:
    - https://owasp.org/link
    - https://cwe.mitre.org/link

metadata:
  cwe: CWE-XXX
  owasp: AX:YYYY
  tags:
    - ai-prone
    - production-blocker

author: Your Name
date: 2025-10-09
```

### 2. Test Your Rule

Create test fixtures in `tests/fixtures/`:

**Vulnerable Code** (`tests/fixtures/vulnerable/your-rule/example.js`):
```javascript
// Code that should trigger your rule
```

**Secure Code** (`tests/fixtures/secure/your-rule/example.js`):
```javascript
// Code that should NOT trigger your rule
```

### 3. Validate Rule

```bash
npm run validate-rule rules/community/your-rule.yaml
npm test -- --grep "your-rule"
```

### 4. Submit PR

Open a pull request with:
- Rule YAML file
- Test fixtures (vulnerable + secure)
- Documentation explaining the security issue

---

## Code Style Guidelines

### JavaScript/TypeScript

**Style:** We use ESLint + Prettier

```typescript
// Good
export async function scanFile(filePath: string): Promise<Finding[]> {
  const content = await readFile(filePath);
  return detectors.map(d => d.detect(content)).flat();
}

// Bad
export async function scanFile(filePath:string):Promise<Finding[]>
{
const content=await readFile(filePath);
return detectors.map(d=>d.detect(content)).flat()
}
```

**Key Rules:**
- Use `async/await` over promises
- Prefer `const` over `let`
- Use descriptive variable names
- Add JSDoc comments for public APIs
- Keep functions small (<50 lines)

---

### Python

**Style:** We use Black + Flake8

```python
# Good
async def scan_file(file_path: str) -> List[Finding]:
    """Scan a file for security issues."""
    content = await read_file(file_path)
    findings = []
    for detector in detectors:
        findings.extend(detector.detect(content))
    return findings

# Bad
def scan_file(file_path):
  content=read_file(file_path)
  findings=[]
  for detector in detectors:
    findings.extend(detector.detect(content))
  return findings
```

**Key Rules:**
- Type hints for all function signatures
- Docstrings for all public functions
- 4 spaces for indentation
- Max line length: 88 characters

---

### YAML (Detection Rules)

```yaml
# Good: Clear, well-documented
id: hardcoded-password
name: Hardcoded Password Detected
description: |
  Passwords should never be hardcoded in source code.
  Use environment variables or a secrets manager.
severity: critical

# Bad: Minimal, unclear
id: pwd
name: Password
severity: high
```

---

## Testing Guidelines

### Unit Tests

Test individual functions/modules in isolation:

```typescript
// scanner/detectors/secrets.test.ts
import { SecretsDetector } from './secrets';

describe('SecretsDetector', () => {
  it('detects hardcoded API keys', () => {
    const code = 'const apiKey = "sk_live_abc123";';
    const findings = detector.detect(code);

    expect(findings).toHaveLength(1);
    expect(findings[0].severity).toBe('critical');
  });

  it('does not flag environment variables', () => {
    const code = 'const apiKey = process.env.API_KEY;';
    const findings = detector.detect(code);

    expect(findings).toHaveLength(0);
  });
});
```

---

### Integration Tests

Test complete workflows:

```typescript
// tests/integration/scan.test.ts
describe('Full scan workflow', () => {
  it('scans project and generates report', async () => {
    const result = await scan('./tests/fixtures/vulnerable');

    expect(result.findings.length).toBeGreaterThan(0);
    expect(result.summary.critical).toBeGreaterThan(0);
  });
});
```

---

### Test Coverage

- **Aim for:** >80% coverage overall
- **Detectors:** >95% coverage (critical path)
- **CLI:** >70% coverage (harder to test)

Check coverage:
```bash
npm test -- --coverage
open coverage/lcov-report/index.html
```

---

## Documentation Guidelines

### README Updates

When adding features, update:
- Feature list
- Usage examples
- Configuration options

### API Documentation

Use JSDoc for TypeScript:

```typescript
/**
 * Scans a directory for security issues.
 *
 * @param path - Directory path to scan
 * @param options - Scan configuration options
 * @returns Promise resolving to scan results
 * @throws {Error} If path does not exist
 *
 * @example
 * ```typescript
 * const results = await scan('/my/project', { severity: 'high' });
 * console.log(results.summary);
 * ```
 */
export async function scan(path: string, options?: ScanOptions): Promise<ScanResult> {
  // ...
}
```

---

## Community

### Communication Channels

- **GitHub Issues**: Bug reports, feature requests
- **GitHub Discussions**: Questions, ideas, community chat
- **Discord**: [Join our server](https://discord.gg/vibesec)
- **Twitter**: [@vibesec_dev](https://twitter.com/vibesec_dev)

### Recognition

Contributors are recognized in:
- `CONTRIBUTORS.md` file
- Release notes
- Monthly community shoutouts on Twitter

### Bounties

We offer bounties for:
- **High-quality detection rules**: $50-$200 per rule
- **Critical bug fixes**: $100-$500
- **Major features**: $500-$2000

Contact us at [email protected] to discuss bounty eligibility.

---

## License

By contributing to VibeSec, you agree that your contributions will be licensed under the MIT License.

---

## Questions?

- **GitHub Discussions**: [Ask here](https://github.com/vibesec/vibesec/discussions)
- **Discord**: [Join the community](https://discord.gg/vibesec)
- **Email**: [email protected]

---

**Thank you for helping make AI-generated code more secure! 🙏**
