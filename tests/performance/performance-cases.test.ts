import { ScannerEngine } from '../../scanner/core/engine';
import { Finding, Severity, Category } from '../../scanner/core/types';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('Performance Tests', () => {
  let engine: ScannerEngine;
  let tempDir: string;

  beforeEach(() => {
    engine = new ScannerEngine();
    tempDir = '/tmp/vibesec-test-' + Math.random().toString(36).substring(7);
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('Small Files Performance', () => {
    it('should scan small files quickly', async () => {
      // Create small test files
      for (let i = 0; i < 10; i++) {
        const smallFile = path.join(tempDir, `small${i}.js`);
        await fs.writeFile(smallFile, `// Small file ${i}`);
      }
      
      const startTime = Date.now();
      const findings = await engine.analyze(tempDir);
      const duration = Date.now() - startTime;
      
      // Should complete quickly
      expect(duration).toBeLessThan(1000); // 1 second max
      expect(findings.length).toBeGreaterThanOrEqual(10);
    });
  });

  describe('Large Files Performance', () => {
    it('should scan large files efficiently', async () => {
      // Create large test files
      for (let i = 0; i < 10; i++) {
        const largeFile = path.join(tempDir, `large${i}.js`);
        await fs.writeFile(largeFile, `// Large file ${i}\n${'x'.repeat(10000)}\nconst secret = "sk-test-key";\n`);
      }
      
      const startTime = Date.now();
      const findings = await engine.analyze(tempDir);
      const duration = Date.now() - startTime;
      
      // Should complete efficiently
      expect(duration).toBeLessThan(5000); // 5 seconds max
      expect(findings.length).toBeGreaterThanOrEqual(10);
      expect(findings.some(f => f.metadata?.filesScanned)).toBe(true);
    });
  });

  describe('Deep Directory Performance', () => {
    it('should handle deep directory structures', async () => {
      // Create deep directory structure
      const deepDir = path.join(tempDir, 'deep');
      await fs.mkdir(deepDir, { recursive: true });
      
      // Create nested directories
      for (let i = 0; i < 5; i++) {
        const nestedDir = path.join(deepDir, `level${i}`);
        await fs.mkdir(nestedDir, { recursive: true });
        
        // Create files at different depths
        for (let j = 0; j < 3; j++) {
          const nestedFile = path.join(nestedDir, `level${i}/file${j}.js`);
          await fs.writeFile(nestedFile, `// Nested file ${j}\nconst secret = "sk-test-key";\n`);
        }
      }
      
      const startTime = Date.now();
      const findings = await engine.analyze(deepDir);
      const duration = Date.now() - startTime;
      
      // Should complete in reasonable time
      expect(duration).toBeLessThan(10000); // 10 seconds max
      expect(findings.length).toBeGreaterThanOrEqual(15);
      expect(findings.some(f => f.metadata?.filesScanned)).toBe(true);
    });
  });

  describe('Memory Usage', () => {
    it('should not leak memory during large scans', async () => {
      // Create memory-intensive test
      const memoryFile = path.join(tempDir, 'memory-test.js');
      await fs.writeFile(memoryFile, `
        // Memory test
        const data = new Array(1000000).fill('x');
        data.forEach(() => {
          // Simulate memory usage
        });
      `);
      
      const beforeMemory = process.memoryUsage().heapUsed;
      const startTime = Date.now();
      
      const findings = await engine.analyze(tempDir);
      const duration = Date.now() - startTime;
      const afterMemory = process.memoryUsage().heapUsed;
      
      // Should not leak significant memory
      expect(afterMemory.heapUsed).toBeLessThanOrEqual(beforeMemory.heapUsed + 50); // Allow some increase
      expect(findings.length).toBeGreaterThanOrEqual(0);
    });
  });
});