# Priority 2: Integration & Enhancement

**Duration**: Weeks 3-4 (40 hours)
**Status**: Planning → In Progress
**Dependencies**: Priority 1 Complete ✅

---

## Overview

Priority 2 integrates Priority 1 components into the main Scanner engine and enhances detection capabilities with AST-based rules.

---

## Components

### P2.1: Scanner Engine Integration (12 hours)

**Goal**: Integrate AST Parser, Config System, and Incremental Scanner into main engine

**Tasks**:

1. **Refactor Scanner Engine** (`scanner/core/engine.ts`)
   - Load configuration via ConfigLoader
   - Initialize AST parser based on file type
   - Check incremental cache before scanning
   - Use AST for complex pattern matching
   - Save results to cache after scan

2. **Create Analyzer Factory** (`scanner/analyzers/analyzer-factory.ts`)
   - Determine analyzer type (regex vs AST) per rule
   - Route to appropriate analyzer
   - Combine results from multiple analyzers

3. **Update RegexAnalyzer** (`scanner/analyzers/regex.ts`)
   - Add fallback for AST-incompatible files
   - Maintain backward compatibility

**Files Modified**:

- `scanner/core/engine.ts` (major refactor)
- `scanner/core/types.ts` (add AST types)
- `scanner/analyzers/regex.ts` (minor updates)

**Files Created**:

- `scanner/analyzers/analyzer-factory.ts`
- `scanner/analyzers/ast-analyzer.ts`

**Success Criteria**:

- Scanner uses config file when present
- AST parser invoked for supported languages
- Incremental scanning reduces scan time by 80%
- Backward compatible with existing CLI usage

---

### P2.2: CLI Enhancement (8 hours)

**Goal**: Update CLI to support configuration, incremental mode, and new options

**Tasks**:

1. **Add Configuration Options** (`cli/index.ts`)
   - `--config <path>` - Specify config file
   - `--init` - Generate .vibesec.yaml template
   - `--incremental` - Enable incremental scanning
   - `--full` - Disable cache, full scan

2. **Update Scan Command** (`cli/commands/scan.ts`)
   - Load configuration before scan
   - Pass config to Scanner engine
   - Display config source in output
   - Add progress for AST parsing

3. **Create Init Command** (`cli/commands/init.ts`)
   - Interactive wizard for config generation
   - Detect project type (Node.js, Python, Go)
   - Generate .vibesec.yaml with sensible defaults

**Files Modified**:

- `cli/index.ts`
- `cli/commands/scan.ts`

**Files Created**:

- `cli/commands/init.ts`

**Success Criteria**:

- `vibesec --init` generates working config
- `vibesec scan --config .vibesec.yaml` uses config
- `vibesec scan --incremental` uses cache
- Help text documents all new options

---

### P2.3: AST-Based Detection Rules (12 hours)

**Goal**: Add detection rules that leverage AST parsing for higher accuracy

**Tasks**:

1. **Create AST Rule Schema** (`rules/schema-ast.json`)
   - Define AST query patterns
   - Node type matching
   - Parent/child relationships
   - Data flow tracking

2. **Implement AST Detector** (`scanner/analyzers/ast-analyzer.ts`)
   - Parse AST via EnhancedASTParser
   - Execute AST queries from rules
   - Track data flow (assignments → usage)
   - Detect control flow issues

3. **Add AST-Specific Rules** (`rules/default/ast-*.yaml`)
   - `ast-sql-injection.yaml` - Track SQL string construction via AST
   - `ast-command-injection.yaml` - Track exec() calls with user input
   - `ast-xss.yaml` - Track HTML rendering with unescaped data
   - `ast-path-traversal.yaml` - Track file path construction

**Files Created**:

- `rules/schema-ast.json`
- `rules/default/ast-sql-injection.yaml`
- `rules/default/ast-command-injection.yaml`
- `rules/default/ast-xss.yaml`
- `rules/default/ast-path-traversal.yaml`
- `scanner/analyzers/ast-analyzer.ts`

**Success Criteria**:

- AST rules detect issues missed by regex
- Detection accuracy improves from 90% → 95%
- False positive rate remains <5%
- Performance: <1ms per AST query

---

### P2.4: Integration Testing (8 hours)

**Goal**: Comprehensive tests for full pipeline with all Priority 1+2 components

**Tasks**:

1. **Create End-to-End Tests** (`tests/integration/full-pipeline.test.ts`)
   - Test config loading → AST parsing → detection → reporting
   - Test incremental scanning with cache
   - Test CLI with all new options
   - Test performance targets

2. **Create Test Fixtures**
   - Complex vulnerable code requiring AST (SQL injection via variable)
   - .vibesec.yaml samples
   - Mock git repositories for incremental testing

3. **Performance Benchmarks** (`tests/performance/priority2-benchmark.ts`)
   - Measure end-to-end scan time with AST
   - Measure incremental scan speedup
   - Memory profiling with AST

**Files Created**:

- `tests/integration/full-pipeline.test.ts`
- `tests/integration/config-loader.test.ts`
- `tests/integration/incremental-scanner.test.ts`
- `tests/performance/priority2-benchmark.ts`
- `tests/fixtures/complex-vulnerable/` (directory)

**Success Criteria**:

- All integration tests pass
- Performance: <2 min for 10K files
- Incremental: <10s for typical PR (100 files)
- Test coverage remains >80%

---

## Implementation Strategy

### Parallel Execution Plan

Launch 4 specialized subagents in parallel:

1. **Scanner Integration Agent** → P2.1 (Scanner Engine Integration)
2. **CLI Enhancement Agent** → P2.2 (CLI Updates)
3. **AST Rules Agent** → P2.3 (AST Detection Rules)
4. **Testing Agent** → P2.4 (Integration Tests)

### GitHub Project Updates

Create issues for each component:

- Issue: "P2.1 - Scanner Engine Integration"
- Issue: "P2.2 - CLI Enhancement"
- Issue: "P2.3 - AST-Based Detection Rules"
- Issue: "P2.4 - Integration Testing"

Track progress in VibeSec Development project.

---

## Performance Targets

| Metric                       | Current     | After P2  | Status       |
| ---------------------------- | ----------- | --------- | ------------ |
| Detection Accuracy           | 90%         | 95%       | 🎯 Target    |
| False Positive Rate          | 0%          | <5%       | 🎯 Target    |
| Scan Speed (10K files)       | ~7-8s       | <2 min    | ✅ On Track  |
| Incremental Scan (100 files) | N/A         | <10s      | 🎯 Target    |
| AST Parse Time               | 0.76ms/file | <1ms/file | ✅ Validated |
| Memory Usage                 | ~15MB       | <100MB    | ✅ On Track  |

---

## Success Criteria

**Priority 2 Complete When**:

- ✅ All P1 components integrated into main Scanner
- ✅ CLI supports configuration, incremental, and init
- ✅ AST-based rules detect complex vulnerabilities
- ✅ Integration tests pass with >80% coverage
- ✅ Performance targets met (<2 min for 10K files)
- ✅ Documentation updated with new features

---

## Deliverables

1. **Enhanced Scanner Engine**
   - Config-driven
   - AST-powered
   - Incremental-aware

2. **Updated CLI**
   - `--config`, `--init`, `--incremental` options
   - Interactive config generation

3. **AST Detection Rules**
   - 4+ new AST-specific rule files
   - Higher accuracy detection

4. **Integration Tests**
   - Full pipeline coverage
   - Performance benchmarks

5. **Documentation**
   - Updated QUICK_START.md
   - New CONFIGURATION_GUIDE.md
   - Updated API.md

---

## Timeline

- **Hours 1-12**: P2.1 (Scanner Integration) - parallel with P2.2, P2.3
- **Hours 1-8**: P2.2 (CLI Enhancement) - parallel with P2.1, P2.3
- **Hours 1-12**: P2.3 (AST Rules) - parallel with P2.1, P2.2
- **Hours 13-20**: P2.4 (Integration Testing) - after P2.1-P2.3 complete

**Total**: 40 hours (Weeks 3-4)

---

## Risk Mitigation

**Risk**: AST parsing slower than expected

- **Mitigation**: Regex fallback always available, incremental scanning compensates

**Risk**: Integration complexity causes regressions

- **Mitigation**: Comprehensive integration tests, backward compatibility maintained

**Risk**: Configuration complexity confuses users

- **Mitigation**: Interactive `--init` wizard, sensible defaults, clear documentation

---

**Status**: Ready for parallel implementation ✅
