# VibeSec Performance Benchmarks

**Target:** <2 minutes for 10,000 files | <500MB memory usage

## Overview

VibeSec includes a comprehensive performance benchmarking system to ensure the scanner meets production-ready performance targets. The benchmark suite tests various scenarios from small projects to enterprise-scale codebases.

## Running Benchmarks

### Via NPM Script (Recommended)

```bash
npm run benchmark
```

This runs all benchmark scenarios with memory profiling enabled (`--expose-gc` flag for accurate GC measurements).

### Via CLI

```bash
# Run all benchmarks
vibesec benchmark

# Save report to file
vibesec benchmark -o benchmark-report.txt

# Verbose output
vibesec benchmark --verbose
```

### Directly

```bash
bun --expose-gc run scripts/run-benchmarks.ts
```

## Benchmark Scenarios

The suite includes 6 comprehensive scenarios:

### 1. Small Project (50 files)

- **Purpose:** Typical small application
- **Files:** 50 JavaScript files
- **Use Case:** Small tools, prototypes, micro-services

### 2. Medium Project (500 files)

- **Purpose:** Medium-sized application
- **Files:** 500 mixed files
- **Use Case:** Standard web applications, APIs

### 3. Large Project (2,000 files)

- **Purpose:** Enterprise-scale application
- **Files:** 2,000 files (extrapolated to 10K target)
- **Use Case:** Large monoliths, enterprise systems
- **Note:** Testing 2K files for practical test duration; performance extrapolates to 10K

### 4. Vulnerable Code (100 files)

- **Purpose:** Files with multiple security issues
- **Files:** 100 files with various vulnerabilities
- **Use Case:** Stress test detection engine with high finding density

### 5. Clean Code (100 files)

- **Purpose:** Files with no security issues
- **Files:** 100 secure files
- **Use Case:** Measure baseline scanning overhead

### 6. Mixed Languages (200 files)

- **Purpose:** Multi-language project
- **Files:** 100 JavaScript + 100 Python
- **Use Case:** Polyglot applications

## Performance Targets

### Speed Targets

| Metric           | Target        | Rationale                             |
| ---------------- | ------------- | ------------------------------------- |
| 10K files        | <2 minutes    | Enterprise CI/CD pipeline requirement |
| Per-file average | <12ms         | Derived from 10K file target          |
| Throughput       | >83 files/sec | Minimum for 2-minute target           |

### Memory Targets

| Metric          | Target   | Rationale                   |
| --------------- | -------- | --------------------------- |
| Peak heap usage | <500MB   | CI/CD container constraints |
| Memory growth   | <1MB/sec | Leak detection threshold    |
| RSS             | <750MB   | Total process memory limit  |

## Metrics Collected

### Performance Metrics

- **Duration:** Total scan time in milliseconds
- **Files Scanned:** Number of files processed
- **Throughput:** Files per second
- **Average File Time:** Mean processing time per file
- **10K Projection:** Estimated time for 10,000 files

### Memory Metrics

- **Peak Heap Used:** Maximum heap memory used
- **Peak RSS:** Maximum resident set size
- **Average Heap:** Mean heap usage during scan
- **Memory Growth:** Net heap growth (leak detection)
- **Growth Rate:** Bytes per second growth rate

## Regression Detection

The benchmark system automatically detects performance regressions by comparing results against baseline measurements:

### Regression Thresholds (Default: 10%)

- **Duration:** Alert if scan time increases >10%
- **Memory:** Alert if memory usage increases >10%
- **Throughput:** Alert if throughput decreases >10%

### Example Regression Report

```
⚠️  Performance Regression Detected:

Metric: duration
  Baseline: 1,245ms
  Current:  1,492ms
  Change:   +19.8% (threshold: 10%)

Metric: memory
  Baseline: 128.45 MB
  Current:  158.23 MB
  Change:   +23.2% (threshold: 10%)
```

## Memory Leak Detection

The memory profiler continuously monitors heap usage and detects potential memory leaks:

```typescript
// Leak detection threshold: 1MB/sec growth rate
const leak = MemoryProfiler.detectLeak(profile);

if (leak.detected) {
  console.warn(`Memory leak: ${leak.growthRate} bytes/sec`);
}
```

### Leak Indicators

- Sustained memory growth >1MB/sec
- No garbage collection effectiveness
- Linear heap growth pattern

## Output Formats

### Console Output (Default)

```
🚀 VibeSec Performance Benchmark Suite

Running 6 benchmark scenarios...

⏱️  Small Project (50 files)
   Speed: ✅ | Memory: ✅
   Duration: 142.50ms
   Files/sec: 350.88
   Peak Memory: 45.23 MB

⏱️  Medium Project (500 files)
   Speed: ✅ | Memory: ✅
   Duration: 1.42s
   Files/sec: 352.11
   Peak Memory: 128.45 MB

...
```

### Text Report (--output)

```
═══════════════════════════════════════════════════════════════
                VibeSec Performance Benchmark Report
═══════════════════════════════════════════════════════════════

Overall Status: ✅ ALL TESTS PASSED

─────────────────────────────────────────────────────────────────
Scenario: Small Project (50 files)

Performance:
  Duration: 142.50ms
  Files Scanned: 50
  Throughput: 350.88 files/sec
  Avg File Time: 2.85ms
  10K Files Projected: 28.50s ✅

Memory:
  Peak Heap: 45.23 MB
  Peak RSS: 128.45 MB
  Avg Heap: 38.67 MB
  Growth: 2.34 MB

Targets:
  Speed (<2min for 10K): ✅ PASS
  Memory (<500MB): ✅ PASS

...
```

### JSON Report (Auto-generated)

```json
[
  {
    "scenario": "Small Project (50 files)",
    "benchmarkResult": {
      "name": "Small Project (50 files)",
      "duration": 142.5,
      "memoryUsed": 47456256,
      "filesScanned": 50,
      "filesPerSecond": 350.88,
      "timestamp": "2025-10-15T10:30:00.000Z",
      "metadata": {
        "findingsCount": 0
      }
    },
    "memoryProfile": {
      "snapshots": [...],
      "peakHeapUsed": 47456256,
      "peakRSS": 134742016,
      "avgHeapUsed": 40567890,
      "memoryGrowth": 2453504,
      "duration": 142.5
    },
    "meetsTargets": {
      "speed": true,
      "memory": true
    },
    "timestamp": "2025-10-15T10:30:00.000Z"
  }
]
```

## Programmatic Usage

### Running Benchmarks in Code

```typescript
import { BenchmarkSuite } from './tests/performance/benchmark-suite';

const suite = new BenchmarkSuite();
const reports = await suite.runAll();

// Check if all passed
const allPass = reports.every((r) => r.meetsTargets.speed && r.meetsTargets.memory);

// Generate report
const reportText = BenchmarkSuite.generateReport(reports);
console.log(reportText);

// Cleanup
await suite.cleanupTempDirs();
```

### Individual Benchmark

```typescript
import { PerformanceBenchmark } from './lib/performance/benchmark';
import { MemoryProfiler } from './lib/performance/memory-profiler';

// Start profiling
const benchmark = new PerformanceBenchmark();
const profiler = new MemoryProfiler();

profiler.start(50); // snapshot every 50ms
benchmark.start();

// ... run your code ...

// Stop and get results
const result = benchmark.stop('My Test', 100);
const memProfile = profiler.stop();

// Check targets
const speedOK = PerformanceBenchmark.meetsTarget(result);
const memOK = MemoryProfiler.meetsTarget(memProfile);
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Performance Benchmarks

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  benchmark:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Bun
        uses: oven-sh/setup-bun@v1

      - name: Install Dependencies
        run: bun install

      - name: Run Benchmarks
        run: npm run benchmark

      - name: Upload Results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: benchmark-results
          path: benchmark-results/
```

### Baseline Comparison

```bash
# Save baseline
npm run benchmark
mv benchmark-results/latest.json benchmarks/baseline.json

# Compare against baseline
npm run benchmark
node scripts/compare-benchmarks.js \
  benchmarks/baseline.json \
  benchmark-results/latest.json
```

## Interpreting Results

### Speed Results

**Pass Criteria:**

- 10K file projection <2 minutes
- Consistent throughput across scenarios
- No significant regression vs baseline

**Red Flags:**

- Throughput <50 files/sec
- Large variance between runs
- Linear slowdown with file count

### Memory Results

**Pass Criteria:**

- Peak heap <500MB
- Stable memory growth
- Effective garbage collection

**Red Flags:**

- Continuous memory growth
- Peak heap >500MB
- Memory not released after scan

## Troubleshooting

### Benchmark Failures

**Symptom:** Benchmarks fail to meet targets

**Possible Causes:**

1. **Slow hardware:** Run on dedicated CI/CD infrastructure
2. **Background processes:** Close other applications
3. **Code regression:** Review recent changes
4. **Test data issues:** Verify test file generation

### Memory Leaks

**Symptom:** Memory growth rate >1MB/sec

**Debugging Steps:**

1. Enable memory profiling: `--expose-gc`
2. Run single scenario in isolation
3. Use Node.js inspector: `--inspect`
4. Check for unclosed file handles
5. Review stream processing code

### Inconsistent Results

**Symptom:** High variance between runs

**Possible Causes:**

1. Insufficient warm-up
2. Disk I/O contention
3. Node.js JIT compilation
4. Garbage collection timing

**Solutions:**

- Run multiple iterations
- Use SSD storage
- Increase warm-up period
- Force GC between runs

## Best Practices

### When to Run Benchmarks

1. **Before major releases:** Validate performance targets
2. **After performance changes:** Detect regressions
3. **Weekly CI runs:** Track trends
4. **After dependency updates:** Verify no degradation

### Benchmark Hygiene

```bash
# Clean environment
rm -rf node_modules
npm install

# Restart terminal
# Close other applications

# Run benchmarks
npm run benchmark
```

### Interpreting Trends

Track these metrics over time:

- Throughput trend (should be stable/improving)
- Memory usage trend (should be stable)
- P95 latency (should be stable)
- File size distribution effects

## Extending Benchmarks

### Adding New Scenarios

```typescript
// tests/performance/benchmark-suite.ts

private createCustomScenario(): BenchmarkScenario {
  return {
    name: 'Custom Scenario',
    description: 'My custom test',
    fileCount: 100,
    setup: async () => {
      const tempDir = this.createTempDir('custom');
      // Generate test files
      return tempDir;
    },
    cleanup: async () => {
      // Cleanup handled automatically
    },
  };
}
```

### Custom Metrics

```typescript
const metadata = {
  findingsCount: scanResult.findings.length,
  rulesEvaluated: scanResult.metadata.rulesCount,
  avgFindingsPerFile: scanResult.findings.length / fileCount,
};

const result = benchmark.stop('Test', fileCount, metadata);
```

## Performance Optimization Tips

Based on benchmark results, common optimizations:

1. **Parallel Scanning:** Use `parallel: true` (default)
2. **Rule Caching:** Rules are loaded once and reused
3. **File Filtering:** Exclude irrelevant files early
4. **Memory Pooling:** Reuse buffers for file reading
5. **Stream Processing:** Don't load entire files into memory
6. **Incremental Scans:** Only scan changed files (future)

## Related Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - System design
- [TECH_STACK.md](./TECH_STACK.md) - Technology choices
- [QUICK_START.md](./QUICK_START.md) - Getting started guide
- [API.md](./API.md) - API documentation

## Questions?

- **GitHub Issues:** https://github.com/ferg-cod3s/vibesec/issues
- **Discussions:** https://github.com/ferg-cod3s/vibesec/discussions
- **Email:** performance@vibesec.dev

---

**Last Updated:** 2025-10-15
**Status:** ✅ Production Ready
**Target Compliance:** 100% (all scenarios pass)
