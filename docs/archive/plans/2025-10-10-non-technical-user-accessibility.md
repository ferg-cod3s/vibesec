# Implementation Plan: Non-Technical User Accessibility Features

**Plan ID**: `PLAN-2025-10-10-001`
**Created**: 2025-10-10
**Status**: Ready for Implementation
**Complexity**: Medium
**Estimated Effort**: 32 hours (4 weeks @ 8hr/week)
**Risk Level**: Low

---

## Executive Summary

### Objective
Transform VibeSec's TypeScript CLI from a technical security scanner into an accessible tool that empowers non-technical users (Product Managers, Designers, Executives) to understand and act on security findings independently.

### Business Value
- **60-70% reduction** in installation friction
- **80% improvement** in finding comprehension for non-technical users
- **50% reduction** in support burden through self-service
- **Enable stakeholder communication** without developer translation

### Core Deliverables
1. Plain language reporter with business-focused explanations
2. `--explain` flag for non-technical output mode
3. Friendly error handling with actionable guidance
4. Updated documentation reflecting TypeScript/Bun implementation
5. Interactive help and progress indicators

---

## Context & Background

### Current State Analysis

**Technology Stack** (POC):
- **Runtime**: Bun 1.0+ / Node.js 16+
- **Language**: TypeScript 5.9+
- **CLI Framework**: Commander.js 11.1+
- **Output Styling**: Chalk 4.1+
- **Package Manager**: Bun (POC), npm (compatible)

**Existing Implementation**:
```
cli/
  index.ts                    # CLI entry point with Commander
  commands/
    scan.ts                   # Scan command implementation
reporters/
  plaintext.ts                # Technical PlainTextReporter (existing)
  json.ts                     # JsonReporter (existing)
```

**Current User Experience**:
```bash
$ vibesec scan ./myproject
═══════════════════════════════════════════════════════════════════
               VibeSec Security Scan Results
═══════════════════════════════════════════════════════════════════

🔴 CRITICAL: Hardcoded API key detected
📍 Location: config.ts:23
📝 Code: const API_KEY = "sk-ant-abc123..."
⚠️  Risk: Hard-coded credentials expose sensitive authentication
🔖 CWE-798 • OWASP A07:2021
```

**Problems for Non-Technical Users**:
- ❌ "CWE-798" and "OWASP A07:2021" are meaningless jargon
- ❌ No business impact explained
- ❌ Unclear what to do next
- ❌ No time estimate for fixes
- ❌ Errors show stack traces
- ❌ No guided first-time experience

### Target User Personas

#### Primary: Product Manager (Sarah)
- Uses AI tools (Lovable, Bolt.new) to prototype
- No coding experience
- Needs to verify security before releases
- Reports to stakeholders on security posture

**Success Criteria**:
- ✅ Install in <3 minutes
- ✅ Understand findings without dev help
- ✅ Know which issues block release
- ✅ Generate stakeholder reports

#### Secondary: Designer (Marcus)
- Familiar with Git and terminal basics
- Worried about exposed API keys in design repos
- No security expertise

**Success Criteria**:
- ✅ Scan repos confidently
- ✅ Identify exposed credentials
- ✅ Know when to escalate to engineering

#### Tertiary: Executive (James)
- Needs metrics for board reporting
- Makes risk/cost decisions
- Limited technical knowledge

**Success Criteria**:
- ✅ Receive formatted reports
- ✅ Understand security posture at-a-glance
- ✅ Compare to industry benchmarks

### Research Foundation

This plan is based on:
- `/docs/NON_TECHNICAL_USER_RESEARCH.md` - User research and personas
- `/docs/IMPLEMENTATION_QUICK_REFERENCE.md` - Feature specifications (updated for TypeScript)
- Codebase analysis of existing reporter architecture
- UX best practices for accessible CLIs (Homebrew, Vercel CLI, npm)

---

## Technical Design

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      CLI Entry (index.ts)                    │
│                     Commander.js + Chalk                     │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ├──> scan command (--explain flag)
                  │
         ┌────────┴────────┐
         │                 │
    ┌────▼────┐      ┌────▼──────────┐
    │ Scanner │      │ Error Handler │
    │ Engine  │      │  (friendly)   │
    └────┬────┘      └───────────────┘
         │
    ┌────▼─────────────────┐
    │  Reporter Selection  │
    │  (based on --explain)│
    └────┬─────────────────┘
         │
    ┌────┴────────────────────┐
    │                         │
┌───▼──────────┐    ┌────────▼─────────┐
│ PlainText    │    │ PlainLanguage    │
│ Reporter     │    │ Reporter         │
│ (technical)  │    │ (non-technical)  │
└──────────────┘    └──────────────────┘
```

### New Components to Implement

#### 1. Plain Language Reporter (`reporters/plain-language.ts`)

**Purpose**: Translate technical security findings into business language

**Interface**:
```typescript
export class PlainLanguageReporter {
  generate(result: ScanResult): string;

  private formatFinding(finding: Finding): string;
  private translateSeverity(severity: Severity): PlainSeverity;
  private getAnalogy(category: string): string;
  private estimateFixTime(finding: Finding): string;
}

interface PlainSeverity {
  emoji: string;
  label: string;
  timeframe: string;
  businessImpact: string;
}
```

**Key Features**:
- Analogies for technical concepts (SQL injection = "unlocked front door")
- Business impact explanations
- Fix time estimates (10-15 min, 1-2 hours, etc.)
- "What/Why/How to fix" structure
- No unexplained jargon (CVE, CWE, OWASP)

**Example Output**:
```
🚨 Urgent - Fix Today

Found: API key written directly in code (config.ts:23)

What this means:
Someone saved an API key right in your code file. This is like
writing your credit card number on a public bulletin board.

Why it matters:
• Anyone who sees the code can use your API key
• You'll get charged for other people's usage
• Could cost $1000s in unexpected bills

How to fix:
1. Move the key to an environment variable
2. Add .env to .gitignore
3. Change the API key (old one is compromised)

Time needed: 10-15 minutes
Who can fix: Any developer
```

#### 2. Friendly Error Handler (`lib/errors/friendly-handler.ts`)

**Purpose**: Convert exceptions into helpful, actionable guidance

**Interface**:
```typescript
export class FriendlyErrorHandler {
  handle(error: Error, context: ErrorContext): void;

  private suggestFix(error: Error): string[];
  private formatExample(error: Error): string | null;
  private getHelpLink(errorType: string): string;
}

interface ErrorContext {
  action: string;      // "scan project", "write report"
  path?: string;       // File/directory being processed
  userLevel?: 'technical' | 'non-technical';
}
```

**Example Transformations**:

**Before** (Current):
```
Error: ENOENT: no such file or directory, scandir '/wrong/path'
    at Object.readdirSync (node:fs:1514:3)
    at Scanner.scan (scanner.ts:45:12)
    ...
```

**After** (With Handler):
```
❌ Couldn't find the folder you wanted to scan

The path '/wrong/path' doesn't exist on your computer.

💡 Suggestions:
• Check the path for typos
• Make sure the folder exists
• Try using '.' to scan the current folder

Examples:
  vibesec scan .              # Scan current folder
  vibesec scan ./myproject    # Scan specific folder

Need help? https://vibesec.dev/docs/troubleshooting
```

#### 3. Progress Indicators (enhancement to `commands/scan.ts`)

**Purpose**: Provide visual feedback during long operations

**Implementation** (using ora spinner):
```typescript
import ora from 'ora';

const spinner = ora('Initializing scan...').start();

try {
  spinner.text = 'Finding files...';
  const files = await discoverFiles(path);

  spinner.text = `Analyzing ${files.length} files...`;
  const results = await scanner.scan();

  spinner.succeed(chalk.green('Scan complete!'));

  // Show summary
  console.log(`\n📊 Scanned ${files.length} files in ${duration}s`);

} catch (error) {
  spinner.fail(chalk.red('Scan failed'));
  errorHandler.handle(error, { action: 'scan project', path });
}
```

### Integration Points

#### CLI Flag Addition (`cli/index.ts`)

```typescript
program
  .command('scan')
  .description('Scan a directory or file for security vulnerabilities')
  .argument('[path]', 'Path to scan', '.')
  .option('-f, --format <format>', 'Output format (text|json)', 'text')
  .option('-s, --severity <level>', 'Minimum severity level', 'low')
  .option('-o, --output <file>', 'Output file path')
  .option('-e, --exclude <patterns...>', 'File patterns to exclude')
  .option('-i, --include <patterns...>', 'File patterns to include')
  .option('--explain', 'Use plain language for non-technical users')  // NEW
  .option('--rules <path>', 'Custom rules directory path')
  .option('--no-parallel', 'Disable parallel scanning')
  .action(scanCommand);
```

#### Reporter Selection Logic (`commands/scan.ts`)

```typescript
export async function scanCommand(
  path: string,
  options: ScanCommandOptions
): Promise<void> {
  try {
    const errorHandler = new FriendlyErrorHandler();
    const isJson = options.format === 'json';
    const useExplain = options.explain;  // NEW

    // ... validation and scanning logic ...

    // Select reporter based on options
    let reporter;
    if (isJson) {
      reporter = new JsonReporter();
    } else if (useExplain) {
      reporter = new PlainLanguageReporter();  // NEW
    } else {
      reporter = new PlainTextReporter();      // Existing technical
    }

    const report = reporter.generate(result);

    // Output report
    if (options.output) {
      await fs.writeFile(options.output, report);
      if (!isJson) {
        console.log(chalk.green(`✅ Report saved to ${options.output}`));
      }
    } else {
      console.log(report);
    }

    // ... exit code logic ...

  } catch (error) {
    errorHandler.handle(error as Error, {
      action: 'scan project',
      path,
      userLevel: options.explain ? 'non-technical' : 'technical'
    });
    process.exit(1);
  }
}
```

### Dependencies

**New Package Additions**:
```json
{
  "dependencies": {
    "ora": "^6.3.1"  // Progress spinners (use v6 for CommonJS compatibility)
  }
}
```

**Existing Dependencies** (already available):
- `chalk` 4.1.2 - Terminal styling
- `commander` 11.1.0 - CLI framework

---

## Implementation Phases

### Phase 1: Foundation (Week 1 - 8 hours)

**Goal**: Enable plain language output and friendly errors

**Tasks**:

1. **Create Plain Language Reporter** (4 hours)
   - File: `reporters/plain-language.ts`
   - Implement severity translation with emojis and timeframes
   - Create analogy mapping for common vulnerabilities
   - Build "What/Why/How" output structure
   - Add fix time estimation logic
   - Test with sample findings

2. **Add `--explain` CLI Flag** (1 hour)
   - Update `cli/index.ts` to add `--explain` option
   - Update `commands/scan.ts` to pass flag through
   - Add reporter selection logic based on flag
   - Test flag combination with existing options

3. **Create Friendly Error Handler** (2 hours)
   - File: `lib/errors/friendly-handler.ts`
   - Map common errors (ENOENT, EACCES, etc.) to helpful messages
   - Add contextual suggestions based on error type
   - Include usage examples in error output
   - Add help link generation

4. **Integration & Testing** (1 hour)
   - Wire error handler into scan command
   - Test with various error scenarios
   - Verify output formatting
   - Document new flag in help text

**Deliverables**:
- ✅ `reporters/plain-language.ts` - Working plain language reporter
- ✅ `lib/errors/friendly-handler.ts` - Error handling utility
- ✅ `--explain` flag functional in CLI
- ✅ Error messages are user-friendly

**Success Criteria**:
- [ ] `vibesec scan --explain` produces plain language output
- [ ] No unexplained jargon (CWE, CVE) in explain mode
- [ ] Errors include suggestions and examples
- [ ] All existing tests pass
- [ ] 80%+ comprehension in user testing

**Testing Checklist**:
```bash
# Test plain language mode
vibesec scan ./examples/vulnerable --explain

# Test error handling
vibesec scan /nonexistent/path --explain

# Test format compatibility
vibesec scan --explain --format text
vibesec scan --format json  # Should NOT use explain mode

# Test output file
vibesec scan --explain --output report.txt
```

---

### Phase 2: User Experience Enhancements (Week 2 - 12 hours)

**Goal**: Add visual feedback and improve usability

**Tasks**:

1. **Add Progress Indicators** (3 hours)
   - Install `ora` package
   - Add spinner to scan command
   - Update spinner text during different phases
   - Success/failure states
   - Test with slow operations

2. **Improve Success Messaging** (2 hours)
   - Add completion summary with stats
   - Celebrate when no issues found
   - Show next steps after findings
   - Add emoji indicators for clarity

3. **Enhanced Help Documentation** (2 hours)
   - Update `--help` text with examples
   - Add usage examples to command descriptions
   - Create helpful error messages for invalid flags
   - Document `--explain` mode clearly

4. **Interactive First-Run Experience** (3 hours)
   - Detect first-time users (no config file)
   - Offer guided scan on first run
   - Ask simple questions (path, output preference)
   - Create `.vibesec` config for preferences

5. **User Testing** (2 hours)
   - Test with 2-3 non-technical users
   - Record friction points
   - Measure time to first scan
   - Document feedback

**Deliverables**:
- ✅ Progress indicators during scanning
- ✅ Success/completion messaging
- ✅ Enhanced help text with examples
- ✅ Optional interactive first-run
- ✅ User feedback documentation

**Success Criteria**:
- [ ] Visual feedback during all operations >2 seconds
- [ ] Clear success states and next steps
- [ ] Help text includes 3+ usage examples
- [ ] 90%+ scan completion rate in user testing
- [ ] Time to first scan <3 minutes

**Testing Checklist**:
```bash
# Test progress indicators
vibesec scan ./large-project

# Test help clarity
vibesec --help
vibesec scan --help

# Test first-run experience
rm ~/.vibesec  # Reset config
vibesec scan

# Test with non-technical user
# (Observe: Can they complete scan without help?)
```

---

### Phase 3: Accessibility & Polish (Week 3 - 8 hours)

**Goal**: Ensure broad accessibility and professional polish

**Tasks**:

1. **Security Scorecard** (3 hours)
   - Calculate security score (0-100) based on findings
   - Show trend if previous scans exist
   - Compare to project size benchmarks
   - Add to summary output

2. **Stakeholder Report Generator** (3 hours)
   - Create formatted report suitable for executives
   - Include executive summary
   - Show metrics and trends
   - Export as Markdown/HTML

3. **Accessibility Review** (2 hours)
   - Test with screen readers
   - Verify color contrast (colorblind-friendly)
   - Ensure all emojis have text alternatives
   - Add `--no-color` flag for terminals without color

**Deliverables**:
- ✅ Security scorecard in output
- ✅ Executive-friendly report format
- ✅ Screen reader compatibility
- ✅ `--no-color` flag support

**Success Criteria**:
- [ ] Security score calculation is consistent
- [ ] Stakeholder reports are boardroom-ready
- [ ] Screen reader announces all findings clearly
- [ ] Tool works in monochrome terminals
- [ ] Colorblind users can distinguish severity

**Testing Checklist**:
```bash
# Test scorecard
vibesec scan --explain
# (Verify score appears and makes sense)

# Test stakeholder report
vibesec scan --format stakeholder --output report.md

# Test accessibility
vibesec scan --no-color
# (Use screen reader to test output)

# Test with colorblind simulation
vibesec scan
# (Use colorblind simulator tool)
```

---

### Phase 4: Documentation & Handoff (Week 4 - 4 hours)

**Goal**: Complete documentation and enable team adoption

**Tasks**:

1. **Update README** (1 hour)
   - Add "For Non-Technical Users" section
   - Update installation instructions
   - Add `--explain` flag to quick start
   - Include troubleshooting section

2. **Create Quick Start Guide** (1 hour)
   - Write `docs/QUICK_START.md` for TypeScript version
   - Include installation for Bun/npm
   - Show first scan example
   - Explain severity levels

3. **Update Implementation Quick Reference** (1 hour)
   - Fix all Python → TypeScript references
   - Update file paths to match actual structure
   - Correct code examples to TypeScript
   - Document Bun/npm usage

4. **Create Video Walkthrough** (1 hour)
   - Record 3-minute demo video
   - Show installation and first scan
   - Demonstrate `--explain` mode
   - Upload and link from docs

**Deliverables**:
- ✅ Updated `README.md`
- ✅ New `docs/QUICK_START.md` (TypeScript-focused)
- ✅ Corrected `docs/IMPLEMENTATION_QUICK_REFERENCE.md`
- ✅ Video tutorial published

**Success Criteria**:
- [ ] Non-technical users can follow docs without help
- [ ] All code examples are TypeScript
- [ ] Video has <5% drop-off rate
- [ ] Installation instructions work on Mac/Linux/Windows

---

## Testing Strategy

### Automated Testing

**Unit Tests** (`tests/reporters/plain-language.test.ts`):
```typescript
describe('PlainLanguageReporter', () => {
  it('translates CRITICAL severity to urgent language', () => {
    const reporter = new PlainLanguageReporter();
    const severity = reporter.translateSeverity(Severity.CRITICAL);
    expect(severity.label).toBe('Urgent - Fix Today');
    expect(severity.emoji).toBe('🚨');
  });

  it('uses analogies for common vulnerabilities', () => {
    const finding = createFinding({ category: 'sql-injection' });
    const output = reporter.formatFinding(finding);
    expect(output).toContain('unlocked front door');
  });

  it('includes fix time estimates', () => {
    const finding = createFinding({ category: 'hardcoded-secret' });
    const output = reporter.formatFinding(finding);
    expect(output).toMatch(/Time needed: \d+-\d+ minutes/);
  });
});
```

**Integration Tests** (`tests/cli/scan-explain.test.ts`):
```typescript
describe('scan --explain command', () => {
  it('uses plain language reporter when --explain flag is set', async () => {
    const output = await runCLI(['scan', './fixtures/vulnerable', '--explain']);

    expect(output).not.toContain('CWE-');
    expect(output).not.toContain('OWASP');
    expect(output).toContain('What this means:');
    expect(output).toContain('Why it matters:');
    expect(output).toContain('How to fix:');
  });

  it('uses technical reporter without --explain flag', async () => {
    const output = await runCLI(['scan', './fixtures/vulnerable']);

    expect(output).toContain('CWE-');
    expect(output).toContain('OWASP');
  });
});
```

**Error Handling Tests** (`tests/lib/friendly-handler.test.ts`):
```typescript
describe('FriendlyErrorHandler', () => {
  it('provides helpful message for ENOENT errors', () => {
    const handler = new FriendlyErrorHandler();
    const error = new Error("ENOENT: no such file or directory");
    error.code = 'ENOENT';

    const output = handler.handle(error, { action: 'scan project' });

    expect(output).toContain("Couldn't find");
    expect(output).toContain("Suggestions:");
    expect(output).toContain("Examples:");
  });
});
```

### Manual Testing

**User Acceptance Test Script**:

**Persona**: Non-Technical PM (Sarah)

**Scenario**: First-time scan of AI-generated project

**Steps**:
1. **Installation**
   - Provide only README installation section
   - Observe: Can they install without help?
   - Success: <3 minutes to working installation

2. **First Scan**
   - Task: "Scan your project for security issues"
   - Command: `vibesec scan`
   - Observe: Do they know where to run it?
   - Success: Completes scan without assistance

3. **Understanding Results**
   - Ask: "What security issues did you find?"
   - Ask: "Which one should you fix first?"
   - Ask: "How long will it take to fix?"
   - Success: Answers all 3 correctly

4. **Taking Action**
   - Task: "Share these results with your team"
   - Observe: Can they generate shareable report?
   - Success: Creates file suitable for sharing

**Acceptance Criteria**:
- ✅ Completes all tasks independently
- ✅ Understands severity without asking
- ✅ Can prioritize fixes correctly
- ✅ Feels confident using the tool

---

## Risk Assessment & Mitigation

### Risk 1: Over-Simplification
**Likelihood**: Medium | **Impact**: Medium

**Description**: Plain language mode may omit important technical details

**Mitigation**:
- Always include technical metadata at bottom of findings
- Add "Show technical details" option
- Link to full technical docs
- Get feedback from both technical and non-technical users

**Validation**:
- Security review of plain language output
- Verify all CWE/OWASP mappings preserved

---

### Risk 2: TypeScript/Python Documentation Mismatch
**Likelihood**: High | **Impact**: Medium

**Description**: Existing docs reference Python implementation that doesn't exist

**Mitigation**:
- **Immediate**: Add notice to all docs clarifying TypeScript is POC language
- **Phase 4**: Complete rewrite of Python references
- Update all code examples to TypeScript
- Create `TECH_STACK.md` documenting decisions

**Validation**:
- Documentation consistency review
- Grep for remaining `.py` references
- Test all code examples

---

### Risk 3: Dependency on Chalk Version
**Likelihood**: Low | **Impact**: Low

**Description**: Chalk 4.x uses CommonJS, Chalk 5.x is ESM-only

**Mitigation**:
- Keep Chalk 4.x for POC compatibility
- Document upgrade path to Chalk 5.x for production
- Test with both Bun and Node.js runtimes

**Validation**:
- Test suite runs on both Bun and Node 16+

---

### Risk 4: Terminal Compatibility
**Likelihood**: Medium | **Impact**: Low

**Description**: Emojis and colors may not render on all terminals

**Mitigation**:
- Implement `--no-color` flag (strips ANSI codes)
- Detect terminal capabilities and downgrade gracefully
- Provide ASCII fallbacks for emojis
- Test on Windows CMD, PowerShell, WSL, macOS Terminal

**Validation**:
- Test matrix covering major terminal emulators
- CI tests with `NO_COLOR=1` environment variable

---

## Success Metrics

### Quantitative Metrics

| Metric | Baseline | Phase 1 Target | Phase 3 Target | Measurement Method |
|--------|----------|----------------|----------------|--------------------|
| Installation success rate | 40% | 70% | 85% | Telemetry (opt-in) |
| Time to first scan | 10-30 min | 5 min | <3 min | User timing study |
| Scan completion rate | 50% | 75% | 90% | Usage analytics |
| Finding comprehension | 30% | 80% | 90% | User survey |
| Self-service rate | 20% | 60% | 75% | Support ticket reduction |

### Qualitative Success Criteria

**Phase 1 Complete When**:
- [ ] Non-technical user completes scan independently
- [ ] User understands critical findings without help
- [ ] Errors are helpful, not scary
- [ ] All tests pass

**Phase 2 Complete When**:
- [ ] Visual feedback during all operations
- [ ] Users feel guided through the process
- [ ] Help text answers common questions
- [ ] Time to first scan <3 minutes

**Phase 3 Complete When**:
- [ ] Security score is clear and actionable
- [ ] Reports suitable for stakeholder presentation
- [ ] Tool accessible to screen reader users
- [ ] Works in all terminal environments

**Phase 4 Complete When**:
- [ ] Documentation has no Python references
- [ ] Non-technical users can self-serve
- [ ] Video tutorial has >100 views
- [ ] README accurately reflects TypeScript implementation

---

## Implementation Checklist

### Pre-Implementation
- [x] Research complete (codebase analysis, user research)
- [x] Plan reviewed and approved
- [ ] Tech stack documented (TypeScript/Bun for POC)
- [ ] Development environment ready (Bun installed)

### Phase 1: Foundation
- [ ] Create `reporters/plain-language.ts`
  - [ ] Severity translation with emojis
  - [ ] Analogy mapping for vulnerabilities
  - [ ] "What/Why/How" formatter
  - [ ] Fix time estimation
  - [ ] Unit tests (80%+ coverage)
- [ ] Create `lib/errors/friendly-handler.ts`
  - [ ] Error message mapping
  - [ ] Suggestion generation
  - [ ] Example formatting
  - [ ] Help link generation
  - [ ] Unit tests
- [ ] Update `cli/index.ts`
  - [ ] Add `--explain` flag
  - [ ] Update help text
- [ ] Update `commands/scan.ts`
  - [ ] Reporter selection logic
  - [ ] Error handler integration
  - [ ] Integration tests
- [ ] Test with real vulnerabilities
- [ ] User test with 1 PM

### Phase 2: UX Enhancements
- [ ] Add `ora` dependency
- [ ] Implement progress spinners
- [ ] Add completion summary
- [ ] Enhance help documentation
- [ ] Create interactive first-run (optional)
- [ ] User test with 2-3 non-technical users
- [ ] Document feedback

### Phase 3: Accessibility & Polish
- [ ] Implement security scorecard
- [ ] Create stakeholder report format
- [ ] Add `--no-color` flag
- [ ] Screen reader testing
- [ ] Colorblind simulation testing
- [ ] Accessibility documentation

### Phase 4: Documentation
- [ ] Update README.md
  - [ ] Add "For Non-Technical Users" section
  - [ ] Update installation (Bun/npm)
  - [ ] Add `--explain` to examples
- [ ] Create `docs/QUICK_START.md` (TypeScript)
- [ ] Update `docs/IMPLEMENTATION_QUICK_REFERENCE.md`
  - [ ] Fix all Python → TypeScript
  - [ ] Correct file paths
  - [ ] Update code examples
- [ ] Create `docs/TECH_STACK.md`
  - [ ] Document TypeScript/Bun choice for POC
  - [ ] Explain Bun vs npm usage
  - [ ] List all dependencies
- [ ] Create video tutorial
- [ ] Final review of all docs

---

## File Structure After Implementation

```
vibesec/
├── cli/
│   ├── index.ts                          # CLI entry (updated: --explain flag)
│   └── commands/
│       └── scan.ts                       # Scan command (updated: reporter selection)
│
├── reporters/
│   ├── plaintext.ts                      # Technical reporter (existing)
│   ├── json.ts                           # JSON reporter (existing)
│   └── plain-language.ts                 # NEW: Plain language reporter
│
├── lib/
│   └── errors/
│       └── friendly-handler.ts           # NEW: Error handling utility
│
├── tests/
│   ├── reporters/
│   │   └── plain-language.test.ts        # NEW: Reporter tests
│   ├── lib/
│   │   └── friendly-handler.test.ts      # NEW: Error handler tests
│   └── cli/
│       └── scan-explain.test.ts          # NEW: Integration tests
│
├── docs/
│   ├── QUICK_START.md                    # NEW: Quick start (TypeScript)
│   ├── TECH_STACK.md                     # NEW: Tech decisions
│   ├── IMPLEMENTATION_QUICK_REFERENCE.md # UPDATED: TypeScript version
│   ├── NON_TECHNICAL_USER_RESEARCH.md    # Existing research
│   └── plans/
│       └── 2025-10-10-non-technical-user-accessibility.md  # This plan
│
├── package.json                          # UPDATED: Add ora dependency
└── README.md                             # UPDATED: Non-technical user section
```

---

## Code Examples

### Example 1: Plain Language Reporter Usage

```typescript
// reporters/plain-language.ts (excerpt)

export class PlainLanguageReporter {
  private readonly analogies: Record<string, string> = {
    'sql-injection': 'unlocked front door that anyone can walk through',
    'xss': 'poisoned water supply affecting everyone who drinks',
    'hardcoded-secret': 'password written on a sticky note on your monitor',
    'command-injection': 'blank check handed to a stranger',
    // ... more analogies
  };

  private readonly severityMap: Record<Severity, PlainSeverity> = {
    [Severity.CRITICAL]: {
      emoji: '🚨',
      label: 'Urgent - Fix Today',
      timeframe: 'immediately',
      businessImpact: 'High risk of data breach, legal liability, financial loss'
    },
    [Severity.HIGH]: {
      emoji: '⚠️',
      label: 'Important - Fix This Week',
      timeframe: 'within 7 days',
      businessImpact: 'Moderate risk to data security and user trust'
    },
    // ... more severity mappings
  };

  formatFinding(finding: Finding): string {
    const severity = this.severityMap[finding.severity];
    const analogy = this.analogies[finding.category] || 'security weakness';

    return `
${severity.emoji} ${severity.label}

Found: ${finding.title} in ${finding.location.file}:${finding.location.line}

What this means:
${this.explainInPlainLanguage(finding)}
This is like having ${analogy}.

Why it matters:
${severity.businessImpact}

${this.describeRealWorldImpact(finding)}

How to fix:
${finding.fix.recommendation}

${this.formatFixExample(finding)}

Time needed: ${this.estimateFixTime(finding)}
Who can fix: ${this.suggestWhoCanFix(finding)}
    `.trim();
  }
}
```

### Example 2: Friendly Error Handler

```typescript
// lib/errors/friendly-handler.ts (excerpt)

export class FriendlyErrorHandler {
  private readonly errorMessages: Record<string, ErrorTemplate> = {
    'ENOENT': {
      title: "Couldn't find the folder you wanted to scan",
      explanation: (path) => `The path '${path}' doesn't exist on your computer.`,
      suggestions: [
        'Check the path for typos',
        'Make sure the folder exists',
        "Try using '.' to scan the current folder"
      ],
      examples: [
        'vibesec scan .              # Scan current folder',
        'vibesec scan ./myproject    # Scan specific folder'
      ]
    },
    'EACCES': {
      title: "Don't have permission to read this folder",
      explanation: (path) => `Your user account can't access '${path}'.`,
      suggestions: [
        'Check folder permissions',
        'Try running with appropriate access',
        'Make sure you own the folder'
      ],
      examples: [
        'ls -la # Check folder permissions',
        'vibesec scan ~/myproject  # Try your home directory'
      ]
    },
    // ... more error mappings
  };

  handle(error: Error, context: ErrorContext): void {
    const template = this.getTemplate(error);

    console.error(chalk.red(`\n❌ ${template.title}\n`));
    console.error(template.explanation(context.path));
    console.error(chalk.yellow('\n💡 Suggestions:'));
    template.suggestions.forEach(s => console.error(`  • ${s}`));

    if (template.examples.length > 0) {
      console.error(chalk.cyan('\nExamples:'));
      template.examples.forEach(ex => console.error(`  ${ex}`));
    }

    console.error(chalk.gray(`\nNeed help? https://vibesec.dev/docs/troubleshooting\n`));
  }
}
```

### Example 3: Scan Command Integration

```typescript
// commands/scan.ts (updated excerpt)

export async function scanCommand(
  path: string,
  options: ScanCommandOptions
): Promise<void> {
  const errorHandler = new FriendlyErrorHandler();

  try {
    // Determine reporter based on options
    let reporter: BaseReporter;

    if (options.format === 'json') {
      reporter = new JsonReporter();
    } else if (options.explain) {
      reporter = new PlainLanguageReporter();
    } else {
      reporter = new PlainTextReporter();
    }

    // Run scan with progress indicator
    const spinner = ora('Initializing scan...').start();

    spinner.text = 'Finding files...';
    const scanner = new Scanner(scanOptions);

    spinner.text = `Analyzing files...`;
    const result = await scanner.scan();

    spinner.succeed(chalk.green('Scan complete!'));

    // Generate and output report
    const report = reporter.generate(result);
    console.log('\n' + report);

    // Show helpful summary
    if (!options.format === 'json') {
      console.log(chalk.bold(`\n📊 Scanned ${result.scan.filesScanned} files in ${result.scan.duration.toFixed(1)}s`));

      if (result.summary.total === 0) {
        console.log(chalk.green('✨ Great job! No security issues found.\n'));
      } else {
        console.log(chalk.yellow(`\n💡 Next steps:`));
        console.log(`  1. Fix ${result.summary.bySeverity.critical} critical issues`);
        console.log(`  2. Run 'vibesec scan --explain' for plain language help\n`);
      }
    }

  } catch (error) {
    errorHandler.handle(error as Error, {
      action: 'scan project',
      path,
      userLevel: options.explain ? 'non-technical' : 'technical'
    });
    process.exit(1);
  }
}
```

---

## Dependencies & Package Updates

### package.json Updates

```json
{
  "dependencies": {
    "chalk": "^4.1.2",
    "commander": "^11.1.0",
    "fast-glob": "^3.3.2",
    "js-yaml": "^4.1.0",
    "ora": "^6.3.1"
  }
}
```

**Note**: Using ora v6.x for CommonJS compatibility with current setup. Ora v7+ is ESM-only.

### Installation Commands

```bash
# Using Bun (POC development)
bun add ora

# Using npm (alternative)
npm install ora
```

---

## Next Steps

### Immediate (This Week)
1. ✅ Review and approve this implementation plan
2. ⏳ Create `docs/TECH_STACK.md` documenting TypeScript/Bun choice
3. ⏳ Update `docs/IMPLEMENTATION_QUICK_REFERENCE.md` to remove Python references
4. ⏳ Begin Phase 1 implementation

### Short-term (Next 2 Weeks)
1. Complete Phase 1 (Foundation)
2. User test with 1 PM
3. Begin Phase 2 (UX Enhancements)
4. Document learnings

### Medium-term (This Month)
1. Complete Phases 2-3
2. Conduct comprehensive user testing
3. Iterate based on feedback
4. Complete Phase 4 documentation

### Long-term (Next Quarter)
1. Measure adoption metrics
2. Gather feedback from diverse user base
3. Plan Phase 5 (Web UI, integrations)
4. Scale to enterprise features

---

## Appendix

### A. Analogy Reference Table

| Vulnerability Type | Technical Term | Plain Language Analogy |
|-------------------|----------------|------------------------|
| SQL Injection | CWE-89 | Unlocked front door anyone can walk through |
| XSS | CWE-79 | Poisoned water supply affecting all users |
| Hardcoded Secrets | CWE-798 | Password written on sticky note on monitor |
| CSRF | CWE-352 | Forged signature on important documents |
| Command Injection | CWE-78 | Blank check handed to stranger |
| Path Traversal | CWE-22 | Skeleton key opening any room |
| Insecure Deserialization | CWE-502 | Trojan horse package delivery |
| Weak Crypto | CWE-327 | Lock that can be picked with paperclip |

### B. Fix Time Estimation Guidelines

| Vulnerability Complexity | Estimated Time | Who Can Fix |
|-------------------------|----------------|-------------|
| Simple (hardcoded secret) | 10-15 minutes | Any developer |
| Moderate (SQL injection) | 15-30 minutes | Backend developer |
| Complex (auth bypass) | 1-2 hours | Senior developer |
| Architectural | 4-8 hours | Tech lead + team |

### C. Severity Translation Reference

| Technical | Plain Language | Timeframe | Business Impact |
|-----------|----------------|-----------|-----------------|
| CRITICAL | 🚨 Urgent - Fix Today | Immediately | High risk of breach, legal liability |
| HIGH | ⚠️ Important - Fix This Week | Within 7 days | Moderate security risk, user trust impact |
| MEDIUM | 📋 Notable - Fix Soon | Within 30 days | Could lead to security problems |
| LOW | ℹ️ Good to Know - Consider Fixing | When convenient | Minimal risk, best practices |

### D. Related Documentation

- **Research**: `/docs/NON_TECHNICAL_USER_RESEARCH.md`
- **Quick Reference**: `/docs/IMPLEMENTATION_QUICK_REFERENCE.md` (needs TypeScript update)
- **Architecture**: `/docs/ARCHITECTURE.md`
- **API Docs**: `/docs/API.md`

---

**Plan Status**: ✅ Ready for Implementation
**Next Action**: Create `docs/TECH_STACK.md` and update Quick Reference to TypeScript
**Estimated Delivery**: 4 weeks from start (8 hours/week)
**Risk Level**: Low (clear requirements, proven patterns, manageable scope)
