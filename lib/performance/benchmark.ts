/**
 * Performance Benchmarking System for VibeSec
 *
 * Provides automated performance testing, regression detection, and memory profiling.
 * Target: <2min for 10K files
 */

export interface BenchmarkResult {
  name: string;
  duration: number; // milliseconds
  memoryUsed: number; // bytes
  filesScanned: number;
  filesPerSecond: number;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface BenchmarkSummary {
  totalDuration: number;
  totalMemory: number;
  avgFileProcessingTime: number;
  filesPerSecond: number;
  peakMemory: number;
  results: BenchmarkResult[];
}

export interface RegressionResult {
  isRegression: boolean;
  metric: string;
  current: number;
  baseline: number;
  percentChange: number;
  threshold: number;
}

export class PerformanceBenchmark {
  private startTime: number = 0;
  private startMemory: number = 0;
  private results: BenchmarkResult[] = [];

  /**
   * Start timing a benchmark
   */
  start(): void {
    this.startTime = performance.now();
    this.startMemory = process.memoryUsage().heapUsed;
  }

  /**
   * Stop timing and record result
   */
  stop(name: string, filesScanned: number, metadata?: Record<string, unknown>): BenchmarkResult {
    const duration = performance.now() - this.startTime;
    const memoryUsed = process.memoryUsage().heapUsed - this.startMemory;
    const filesPerSecond = filesScanned / (duration / 1000);

    const result: BenchmarkResult = {
      name,
      duration,
      memoryUsed,
      filesScanned,
      filesPerSecond,
      timestamp: new Date(),
      metadata,
    };

    this.results.push(result);
    return result;
  }

  /**
   * Get all recorded results
   */
  getResults(): BenchmarkResult[] {
    return this.results;
  }

  /**
   * Get summary statistics
   */
  getSummary(): BenchmarkSummary {
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);
    const totalMemory = this.results.reduce((sum, r) => sum + r.memoryUsed, 0);
    const totalFiles = this.results.reduce((sum, r) => sum + r.filesScanned, 0);
    const avgFileProcessingTime = totalFiles > 0 ? totalDuration / totalFiles : 0;
    const filesPerSecond = totalFiles / (totalDuration / 1000);
    const peakMemory = Math.max(...this.results.map((r) => r.memoryUsed), 0);

    return {
      totalDuration,
      totalMemory,
      avgFileProcessingTime,
      filesPerSecond,
      peakMemory,
      results: this.results,
    };
  }

  /**
   * Clear all results
   */
  clear(): void {
    this.results = [];
  }

  /**
   * Format duration for display
   */
  static formatDuration(ms: number): string {
    if (ms < 1000) {
      return `${ms.toFixed(2)}ms`;
    } else if (ms < 60000) {
      return `${(ms / 1000).toFixed(2)}s`;
    } else {
      const minutes = Math.floor(ms / 60000);
      const seconds = ((ms % 60000) / 1000).toFixed(2);
      return `${minutes}m ${seconds}s`;
    }
  }

  /**
   * Format memory for display
   */
  static formatMemory(bytes: number): string {
    const kb = bytes / 1024;
    const mb = kb / 1024;
    const gb = mb / 1024;

    if (gb >= 1) {
      return `${gb.toFixed(2)} GB`;
    } else if (mb >= 1) {
      return `${mb.toFixed(2)} MB`;
    } else {
      return `${kb.toFixed(2)} KB`;
    }
  }

  /**
   * Detect performance regression
   */
  static detectRegression(
    current: BenchmarkResult,
    baseline: BenchmarkResult,
    thresholdPercent: number = 10
  ): RegressionResult[] {
    const regressions: RegressionResult[] = [];

    // Check duration regression
    const durationChange = ((current.duration - baseline.duration) / baseline.duration) * 100;
    if (durationChange > thresholdPercent) {
      regressions.push({
        isRegression: true,
        metric: 'duration',
        current: current.duration,
        baseline: baseline.duration,
        percentChange: durationChange,
        threshold: thresholdPercent,
      });
    }

    // Check memory regression
    const memoryChange = ((current.memoryUsed - baseline.memoryUsed) / baseline.memoryUsed) * 100;
    if (memoryChange > thresholdPercent) {
      regressions.push({
        isRegression: true,
        metric: 'memory',
        current: current.memoryUsed,
        baseline: baseline.memoryUsed,
        percentChange: memoryChange,
        threshold: thresholdPercent,
      });
    }

    // Check throughput regression (files per second)
    const throughputChange =
      ((baseline.filesPerSecond - current.filesPerSecond) / baseline.filesPerSecond) * 100;
    if (throughputChange > thresholdPercent) {
      regressions.push({
        isRegression: true,
        metric: 'throughput',
        current: current.filesPerSecond,
        baseline: baseline.filesPerSecond,
        percentChange: -throughputChange, // negative because lower is worse
        threshold: thresholdPercent,
      });
    }

    return regressions;
  }

  /**
   * Check if performance meets target (< 2min for 10K files)
   */
  static meetsTarget(result: BenchmarkResult): boolean {
    // const filesPerMinute = result.filesPerSecond * 60;
    const projectedTimeFor10K = (10000 / result.filesPerSecond) * 1000; // ms

    // Target: 10K files in < 2 minutes (120,000 ms)
    return projectedTimeFor10K < 120000;
  }

  /**
   * Get projected time for 10K files
   */
  static getProjectedTime10K(result: BenchmarkResult): number {
    return (10000 / result.filesPerSecond) * 1000; // ms
  }
}
