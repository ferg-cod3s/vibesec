# VibeSec Priority 1 - Atomic Task Breakdown

**Phase**: MVP Priority 1 - Foundation
**Duration**: 38 hours (Weeks 1-2)
**Status**: Not Started
**Dependencies**: None (POC complete)

---

## Overview

This document breaks down Priority 1 (Foundation) into atomic, independently executable tasks. Each task is designed to be:

- **Atomic**: Can be completed in a single focused session (1-4 hours)
- **Testable**: Has clear success criteria
- **Trackable**: Can be marked as done independently
- **Sequenceable**: Dependencies are explicit

---

## Component 1: AST Parser Integration (16 hours)

### 1.1 Environment Setup & Dependencies (2 hours)

**Description**: Install and configure tree-sitter dependencies

**Tasks**:

- [ ] **1.1.1** Install tree-sitter core library (`npm install tree-sitter`)
- [ ] **1.1.2** Install language parsers:
  - `@tree-sitter/javascript` (for JS/TS)
  - `tree-sitter-python`
  - `tree-sitter-go`
- [ ] **1.1.3** Create directory structure: `scanner/analyzers/ast/`
- [ ] **1.1.4** Add tree-sitter types to TypeScript config
- [ ] **1.1.5** Document dependencies in package.json

**Success Criteria**:

- All packages install without errors
- TypeScript recognizes tree-sitter types
- Directory structure exists

**Files Created**:

- `scanner/analyzers/ast/` (directory)

**Dependencies**: None

---

### 1.2 Base AST Parser Class (3 hours)

**Description**: Create abstract base class for AST parsing

**Tasks**:

- [ ] **1.2.1** Create `scanner/analyzers/ast/base-parser.ts`
- [ ] **1.2.2** Define `ASTParser` interface:
  ```typescript
  interface ASTParser {
    parseFile(filePath: string): Promise<ASTNode>;
    query(pattern: string): Promise<ASTNode[]>;
    extractSymbols(): Promise<Symbol[]>;
  }
  ```
- [ ] **1.2.3** Implement error handling for parse failures
- [ ] **1.2.4** Add performance logging (parse time tracking)
- [ ] **1.2.5** Write unit tests for base class

**Success Criteria**:

- Base class compiles without errors
- Error handling catches malformed files
- Performance logging outputs parse time
- 100% test coverage for base class

**Files Created**:

- `scanner/analyzers/ast/base-parser.ts`
- `tests/ast/base-parser.test.ts`

**Dependencies**: 1.1

---

### 1.3 JavaScript/TypeScript Parser (4 hours)

**Description**: Implement JavaScript/TypeScript AST parser

**Tasks**:

- [ ] **1.3.1** Create `scanner/analyzers/ast/javascript-parser.ts`
- [ ] **1.3.2** Implement `parseFile()` using `@tree-sitter/javascript`
- [ ] **1.3.3** Implement query engine for common patterns:
  - Function declarations
  - Variable declarations
  - Import statements
  - SQL query construction
- [ ] **1.3.4** Add symbol extraction (functions, classes, variables)
- [ ] **1.3.5** Performance optimization: lazy parsing
- [ ] **1.3.6** Write comprehensive tests with sample JS/TS files

**Success Criteria**:

- Parse 1000+ files/second
- Extract all function/variable declarations
- Query patterns work correctly
- Memory usage <100MB for typical file
- 90%+ test coverage

**Files Created**:

- `scanner/analyzers/ast/javascript-parser.ts`
- `tests/ast/javascript-parser.test.ts`
- `tests/fixtures/ast/sample.js`
- `tests/fixtures/ast/sample.ts`

**Dependencies**: 1.2

---

### 1.4 Python Parser (3 hours)

**Description**: Implement Python AST parser

**Tasks**:

- [ ] **1.4.1** Create `scanner/analyzers/ast/python-parser.ts`
- [ ] **1.4.2** Implement `parseFile()` using `tree-sitter-python`
- [ ] **1.4.3** Implement query engine for Python patterns:
  - Function definitions (def)
  - Class definitions
  - Import statements
  - SQL query construction
- [ ] **1.4.4** Add symbol extraction (functions, classes, variables)
- [ ] **1.4.5** Write tests with sample Python files

**Success Criteria**:

- Parse 1000+ files/second
- Extract all function/class definitions
- Query patterns work correctly
- 90%+ test coverage

**Files Created**:

- `scanner/analyzers/ast/python-parser.ts`
- `tests/ast/python-parser.test.ts`
- `tests/fixtures/ast/sample.py`

**Dependencies**: 1.2

---

### 1.5 Go Parser (2 hours)

**Description**: Implement Go AST parser

**Tasks**:

- [ ] **1.5.1** Create `scanner/analyzers/ast/go-parser.ts`
- [ ] **1.5.2** Implement `parseFile()` using `tree-sitter-go`
- [ ] **1.5.3** Implement query engine for Go patterns:
  - Function declarations
  - Struct definitions
  - Import statements
- [ ] **1.5.4** Write tests with sample Go files

**Success Criteria**:

- Parse 1000+ files/second
- Extract all function/struct definitions
- 90%+ test coverage

**Files Created**:

- `scanner/analyzers/ast/go-parser.ts`
- `tests/ast/go-parser.test.ts`
- `tests/fixtures/ast/sample.go`

**Dependencies**: 1.2

---

### 1.6 Parser Factory & Integration (2 hours)

**Description**: Create factory to select parser based on file extension

**Tasks**:

- [ ] **1.6.1** Create `scanner/analyzers/ast/parser-factory.ts`
- [ ] **1.6.2** Implement `getParser(filePath)` method:
  - `.js`, `.jsx`, `.ts`, `.tsx` → JavaScript parser
  - `.py` → Python parser
  - `.go` → Go parser
- [ ] **1.6.3** Add lazy loading (only load parser when needed)
- [ ] **1.6.4** Integrate with `scanner/core/engine.ts`
- [ ] **1.6.5** Add CLI flag: `--use-ast` (default: false for backward compatibility)
- [ ] **1.6.6** Write integration tests

**Success Criteria**:

- Correct parser selected for each file type
- Lazy loading reduces memory usage
- Integration with scanner engine works
- CLI flag toggles AST parsing
- Integration tests pass

**Files Created**:

- `scanner/analyzers/ast/parser-factory.ts`
- `scanner/analyzers/ast/index.ts` (exports)
- `tests/ast/parser-factory.test.ts`
- `tests/integration/ast-scanner.test.ts`

**Dependencies**: 1.3, 1.4, 1.5

---

## Component 2: Configuration System (12 hours)

### 2.1 Configuration Schema Definition (2 hours)

**Description**: Define YAML schema and TypeScript types

**Tasks**:

- [ ] **2.1.1** Create `scanner/config/schema.ts` with TypeScript types:
  ```typescript
  interface VibeSec Config {
    version: number
    scan: ScanConfig
    severity: SeverityConfig
    detectors: DetectorConfig
    integrations: IntegrationConfig
    custom_rules: string[]
  }
  ```
- [ ] **2.1.2** Create JSON Schema for validation (`scanner/config/schema.json`)
- [ ] **2.1.3** Document schema in `docs/CONFIG_SCHEMA.md`
- [ ] **2.1.4** Create `.vibesec.yaml.example` in project root

**Success Criteria**:

- TypeScript types compile
- JSON Schema is valid
- Example config file is syntactically correct
- Documentation is clear

**Files Created**:

- `scanner/config/schema.ts`
- `scanner/config/schema.json`
- `docs/CONFIG_SCHEMA.md`
- `.vibesec.yaml.example`

**Dependencies**: None

---

### 2.2 YAML Parser & Loader (3 hours)

**Description**: Load and parse .vibesec.yaml file

**Tasks**:

- [ ] **2.2.1** Install `js-yaml` dependency
- [ ] **2.2.2** Create `scanner/config/loader.ts`
- [ ] **2.2.3** Implement `loadConfig(projectRoot)` function:
  - Search for `.vibesec.yaml` in project root
  - Parse YAML using `js-yaml`
  - Validate against JSON Schema
  - Return typed config object
- [ ] **2.2.4** Add error handling for:
  - File not found (use defaults)
  - Invalid YAML syntax
  - Schema validation errors
- [ ] **2.2.5** Write unit tests with valid/invalid configs

**Success Criteria**:

- Load config in <50ms
- Validation catches all schema violations
- Clear error messages for invalid configs
- 100% test coverage

**Files Created**:

- `scanner/config/loader.ts`
- `tests/config/loader.test.ts`
- `tests/fixtures/config/valid.yaml`
- `tests/fixtures/config/invalid-syntax.yaml`
- `tests/fixtures/config/invalid-schema.yaml`

**Dependencies**: 2.1

---

### 2.3 Environment Variable Substitution (2 hours)

**Description**: Support ${ENV_VAR} syntax in config

**Tasks**:

- [ ] **2.3.1** Create `scanner/config/env-substitution.ts`
- [ ] **2.3.2** Implement `substituteEnvVars(config)` function:
  - Regex to find `${VAR_NAME}` patterns
  - Replace with `process.env.VAR_NAME`
  - Warn if environment variable not set
- [ ] **2.3.3** Handle nested objects and arrays
- [ ] **2.3.4** Add security: validate environment variable names
- [ ] **2.3.5** Write unit tests

**Success Criteria**:

- All `${VAR}` patterns are replaced
- Warning logged for undefined vars
- Security validation prevents injection
- 100% test coverage

**Files Created**:

- `scanner/config/env-substitution.ts`
- `tests/config/env-substitution.test.ts`

**Dependencies**: 2.2

---

### 2.4 Config Merging with CLI Flags (2 hours)

**Description**: Merge config file with CLI flags (CLI takes precedence)

**Tasks**:

- [ ] **2.4.1** Create `scanner/config/merger.ts`
- [ ] **2.4.2** Implement `mergeConfig(fileConfig, cliOptions)` function:
  - CLI flags override file config
  - Deep merge for nested objects
  - Precedence: CLI > ENV > File > Defaults
- [ ] **2.4.3** Add default configuration values
- [ ] **2.4.4** Write merge logic tests

**Success Criteria**:

- CLI flags always override file config
- Defaults are applied when values missing
- Deep merge works correctly
- 100% test coverage

**Files Created**:

- `scanner/config/merger.ts`
- `scanner/config/defaults.ts`
- `tests/config/merger.test.ts`

**Dependencies**: 2.2, 2.3

---

### 2.5 CLI Integration (2 hours)

**Description**: Integrate config system with existing CLI

**Tasks**:

- [ ] **2.5.1** Update `cli/commands/scan.ts`:
  - Load config file before scan
  - Merge with CLI options
  - Pass to scanner engine
- [ ] **2.5.2** Add CLI flags to override config:
  - `--config <path>` (custom config file)
  - `--exclude <pattern>` (add to exclusions)
  - `--severity <level>` (override threshold)
- [ ] **2.5.3** Add `--show-config` flag to display effective config
- [ ] **2.5.4** Update help text with config options

**Success Criteria**:

- Config loads automatically if present
- CLI flags override correctly
- `--show-config` displays merged config
- Help text is updated

**Files Modified**:

- `cli/commands/scan.ts`
- `cli/index.ts`

**Dependencies**: 2.4

---

### 2.6 Config System Tests (1 hour)

**Description**: End-to-end integration tests for config system

**Tasks**:

- [ ] **2.6.1** Create `tests/integration/config.test.ts`
- [ ] **2.6.2** Test scenarios:
  - No config file (use defaults)
  - Valid config file
  - Config file + CLI flags
  - Environment variable substitution
  - Invalid config (error handling)
- [ ] **2.6.3** Test `--show-config` output

**Success Criteria**:

- All integration tests pass
- Edge cases covered
- Error handling verified

**Files Created**:

- `tests/integration/config.test.ts`

**Dependencies**: 2.5

---

## Component 3: Incremental Scanning (10 hours)

### 3.1 Git Repository Detection (1 hour)

**Description**: Detect if project is a git repository

**Tasks**:

- [ ] **3.1.1** Install `simple-git` dependency
- [ ] **3.1.2** Create `scanner/core/git-detector.ts`
- [ ] **3.1.3** Implement `isGitRepository(path)` function:
  - Check for `.git` directory
  - Verify it's a valid git repo
  - Return boolean
- [ ] **3.1.4** Write unit tests

**Success Criteria**:

- Correctly detects git repositories
- Returns false for non-git directories
- 100% test coverage

**Files Created**:

- `scanner/core/git-detector.ts`
- `tests/git/git-detector.test.ts`

**Dependencies**: None

---

### 3.2 Changed Files Detection (2 hours)

**Description**: Get list of changed files using git diff

**Tasks**:

- [ ] **3.2.1** Create `scanner/core/git-diff.ts`
- [ ] **3.2.2** Implement `getChangedFiles(baseRef)` function:
  - Run `git diff --name-only <baseRef>`
  - Default baseRef: `HEAD`
  - Support custom refs (e.g., `main`, `origin/main`)
  - Filter by file extensions
- [ ] **3.2.3** Handle git errors gracefully
- [ ] **3.2.4** Write unit tests with mocked git commands

**Success Criteria**:

- Returns list of changed files
- Handles various git refs
- Graceful error handling
- 90%+ test coverage

**Files Created**:

- `scanner/core/git-diff.ts`
- `tests/git/git-diff.test.ts`

**Dependencies**: 3.1

---

### 3.3 File Hashing & Cache Storage (3 hours)

**Description**: Hash files and cache scan results

**Tasks**:

- [ ] **3.3.1** Create `scanner/cache/hasher.ts`
- [ ] **3.3.2** Implement `hashFile(filePath)` function:
  - SHA-256 hash of file contents
  - Fast hashing (streaming for large files)
- [ ] **3.3.3** Create `scanner/cache/storage.ts`
- [ ] **3.3.4** Implement cache storage:
  ```typescript
  interface CacheEntry {
    hash: string;
    findings: Finding[];
    timestamp: number;
  }
  ```
- [ ] **3.3.5** Store cache in `.vibesec-cache/results.json`
- [ ] **3.3.6** Implement `getCache()`, `setCache()`, `clearCache()`
- [ ] **3.3.7** Add cache expiration (default: 7 days)
- [ ] **3.3.8** Write unit tests

**Success Criteria**:

- Hash files in <10ms each
- Cache read/write works
- Cache expiration works
- 100% test coverage

**Files Created**:

- `scanner/cache/hasher.ts`
- `scanner/cache/storage.ts`
- `tests/cache/hasher.test.ts`
- `tests/cache/storage.test.ts`

**Dependencies**: None

---

### 3.4 Incremental Scan Logic (3 hours)

**Description**: Implement incremental scanning with cache

**Tasks**:

- [ ] **3.4.1** Create `scanner/core/incremental-scanner.ts`
- [ ] **3.4.2** Implement `incrementalScan(options)` workflow:
  ```
  1. Check if git repo
  2. Get changed files via git diff
  3. Hash all project files
  4. Load cache
  5. Identify files to scan:
     - Changed files (different hash)
     - New files (not in cache)
  6. Scan only those files
  7. Merge with cached results for unchanged files
  8. Update cache with new results
  ```
- [ ] **3.4.3** Add fallback to full scan if:
  - Not a git repo
  - Cache corrupted
  - `--no-cache` flag
- [ ] **3.4.4** Add performance logging (cache hit rate, time saved)
- [ ] **3.4.5** Write integration tests

**Success Criteria**:

- Incremental scan <10s for typical PR (5-10 files)
- Cache hit rate >90% for unchanged files
- Fallback to full scan works
- Performance metrics logged

**Files Created**:

- `scanner/core/incremental-scanner.ts`
- `tests/integration/incremental-scan.test.ts`

**Dependencies**: 3.1, 3.2, 3.3

---

### 3.5 CLI Integration & Flags (1 hour)

**Description**: Add incremental scanning to CLI

**Tasks**:

- [ ] **3.5.1** Update `cli/commands/scan.ts`:
  - Default: incremental scan if git repo
  - Add `--no-cache` flag (force full scan)
  - Add `--clear-cache` flag (delete cache)
  - Add `--cache-stats` flag (show cache metrics)
- [ ] **3.5.2** Display cache stats in output:
  - "Cache hit: 95% (19/20 files)"
  - "Time saved: 45s"
- [ ] **3.5.3** Update help text

**Success Criteria**:

- Incremental scan runs by default in git repos
- Flags work correctly
- Cache stats displayed
- Help text updated

**Files Modified**:

- `cli/commands/scan.ts`
- `cli/index.ts`

**Dependencies**: 3.4

---

## Task Dependencies Graph

```
Priority 1 Foundation (38 hours)
│
├── AST Parser (16h)
│   ├── 1.1 Setup (2h) ────────────┐
│   ├── 1.2 Base Class (3h) ◄──────┤
│   ├── 1.3 JS Parser (4h) ◄───────┤
│   ├── 1.4 Python Parser (3h) ◄───┤
│   ├── 1.5 Go Parser (2h) ◄───────┤
│   └── 1.6 Integration (2h) ◄─────┴─ (1.3, 1.4, 1.5)
│
├── Config System (12h)
│   ├── 2.1 Schema (2h) ────────────┐
│   ├── 2.2 Loader (3h) ◄───────────┤
│   ├── 2.3 Env Vars (2h) ◄─────────┤
│   ├── 2.4 Merger (2h) ◄───────────┴─ (2.2, 2.3)
│   ├── 2.5 CLI Integration (2h) ◄──── (2.4)
│   └── 2.6 Tests (1h) ◄─────────────── (2.5)
│
└── Incremental Scan (10h)
    ├── 3.1 Git Detect (1h) ────────┐
    ├── 3.2 Git Diff (2h) ◄─────────┤
    ├── 3.3 Cache (3h) ─────────────┤
    ├── 3.4 Scan Logic (3h) ◄───────┴─ (3.1, 3.2, 3.3)
    └── 3.5 CLI Integration (1h) ◄──── (3.4)
```

---

## Execution Strategy

### Week 1 (20 hours)

**Focus**: AST Parser + Config System

**Monday (4h)**:

- 1.1 AST Setup (2h)
- 1.2 Base Class (2h)

**Tuesday (4h)**:

- 1.2 Base Class completion (1h)
- 1.3 JS Parser (3h)

**Wednesday (4h)**:

- 1.3 JS Parser completion (1h)
- 1.4 Python Parser (3h)

**Thursday (4h)**:

- 1.5 Go Parser (2h)
- 1.6 Integration (2h)

**Friday (4h)**:

- 2.1 Config Schema (2h)
- 2.2 YAML Loader (2h)

---

### Week 2 (18 hours)

**Focus**: Config System + Incremental Scan

**Monday (4h)**:

- 2.2 Loader completion (1h)
- 2.3 Env Vars (2h)
- 2.4 Merger (1h)

**Tuesday (4h)**:

- 2.4 Merger completion (1h)
- 2.5 CLI Integration (2h)
- 2.6 Tests (1h)

**Wednesday (4h)**:

- 3.1 Git Detect (1h)
- 3.2 Git Diff (2h)
- 3.3 Cache (1h)

**Thursday (4h)**:

- 3.3 Cache completion (2h)
- 3.4 Scan Logic (2h)

**Friday (2h)**:

- 3.4 Scan Logic completion (1h)
- 3.5 CLI Integration (1h)

---

## Success Metrics

### Technical Metrics

| Metric                 | Target              | Measurement       |
| ---------------------- | ------------------- | ----------------- |
| AST Parse Speed        | >1000 files/sec     | Benchmark tests   |
| Config Load Time       | <50ms               | Performance tests |
| Incremental Scan Speed | <10s for 5-10 files | Integration tests |
| Cache Hit Rate         | >90%                | Logged metrics    |
| Memory Usage           | <200MB              | Profiler          |
| Test Coverage          | >85%                | Jest coverage     |

### Quality Metrics

| Metric                 | Target              | Measurement     |
| ---------------------- | ------------------- | --------------- |
| All Unit Tests Pass    | 100%                | CI pipeline     |
| Integration Tests Pass | 100%                | CI pipeline     |
| Type Safety            | 0 TypeScript errors | `bun typecheck` |
| Linting                | 0 ESLint errors     | `bun lint`      |

---

## Risks & Mitigation

### Risk 1: AST Performance Issues

**Probability**: Medium
**Impact**: High
**Mitigation**:

- Lazy-load AST parsing (only when needed)
- Fallback to regex if AST too slow
- Implement caching for parsed ASTs

### Risk 2: Config Schema Evolution

**Probability**: Medium
**Impact**: Medium
**Mitigation**:

- Version config schema (v1, v2, etc.)
- Migration tool for old configs
- Backward compatibility for 1 major version

### Risk 3: Git Integration Complexity

**Probability**: Low
**Impact**: Medium
**Mitigation**:

- Graceful degradation to full scan
- Clear error messages for git issues
- Extensive testing with various git states

---

## Testing Strategy

### Unit Tests

- Every new file gets a corresponding `.test.ts`
- Target: >90% coverage for each module
- Mocking: Use jest.mock for external dependencies

### Integration Tests

- Test end-to-end workflows:
  - AST + Scanner integration
  - Config + CLI integration
  - Incremental scan + Cache
- Test with real project files

### Performance Tests

- Benchmark AST parsing (1000 files)
- Benchmark config loading
- Benchmark incremental vs full scan

---

## Documentation Updates

### Required Documentation

- [ ] Update `docs/ARCHITECTURE.md` with AST parser design
- [ ] Create `docs/CONFIG_SCHEMA.md` for configuration reference
- [ ] Update `README.md` with new CLI flags
- [ ] Add examples to `docs/QUICK_START.md`
- [ ] Update `docs/API.md` with new programmatic APIs

---

## GitHub Project Items to Create

Each task above should become a GitHub Project item with:

- **Title**: Task ID + Description (e.g., "1.1.1: Install tree-sitter")
- **Body**: Success criteria, files created, dependencies
- **Labels**: `priority-1`, `ast-parser` / `config` / `incremental-scan`
- **Estimate**: Hours from task description
- **Status**: Todo → In Progress → Done

**Total Items**: ~35 atomic tasks

---

**Next Steps**:

1. Review this breakdown for completeness
2. Create GitHub Project items from this document
3. Begin execution with Week 1, Monday tasks
4. Update task status as work progresses
5. Adjust estimates based on actual time spent
