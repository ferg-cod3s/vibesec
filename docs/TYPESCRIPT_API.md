# VibeSec TypeScript API Reference

**Complete TypeScript type definitions and interfaces**

---

## Table of Contents

1. [Exports](#exports)
2. [Classes](#classes)
3. [Interfaces](#interfaces)
4. [Enums](#enums)
5. [Type Aliases](#type-aliases)
6. [Module Organization](#module-organization)

---

## Exports

### Main Module (`vibesec`)

```typescript
import {
  // Classes
  Scanner,

  // Types
  ScanOptions,
  ScanResult,
  ScanMetadata,
  ScanSummary,
  Finding,
  Location,
  FixRecommendation,
  FindingMetadata,
  Rule,
  Pattern,

  // Enums
  Severity,
  Category,
} from 'vibesec';
```

### Reporters Module (`vibesec/reporters`)

```typescript
import {
  Reporter,
  TextReporter,
  JSONReporter,
  PlainLanguageReporter,
  StakeholderReporter,
  ReporterOptions,
} from 'vibesec/reporters';
```

### Performance Module (`vibesec/lib/performance`)

```typescript
import {
  PerformanceBenchmark,
  BenchmarkResult,
  BenchmarkSummary,
  RegressionResult,
  MemoryProfiler,
  MemorySnapshot,
  MemoryProfile,
  MemoryLeak,
} from 'vibesec/lib/performance';
```

---

## Classes

### `Scanner`

Main scanning engine for security analysis.

```typescript
class Scanner {
  constructor(options: ScanOptions);
  scan(): Promise<ScanResult>;
}
```

#### Constructor

```typescript
constructor(options: ScanOptions)
```

**Parameters:**
- `options` - Configuration options for the scanner

**Example:**
```typescript
const scanner = new Scanner({
  path: './src',
  parallel: true,
  exclude: ['node_modules/**'],
});
```

#### Methods

##### `scan()`

Executes the security scan and returns findings.

```typescript
scan(): Promise<ScanResult>
```

**Returns:** `Promise<ScanResult>`

**Example:**
```typescript
const result = await scanner.scan();
console.log(`Found ${result.summary.total} issues`);
```

---

### `PerformanceBenchmark`

Performance tracking and benchmarking utility.

```typescript
class PerformanceBenchmark {
  start(): void;
  stop(name: string, filesScanned: number, metadata?: Record<string, unknown>): BenchmarkResult;
  getResults(): BenchmarkResult[];
  getSummary(): BenchmarkSummary;
  clear(): void;

  // Static methods
  static formatDuration(ms: number): string;
  static formatMemory(bytes: number): string;
  static detectRegression(current: BenchmarkResult, baseline: BenchmarkResult, thresholdPercent?: number): RegressionResult[];
  static meetsTarget(result: BenchmarkResult): boolean;
  static getProjectedTime10K(result: BenchmarkResult): number;
}
```

#### Methods

##### `start()`

Begins timing a benchmark operation.

```typescript
start(): void
```

**Example:**
```typescript
const benchmark = new PerformanceBenchmark();
benchmark.start();
// ... perform operation ...
```

##### `stop()`

Stops timing and records the result.

```typescript
stop(name: string, filesScanned: number, metadata?: Record<string, unknown>): BenchmarkResult
```

**Parameters:**
- `name` - Name of the benchmark
- `filesScanned` - Number of files processed
- `metadata` - Optional custom metadata

**Returns:** `BenchmarkResult`

**Example:**
```typescript
const result = benchmark.stop('My Scan', 100, {
  findingsCount: 5,
});
```

##### `formatDuration()` (static)

Formats duration for human-readable display.

```typescript
static formatDuration(ms: number): string
```

**Parameters:**
- `ms` - Duration in milliseconds

**Returns:** Formatted string (e.g., "1.23s", "2m 15.50s")

##### `formatMemory()` (static)

Formats memory size for human-readable display.

```typescript
static formatMemory(bytes: number): string
```

**Parameters:**
- `bytes` - Memory size in bytes

**Returns:** Formatted string (e.g., "45.23 MB", "1.23 GB")

---

### `MemoryProfiler`

Memory usage tracking and leak detection.

```typescript
class MemoryProfiler {
  start(intervalMs?: number): void;
  stop(): MemoryProfile;

  // Static methods
  static detectLeak(profile: MemoryProfile, thresholdBytesPerSecond?: number): MemoryLeak;
  static meetsTarget(profile: MemoryProfile): boolean;
  static formatMemory(bytes: number): string;
  static generateReport(profile: MemoryProfile): string;
  static forceGC(): void;
  static getCurrentUsage(): MemorySnapshot;
}
```

#### Methods

##### `start()`

Begins memory profiling with periodic snapshots.

```typescript
start(intervalMs?: number): void
```

**Parameters:**
- `intervalMs` - Snapshot interval in milliseconds (default: 100ms)

**Example:**
```typescript
const profiler = new MemoryProfiler();
profiler.start(50); // snapshot every 50ms
```

##### `stop()`

Stops profiling and returns the memory profile.

```typescript
stop(): MemoryProfile
```

**Returns:** `MemoryProfile`

**Example:**
```typescript
const profile = profiler.stop();
console.log(`Peak Heap: ${MemoryProfiler.formatMemory(profile.peakHeapUsed)}`);
```

##### `detectLeak()` (static)

Detects potential memory leaks from a memory profile.

```typescript
static detectLeak(profile: MemoryProfile, thresholdBytesPerSecond?: number): MemoryLeak
```

**Parameters:**
- `profile` - Memory profile to analyze
- `thresholdBytesPerSecond` - Leak detection threshold (default: 1MB/s)

**Returns:** `MemoryLeak`

---

## Interfaces

### `ScanOptions`

Configuration options for the Scanner.

```typescript
interface ScanOptions {
  path: string;              // Directory or file to scan (required)
  exclude?: string[];        // Glob patterns to exclude
  include?: string[];        // Glob patterns to include
  severity?: Severity;       // Minimum severity level
  format?: 'text' | 'json' | 'sarif';
  output?: string;           // Output file path
  rulesPath?: string;        // Custom rules directory
  parallel?: boolean;        // Enable parallel scanning (default: true)
  maxFileSize?: number;      // Max file size in bytes (default: 1MB)
  quiet?: boolean;           // Suppress progress messages
}
```

**Example:**
```typescript
const options: ScanOptions = {
  path: './src',
  exclude: ['node_modules/**', '*.test.ts'],
  severity: Severity.HIGH,
  parallel: true,
  quiet: false,
};
```

---

### `ScanResult`

Complete scan execution result.

```typescript
interface ScanResult {
  version: string;           // VibeSec version
  scan: ScanMetadata;        // Scan execution metadata
  summary: ScanSummary;      // Finding statistics
  findings: Finding[];       // Array of all findings
}
```

**Example:**
```typescript
const result: ScanResult = await scanner.scan();

console.log(`Version: ${result.version}`);
console.log(`Files: ${result.scan.filesScanned}`);
console.log(`Issues: ${result.summary.total}`);

for (const finding of result.findings) {
  console.log(`${finding.severity}: ${finding.title}`);
}
```

---

### `ScanMetadata`

Metadata about scan execution.

```typescript
interface ScanMetadata {
  path: string;              // Scanned path
  filesScanned: number;      // Number of files scanned
  duration: number;          // Scan duration in seconds
  timestamp: string;         // ISO 8601 timestamp
  version: string;           // VibeSec version
}
```

---

### `ScanSummary`

Statistical summary of findings.

```typescript
interface ScanSummary {
  total: number;             // Total findings
  bySeverity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  byCategory: {
    [key in Category]?: number;
  };
}
```

**Example:**
```typescript
const summary: ScanSummary = result.summary;

console.log(`Total: ${summary.total}`);
console.log(`Critical: ${summary.bySeverity.critical}`);
console.log(`Secrets: ${summary.byCategory[Category.SECRETS] || 0}`);
```

---

### `Finding`

Individual security finding.

```typescript
interface Finding {
  id: string;                   // Unique finding ID
  rule: string;                 // Rule ID that triggered
  severity: Severity;           // critical|high|medium|low
  category: Category;           // secrets|injection|auth|etc
  title: string;                // Short title
  description: string;          // Detailed description
  location: Location;           // File and line number
  snippet: string;              // Code snippet
  fix: FixRecommendation;       // How to fix
  metadata: FindingMetadata;    // CWE, OWASP, confidence
}
```

**Example:**
```typescript
const finding: Finding = result.findings[0];

console.log(`${finding.severity}: ${finding.title}`);
console.log(`Location: ${finding.location.file}:${finding.location.line}`);
console.log(`Fix: ${finding.fix.recommendation}`);
```

---

### `Location`

Source code location of a finding.

```typescript
interface Location {
  file: string;              // File path
  line: number;              // Line number
  column: number;            // Column number
  endLine?: number;          // End line (optional)
  endColumn?: number;        // End column (optional)
}
```

---

### `FixRecommendation`

Recommendation for fixing a finding.

```typescript
interface FixRecommendation {
  recommendation: string;    // Human-readable fix description
  before: string;            // Code before fix
  after: string;             // Code after fix
  references: string[];      // Reference URLs
}
```

**Example:**
```typescript
const fix: FixRecommendation = finding.fix;

console.log(`Recommendation: ${fix.recommendation}`);
console.log(`Before:\n${fix.before}`);
console.log(`After:\n${fix.after}`);

for (const ref of fix.references) {
  console.log(`Reference: ${ref}`);
}
```

---

### `FindingMetadata`

Additional metadata about a finding.

```typescript
interface FindingMetadata {
  cwe?: string;              // CWE ID (e.g., "CWE-79")
  owasp?: string;            // OWASP category
  confidence: number;        // 0.0 to 1.0
  [key: string]: unknown;    // Additional custom metadata
}
```

**Example:**
```typescript
const metadata: FindingMetadata = finding.metadata;

console.log(`CWE: ${metadata.cwe}`);
console.log(`Confidence: ${(metadata.confidence * 100).toFixed(1)}%`);
```

---

### `Rule`

Detection rule definition.

```typescript
interface Rule {
  id: string;                    // Unique rule ID
  name: string;                  // Rule name
  description: string;           // Rule description
  severity: Severity;            // Severity level
  category: Category;            // Category
  patterns: Pattern[];           // Matching patterns
  languages: string[];           // Supported languages
  enabled: boolean;              // Rule enabled flag
  fix?: {
    template: string;
    references: string[];
  };
  metadata?: {
    cwe?: string;
    owasp?: string;
    tags?: string[];
  };
}
```

---

### `Pattern`

Pattern matching configuration for a rule.

```typescript
interface Pattern {
  regex: string;             // Regular expression pattern
  flags?: string;            // Regex flags (e.g., "gi")
  multiline?: boolean;       // Multiline matching
}
```

---

### `Reporter`

Interface for custom output formatters.

```typescript
interface Reporter {
  name: string;
  format(result: ScanResult, options?: ReporterOptions): Promise<string>;
}
```

**Example:**
```typescript
class MyReporter implements Reporter {
  name = 'my-reporter';

  async format(result: ScanResult, options?: ReporterOptions): Promise<string> {
    return `Found ${result.summary.total} issues`;
  }
}
```

---

### `ReporterOptions`

Options for reporter formatting.

```typescript
interface ReporterOptions {
  color?: boolean;           // Enable color output
  verbose?: boolean;         // Verbose output
  [key: string]: unknown;    // Custom options
}
```

---

### `BenchmarkResult`

Result of a performance benchmark.

```typescript
interface BenchmarkResult {
  name: string;              // Benchmark name
  duration: number;          // Duration in milliseconds
  memoryUsed: number;        // Memory used in bytes
  filesScanned: number;      // Number of files scanned
  filesPerSecond: number;    // Throughput
  timestamp: Date;           // When the benchmark ran
  metadata?: Record<string, unknown>;  // Custom metadata
}
```

---

### `MemoryProfile`

Memory usage profile over time.

```typescript
interface MemoryProfile {
  snapshots: MemorySnapshot[];  // Array of memory snapshots
  peakHeapUsed: number;         // Peak heap usage in bytes
  peakRSS: number;              // Peak RSS in bytes
  avgHeapUsed: number;          // Average heap usage in bytes
  memoryGrowth: number;         // Net memory growth in bytes
  duration: number;             // Profile duration in milliseconds
}
```

---

### `MemorySnapshot`

Single point-in-time memory measurement.

```typescript
interface MemorySnapshot {
  timestamp: Date;           // When the snapshot was taken
  heapUsed: number;          // Heap used in bytes
  heapTotal: number;         // Total heap in bytes
  external: number;          // External memory in bytes
  arrayBuffers: number;      // Array buffer memory in bytes
  rss: number;               // Resident set size in bytes
}
```

---

### `MemoryLeak`

Memory leak detection result.

```typescript
interface MemoryLeak {
  detected: boolean;         // Whether leak was detected
  growthRate: number;        // Bytes per second growth rate
  totalGrowth: number;       // Total bytes grown
  threshold: number;         // Detection threshold (bytes/sec)
}
```

---

## Enums

### `Severity`

Severity levels for security findings.

```typescript
enum Severity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}
```

**Usage:**
```typescript
import { Severity } from 'vibesec';

const options: ScanOptions = {
  path: './src',
  severity: Severity.HIGH,  // Only report high and critical
};

// Check severity
if (finding.severity === Severity.CRITICAL) {
  console.error('Critical issue found!');
}
```

---

### `Category`

Category of security issue.

```typescript
enum Category {
  SECRETS = 'secrets',
  INJECTION = 'injection',
  AUTH = 'auth',
  INCOMPLETE = 'incomplete',
  AI_SPECIFIC = 'ai-specific',
  DEPENDENCIES = 'dependencies',
  WEB_SECURITY = 'web-security',
  CRYPTOGRAPHY = 'cryptography',
  CUSTOM = 'custom',
}
```

**Usage:**
```typescript
import { Category } from 'vibesec';

// Filter by category
const secretLeaks = result.findings.filter(
  f => f.category === Category.SECRETS
);

// Count by category
const injectionCount = result.summary.byCategory[Category.INJECTION] || 0;
```

---

## Type Aliases

### Severity String Union

```typescript
type SeverityLevel = 'critical' | 'high' | 'medium' | 'low';
```

### Category String Union

```typescript
type CategoryType =
  | 'secrets'
  | 'injection'
  | 'auth'
  | 'incomplete'
  | 'ai-specific'
  | 'dependencies'
  | 'web-security'
  | 'cryptography'
  | 'custom';
```

---

## Module Organization

### Core Module Structure

```
vibesec/
├── index.ts                    # Main exports
├── scanner/
│   ├── core/
│   │   ├── engine.ts           # Scanner class
│   │   ├── types.ts            # Core types
│   │   └── rule-loader.ts      # Rule loading
│   └── analyzers/
│       ├── regex.ts            # Regex analyzer
│       └── dependency.ts       # Dependency analyzer
├── reporters/
│   ├── index.ts                # Reporter exports
│   ├── text.ts                 # TextReporter
│   ├── json.ts                 # JSONReporter
│   ├── plain-language.ts       # PlainLanguageReporter
│   └── stakeholder.ts          # StakeholderReporter
└── lib/
    ├── performance/
    │   ├── benchmark.ts        # PerformanceBenchmark
    │   └── memory-profiler.ts  # MemoryProfiler
    └── utils/
        └── security-score.ts   # Security scoring
```

### Import Paths

```typescript
// Core exports
import { Scanner, ScanResult, Severity, Category } from 'vibesec';

// Reporters
import { TextReporter, JSONReporter } from 'vibesec/reporters';

// Performance utilities
import { PerformanceBenchmark, MemoryProfiler } from 'vibesec/lib/performance';

// Utility functions
import { calculateSecurityScore } from 'vibesec/lib/utils';
```

---

## Type Guards

### Type narrowing helpers

```typescript
// Check if finding is critical
function isCritical(finding: Finding): boolean {
  return finding.severity === Severity.CRITICAL;
}

// Check if finding is in category
function isCategory(finding: Finding, category: Category): boolean {
  return finding.category === category;
}

// Type guard for ScanResult
function isScanResult(obj: unknown): obj is ScanResult {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'version' in obj &&
    'scan' in obj &&
    'summary' in obj &&
    'findings' in obj
  );
}
```

---

## Generic Utilities

### Working with Findings

```typescript
// Sort findings by severity
function sortBySeverity(findings: Finding[]): Finding[] {
  const severityOrder = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };

  return findings.sort((a, b) =>
    severityOrder[a.severity] - severityOrder[b.severity]
  );
}

// Group findings by category
function groupByCategory(findings: Finding[]): Record<string, Finding[]> {
  const grouped: Record<string, Finding[]> = {};

  for (const finding of findings) {
    if (!grouped[finding.category]) {
      grouped[finding.category] = [];
    }
    grouped[finding.category].push(finding);
  }

  return grouped;
}

// Filter high confidence findings
function highConfidence(findings: Finding[], threshold = 0.8): Finding[] {
  return findings.filter(f => f.metadata.confidence >= threshold);
}
```

---

## Related Documentation

- [Programmatic API](./PROGRAMMATIC_API.md) - Usage examples
- [Custom Reporters](./CUSTOM_REPORTERS.md) - Reporter development
- [Architecture](./ARCHITECTURE.md) - System design
- [Quick Start](./QUICK_START.md) - Getting started

---

**Last Updated:** 2025-10-15
**Version:** 0.1.0
**Status:** Production Ready
