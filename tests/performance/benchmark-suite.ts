/**
 * Performance Benchmark Suite for VibeSec
 *
 * Comprehensive performance tests for different scenarios:
 * - Small projects (10-100 files)
 * - Medium projects (100-1000 files)
 * - Large projects (1000-10000 files)
 * - Different file types and rule complexity
 */

import * as fs from 'fs';
import * as path from 'path';
import { Scanner } from '../../scanner/core/engine';
import { PerformanceBenchmark, BenchmarkResult } from '../../lib/performance/benchmark';
import { MemoryProfiler, MemoryProfile } from '../../lib/performance/memory-profiler';

export interface BenchmarkScenario {
  name: string;
  description: string;
  fileCount: number;
  setup: () => Promise<string>;
  cleanup: () => Promise<void>;
}

export interface BenchmarkReport {
  scenario: string;
  benchmarkResult: BenchmarkResult;
  memoryProfile: MemoryProfile;
  meetsTargets: {
    speed: boolean;
    memory: boolean;
  };
  timestamp: Date;
}

export class BenchmarkSuite {
  private tempDirs: string[] = [];

  /**
   * Run all benchmark scenarios
   */
  async runAll(): Promise<BenchmarkReport[]> {
    const scenarios = this.getScenarios();
    const reports: BenchmarkReport[] = [];

    console.log(`Running ${scenarios.length} benchmark scenarios...\n`);

    for (const scenario of scenarios) {
      console.log(`⏱️  ${scenario.name}`);
      const report = await this.runScenario(scenario);
      reports.push(report);

      // Log quick summary
      const speedPass = report.meetsTargets.speed ? '✅' : '❌';
      const memPass = report.meetsTargets.memory ? '✅' : '❌';
      console.log(`   Speed: ${speedPass} | Memory: ${memPass}`);
      console.log(
        `   Duration: ${PerformanceBenchmark.formatDuration(report.benchmarkResult.duration)}`
      );
      console.log(`   Files/sec: ${report.benchmarkResult.filesPerSecond.toFixed(2)}`);
      console.log(`   Peak Memory: ${MemoryProfiler.formatMemory(report.memoryProfile.peakHeapUsed)}\n`);
    }

    return reports;
  }

  /**
   * Run a single benchmark scenario
   */
  async runScenario(scenario: BenchmarkScenario): Promise<BenchmarkReport> {
    // Setup test directory
    const testPath = await scenario.setup();

    // Start profiling
    const benchmark = new PerformanceBenchmark();
    const memoryProfiler = new MemoryProfiler();

    // Force GC before starting
    if (global.gc) {
      global.gc();
    }

    memoryProfiler.start(50); // snapshot every 50ms
    benchmark.start();

    // Run scanner
    const scanner = new Scanner({
      path: testPath,
      parallel: true,
    });

    const scanResult = await scanner.scan();

    // Stop profiling
    const benchmarkResult = benchmark.stop(scenario.name, scenario.fileCount, {
      findingsCount: scanResult.findings.length,
    });
    const memoryProfile = memoryProfiler.stop();

    // Cleanup
    await scenario.cleanup();

    // Check if meets targets
    const meetsTargets = {
      speed: PerformanceBenchmark.meetsTarget(benchmarkResult),
      memory: MemoryProfiler.meetsTarget(memoryProfile),
    };

    return {
      scenario: scenario.name,
      benchmarkResult,
      memoryProfile,
      meetsTargets,
      timestamp: new Date(),
    };
  }

  /**
   * Get all benchmark scenarios
   */
  private getScenarios(): BenchmarkScenario[] {
    return [
      this.createSmallProjectScenario(),
      this.createMediumProjectScenario(),
      this.createLargeProjectScenario(),
      this.createVulnerableCodeScenario(),
      this.createCleanCodeScenario(),
      this.createMixedLanguageScenario(),
    ];
  }

  /**
   * Small project scenario (50 files)
   */
  private createSmallProjectScenario(): BenchmarkScenario {
    return {
      name: 'Small Project (50 files)',
      description: 'Typical small application with 50 JavaScript files',
      fileCount: 50,
      setup: async () => {
        const tempDir = this.createTempDir('small-project');
        await this.generateFiles(tempDir, 50, 'small');
        return tempDir;
      },
      cleanup: async () => {
        // Cleanup handled by cleanupTempDirs()
      },
    };
  }

  /**
   * Medium project scenario (500 files)
   */
  private createMediumProjectScenario(): BenchmarkScenario {
    return {
      name: 'Medium Project (500 files)',
      description: 'Medium-sized application with 500 files',
      fileCount: 500,
      setup: async () => {
        const tempDir = this.createTempDir('medium-project');
        await this.generateFiles(tempDir, 500, 'medium');
        return tempDir;
      },
      cleanup: async () => {
        // Cleanup handled by cleanupTempDirs()
      },
    };
  }

  /**
   * Large project scenario (2000 files)
   * Note: Testing 2K files instead of 10K for faster test execution
   * Performance can be extrapolated to 10K
   */
  private createLargeProjectScenario(): BenchmarkScenario {
    return {
      name: 'Large Project (2000 files)',
      description: 'Large enterprise application with 2000 files',
      fileCount: 2000,
      setup: async () => {
        const tempDir = this.createTempDir('large-project');
        await this.generateFiles(tempDir, 2000, 'large');
        return tempDir;
      },
      cleanup: async () => {
        // Cleanup handled by cleanupTempDirs()
      },
    };
  }

  /**
   * Vulnerable code scenario (100 files with issues)
   */
  private createVulnerableCodeScenario(): BenchmarkScenario {
    return {
      name: 'Vulnerable Code (100 files)',
      description: 'Files with multiple security issues',
      fileCount: 100,
      setup: async () => {
        const tempDir = this.createTempDir('vulnerable-code');
        await this.generateFiles(tempDir, 100, 'vulnerable');
        return tempDir;
      },
      cleanup: async () => {
        // Cleanup handled by cleanupTempDirs()
      },
    };
  }

  /**
   * Clean code scenario (100 files no issues)
   */
  private createCleanCodeScenario(): BenchmarkScenario {
    return {
      name: 'Clean Code (100 files)',
      description: 'Files with no security issues',
      fileCount: 100,
      setup: async () => {
        const tempDir = this.createTempDir('clean-code');
        await this.generateFiles(tempDir, 100, 'clean');
        return tempDir;
      },
      cleanup: async () => {
        // Cleanup handled by cleanupTempDirs()
      },
    };
  }

  /**
   * Mixed language scenario
   */
  private createMixedLanguageScenario(): BenchmarkScenario {
    return {
      name: 'Mixed Languages (200 files)',
      description: '100 JS + 100 Python files',
      fileCount: 200,
      setup: async () => {
        const tempDir = this.createTempDir('mixed-lang');
        await this.generateFiles(tempDir, 100, 'small', 'js');
        await this.generateFiles(tempDir, 100, 'small', 'py');
        return tempDir;
      },
      cleanup: async () => {
        // Cleanup handled by cleanupTempDirs()
      },
    };
  }

  /**
   * Generate test files
   */
  private async generateFiles(
    dir: string,
    count: number,
    type: 'small' | 'medium' | 'large' | 'vulnerable' | 'clean',
    lang: 'js' | 'py' = 'js'
  ): Promise<void> {
    const ext = lang === 'js' ? '.js' : '.py';

    for (let i = 0; i < count; i++) {
      const fileName = `file-${i}${ext}`;
      const filePath = path.join(dir, fileName);
      const content = this.generateFileContent(type, lang);

      await fs.promises.writeFile(filePath, content, 'utf8');
    }
  }

  /**
   * Generate file content based on type
   */
  private generateFileContent(
    type: 'small' | 'medium' | 'large' | 'vulnerable' | 'clean',
    lang: 'js' | 'py'
  ): string {
    if (type === 'vulnerable') {
      return lang === 'js' ? this.getVulnerableJSContent() : this.getVulnerablePyContent();
    } else if (type === 'clean') {
      return lang === 'js' ? this.getCleanJSContent() : this.getCleanPyContent();
    } else {
      // Small, medium, large - just vary the file size
      const lines = type === 'small' ? 50 : type === 'medium' ? 100 : 200;
      return lang === 'js'
        ? this.getGenericJSContent(lines)
        : this.getGenericPyContent(lines);
    }
  }

  private getVulnerableJSContent(): string {
    return `// Vulnerable code sample
const apiKey = "FAKE-API-KEY-1234567890abcdefghijk";
const db = require('database');

function getUser(id) {
  // SQL injection vulnerability
  return db.query("SELECT * FROM users WHERE id = " + id);
}

function renderTemplate(data) {
  // XSS vulnerability
  return "<div>" + data.userInput + "</div>";
}
`;
  }

  private getVulnerablePyContent(): string {
    return `# Vulnerable Python code
API_KEY = "fake_stripe_live_1234567890abcdefghijk"

def get_user(id):
    # SQL injection vulnerability
    query = f"SELECT * FROM users WHERE id = {id}"
    return db.execute(query)

def process_file(filename):
    # Path traversal vulnerability
    with open(filename) as f:
        return f.read()
`;
  }

  private getCleanJSContent(): string {
    return `// Clean secure code
const config = require('./config');

function getUser(id) {
  // Parameterized query - secure
  return db.query("SELECT * FROM users WHERE id = ?", [id]);
}

function processData(data) {
  // Input validation
  if (!isValid(data)) {
    throw new Error('Invalid data');
  }
  return transform(data);
}
`;
  }

  private getCleanPyContent(): string {
    return `# Clean Python code
import os

def get_user(id):
    # Parameterized query - secure
    query = "SELECT * FROM users WHERE id = ?"
    return db.execute(query, (id,))

def process_data(data):
    # Input validation
    if not is_valid(data):
        raise ValueError('Invalid data')
    return transform(data)
`;
  }

  private getGenericJSContent(lines: number): string {
    const content: string[] = ['// Generic JavaScript file', ''];
    for (let i = 0; i < lines; i++) {
      content.push(`function func${i}() { return ${i}; }`);
    }
    return content.join('\n');
  }

  private getGenericPyContent(lines: number): string {
    const content: string[] = ['# Generic Python file', ''];
    for (let i = 0; i < lines; i++) {
      content.push(`def func${i}(): return ${i}`);
    }
    return content.join('\n');
  }

  /**
   * Create temporary directory
   */
  private createTempDir(name: string): string {
    const tempDir = path.join(process.cwd(), '.benchmark-temp', name);
    fs.mkdirSync(tempDir, { recursive: true });
    this.tempDirs.push(tempDir);
    return tempDir;
  }

  /**
   * Cleanup all temporary directories
   */
  async cleanupTempDirs(): Promise<void> {
    for (const dir of this.tempDirs) {
      try {
        await fs.promises.rm(dir, { recursive: true, force: true });
      } catch (error) {
        console.warn(`Failed to cleanup ${dir}:`, error);
      }
    }
    this.tempDirs = [];
  }

  /**
   * Generate performance report
   */
  static generateReport(reports: BenchmarkReport[]): string {
    const lines: string[] = [
      '═══════════════════════════════════════════════════════════════',
      '                VibeSec Performance Benchmark Report           ',
      '═══════════════════════════════════════════════════════════════',
      '',
    ];

    // Summary
    const allPass = reports.every((r) => r.meetsTargets.speed && r.meetsTargets.memory);
    lines.push(`Overall Status: ${allPass ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    lines.push('');

    // Individual scenarios
    for (const report of reports) {
      lines.push(`─────────────────────────────────────────────────────────────────`);
      lines.push(`Scenario: ${report.scenario}`);
      lines.push('');

      // Performance metrics
      const result = report.benchmarkResult;
      lines.push('Performance:');
      lines.push(`  Duration: ${PerformanceBenchmark.formatDuration(result.duration)}`);
      lines.push(`  Files Scanned: ${result.filesScanned}`);
      lines.push(`  Throughput: ${result.filesPerSecond.toFixed(2)} files/sec`);
      lines.push(
        `  Avg File Time: ${(result.duration / result.filesScanned).toFixed(2)}ms`
      );

      // 10K projection
      const projected10K = PerformanceBenchmark.getProjectedTime10K(result);
      const speedPass = projected10K < 120000;
      lines.push(
        `  10K Files Projected: ${PerformanceBenchmark.formatDuration(projected10K)} ${speedPass ? '✅' : '❌'}`
      );
      lines.push('');

      // Memory metrics
      const mem = report.memoryProfile;
      lines.push('Memory:');
      lines.push(`  Peak Heap: ${MemoryProfiler.formatMemory(mem.peakHeapUsed)}`);
      lines.push(`  Peak RSS: ${MemoryProfiler.formatMemory(mem.peakRSS)}`);
      lines.push(`  Avg Heap: ${MemoryProfiler.formatMemory(mem.avgHeapUsed)}`);
      lines.push(`  Growth: ${MemoryProfiler.formatMemory(mem.memoryGrowth)}`);

      const memLeak = MemoryProfiler.detectLeak(mem);
      if (memLeak.detected) {
        lines.push(
          `  ⚠️  Memory Leak: ${MemoryProfiler.formatMemory(memLeak.growthRate)}/s`
        );
      }
      lines.push('');

      // Targets
      lines.push('Targets:');
      lines.push(`  Speed (<2min for 10K): ${report.meetsTargets.speed ? '✅ PASS' : '❌ FAIL'}`);
      lines.push(`  Memory (<500MB): ${report.meetsTargets.memory ? '✅ PASS' : '❌ FAIL'}`);
      lines.push('');
    }

    lines.push(`═══════════════════════════════════════════════════════════════`);
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push('');

    return lines.join('\n');
  }
}
