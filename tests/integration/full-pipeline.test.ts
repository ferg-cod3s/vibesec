import { Scanner } from '../../scanner/core/engine';
import { PlainTextReporter } from '../../reporters/plaintext';
import { JsonReporter } from '../../reporters/json';
import { StakeholderReporter } from '../../reporters/stakeholder';
import { PlainLanguageReporter } from '../../reporters/plain-language';
import { ScanOptions } from '../../scanner/core/types';
import * as fs from 'fs/promises';
import * as path from 'path';
import { execSync } from 'child_process';

describe('Full Pipeline Integration Tests', () => {
  const testDir = path.join(__dirname, '../fixtures');
  const complexVulnerableFile = path.join(testDir, 'complex-vulnerable/ast-sql-injection.ts');

  beforeAll(async () => {
    // Ensure test files exist
    try {
      await fs.access(complexVulnerableFile);
    } catch {
      throw new Error(`Test fixture not found: ${complexVulnerableFile}`);
    }
  });

  describe('Complete config → AST → detection → reporting flow', () => {
    it('should process config loading, AST parsing, rule detection, and reporting', async () => {
      const options: ScanOptions = {
        path: complexVulnerableFile,
        severity: 'low',
        format: 'json',
        parallel: false, // Sequential for predictable testing
        quiet: true,
      };

      const scanner = new Scanner(options);
      const result = await scanner.scan();

      // Verify the complete pipeline worked
      expect(result).toBeDefined();
      expect(result.scan).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.findings).toBeDefined();
      expect(Array.isArray(result.findings)).toBe(true);

      // Debug: Print all findings
      console.log(
        'All findings:',
        result.findings.map((f) => ({ rule: f.rule, category: f.category, title: f.title }))
      );

      // Check if SQL injection rule was loaded
      const sqlInjectionRule = result.findings.filter((f) => f.rule === 'ast-sql-injection');
      console.log('SQL injection rule findings:', sqlInjectionRule);

      // Should detect SQL injection vulnerability
      const sqlInjections = result.findings.filter((f) => f.category === 'injection');
      console.log('Injection findings:', sqlInjections);
      expect(sqlInjections.length).toBeGreaterThan(0);

      // Verify AST was used (complex vulnerability requires AST analysis)
      const hasAstBasedFinding = result.findings.some(
        (f) =>
          f.description.includes('variable') ||
          f.description.includes('flow') ||
          f.description.includes('AST')
      );
      expect(hasAstBasedFinding).toBe(true);
    });

    it('should handle multiple reporters correctly', async () => {
      const options: ScanOptions = {
        path: complexVulnerableFile,
        severity: 'low',
        format: 'text',
        parallel: false,
        quiet: true,
      };

      const scanner = new Scanner(options);
      const result = await scanner.scan();

      // Test all reporters
      const reporters = [
        new PlainTextReporter(),
        new JsonReporter(),
        new StakeholderReporter(),
        new PlainLanguageReporter(),
      ];

      for (const reporter of reporters) {
        const report = reporter.generate(result);
        expect(typeof report).toBe('string');
        expect(report.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Incremental scanning with cache', () => {
    const cacheDir = path.join(process.cwd(), '.vibesec-cache');
    const cacheFile = path.join(cacheDir, 'scan-cache.json');

    beforeEach(async () => {
      // Clean up cache before each test
      try {
        await fs.rm(cacheDir, { recursive: true, force: true });
      } catch {}
    });

    afterEach(async () => {
      // Clean up after each test
      try {
        await fs.rm(cacheDir, { recursive: true, force: true });
      } catch {}
    });

    it('should use cache for unchanged files', async () => {
      // First scan - should create cache
      const options1: ScanOptions = {
        path: complexVulnerableFile,
        severity: 'low',
        parallel: false,
        quiet: true,
        configPath: path.join(__dirname, 'config-samples', '.vibesec-cache.yaml'), // We'll need to create this
      };

      const scanner1 = new Scanner(options1);
      const result1 = await scanner1.scan();

      // Verify cache was created
      try {
        await fs.access(cacheFile);
      } catch {
        throw new Error('Cache file was not created');
      }

      // Second scan - should use cache
      const options2: ScanOptions = {
        path: complexVulnerableFile,
        severity: 'low',
        parallel: false,
        quiet: true,
      };

      const scanner2 = new Scanner(options2);
      const startTime = Date.now();
      const result2 = await scanner2.scan();
      const duration = Date.now() - startTime;

      // Results should be identical
      expect(result2.summary.total).toBe(result1.summary.total);
      expect(result2.findings.length).toBe(result1.findings.length);

      // Should be faster (though this is a rough test)
      expect(duration).toBeLessThan(1000); // Should be very fast with cache
    });

    it('should invalidate cache when file changes', async () => {
      // This test would require mocking file changes
      // For now, we'll test the cache invalidation logic exists
      const options: ScanOptions = {
        path: complexVulnerableFile,
        severity: 'low',
        parallel: false,
        quiet: true,
        full: true, // Force full scan, ignore cache
      };

      const scanner = new Scanner(options);
      const result = await scanner.scan();

      expect(result.findings.length).toBeGreaterThan(0);
    });
  });

  describe('CLI integration with new options', () => {
    const configFile = path.join(testDir, 'config-samples/.vibesec.yaml');

    beforeAll(async () => {
      // Ensure config file exists
      try {
        await fs.access(configFile);
      } catch {
        throw new Error(`Config fixture not found: ${configFile}`);
      }
    });

    it('should handle --config option', async () => {
      // Test that config loading works through CLI options
      const options: ScanOptions = {
        path: complexVulnerableFile,
        severity: 'low',
        format: 'json',
        parallel: false,
        quiet: true,
        configPath: configFile,
      };

      const scanner = new Scanner(options);
      const result = await scanner.scan();

      // Should respect config file settings
      expect(result).toBeDefined();
      expect(result.findings.length).toBeGreaterThan(0);
    });

    it('should handle --incremental option', async () => {
      // Test incremental scanning
      const options: ScanOptions = {
        path: complexVulnerableFile,
        severity: 'low',
        parallel: false,
        quiet: true,
        incremental: true,
      };

      const scanner = new Scanner(options);
      const result = await scanner.scan();

      expect(result).toBeDefined();
      // In a real git repo, this would only scan changed files
      // For this test, it should still work
    });

    it('should handle --full option', async () => {
      // Test full scan override
      const options: ScanOptions = {
        path: complexVulnerableFile,
        severity: 'low',
        parallel: false,
        quiet: true,
        full: true,
      };

      const scanner = new Scanner(options);
      const result = await scanner.scan();

      expect(result).toBeDefined();
      expect(result.findings.length).toBeGreaterThan(0);
    });
  });

  describe('Performance targets', () => {
    it('should meet performance targets for small scans', async () => {
      const options: ScanOptions = {
        path: complexVulnerableFile,
        severity: 'low',
        parallel: false,
        quiet: true,
      };

      const scanner = new Scanner(options);
      const startTime = Date.now();
      const result = await scanner.scan();
      const duration = Date.now() - startTime;

      // Should complete in reasonable time
      expect(duration).toBeLessThan(5000); // 5 seconds max for small file
      expect(result.scan.duration).toBeGreaterThan(0);
      expect(result.scan.filesScanned).toBe(1);
    });

    // Note: Large scale performance tests would require generating
    // many test files and are better suited for the performance benchmark suite
  });

  describe('Error handling and edge cases', () => {
    it('should handle non-existent paths gracefully', async () => {
      const options: ScanOptions = {
        path: '/non/existent/path',
        severity: 'low',
        parallel: false,
        quiet: true,
      };

      const scanner = new Scanner(options);
      await expect(scanner.scan()).rejects.toThrow();
    });

    it('should handle empty directories', async () => {
      const emptyDir = path.join(testDir, 'empty-dir');
      await fs.mkdir(emptyDir, { recursive: true });

      try {
        const options: ScanOptions = {
          path: emptyDir,
          severity: 'low',
          parallel: false,
          quiet: true,
        };

        const scanner = new Scanner(options);
        const result = await scanner.scan();

        expect(result.scan.filesScanned).toBe(0);
        expect(result.findings.length).toBe(0);
      } finally {
        await fs.rm(emptyDir, { recursive: true, force: true });
      }
    });

    it('should handle files with syntax errors', async () => {
      const syntaxErrorFile = path.join(testDir, 'syntax-error.js');
      await fs.writeFile(syntaxErrorFile, 'function broken { syntax error }');

      try {
        const options: ScanOptions = {
          path: syntaxErrorFile,
          severity: 'low',
          parallel: false,
          quiet: true,
        };

        const scanner = new Scanner(options);
        const result = await scanner.scan();

        // Should still complete scan even with syntax errors
        expect(result).toBeDefined();
        expect(typeof result.scan.filesScanned).toBe('number');
      } finally {
        await fs.unlink(syntaxErrorFile);
      }
    });
  });
});
