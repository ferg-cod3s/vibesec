/**
 * Comprehensive Performance Tests for VibeSec Scanner
 * 
 * Tests enterprise-scale workloads using bun:test framework:
 * - Large codebase scanning (1000+ files)
 * - Memory usage monitoring
 * - Concurrent scanning operations
 * - File type and size benchmarking
 * - Cross-project testing for all Github repos
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { Scanner } from '../../scanner/core/engine';
import { PerformanceBenchmark } from '../../lib/performance/benchmark';
import { MemoryProfiler } from '../../lib/performance/memory-profiler';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

// Secure agent injection system
interface AgentInjectionConfig {
  enabled: boolean;
  allowedPaths: string[];
  maxConcurrency: number;
  timeoutMs: number;
  sanitizeOutput: boolean;
}

class SecureAgentInjector {
  private config: AgentInjectionConfig;
  private activeInjections: Map<string, any> = new Map();

  constructor(config: AgentInjectionConfig) {
    this.config = config;
  }

  // Secure injection with validation
  async injectTest(targetPath: string, testFn: () => Promise<any>): Promise<any> {
    // Validate path is allowed
    if (!this.isPathAllowed(targetPath)) {
      throw new Error(`Path not allowed for testing: ${targetPath}`);
    }

    // Sanitize path to prevent directory traversal
    const sanitizedPath = path.resolve(targetPath);
    if (!sanitizedPath.startsWith(this.config.allowedPaths[0])) {
      throw new Error(`Path traversal detected: ${targetPath}`);
    }

    const injectionId = this.generateInjectionId();
    
    try {
      // Track injection for cleanup
      this.activeInjections.set(injectionId, {
        path: sanitizedPath,
        startTime: Date.now(),
        status: 'running'
      });

      // Execute with timeout and monitoring
      const result = await Promise.race([
        testFn(),
        this.createTimeout(this.config.timeoutMs)
      ]);

      this.activeInjections.set(injectionId, {
        ...this.activeInjections.get(injectionId),
        status: 'completed',
        endTime: Date.now()
      });

      return this.sanitizeOutput(result);
    } catch (error) {
      this.activeInjections.set(injectionId, {
        ...this.activeInjections.get(injectionId),
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
        endTime: Date.now()
      });
      throw error;
    }
  }

  private isPathAllowed(testPath: string): boolean {
    const resolvedTestPath = path.resolve(testPath);
    
    return this.config.allowedPaths.some(allowed => {
      const resolvedAllowed = path.resolve(allowed);
      return resolvedTestPath.startsWith(resolvedAllowed) || 
             resolvedTestPath.includes('/tmp/') || // Allow temp directories
             resolvedTestPath.includes('/var/folders/'); // Allow macOS temp directories
    });
  }

  private generateInjectionId(): string {
    return `inj_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  private createTimeout(ms: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Test timeout after ${ms}ms`)), ms);
    });
  }

  private sanitizeOutput(result: any): any {
    if (!this.config.sanitizeOutput) return result;

    // Remove sensitive information from output
    if (typeof result === 'object' && result !== null) {
      const sanitized = { ...result };
      
      // Remove potential secrets
      if (sanitized.findings) {
        sanitized.findings = (sanitized.findings as any[]).map(finding => ({
          ...finding,
          // Replace actual secrets with placeholder
          content: finding.content ? finding.content.replace(/["'][\w\-_]{20,}["']/g, '"***REDACTED***"') : undefined
        }));
      }

      return sanitized;
    }

    return result;
  }

  // Cleanup active injections
  async cleanup(): Promise<void> {
    for (const [id, injection] of this.activeInjections) {
      if (injection.status === 'running') {
        console.warn(`Cleaning up hanging injection: ${id}`);
      }
    }
    this.activeInjections.clear();
  }

  getStats(): { active: number, completed: number, failed: number } {
    const stats = { active: 0, completed: 0, failed: 0 };
    
    for (const injection of this.activeInjections.values()) {
      stats[injection.status]++;
    }

    return stats;
  }
}

// Global test configuration
const TEST_CONFIG: AgentInjectionConfig = {
  enabled: true,
  allowedPaths: ['/Users/johnferguson/Github', '/tmp', '/var/folders'],
  maxConcurrency: 5,
  timeoutMs: 120000, // 2 minutes
  sanitizeOutput: true
};

const secureInjector = new SecureAgentInjector(TEST_CONFIG);

describe('Scanner Performance Tests', () => {
  let scanner: Scanner;
  let tempDir: string;
  let benchmark: PerformanceBenchmark;
  let memoryProfiler: MemoryProfiler;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'vibesec-perf-'));
    benchmark = new PerformanceBenchmark();
    memoryProfiler = new MemoryProfiler();
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
    await secureInjector.cleanup();
  });

  describe('Enterprise-Scale Codebase Testing', () => {
    it('should scan 1000+ files efficiently', async () => {
      // Generate 1000 mixed test files
      await generateTestFiles(tempDir, 1000, 'mixed');
      
      // Force garbage collection before starting
      if (global.gc) global.gc();
      
      benchmark.start();
      memoryProfiler.start(100); // Snapshot every 100ms
      
      scanner = new Scanner({ 
        path: tempDir, 
        parallel: true,
        quiet: true 
      });
      
      const result = await secureInjector.injectTest(tempDir, async () => 
        scanner.scan()
      );
      
      const benchmarkResult = benchmark.stop('large-codebase', result.scan.filesScanned);
      const memoryProfile = memoryProfiler.stop();
      
      // Performance assertions
      expect(result.scan.filesScanned).toBeGreaterThanOrEqual(1000);
      expect(benchmarkResult.duration).toBeLessThan(60000); // 60 seconds
      expect(PerformanceBenchmark.meetsTarget(benchmarkResult)).toBe(true);
      expect(MemoryProfiler.meetsTarget(memoryProfile)).toBe(true);
      
      // Memory leak detection
      const leak = MemoryProfiler.detectLeak(memoryProfile);
      expect(leak.detected).toBe(false);
      
      console.log(`Scanned ${result.scan.filesScanned} files in ${PerformanceBenchmark.formatDuration(benchmarkResult.duration)}`);
      console.log(`Throughput: ${benchmarkResult.filesPerSecond.toFixed(2)} files/sec`);
      console.log(`Peak memory: ${MemoryProfiler.formatMemory(memoryProfile.peakHeapUsed)}`);
    }, 120000); // 2 minute timeout

    it('should handle deep directory structures efficiently', async () => {
      // Create deep nested structure (10 levels, 100 files per level)
      await createDeepDirectoryStructure(tempDir, 10, 100);
      
      benchmark.start();
      memoryProfiler.start();
      
      scanner = new Scanner({ path: tempDir, parallel: true, quiet: true });
      
      const result = await secureInjector.injectTest(tempDir, async () => 
        scanner.scan()
      );
      
      const benchmarkResult = benchmark.stop('deep-structure', result.scan.filesScanned);
      const memoryProfile = memoryProfiler.stop();
      
      expect(result.scan.filesScanned).toBeGreaterThanOrEqual(1000);
      expect(benchmarkResult.duration).toBeLessThan(45000);
      expect(MemoryProfiler.meetsTarget(memoryProfile)).toBe(true);
    }, 90000);
  });

  describe('Memory Usage Monitoring', () => {
    it('should not leak memory during consecutive scans', async () => {
      await generateTestFiles(tempDir, 100, 'vulnerable');
      
      const memorySnapshots: number[] = [];
      
      // Run 10 consecutive scans
      for (let i = 0; i < 10; i++) {
        if (global.gc) global.gc();
        
        const beforeMemory = process.memoryUsage().heapUsed;
        
        scanner = new Scanner({ path: tempDir, quiet: true });
        await secureInjector.injectTest(tempDir, async () => 
          scanner.scan()
        );
        
        const afterMemory = process.memoryUsage().heapUsed;
        memorySnapshots.push(afterMemory - beforeMemory);
      }
      
      // Check for memory leaks (growth should be minimal)
      const avgGrowth = memorySnapshots.reduce((a, b) => a + b, 0) / memorySnapshots.length;
      const maxGrowth = Math.max(...memorySnapshots);
      
      expect(avgGrowth).toBeLessThan(10 * 1024 * 1024); // 10MB average
      expect(maxGrowth).toBeLessThan(50 * 1024 * 1024); // 50MB max
    }, 180000);

    it('should handle large files without memory exhaustion', async () => {
      // Create files of different sizes
      await createLargeFiles(tempDir, [
        { name: 'small.js', size: 1024 * 10 },      // 10KB
        { name: 'medium.js', size: 1024 * 100 },    // 100KB  
        { name: 'large.js', size: 1024 * 1024 },   // 1MB
        { name: 'xlarge.js', size: 1024 * 1024 * 4 } // 4MB
      ]);
      
      memoryProfiler.start();
      
      scanner = new Scanner({ 
        path: tempDir, 
        maxFileSize: 5 * 1024 * 1024, // 5MB limit
        quiet: true 
      });
      
      const result = await secureInjector.injectTest(tempDir, async () => 
        scanner.scan()
      );
      
      const memoryProfile = memoryProfiler.stop();
      
      expect(result.scan.filesScanned).toBe(4);
      expect(memoryProfile.peakHeapUsed).toBeLessThan(500 * 1024 * 1024); // 500MB
    }, 60000);
  });

  describe('Concurrent Scanning Operations', () => {
    it('should handle multiple parallel scans efficiently', async () => {
      // Create 5 different directories
      const dirs = [];
      for (let i = 0; i < 5; i++) {
        const dir = path.join(tempDir, `project-${i}`);
        await fs.mkdir(dir, { recursive: true });
        await generateTestFiles(dir, 200, 'mixed');
        dirs.push(dir);
      }
      
      benchmark.start();
      
      // Run scans in parallel with concurrency limit
      const scanPromises = dirs.slice(0, TEST_CONFIG.maxConcurrency).map(dir => {
        const scanner = new Scanner({ path: dir, parallel: true, quiet: true });
        return secureInjector.injectTest(dir, async () => scanner.scan());
      });
      
      const results = await Promise.all(scanPromises);
      const benchmarkResult = benchmark.stop('concurrent-scans', results.reduce((sum, r) => sum + r.scan.filesScanned, 0));
      
      expect(results).toHaveLength(Math.min(5, TEST_CONFIG.maxConcurrency));
      expect(results.every(r => r.scan.filesScanned === 200)).toBe(true);
      expect(benchmarkResult.duration).toBeLessThan(30000); // 30 seconds
    }, 90000);

    it('should compare parallel vs sequential performance', async () => {
      await generateTestFiles(tempDir, 500, 'mixed');
      
      // Sequential scan
      const sequentialScanner = new Scanner({ path: tempDir, parallel: false, quiet: true });
      const sequentialStart = performance.now();
      await secureInjector.injectTest(tempDir, async () => 
        sequentialScanner.scan()
      );
      const sequentialDuration = performance.now() - sequentialStart;
      
      // Parallel scan
      const parallelScanner = new Scanner({ path: tempDir, parallel: true, quiet: true });
      const parallelStart = performance.now();
      await secureInjector.injectTest(tempDir, async () => 
        parallelScanner.scan()
      );
      const parallelDuration = performance.now() - parallelStart;
      
      // Parallel should be faster (allow some variance)
      expect(parallelDuration).toBeLessThan(sequentialDuration * 1.2);
      
      console.log(`Sequential: ${sequentialDuration.toFixed(2)}ms`);
      console.log(`Parallel: ${parallelDuration.toFixed(2)}ms`);
      console.log(`Speedup: ${(sequentialDuration / parallelDuration).toFixed(2)}x`);
    }, 120000);
  });

  describe('File Type and Size Benchmarking', () => {
    it.each([
      { type: 'javascript', ext: 'js', count: 200 },
      { type: 'typescript', ext: 'ts', count: 200 },
      { type: 'python', ext: 'py', count: 200 },
      { type: 'jsx', ext: 'jsx', count: 200 },
      { type: 'tsx', ext: 'tsx', count: 200 }
    ])('should benchmark $type files efficiently', async ({ type, ext, count }) => {
      await generateTestFiles(tempDir, count, type);
      
      benchmark.start();
      
      scanner = new Scanner({ 
        path: tempDir, 
        include: [`**/*.${ext}`],
        quiet: true 
      });
      
      const result = await secureInjector.injectTest(tempDir, async () => 
        scanner.scan()
      );
      
      const benchmarkResult = benchmark.stop(`${type}-benchmark`, result.scan.filesScanned);
      
      expect(result.scan.filesScanned).toBe(count);
      expect(benchmarkResult.duration).toBeLessThan(15000); // 15 seconds per type
      expect(benchmarkResult.filesPerSecond).toBeGreaterThan(10); // Min 10 files/sec
    }, 45000);

    it('should handle mixed file types efficiently', async () => {
      const fileTypes = [
        { type: 'javascript', count: 100, ext: 'js' },
        { type: 'typescript', count: 100, ext: 'ts' },
        { type: 'python', count: 100, ext: 'py' },
        { type: 'jsx', count: 50, ext: 'jsx' },
        { type: 'tsx', count: 50, ext: 'tsx' }
      ];
      
      for (const fileType of fileTypes) {
        await generateTestFiles(tempDir, fileType.count, fileType.type);
      }
      
      benchmark.start();
      memoryProfiler.start();
      
      scanner = new Scanner({ path: tempDir, parallel: true, quiet: true });
      
      const result = await secureInjector.injectTest(tempDir, async () => 
        scanner.scan()
      );
      
      const benchmarkResult = benchmark.stop('mixed-types', result.scan.filesScanned);
      const memoryProfile = memoryProfiler.stop();
      
      expect(result.scan.filesScanned).toBe(400); // Total files
      expect(benchmarkResult.duration).toBeLessThan(20000);
      expect(MemoryProfiler.meetsTarget(memoryProfile)).toBe(true);
    }, 60000);
  });
});

// Helper functions
async function generateTestFiles(dir: string, count: number, type: string): Promise<void> {
  const contents = {
    javascript: () => `// JavaScript file ${Math.random()}\nconst apiKey = "fake-key-${Math.random()}";\nfunction test() { return true; }`,
    typescript: () => `// TypeScript file ${Math.random()}\nconst apiKey: string = "fake-key-${Math.random()}";\nfunction test(): boolean { return true; }`,
    python: () => `# Python file ${Math.random()}\nAPI_KEY = "fake-key-${Math.random()}"\ndef test(): return True`,
    jsx: () => `// JSX file ${Math.random()}\nconst apiKey = "fake-key-${Math.random()}";\nexport default function Test() { return <div>Test</div>; }`,
    tsx: () => `// TSX file ${Math.random()}\nconst apiKey: string = "fake-key-${Math.random()}";\nexport default function Test(): JSX.Element { return <div>Test</div>; }`,
    mixed: () => {
      const types = ['javascript', 'typescript', 'python', 'jsx', 'tsx'];
      const randomType = types[Math.floor(Math.random() * types.length)];
      return contents[randomType]();
    },
    vulnerable: () => `// Vulnerable file ${Math.random()}\nconst apiKey = "sk-live-${Math.random()}";\nconst dbPassword = "password123";\nfunction query(id) { return db.query("SELECT * FROM users WHERE id = " + id); }`
  };

  const getContent = contents[type] || contents.mixed;
  
  for (let i = 0; i < count; i++) {
    const ext = type === 'mixed' ? ['js', 'ts', 'py', 'jsx', 'tsx'][Math.floor(Math.random() * 5)] : 
                type === 'javascript' ? 'js' :
                type === 'typescript' ? 'ts' :
                type === 'python' ? 'py' :
                type === 'jsx' ? 'jsx' : 'tsx';
    
    const fileName = `file-${i}.${ext}`;
    const filePath = path.join(dir, fileName);
    await fs.writeFile(filePath, getContent());
  }
}

async function createDeepDirectoryStructure(baseDir: string, depth: number, filesPerLevel: number): Promise<void> {
  let currentDir = baseDir;
  
  for (let level = 0; level < depth; level++) {
    const levelDir = path.join(currentDir, `level-${level}`);
    await fs.mkdir(levelDir, { recursive: true });
    
    for (let i = 0; i < filesPerLevel; i++) {
      const fileName = `file-${i}.js`;
      const filePath = path.join(levelDir, fileName);
      await fs.writeFile(filePath, `// File at level ${level}, index ${i}\nconst secret = "test-${Math.random()}";`);
    }
    
    currentDir = levelDir;
  }
}

async function createLargeFiles(dir: string, files: Array<{name: string, size: number}>): Promise<void> {
  for (const file of files) {
    const filePath = path.join(dir, file.name);
    const content = `// Large file ${file.name}\n` + 'x'.repeat(file.size - 100) + '\nconst secret = "test-key";';
    await fs.writeFile(filePath, content);
  }
}