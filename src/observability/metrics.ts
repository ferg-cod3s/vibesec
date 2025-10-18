/**
 * Metrics collection and reporting for observability
 */

export interface Metric {
  name: string;
  value: number;
  unit: 'ms' | 'count' | 'bytes' | 'percent';
  tags?: Record<string, string>;
  timestamp: number;
}

export interface ScanMetrics {
  totalFiles: number;
  filesScanned: number;
  filesSkipped: number;
  cacheHits: number;
  cacheMisses: number;
  totalFindings: number;
  findingsBySeverity: Record<string, number>;
  scanDuration: number;
  avgFileParseTime: number;
  peakMemoryUsage: number;
  errors: number;
}

export class MetricsCollector {
  private static instance: MetricsCollector;
  private metrics: Metric[] = [];
  private scanMetrics: Partial<ScanMetrics> = {};

  private constructor() {}

  static getInstance(): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector();
    }
    return MetricsCollector.instance;
  }

  /**
   * Record a metric
   */
  record(name: string, value: number, unit: Metric['unit'], tags?: Record<string, string>): void {
    this.metrics.push({
      name,
      value,
      unit,
      tags,
      timestamp: Date.now(),
    });
  }

  /**
   * Increment a counter
   */
  increment(name: string, value = 1, tags?: Record<string, string>): void {
    this.record(name, value, 'count', tags);
  }

  /**
   * Record timing in milliseconds
   */
  timing(name: string, durationMs: number, tags?: Record<string, string>): void {
    this.record(name, durationMs, 'ms', tags);
  }

  /**
   * Record memory usage in bytes
   */
  memory(name: string, bytes: number, tags?: Record<string, string>): void {
    this.record(name, bytes, 'bytes', tags);
  }

  /**
   * Update scan metrics
   */
  updateScanMetrics(updates: Partial<ScanMetrics>): void {
    this.scanMetrics = { ...this.scanMetrics, ...updates };
  }

  /**
   * Get current scan metrics
   */
  getScanMetrics(): ScanMetrics {
    return {
      totalFiles: this.scanMetrics.totalFiles || 0,
      filesScanned: this.scanMetrics.filesScanned || 0,
      filesSkipped: this.scanMetrics.filesSkipped || 0,
      cacheHits: this.scanMetrics.cacheHits || 0,
      cacheMisses: this.scanMetrics.cacheMisses || 0,
      totalFindings: this.scanMetrics.totalFindings || 0,
      findingsBySeverity: this.scanMetrics.findingsBySeverity || {},
      scanDuration: this.scanMetrics.scanDuration || 0,
      avgFileParseTime: this.scanMetrics.avgFileParseTime || 0,
      peakMemoryUsage: this.scanMetrics.peakMemoryUsage || 0,
      errors: this.scanMetrics.errors || 0,
    };
  }

  /**
   * Get metrics summary
   */
  getSummary(): {
    totalMetrics: number;
    metricsByType: Record<string, number>;
    recentMetrics: Metric[];
  } {
    const metricsByType: Record<string, number> = {};
    for (const metric of this.metrics) {
      metricsByType[metric.name] = (metricsByType[metric.name] || 0) + 1;
    }

    return {
      totalMetrics: this.metrics.length,
      metricsByType,
      recentMetrics: this.metrics.slice(-10),
    };
  }

  /**
   * Export metrics as JSON
   */
  export(): string {
    return JSON.stringify(
      {
        scanMetrics: this.getScanMetrics(),
        allMetrics: this.metrics,
        summary: this.getSummary(),
      },
      null,
      2
    );
  }

  /**
   * Export in Prometheus format
   */
  exportPrometheus(): string {
    const lines: string[] = [];

    // Scan metrics
    const scanMetrics = this.getScanMetrics();
    lines.push(`# HELP vibesec_files_total Total files discovered`);
    lines.push(`# TYPE vibesec_files_total gauge`);
    lines.push(`vibesec_files_total ${scanMetrics.totalFiles}`);

    lines.push(`# HELP vibesec_files_scanned Files scanned`);
    lines.push(`# TYPE vibesec_files_scanned counter`);
    lines.push(`vibesec_files_scanned ${scanMetrics.filesScanned}`);

    lines.push(`# HELP vibesec_cache_hits Cache hits`);
    lines.push(`# TYPE vibesec_cache_hits counter`);
    lines.push(`vibesec_cache_hits ${scanMetrics.cacheHits}`);

    lines.push(`# HELP vibesec_findings_total Total security findings`);
    lines.push(`# TYPE vibesec_findings_total gauge`);
    lines.push(`vibesec_findings_total ${scanMetrics.totalFindings}`);

    lines.push(`# HELP vibesec_scan_duration_seconds Scan duration in seconds`);
    lines.push(`# TYPE vibesec_scan_duration_seconds gauge`);
    lines.push(`vibesec_scan_duration_seconds ${scanMetrics.scanDuration / 1000}`);

    lines.push(`# HELP vibesec_memory_bytes Peak memory usage in bytes`);
    lines.push(`# TYPE vibesec_memory_bytes gauge`);
    lines.push(`vibesec_memory_bytes ${scanMetrics.peakMemoryUsage}`);

    // Findings by severity
    for (const [severity, count] of Object.entries(scanMetrics.findingsBySeverity)) {
      lines.push(`vibesec_findings{severity="${severity}"} ${count}`);
    }

    return lines.join('\n');
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.metrics = [];
    this.scanMetrics = {};
  }
}

// Singleton instance
export const metrics = MetricsCollector.getInstance();
