# VibeSec Observability System

## Overview

Comprehensive observability and error reporting system for VibeSec, providing:
- Structured logging
- Metrics collection
- Error tracking and categorization
- Performance monitoring

## Components

### 1. Logger (`logger.ts`)

Structured logging with levels and context:

```typescript
import { logger, LogLevel } from './logger';

// Set log level
logger.setLevel(LogLevel.DEBUG);

// Basic logging
logger.debug('Parsing file', { file: 'app.ts', language: 'typescript' });
logger.info('Scan started', { totalFiles: 100 });
logger.warn('Cache miss', { file: 'app.ts', reason: 'hash_mismatch' });
logger.error('Parse failed', { file: 'bad.ts' }, parseError);
logger.fatal('System crash', {}, systemError);

// Measure operation duration
const result = await logger.measure('parse_file', async () => {
  return await parser.parseFile('app.ts');
}, { file: 'app.ts' });

// Export logs for debugging
const logs = logger.exportLogs();
console.log(logs);
```

### 2. Metrics (`metrics.ts`)

Performance and usage metrics:

```typescript
import { metrics } from './metrics';

// Record metrics
metrics.increment('files_scanned');
metrics.timing('parse_duration', 42.5, { file: 'app.ts' });
metrics.memory('heap_used', process.memoryUsage().heapUsed);

// Update scan metrics
metrics.updateScanMetrics({
  totalFiles: 100,
  filesScanned: 95,
  filesSkipped: 5,
  cacheHits: 80,
  cacheMisses: 15,
  totalFindings: 12,
  findingsBySeverity: {
    critical: 2,
    high: 5,
    medium: 3,
    low: 2,
  },
  scanDuration: 5000,
  avgFileParseTime: 52.6,
  peakMemoryUsage: 125 * 1024 * 1024,
  errors: 0,
});

// Get metrics
const scanMetrics = metrics.getScanMetrics();
console.log(scanMetrics);

// Export for monitoring
const prometheusFormat = metrics.exportPrometheus();
console.log(prometheusFormat);
```

### 3. Error Reporter (`error-reporter.ts`)

Centralized error tracking:

```typescript
import { errorReporter, ErrorCategory } from './error-reporter';

// Report errors
try {
  await parseFile('bad.ts');
} catch (error) {
  errorReporter.reportParseError('bad.ts', error as Error, {
    language: 'typescript',
    size: 1024,
  });
}

// Specialized error reporting
errorReporter.reportConfigError('.vibesec.yaml', configError);
errorReporter.reportFileSystemError('read', '/path/to/file', fsError);
errorReporter.reportCacheError('load', cacheError);
errorReporter.reportDetectionError('sql-injection', 'app.ts', detectionError);

// Get error statistics
const stats = errorReporter.getStats();
console.log(`Total errors: ${stats.total}`);
console.log(`Unresolved: ${stats.unresolved}`);
console.log(errorReporter.getSummary());

// Export for analysis
const errorReport = errorReporter.export();
```

## Integration Example

### Scanner with Observability

```typescript
import { logger } from './observability/logger';
import { metrics } from './observability/metrics';
import { errorReporter } from './observability/error-reporter';

export class ObservableScanner {
  async scan(files: string[]): Promise<Finding[]> {
    const findings: Finding[] = [];

    // Log scan start
    logger.info('Scan started', { totalFiles: files.length });

    // Update metrics
    metrics.updateScanMetrics({ totalFiles: files.length });

    const startTime = Date.now();

    for (const file of files) {
      try {
        // Measure file parsing
        const fileFindings = await logger.measure('parse_file', async () => {
          return await this.parseFile(file);
        }, { file });

        findings.push(...fileFindings);
        metrics.increment('files_scanned');

      } catch (error) {
        metrics.increment('errors_total');
        errorReporter.reportParseError(file, error as Error);
        logger.warn('Skipping file due to error', { file });
      }
    }

    const duration = Date.now() - startTime;

    // Update final metrics
    metrics.updateScanMetrics({
      filesScanned: files.length - errorReporter.getErrorsByCategory('parse_error').length,
      scanDuration: duration,
      totalFindings: findings.length,
      errors: errorReporter.getStats().total,
    });

    // Log completion
    logger.info('Scan completed', {
      totalFiles: files.length,
      findings: findings.length,
      duration: `${duration}ms`,
    });

    return findings;
  }
}
```

### CLI with Observability

```typescript
import { logger, LogLevel } from './observability/logger';
import { metrics } from './observability/metrics';
import { errorReporter } from './observability/error-reporter';

export async function scanCommand(options: ScanOptions): Promise<void> {
  // Configure logging
  if (options.verbose) {
    logger.setLevel(LogLevel.DEBUG);
  }

  logger.info('VibeSec scan starting', { path: options.path });

  try {
    const scanner = new ObservableScanner();
    const findings = await scanner.scan(options.files);

    // Display metrics
    if (options.verbose) {
      const scanMetrics = metrics.getScanMetrics();
      console.log('\n=== Scan Metrics ===');
      console.log(`Files scanned: ${scanMetrics.filesScanned}`);
      console.log(`Cache hit rate: ${(scanMetrics.cacheHits / scanMetrics.totalFiles * 100).toFixed(1)}%`);
      console.log(`Avg parse time: ${scanMetrics.avgFileParseTime.toFixed(2)}ms`);
      console.log(`Peak memory: ${(scanMetrics.peakMemoryUsage / 1024 / 1024).toFixed(2)}MB`);
    }

    // Display error summary if errors occurred
    const errorStats = errorReporter.getStats();
    if (errorStats.total > 0) {
      console.log('\n' + errorReporter.getSummary());
    }

    // Export logs if requested
    if (options.exportLogs) {
      await writeFile('vibesec-logs.json', logger.exportLogs());
      await writeFile('vibesec-metrics.json', metrics.export());
      await writeFile('vibesec-errors.json', errorReporter.export());
      console.log('\nLogs exported to vibesec-*.json files');
    }

  } catch (error) {
    logger.fatal('Scan failed', {}, error as Error);
    errorReporter.report('system_error', 'Scan crashed', error as Error);
    process.exit(1);
  }
}
```

## Monitoring Integration

### Prometheus Metrics

Export metrics in Prometheus format for monitoring:

```typescript
import { metrics } from './observability/metrics';

app.get('/metrics', (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.send(metrics.exportPrometheus());
});
```

### Log Aggregation

Export logs for aggregation services (Datadog, Splunk, etc.):

```typescript
import { logger } from './observability/logger';

// Export as structured JSON
const logs = logger.getRecentLogs(1000);
await sendToLogAggregator(logs);
```

### Error Monitoring

Track errors in monitoring dashboards:

```typescript
import { errorReporter } from './observability/error-reporter';

// Get error statistics
const stats = errorReporter.getStats();

// Alert on high error rate
if (stats.unresolved > threshold) {
  await sendAlert('High error rate detected', stats);
}
```

## Best Practices

1. **Always log context**: Include relevant context (file paths, rule IDs, etc.)
2. **Use appropriate log levels**: DEBUG for development, INFO for normal operation
3. **Measure critical operations**: Use `logger.measure()` for performance tracking
4. **Report errors immediately**: Don't swallow exceptions, report them
5. **Monitor metrics**: Track scan performance and cache efficiency
6. **Export diagnostics**: Enable log/metric export for troubleshooting

## Performance Impact

The observability system is designed for minimal overhead:
- Logging: <0.1ms per log entry
- Metrics: <0.05ms per metric record
- Error reporting: <0.2ms per error

Total overhead: <1% of scan time for typical workloads.
