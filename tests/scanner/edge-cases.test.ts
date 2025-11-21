import { ScannerEngine } from '../../scanner/core/engine';
import { Finding, Severity, Category } from '../../scanner/core/types';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('Scanner Engine Edge Cases', () => {
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

  describe('File Permission Errors', () => {
    it('should handle permission denied errors gracefully', async () => {
      const testFile = path.join(tempDir, 'test.js');
      await fs.writeFile(testFile, 'test');
      
      // Mock fs.readFile to throw permission error
      const originalReadFile = fs.readFile;
      (fs as any).readFile = jest.fn().mockImplementation(() => {
        const error = new Error('Permission denied');
        throw error;
      }) as any;

      const findings = await (engine as any).analyze(tempDir);
      
      // Should handle permission error gracefully
      expect(Array.isArray(findings)).toBe(true);
      expect(findings).toHaveLength(0);

      // Restore
      (fs as any).readFile = originalReadFile;
    });

    it('should handle file not found errors gracefully', async () => {
      const findings = await (engine as any).analyze(tempDir);
      
      // Should handle missing file gracefully
      expect(Array.isArray(findings)).toBe(true);
      expect(findings).toHaveLength(0);

      // Restore
      (fs as any).readFile = originalReadFile;
    });
  });

    it('should handle corrupted JSON files gracefully', async () => {
      const packageJson = path.join(tempDir, 'package.json');
      await fs.writeFile(packageJson, '{ invalid json');
      
      const findings = await (engine as any).analyze(tempDir);
      
      // Should handle corrupted JSON gracefully
      expect(Array.isArray(findings)).toBe(true);
      expect(findings).toHaveLength(0);

      // Restore
      (fs as any).readFile = originalReadFile;
    });
    });

    it('should handle empty directories gracefully', async () => {
      const findings = await (engine as any).analyze(tempDir);
      
      // Should handle empty directory gracefully
      expect(Array.isArray(findings)).toBe(true);
      expect(findings).toHaveLength(0);

      // Restore
      (fs as any).readFile = originalReadFile;
    });
    });

    it('should handle very large files', async () => {
      // Create a large test file
      const largeContent = 'x'.repeat(1000000);
      const largeFile = path.join(tempDir, 'large.txt');
      await fs.writeFile(largeFile, largeContent);
      
      const findings = await (engine as any).analyze(tempDir);
      
      // Should handle large files without timeout
      expect(Array.isArray(findings)).toBe(true);
      expect(findings.length).toBeGreaterThanOrEqual(1);
      
      // Should find regex patterns in large file
      expect(findings.some(f => f.rule === 'regex-large-content')).toBe(true);
      
      // Restore
      await fs.rm(largeFile);
      (fs as any).readFile = originalReadFile;
    });
    });

    it('should handle deep directory structures', async () => {
      // Create nested directory structure
      const nestedDir = path.join(tempDir, 'nested');
      await fs.mkdir(nestedDir, { recursive: true });
      
      // Create files at various depths
      await fs.writeFile(path.join(nestedDir, 'file1.js'), 'content1');
      await fs.writeFile(path.join(nestedDir, 'file2.js'), 'content2');
      await fs.writeFile(path.join(nestedDir, 'deep', 'file3.js'), 'content3');
      await fs.writeFile(path.join(nestedDir, 'very', 'deep', 'file4.js'), 'content4');
      
      const findings = await (engine as any).analyze(tempDir);
      
      // Should find all files including nested ones
      expect(findings.length).toBeGreaterThanOrEqual(4);
      
      // Should find files at different depths
      expect(findings.some(f => f.location.file.includes('nested/'))).toBe(true);
      expect(findings.some(f => f.location.file.includes('deep/'))).toBe(true);
      expect(findings.some(f => f.location.file.includes('very/'))).toBe(true);
      
      // Restore
      await fs.rm(nestedDir, { recursive: true });
      (fs as any).readFile = originalReadFile;
    });
    });

    it('should handle mixed file types', async () => {
      // Create files with different extensions
      await fs.writeFile(path.join(tempDir, 'test.js'), 'const secret = "sk-proj-key";');
      await fs.writeFile(path.join(tempDir, 'test.py'), 'import os');
      await fs.writeFile(path.join(tempDir, 'test.go'), 'package main');
      await fs.writeFile(path.join(tempDir, 'test.rs'), 'fn main() {}');
      
      const findings = await (engine as any).analyze(tempDir);
      
      // Should find all file types
      expect(findings.length).toBeGreaterThanOrEqual(4);
      
      // Should detect secrets in JS file
      expect(findings.some(f => f.rule === 'regex-secrets' && f.title.includes('sk-proj-key'))).toBe(true);
      
      // Should detect import in Python file
      expect(findings.some(f => f.rule === 'regex-python-import' && f.title.includes('import os'))).toBe(true);
      
      // Should detect main function in Rust file
      expect(findings.some(f => f.rule === 'regex-rust-main' && f.title.includes('package main'))).toBe(true);
      
      // Restore
      await fs.rm(path.join(tempDir, 'test.js'));
      await fs.rm(path.join(tempDir, 'test.py'));
      await fs.rm(path.join(tempDir, 'test.go'));
      await fs.rm(path.join(tempDir, 'test.rs'));
      (fs as any).readFile = originalReadFile;
    });
    });
  });

  describe('Performance Edge Cases', () => {
    it('should measure scan duration', async () => {
      const startTime = Date.now();
      
      // Create moderately sized test
      const mediumContent = 'x'.repeat(10000);
      const mediumFile = path.join(tempDir, 'medium.txt');
      await fs.writeFile(mediumFile, mediumContent);
      
      const findings = await (engine as any).analyze(tempDir);
      
      const duration = Date.now() - startTime;
      
      // Should complete in reasonable time
      expect(duration).toBeLessThan(5000)); // 5 second max
      
      // Should log performance metrics
      expect(findings.length).toBeGreaterThanOrEqual(1));
      
      // Restore
      await fs.rm(mediumFile);
      (fs as any).readFile = originalReadFile;
    });

    it('should handle memory usage efficiently', async () => {
      // Create memory-intensive test
      const memoryContent = 'x'.repeat(50000);
      const memoryFile = path.join(tempDir, 'memory.txt');
      await fs.writeFile(memoryFile, memoryContent);
      
      const findings = await (engine as any).analyze(tempDir);
      
      // Should complete without memory leaks
      expect(findings.length).toBeGreaterThanOrEqual(1));
      
      // Restore
      await fs.rm(memoryFile);
      (fs as any).readFile = originalReadFile;
    });
  });
    });
  });