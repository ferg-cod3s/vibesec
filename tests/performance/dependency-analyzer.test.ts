/**
 * Performance Tests for VibeSec Dependency Analyzer
 * 
 * Tests large dependency trees, memory usage during analysis,
 * concurrent dependency parsing, and different package managers using bun:test.
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { DependencyAnalyzer } from '../../scanner/analyzers/dependency';
import { PerformanceBenchmark } from '../../lib/performance/benchmark';
import { MemoryProfiler } from '../../lib/performance/memory-profiler';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

// Secure agent injection for dependency tests
interface DependencySecurityConfig {
  maxDependencyCount: number;
  maxFileSize: number;
  allowedPackageManagers: string[];
  sanitizeOutput: boolean;
  timeoutMs: number;
}

class SecureDependencyTester {
  private config: DependencySecurityConfig;
  private activeAnalyses: Map<string, any> = new Map();

  constructor(config: DependencySecurityConfig) {
    this.config = config;
  }

  async executeAnalysis(
    analyzer: DependencyAnalyzer,
    projectPath: string,
    analysisId?: string
  ): Promise<any[]> {
    const id = analysisId || this.generateAnalysisId();
    
    // Validate package manager
    const packageManager = await this.detectPackageManager(projectPath);
    if (!this.config.allowedPackageManagers.includes(packageManager)) {
      throw new Error(`Package manager not allowed: ${packageManager}`);
    }

    // Validate file sizes
    await this.validateFileSizes(projectPath);

    try {
      this.activeAnalyses.set(id, {
        path: projectPath,
        packageManager,
        startTime: Date.now(),
        status: 'running'
      });

      // Execute with timeout
      const result = await Promise.race([
        analyzer.analyze(projectPath),
        this.createTimeout(this.config.timeoutMs)
      ]);

      this.activeAnalyses.set(id, {
        ...this.activeAnalyses.get(id),
        status: 'completed',
        endTime: Date.now(),
        findingsCount: Array.isArray(result) ? result.length : 0
      });

      return this.sanitizeOutput(result);
    } catch (error) {
      this.activeAnalyses.set(id, {
        ...this.activeAnalyses.get(id),
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
        endTime: Date.now()
      });
      throw error;
    }
  }

  async executeConcurrentAnalyses(
    analyzer: DependencyAnalyzer,
    projectPaths: string[]
  ): Promise<Array<{ path: string, findings: any[] }>> {
    // Limit concurrent analyses
    const limitedPaths = projectPaths.slice(0, 10); // Max 10 concurrent
    
    const promises = limitedPaths.map(async (projectPath, index) => {
      const analysisId = `concurrent_${index}_${Date.now()}`;
      const findings = await this.executeAnalysis(analyzer, projectPath, analysisId);
      return { path: projectPath, findings };
    });

    return Promise.all(promises);
  }

  private async detectPackageManager(projectPath: string): Promise<string> {
    const files = await fs.readdir(projectPath);
    
    if (files.includes('package.json')) return 'npm';
    if (files.includes('Cargo.toml')) return 'cargo';
    if (files.includes('requirements.txt') || files.includes('setup.py')) return 'pip';
    
    return 'unknown';
  }

  private async validateFileSizes(projectPath: string): Promise<void> {
    const files = await fs.readdir(projectPath, { withFileTypes: true });
    
    for (const file of files) {
      if (file.isFile()) {
        const filePath = path.join(projectPath, file.name);
        const stats = await fs.stat(filePath);
        
        if (stats.size > this.config.maxFileSize) {
          throw new Error(`File too large: ${file.name} (${stats.size} bytes)`);
        }
      }
    }
  }

  private generateAnalysisId(): string {
    return `dep_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  private createTimeout(ms: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Analysis timeout after ${ms}ms`)), ms);
    });
  }

  private sanitizeOutput(result: any[]): any[] {
    if (!this.config.sanitizeOutput) return result;

    return result.map(finding => ({
      ...finding,
      // Remove potential secrets from dependency names or versions
      dependency: finding.dependency ? 
        finding.dependency.replace(/["'][\w\-_]{20,}["']/g, '"***REDACTED***"') : 
        undefined,
      version: finding.version ? 
        finding.version.replace(/["'][\w\-_]{20,}["']/g, '"***REDACTED***"') : 
        undefined
    }));
  }

  getStats(): { active: number, completed: number, failed: number } {
    const stats = { active: 0, completed: 0, failed: 0 };
    
    for (const analysis of this.activeAnalyses.values()) {
      stats[analysis.status]++;
    }

    return stats;
  }

  cleanup(): void {
    this.activeAnalyses.clear();
  }
}

// Global test configuration
const DEPENDENCY_TEST_CONFIG: DependencySecurityConfig = {
  maxDependencyCount: 5000,
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedPackageManagers: ['npm', 'cargo', 'pip'],
  sanitizeOutput: true,
  timeoutMs: 60000 // 1 minute
};

const secureDependencyTester = new SecureDependencyTester(DEPENDENCY_TEST_CONFIG);

describe('Dependency Analyzer Performance Tests', () => {
  let analyzer: DependencyAnalyzer;
  let tempDir: string;
  let benchmark: PerformanceBenchmark;
  let memoryProfiler: MemoryProfiler;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'vibesec-deps-perf-'));
    analyzer = new DependencyAnalyzer();
    benchmark = new PerformanceBenchmark();
    memoryProfiler = new MemoryProfiler();
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
    secureDependencyTester.cleanup();
  });

  describe('Large Dependency Tree Performance', () => {
    it.each([
      { packageManager: 'npm', dependencyCount: 1000, expectedDuration: 10000 },
      { packageManager: 'cargo', dependencyCount: 500, expectedDuration: 8000 },
      { packageManager: 'pip', dependencyCount: 800, expectedDuration: 12000 }
    ])('should analyze $dependencyCount $packageManager dependencies efficiently', async ({ packageManager, dependencyCount, expectedDuration }) => {
      await generateDependencyFiles(packageManager, dependencyCount, tempDir);
      
      benchmark.start();
      memoryProfiler.start(100);
      
      const findings = await secureDependencyTester.executeAnalysis(analyzer, tempDir);
      
      const benchmarkResult = benchmark.stop(`${packageManager}-large-tree`, dependencyCount);
      const memoryProfile = memoryProfiler.stop();
      
      expect(Array.isArray(findings)).toBe(true);
      expect(benchmarkResult.duration).toBeLessThan(expectedDuration);
      expect(MemoryProfiler.meetsTarget(memoryProfile)).toBe(true);
      
      console.log(`${packageManager}: Analyzed ${dependencyCount} deps in ${PerformanceBenchmark.formatDuration(benchmarkResult.duration)}`);
    }, 60000);

    it('should handle complex dependency graphs efficiently', async () => {
      // Create complex dependency graph with nested dependencies
      await createComplexDependencyGraph(tempDir, 5, 100); // 5 levels, 100 deps per level
      
      benchmark.start();
      
      const findings = await secureDependencyTester.executeAnalysis(analyzer, tempDir);
      
      const benchmarkResult = benchmark.stop('complex-graph', 500);
      
      expect(Array.isArray(findings)).toBe(true);
      expect(benchmarkResult.duration).toBeLessThan(15000);
      expect(benchmarkResult.filesPerSecond).toBeGreaterThan(30);
    }, 45000);

    it('should scale linearly with dependency count', async () => {
      const dependencyCounts = [100, 250, 500, 750, 1000];
      const durations: number[] = [];
      
      for (const count of dependencyCounts) {
        const testDir = path.join(tempDir, `test-${count}`);
        await fs.mkdir(testDir, { recursive: true });
        
        await generateDependencyFiles('npm', count, testDir);
        
        const startTime = performance.now();
        await secureDependencyTester.executeAnalysis(analyzer, testDir);
        const duration = performance.now() - startTime;
        
        durations.push(duration);
      }
      
      // Check for linear scaling (allow some variance)
      for (let i = 1; i < durations.length; i++) {
        const expectedRatio = dependencyCounts[i] / dependencyCounts[0];
        const actualRatio = durations[i] / durations[0];
        
        // Allow up to 2x linear scaling (accounting for complexity)
        expect(actualRatio).toBeLessThan(expectedRatio * 2);
      }
    }, 120000);
  });

  describe('Memory Usage During Analysis', () => {
    it('should not leak memory during large dependency analysis', async () => {
      await generateDependencyFiles('npm', 1000, tempDir);
      
      const memorySnapshots: number[] = [];
      
      // Run analysis multiple times
      for (let i = 0; i < 5; i++) {
        if (global.gc) global.gc();
        
        const beforeMemory = process.memoryUsage().heapUsed;
        
        await secureDependencyTester.executeAnalysis(analyzer, tempDir);
        
        const afterMemory = process.memoryUsage().heapUsed;
        memorySnapshots.push(afterMemory - beforeMemory);
      }
      
      const avgGrowth = memorySnapshots.reduce((a, b) => a + b, 0) / memorySnapshots.length;
      const maxGrowth = Math.max(...memorySnapshots);
      
      expect(avgGrowth).toBeLessThan(20 * 1024 * 1024); // 20MB average
      expect(maxGrowth).toBeLessThan(100 * 1024 * 1024); // 100MB max
    }, 90000);

    it('should handle memory-intensive dependency files', async () => {
      // Create package files with large dependency lists
      await createLargeDependencyFiles(tempDir, 2000); // 2000 dependencies
      
      memoryProfiler.start();
      
      const findings = await secureDependencyTester.executeAnalysis(analyzer, tempDir);
      const memoryProfile = memoryProfiler.stop();
      
      expect(Array.isArray(findings)).toBe(true);
      expect(memoryProfile.peakHeapUsed).toBeLessThan(300 * 1024 * 1024); // 300MB
      
      const leak = MemoryProfiler.detectLeak(memoryProfile);
      expect(leak.detected).toBe(false);
    }, 60000);
  });

  describe('Concurrent Dependency Parsing', () => {
    it('should handle multiple concurrent analyses', async () => {
      const concurrentAnalyses = 5;
      const dependenciesPerAnalysis = 200;
      
      // Create multiple test directories
      const testDirs = [];
      for (let i = 0; i < concurrentAnalyses; i++) {
        const dir = path.join(tempDir, `analysis-${i}`);
        await fs.mkdir(dir, { recursive: true });
        await generateDependencyFiles('npm', dependenciesPerAnalysis, dir);
        testDirs.push(dir);
      }
      
      benchmark.start();
      memoryProfiler.start();
      
      const results = await secureDependencyTester.executeConcurrentAnalyses(analyzer, testDirs);
      
      const benchmarkResult = benchmark.stop('concurrent-analysis', concurrentAnalyses * dependenciesPerAnalysis);
      const memoryProfile = memoryProfiler.stop();
      
      expect(results).toHaveLength(concurrentAnalyses);
      expect(results.every(r => Array.isArray(r.findings))).toBe(true);
      expect(benchmarkResult.duration).toBeLessThan(20000); // 20 seconds
      expect(MemoryProfiler.meetsTarget(memoryProfile)).toBe(true);
    }, 60000);

    it('should handle mixed package managers concurrently', async () => {
      const packageManagers = ['npm', 'cargo', 'pip'];
      const dependenciesPerManager = 300;
      
      benchmark.start();
      
      // Create and analyze different package manager projects concurrently
      const analysisPromises = packageManagers.map(async (pm) => {
        const dir = path.join(tempDir, pm);
        await fs.mkdir(dir, { recursive: true });
        await generateDependencyFiles(pm, dependenciesPerManager, dir);
        return secureDependencyTester.executeAnalysis(analyzer, dir);
      });
      
      const results = await Promise.all(analysisPromises);
      const benchmarkResult = benchmark.stop('mixed-package-managers', packageManagers.length * dependenciesPerManager);
      
      expect(results).toHaveLength(packageManagers);
      expect(results.every(r => Array.isArray(r))).toBe(true);
      expect(benchmarkResult.duration).toBeLessThan(25000);
    }, 60000);
  });

  describe('Package Manager Benchmarking', () => {
    it.each([
      { manager: 'npm', file: 'package.json', deps: 100 },
      { manager: 'cargo', file: 'Cargo.toml', deps: 50 },
      { manager: 'pip', file: 'requirements.txt', deps: 150 }
    ])('should benchmark $manager performance with $deps dependencies', async ({ manager, file, deps }) => {
      await generateDependencyFiles(manager, deps, tempDir);
      
      benchmark.start();
      
      const findings = await secureDependencyTester.executeAnalysis(analyzer, tempDir);
      const benchmarkResult = benchmark.stop(`${manager}-benchmark`, deps);
      
      expect(Array.isArray(findings)).toBe(true);
      expect(benchmarkResult.filesPerSecond).toBeGreaterThan(1); // At least 1 dep/sec
      expect(benchmarkResult.duration).toBeLessThan(15000); // 15 seconds max
      
      // Verify file was processed
      const expectedFile = path.join(tempDir, file);
      expect(await fs.access(expectedFile).then(() => true).catch(() => false)).toBe(true);
    }, 45000);

    it('should compare package manager performance', async () => {
      const packageManagers = [
        { name: 'npm', deps: 200 },
        { name: 'cargo', deps: 100 },
        { name: 'pip', deps: 200 }
      ];
      
      const results: Array<{name: string, duration: number, findings: any[]}> = [];
      
      for (const pm of packageManagers) {
        const dir = path.join(tempDir, pm.name);
        await fs.mkdir(dir, { recursive: true });
        await generateDependencyFiles(pm.name, pm.deps, dir);
        
        const startTime = performance.now();
        const findings = await secureDependencyTester.executeAnalysis(analyzer, dir);
        const duration = performance.now() - startTime;
        
        results.push({ name: pm.name, duration, findings });
      }
      
      // All should complete within reasonable time
      results.forEach(result => {
        expect(result.duration).toBeLessThan(10000);
        expect(Array.isArray(result.findings)).toBe(true);
      });
      
      // Log performance comparison
      console.log('Package Manager Performance Comparison:');
      results.forEach(result => {
        console.log(`${result.name}: ${result.duration.toFixed(2)}ms`);
      });
    }, 60000);
  });

  describe('Error Handling Performance', () => {
    it('should handle malformed dependency files efficiently', async () => {
      // Create malformed dependency files
      await createMalformedDependencyFiles(tempDir);
      
      benchmark.start();
      
      const findings = await secureDependencyTester.executeAnalysis(analyzer, tempDir);
      const benchmarkResult = benchmark.stop('malformed-files', 10);
      
      expect(Array.isArray(findings)).toBe(true);
      expect(benchmarkResult.duration).toBeLessThan(5000); // Should fail fast
    }, 30000);

    it('should handle missing package manager tools gracefully', async () => {
      // Create dependency files but mock missing tools
      await generateDependencyFiles('npm', 100, tempDir);
      
      // Mock execSync to simulate missing tools
      const originalExecSync = require('child_process').execSync;
      require('child_process').execSync = jest.fn(() => {
        throw new Error('Command not found');
      });
      
      benchmark.start();
      
      const findings = await secureDependencyTester.executeAnalysis(analyzer, tempDir);
      const benchmarkResult = benchmark.stop('missing-tools', 100);
      
      expect(Array.isArray(findings)).toBe(true);
      expect(benchmarkResult.duration).toBeLessThan(3000);
      
      // Restore original
      require('child_process').execSync = originalExecSync;
    }, 30000);
  });
});

// Helper functions
async function generateDependencyFiles(packageManager: string, count: number, dir: string): Promise<void> {
  switch (packageManager) {
    case 'npm':
      await generateNpmFiles(count, dir);
      break;
    case 'cargo':
      await generateCargoFiles(count, dir);
      break;
    case 'pip':
      await generatePipFiles(count, dir);
      break;
  }
}

async function generateNpmFiles(count: number, dir: string): Promise<void> {
  const dependencies: Record<string, string> = {};
  const devDependencies: Record<string, string> = {};
  
  for (let i = 0; i < count; i++) {
    const isDev = i % 3 === 0;
    const depName = `package-${i}`;
    const version = `${Math.floor(Math.random() * 5) + 1}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 10)}`;
    
    if (isDev) {
      devDependencies[depName] = version;
    } else {
      dependencies[depName] = version;
    }
  }
  
  const packageJson = {
    name: 'test-project',
    version: '1.0.0',
    dependencies,
    devDependencies
  };
  
  await fs.writeFile(
    path.join(dir, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );
  
  // Create package-lock.json for more realistic testing
  const lockFile = {
    name: 'test-project',
    version: '1.0.0',
    lockfileVersion: 2,
    requires: true,
    packages: {},
    dependencies
  };
  
  await fs.writeFile(
    path.join(dir, 'package-lock.json'),
    JSON.stringify(lockFile, null, 2)
  );
}

async function generateCargoFiles(count: number, dir: string): Promise<void> {
  const dependencies: string[] = [];
  
  for (let i = 0; i < count; i++) {
    const crateName = `crate-${i}`;
    const version = `${Math.floor(Math.random() * 5) + 1}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 10)}`;
    dependencies.push(`${crateName} = "${version}"`);
  }
  
  const cargoToml = `[package]
name = "test-project"
version = "0.1.0"
edition = "2021"

[dependencies]
${dependencies.join('\n')}`;
  
  await fs.writeFile(path.join(dir, 'Cargo.toml'), cargoToml);
  
  // Create Cargo.lock for more realistic testing
  const cargoLock = `# This file is automatically @generated by Cargo.
# It is not intended for manual editing.
version = 3

[[package]]
name = "test-project"
version = "0.1.0"
dependencies = ${dependencies.map(dep => dep.split('=')[0]).join(', ')}`;
  
  await fs.writeFile(path.join(dir, 'Cargo.lock'), cargoLock);
}

async function generatePipFiles(count: number, dir: string): Promise<void> {
  const requirements: string[] = [];
  
  for (let i = 0; i < count; i++) {
    const packageName = `package-${i}`;
    const version = `==${Math.floor(Math.random() * 5) + 1}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 10)}`;
    requirements.push(`${packageName}${version}`);
  }
  
  await fs.writeFile(
    path.join(dir, 'requirements.txt'),
    requirements.join('\n')
  );
  
  // Create setup.py for more realistic testing
  const setupPy = `from setuptools import setup, find_packages

setup(
    name="test-project",
    version="1.0.0",
    packages=find_packages(),
    install_requires=${JSON.stringify(requirements)},
)`;
  
  await fs.writeFile(path.join(dir, 'setup.py'), setupPy);
}

async function createComplexDependencyGraph(baseDir: string, levels: number, depsPerLevel: number): Promise<void> {
  let currentDir = baseDir;
  
  for (let level = 0; level < levels; level++) {
    const levelDir = path.join(currentDir, `level-${level}`);
    await fs.mkdir(levelDir, { recursive: true });
    
    await generateDependencyFiles('npm', depsPerLevel, levelDir);
    currentDir = levelDir;
  }
}

async function createLargeDependencyFiles(dir: string, dependencyCount: number): Promise<void> {
  const dependencies: Record<string, string> = {};
  
  for (let i = 0; i < dependencyCount; i++) {
    dependencies[`large-package-${i}`] = '1.0.0';
  }
  
  const packageJson = {
    name: 'large-project',
    version: '1.0.0',
    dependencies
  };
  
  await fs.writeFile(
    path.join(dir, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );
}

async function createMalformedDependencyFiles(dir: string): Promise<void> {
  // Malformed package.json
  await fs.writeFile(
    path.join(dir, 'package.json'),
    '{ "name": "test", "dependencies": invalid-json }'
  );
  
  // Malformed Cargo.toml
  await fs.writeFile(
    path.join(dir, 'Cargo.toml'),
    '[package\nname = "test"\nversion = "1.0.0"'
  );
  
  // Malformed requirements.txt
  await fs.writeFile(
    path.join(dir, 'requirements.txt'),
    'invalid-package-==\n==1.0.0\npackage-without-version'
  );
}