/**
 * Memory Profiler for VibeSec
 *
 * Tracks memory usage during scanning operations and detects memory leaks.
 * Target: <500MB memory usage for typical operations
 */

export interface MemorySnapshot {
  timestamp: Date;
  heapUsed: number;
  heapTotal: number;
  external: number;
  arrayBuffers: number;
  rss: number; // Resident Set Size
}

export interface MemoryProfile {
  snapshots: MemorySnapshot[];
  peakHeapUsed: number;
  peakRSS: number;
  avgHeapUsed: number;
  memoryGrowth: number; // bytes
  duration: number; // ms
}

export interface MemoryLeak {
  detected: boolean;
  growthRate: number; // bytes per second
  totalGrowth: number; // bytes
  threshold: number; // bytes per second
}

export class MemoryProfiler {
  private snapshots: MemorySnapshot[] = [];
  private startTime: number = 0;
  private intervalId?: NodeJS.Timeout;

  /**
   * Start profiling memory usage
   * @param intervalMs - How often to take snapshots (default: 100ms)
   */
  start(intervalMs: number = 100): void {
    this.snapshots = [];
    this.startTime = Date.now();

    // Take initial snapshot
    this.takeSnapshot();

    // Start periodic snapshots
    this.intervalId = setInterval(() => {
      this.takeSnapshot();
    }, intervalMs);
  }

  /**
   * Stop profiling and return results
   */
  stop(): MemoryProfile {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }

    // Take final snapshot
    this.takeSnapshot();

    const duration = Date.now() - this.startTime;
    const heapUsedValues = this.snapshots.map((s) => s.heapUsed);
    const rssValues = this.snapshots.map((s) => s.rss);

    const peakHeapUsed = Math.max(...heapUsedValues);
    const peakRSS = Math.max(...rssValues);
    const avgHeapUsed = heapUsedValues.reduce((a, b) => a + b, 0) / heapUsedValues.length;

    const memoryGrowth =
      this.snapshots.length > 1
        ? this.snapshots[this.snapshots.length - 1].heapUsed - this.snapshots[0].heapUsed
        : 0;

    return {
      snapshots: this.snapshots,
      peakHeapUsed,
      peakRSS,
      avgHeapUsed,
      memoryGrowth,
      duration,
    };
  }

  /**
   * Take a memory snapshot
   */
  private takeSnapshot(): void {
    const mem = process.memoryUsage();
    this.snapshots.push({
      timestamp: new Date(),
      heapUsed: mem.heapUsed,
      heapTotal: mem.heapTotal,
      external: mem.external,
      arrayBuffers: mem.arrayBuffers,
      rss: mem.rss,
    });
  }

  /**
   * Detect potential memory leak
   */
  static detectLeak(
    profile: MemoryProfile,
    thresholdBytesPerSecond: number = 1024 * 1024 // 1MB/s default
  ): MemoryLeak {
    const durationSeconds = profile.duration / 1000;
    const growthRate = durationSeconds > 0 ? profile.memoryGrowth / durationSeconds : 0;

    return {
      detected: growthRate > thresholdBytesPerSecond,
      growthRate,
      totalGrowth: profile.memoryGrowth,
      threshold: thresholdBytesPerSecond,
    };
  }

  /**
   * Check if memory usage is within target (<500MB)
   */
  static meetsTarget(profile: MemoryProfile): boolean {
    const targetBytes = 500 * 1024 * 1024; // 500MB
    return profile.peakHeapUsed < targetBytes;
  }

  /**
   * Format memory value for display
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
   * Generate memory usage report
   */
  static generateReport(profile: MemoryProfile): string {
    const leak = MemoryProfiler.detectLeak(profile);
    const meetsTarget = MemoryProfiler.meetsTarget(profile);

    const lines: string[] = [
      '=== Memory Profile Report ===',
      '',
      `Duration: ${profile.duration.toFixed(0)}ms`,
      `Snapshots: ${profile.snapshots.length}`,
      '',
      'Memory Usage:',
      `  Peak Heap: ${MemoryProfiler.formatMemory(profile.peakHeapUsed)}`,
      `  Peak RSS: ${MemoryProfiler.formatMemory(profile.peakRSS)}`,
      `  Avg Heap: ${MemoryProfiler.formatMemory(profile.avgHeapUsed)}`,
      `  Growth: ${MemoryProfiler.formatMemory(profile.memoryGrowth)}`,
      '',
      `Target (<500MB): ${meetsTarget ? '✅ PASS' : '❌ FAIL'}`,
      '',
      'Memory Leak Detection:',
      `  Status: ${leak.detected ? '⚠️  DETECTED' : '✅ None detected'}`,
      `  Growth Rate: ${MemoryProfiler.formatMemory(leak.growthRate)}/s`,
      `  Threshold: ${MemoryProfiler.formatMemory(leak.threshold)}/s`,
    ];

    return lines.join('\n');
  }

  /**
   * Force garbage collection (if available)
   */
  static forceGC(): void {
    if (global.gc) {
      global.gc();
    }
  }

  /**
   * Get current memory usage
   */
  static getCurrentUsage(): MemorySnapshot {
    const mem = process.memoryUsage();
    return {
      timestamp: new Date(),
      heapUsed: mem.heapUsed,
      heapTotal: mem.heapTotal,
      external: mem.external,
      arrayBuffers: mem.arrayBuffers,
      rss: mem.rss,
    };
  }
}
