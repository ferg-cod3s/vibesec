# VibeSec Programmatic API

**Complete guide for using VibeSec programmatically in TypeScript/JavaScript applications**

## Table of Contents

1. [Installation](#installation)
2. [Core Scanner API](#core-scanner-api)
3. [Custom Reporters](#custom-reporters)
4. [Performance Monitoring](#performance-monitoring)
5. [Advanced Usage](#advanced-usage)
6. [TypeScript Definitions](#typescript-definitions)
7. [Examples](#examples)

---

## Installation

```bash
# NPM
npm install vibesec

# Bun (recommended)
bun add vibesec

# Yarn
yarn add vibesec
```

---

## Core Scanner API

### Basic Usage

```typescript
import { Scanner } from 'vibesec';

const scanner = new Scanner({
  path: './src',
  parallel: true,
});

const result = await scanner.scan();
console.log(`Found ${result.summary.total} issues`);
```

### Scanner Constructor

```typescript
class Scanner {
  constructor(options: ScanOptions);
}

interface ScanOptions {
  path: string; // Directory or file to scan
  exclude?: string[]; // Glob patterns to exclude
  include?: string[]; // Glob patterns to include
  severity?: Severity; // Minimum severity level
  format?: 'text' | 'json' | 'sarif';
  output?: string; // Output file path
  rulesPath?: string; // Custom rules directory
  parallel?: boolean; // Enable parallel scanning (default: true)
  maxFileSize?: number; // Max file size in bytes (default: 1MB)
  quiet?: boolean; // Suppress progress output
}
```

### Scanner Methods

#### `scan(): Promise<ScanResult>`

Executes the security scan and returns findings.

```typescript
const scanner = new Scanner({ path: './src' });
const result = await scanner.scan();

console.log(`Scanned ${result.scan.filesScanned} files`);
console.log(`Duration: ${result.scan.duration}s`);
console.log(`Found ${result.summary.total} issues`);
```

**Returns:** `ScanResult`

```typescript
interface ScanResult {
  version: string;
  scan: ScanMetadata;
  summary: ScanSummary;
  findings: Finding[];
}
```

---

## ScanResult Structure

### Complete Type Definition

```typescript
interface ScanResult {
  version: string; // VibeSec version
  scan: ScanMetadata; // Scan execution metadata
  summary: ScanSummary; // Finding statistics
  findings: Finding[]; // Array of all findings
}

interface ScanMetadata {
  path: string; // Scanned path
  filesScanned: number; // Number of files scanned
  duration: number; // Scan duration in seconds
  timestamp: string; // ISO 8601 timestamp
  version: string; // VibeSec version
}

interface ScanSummary {
  total: number; // Total findings
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

interface Finding {
  id: string; // Unique finding ID
  rule: string; // Rule ID that triggered
  severity: Severity; // critical|high|medium|low
  category: Category; // secrets|injection|auth|etc
  title: string; // Short title
  description: string; // Detailed description
  location: Location; // File and line number
  snippet: string; // Code snippet
  fix: FixRecommendation; // How to fix
  metadata: FindingMetadata; // CWE, OWASP, confidence
}
```

---

## Custom Reporters

VibeSec allows you to create custom output formats by implementing the `Reporter` interface.

### Reporter Interface

```typescript
interface Reporter {
  name: string;
  format(result: ScanResult, options?: ReporterOptions): Promise<string>;
}

interface ReporterOptions {
  color?: boolean; // Enable color output
  verbose?: boolean; // Verbose output
  [key: string]: unknown; // Custom options
}
```

### Creating a Custom Reporter

```typescript
import { Reporter, ScanResult, ReporterOptions } from 'vibesec';

export class MyCustomReporter implements Reporter {
  name = 'my-custom';

  async format(result: ScanResult, options?: ReporterOptions): Promise<string> {
    const lines: string[] = [];

    lines.push(`# Security Report for ${result.scan.path}`);
    lines.push(`Generated: ${result.scan.timestamp}`);
    lines.push('');

    // Add summary
    lines.push(`## Summary`);
    lines.push(`- Total Issues: ${result.summary.total}`);
    lines.push(`- Critical: ${result.summary.bySeverity.critical}`);
    lines.push(`- High: ${result.summary.bySeverity.high}`);
    lines.push('');

    // Add findings
    lines.push(`## Findings`);
    for (const finding of result.findings) {
      lines.push(`### ${finding.title}`);
      lines.push(`**Severity:** ${finding.severity}`);
      lines.push(`**Location:** ${finding.location.file}:${finding.location.line}`);
      lines.push('');
      lines.push(finding.description);
      lines.push('');
      lines.push('**Fix:**');
      lines.push(finding.fix.recommendation);
      lines.push('');
    }

    return lines.join('\n');
  }
}
```

### Using Custom Reporters

```typescript
import { Scanner } from 'vibesec';
import { MyCustomReporter } from './my-reporter';
import * as fs from 'fs';

const scanner = new Scanner({ path: './src' });
const result = await scanner.scan();

const reporter = new MyCustomReporter();
const output = await reporter.format(result, { verbose: true });

// Write to file
await fs.promises.writeFile('custom-report.md', output, 'utf8');
console.log('Report generated: custom-report.md');
```

### Built-in Reporters

VibeSec includes several built-in reporters:

```typescript
import {
  TextReporter,
  JSONReporter,
  PlainLanguageReporter,
  StakeholderReporter,
} from 'vibesec/reporters';

const scanner = new Scanner({ path: './src' });
const result = await scanner.scan();

// Text reporter (default)
const text = await new TextReporter().format(result);

// JSON reporter
const json = await new JSONReporter().format(result);

// Plain language reporter (for non-technical users)
const plain = await new PlainLanguageReporter().format(result);

// Stakeholder reporter (executive summary)
const stakeholder = await new StakeholderReporter().format(result);
```

---

## Performance Monitoring

Track performance metrics during scanning using the built-in performance utilities.

### PerformanceBenchmark

```typescript
import { PerformanceBenchmark } from 'vibesec/lib/performance/benchmark';
import { Scanner } from 'vibesec';

const benchmark = new PerformanceBenchmark();

// Start timing
benchmark.start();

// Run scanner
const scanner = new Scanner({ path: './src' });
const result = await scanner.scan();

// Stop and get metrics
const metrics = benchmark.stop('My Scan', result.scan.filesScanned);

console.log(`Duration: ${PerformanceBenchmark.formatDuration(metrics.duration)}`);
console.log(`Throughput: ${metrics.filesPerSecond.toFixed(2)} files/sec`);
console.log(`Memory Used: ${PerformanceBenchmark.formatMemory(metrics.memoryUsed)}`);

// Check if meets performance targets (<2min for 10K files)
const meetsTarget = PerformanceBenchmark.meetsTarget(metrics);
console.log(`Performance Target: ${meetsTarget ? '✅ PASS' : '❌ FAIL'}`);
```

### MemoryProfiler

```typescript
import { MemoryProfiler } from 'vibesec/lib/performance/memory-profiler';
import { Scanner } from 'vibesec';

const profiler = new MemoryProfiler();

// Start profiling (snapshot every 50ms)
profiler.start(50);

// Run scanner
const scanner = new Scanner({ path: './src' });
const result = await scanner.scan();

// Stop and get profile
const profile = profiler.stop();

console.log(`Peak Heap: ${MemoryProfiler.formatMemory(profile.peakHeapUsed)}`);
console.log(`Peak RSS: ${MemoryProfiler.formatMemory(profile.peakRSS)}`);
console.log(`Memory Growth: ${MemoryProfiler.formatMemory(profile.memoryGrowth)}`);

// Check for memory leaks
const leak = MemoryProfiler.detectLeak(profile);
if (leak.detected) {
  console.warn(`⚠️  Memory leak detected: ${MemoryProfiler.formatMemory(leak.growthRate)}/sec`);
}

// Check if meets target (<500MB)
const meetsTarget = MemoryProfiler.meetsTarget(profile);
console.log(`Memory Target: ${meetsTarget ? '✅ PASS' : '❌ FAIL'}`);
```

---

## Advanced Usage

### Custom Rules

Load custom detection rules from a directory:

```typescript
const scanner = new Scanner({
  path: './src',
  rulesPath: './my-rules', // Custom rules directory
});

const result = await scanner.scan();
```

#### Custom Rule Format (YAML)

```yaml
# my-rules/my-custom-rule.yaml
id: my-custom-check
name: My Custom Security Check
description: Detects custom security patterns
severity: high
category: custom
enabled: true
languages:
  - javascript
  - typescript
patterns:
  - regex: myInsecureFunction\(
    flags: g
fix:
  template: Use secureFunction() instead
  references:
    - https://docs.example.com/secure-function
metadata:
  cwe: CWE-123
  tags:
    - custom
    - security
```

### Filtering Results

```typescript
const scanner = new Scanner({ path: './src' });
const result = await scanner.scan();

// Filter by severity
const criticalFindings = result.findings.filter((f) => f.severity === 'critical');
console.log(`Critical issues: ${criticalFindings.length}`);

// Filter by category
const secretsFindings = result.findings.filter((f) => f.category === 'secrets');
console.log(`Secret leaks: ${secretsFindings.length}`);

// Filter by confidence
const highConfidence = result.findings.filter((f) => f.metadata.confidence > 0.8);
console.log(`High confidence findings: ${highConfidence.length}`);

// Filter by file pattern
const apiFindings = result.findings.filter((f) => f.location.file.includes('/api/'));
console.log(`API issues: ${apiFindings.length}`);
```

### Aggregating Results

```typescript
import { Scanner } from 'vibesec';

async function scanMultipleProjects(projects: string[]) {
  const allFindings: Finding[] = [];
  const stats = {
    totalFiles: 0,
    totalFindings: 0,
    totalDuration: 0,
  };

  for (const project of projects) {
    console.log(`Scanning ${project}...`);

    const scanner = new Scanner({ path: project, quiet: true });
    const result = await scanner.scan();

    allFindings.push(...result.findings);
    stats.totalFiles += result.scan.filesScanned;
    stats.totalFindings += result.summary.total;
    stats.totalDuration += result.scan.duration;
  }

  console.log(`\nAggregated Results:`);
  console.log(`  Projects Scanned: ${projects.length}`);
  console.log(`  Total Files: ${stats.totalFiles}`);
  console.log(`  Total Findings: ${stats.totalFindings}`);
  console.log(`  Total Duration: ${stats.totalDuration.toFixed(2)}s`);

  return allFindings;
}

const findings = await scanMultipleProjects(['./project-a', './project-b', './project-c']);
```

### Error Handling

```typescript
import { Scanner } from 'vibesec';

try {
  const scanner = new Scanner({ path: './src' });
  const result = await scanner.scan();

  // Check if scan completed successfully
  if (result.summary.total === 0) {
    console.log('✅ No issues found!');
  } else {
    console.warn(`⚠️  Found ${result.summary.total} issues`);
  }
} catch (error) {
  if (error.code === 'ENOENT') {
    console.error('❌ Path not found');
  } else if (error.code === 'EACCES') {
    console.error('❌ Permission denied');
  } else {
    console.error('❌ Scan failed:', error.message);
  }
  process.exit(1);
}
```

---

## TypeScript Definitions

### Core Types

```typescript
// Severity enum
enum Severity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

// Category enum
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

// Location interface
interface Location {
  file: string;
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
}

// Fix recommendation interface
interface FixRecommendation {
  recommendation: string;
  before: string;
  after: string;
  references: string[];
}

// Finding metadata interface
interface FindingMetadata {
  cwe?: string;
  owasp?: string;
  confidence: number; // 0.0 to 1.0
  [key: string]: unknown;
}

// Complete finding interface
interface Finding {
  id: string;
  rule: string;
  severity: Severity;
  category: Category;
  title: string;
  description: string;
  location: Location;
  snippet: string;
  fix: FixRecommendation;
  metadata: FindingMetadata;
}
```

### Importing Types

```typescript
import type {
  Scanner,
  ScanResult,
  ScanOptions,
  Finding,
  Severity,
  Category,
  Location,
} from 'vibesec';

// Use in function signatures
function processScanResult(result: ScanResult): void {
  const criticalFindings = result.findings.filter((f: Finding) => f.severity === Severity.CRITICAL);
  // ...
}
```

---

## Examples

### Example 1: Basic CI/CD Integration

```typescript
// scripts/security-scan.ts
import { Scanner } from 'vibesec';

async function ciScan() {
  const scanner = new Scanner({
    path: process.cwd(),
    exclude: ['node_modules/**', 'dist/**', '*.test.ts'],
    parallel: true,
    quiet: true,
  });

  try {
    const result = await scanner.scan();

    // Check for critical/high severity issues
    const blockers = result.findings.filter(
      (f) => f.severity === 'critical' || f.severity === 'high'
    );

    if (blockers.length > 0) {
      console.error(`❌ Found ${blockers.length} critical/high severity issues`);
      blockers.forEach((f) => {
        console.error(`  - ${f.title} (${f.location.file}:${f.location.line})`);
      });
      process.exit(1);
    }

    console.log(`✅ Security scan passed (${result.summary.total} low/medium issues)`);
  } catch (error) {
    console.error('❌ Security scan failed:', error);
    process.exit(1);
  }
}

ciScan();
```

### Example 2: Custom Slack Reporter

```typescript
// reporters/slack-reporter.ts
import { Reporter, ScanResult } from 'vibesec';
import fetch from 'node-fetch';

export class SlackReporter implements Reporter {
  name = 'slack';

  constructor(private webhookUrl: string) {}

  async format(result: ScanResult): Promise<string> {
    const color =
      result.summary.bySeverity.critical > 0
        ? 'danger'
        : result.summary.bySeverity.high > 0
          ? 'warning'
          : 'good';

    const payload = {
      attachments: [
        {
          color,
          title: '🔒 VibeSec Security Scan Results',
          fields: [
            {
              title: 'Project',
              value: result.scan.path,
              short: true,
            },
            {
              title: 'Total Issues',
              value: result.summary.total.toString(),
              short: true,
            },
            {
              title: 'Critical',
              value: result.summary.bySeverity.critical.toString(),
              short: true,
            },
            {
              title: 'High',
              value: result.summary.bySeverity.high.toString(),
              short: true,
            },
            {
              title: 'Files Scanned',
              value: result.scan.filesScanned.toString(),
              short: true,
            },
            {
              title: 'Duration',
              value: `${result.scan.duration.toFixed(2)}s`,
              short: true,
            },
          ],
          footer: 'VibeSec',
          ts: Math.floor(Date.parse(result.scan.timestamp) / 1000),
        },
      ],
    };

    const response = await fetch(this.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Slack notification failed: ${response.statusText}`);
    }

    return 'Slack notification sent';
  }
}

// Usage
import { Scanner } from 'vibesec';
import { SlackReporter } from './reporters/slack-reporter';

const scanner = new Scanner({ path: './src' });
const result = await scanner.scan();

const slackReporter = new SlackReporter(process.env.SLACK_WEBHOOK_URL);
await slackReporter.format(result);
```

### Example 3: Periodic Monitoring

```typescript
// scripts/monitor.ts
import { Scanner } from 'vibesec';
import * as fs from 'fs/promises';

interface HistoricalData {
  timestamp: string;
  totalFindings: number;
  bySeverity: { critical: number; high: number; medium: number; low: number };
}

async function monitor() {
  const scanner = new Scanner({ path: './src', quiet: true });
  const result = await scanner.scan();

  // Load historical data
  let history: HistoricalData[] = [];
  try {
    const data = await fs.readFile('security-history.json', 'utf8');
    history = JSON.parse(data);
  } catch {
    // File doesn't exist yet
  }

  // Add current scan
  history.push({
    timestamp: result.scan.timestamp,
    totalFindings: result.summary.total,
    bySeverity: result.summary.bySeverity,
  });

  // Save updated history
  await fs.writeFile('security-history.json', JSON.stringify(history, null, 2));

  // Check for trends
  if (history.length >= 2) {
    const prev = history[history.length - 2];
    const curr = history[history.length - 1];

    if (curr.totalFindings > prev.totalFindings) {
      console.warn(`⚠️  Security issues increased: ${prev.totalFindings} → ${curr.totalFindings}`);
    } else if (curr.totalFindings < prev.totalFindings) {
      console.log(`✅ Security issues decreased: ${prev.totalFindings} → ${curr.totalFindings}`);
    }
  }
}

// Run every 24 hours
setInterval(monitor, 24 * 60 * 60 * 1000);
monitor(); // Run immediately
```

---

## API Reference Summary

### Classes

- `Scanner` - Main scanning engine
- `PerformanceBenchmark` - Performance tracking
- `MemoryProfiler` - Memory profiling
- Built-in reporters: `TextReporter`, `JSONReporter`, `PlainLanguageReporter`, `StakeholderReporter`

### Interfaces

- `ScanOptions` - Scanner configuration
- `ScanResult` - Scan output
- `Finding` - Individual security issue
- `Reporter` - Custom reporter interface

### Enums

- `Severity` - critical|high|medium|low
- `Category` - secrets|injection|auth|etc

---

## Related Documentation

- [CLI Documentation](./API.md) - Command-line interface
- [Architecture](./ARCHITECTURE.md) - System design
- [Performance Benchmarks](./PERFORMANCE_BENCHMARKS.md) - Performance testing
- [Quick Start](./QUICK_START.md) - Getting started guide

---

**Last Updated:** 2025-10-15
**Version:** 0.1.0
**Status:** Production Ready
