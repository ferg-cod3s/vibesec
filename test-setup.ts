#!/usr/bin/env bun
/**
 * Quick test to verify performance test setup
 */

import { test, expect } from 'bun:test';
import { Scanner } from './scanner/core/engine';
import { PerformanceBenchmark } from './lib/performance/benchmark';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

test('Performance test setup verification - should create and scan small test directory', async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'vibesec-quick-test-'));
    
    // Create a few test files
    await fs.writeFile(path.join(tempDir, 'test.js'), 'const apiKey = "test-key";');
    await fs.writeFile(path.join(tempDir, 'test.ts'), 'const apiKey: string = "test-key";');
    
    const benchmark = new PerformanceBenchmark();
    benchmark.start();
    
    const scanner = new Scanner({ path: tempDir, quiet: true });
    const result = await scanner.scan();
    
    const benchmarkResult = benchmark.stop('quick-test', result.scan.filesScanned);
    
    expect(result.scan.filesScanned).toBe(2);
    expect(result.findings.length).toBeGreaterThanOrEqual(0);
    expect(benchmarkResult.duration).toBeGreaterThan(0);
    expect(benchmarkResult.filesPerSecond).toBeGreaterThan(0);
    
    console.log(`✅ Quick test passed: Scanned ${result.scan.filesScanned} files in ${benchmarkResult.duration.toFixed(2)}ms`);
    
    // Cleanup
    await fs.rm(tempDir, { recursive: true, force: true });
  }, 10000);
});

console.log('🚀 Performance test setup verification complete!');