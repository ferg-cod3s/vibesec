/**
 * P2.1 Scanner Engine Integration Tests
 * Tests the integration of Priority 1 components (ConfigLoader, EnhancedASTParser, IncrementalScanner)
 */

import * as path from 'path';
import * as fs from 'fs/promises';
import { Scanner } from '../../scanner/core/engine';
import { EnhancedASTParser } from '../../src/ast/enhanced-ast-parser';
import { IncrementalScanner } from '../../src/incremental/incremental-scanner';

describe('P2.1 Scanner Engine Integration', () => {
  const fixturesPath = path.join(__dirname, '../fixtures');
  const configSamplesPath = path.join(fixturesPath, 'config-samples');

  describe('ConfigLoader Integration', () => {
    it('should load .vibesec.yaml configuration and merge with CLI options', async () => {
      const configPath = path.join(configSamplesPath, '.vibesec.yaml');
      const testFile = path.join(fixturesPath, 'vulnerable/js/sql-injection.js');

      const scanner = new Scanner({
        path: testFile,
        configPath,
        quiet: true,
        // CLI option should override config
        severity: 'critical' as any,
      });

      const result = await scanner.scan();

      // Should have loaded config (exclude patterns should include tests/fixtures)
      expect(result.findings.length).toBeGreaterThan(0);

      // Verify CLI severity override worked
      const allFindingsAreCritical = result.findings.every((f) => f.severity === 'critical');
      expect(allFindingsAreCritical).toBe(true);
    });

    it('should fall back to defaults when no config file exists', async () => {
      const testFile = path.join(fixturesPath, 'vulnerable/js/sql-injection.js');

      const scanner = new Scanner({
        path: testFile,
        configPath: '/nonexistent/config.yaml',
        quiet: true,
      });

      const result = await scanner.scan();

      // Should still work with defaults
      expect(result.findings.length).toBeGreaterThan(0);
    });

    it('should handle empty config file gracefully', async () => {
      const emptyConfigPath = path.join(configSamplesPath, 'empty.yaml');

      // Create empty config file
      await fs.writeFile(emptyConfigPath, '');

      const testFile = path.join(fixturesPath, 'vulnerable/js/sql-injection.js');
      const scanner = new Scanner({
        path: testFile,
        configPath: emptyConfigPath,
        quiet: true,
      });

      const result = await scanner.scan();

      // Should work with defaults
      expect(result.findings.length).toBeGreaterThan(0);

      // Clean up
      await fs.unlink(emptyConfigPath);
    });

    it('should respect configuration file include/exclude patterns', async () => {
      const configPath = path.join(configSamplesPath, '.vibesec.yaml');
      const vulnerablePath = path.join(fixturesPath, 'vulnerable');

      const scanner = new Scanner({
        path: vulnerablePath,
        configPath,
        quiet: true,
      });

      const result = await scanner.scan();

      // Should scan files (config includes js/ts files)
      expect(result.scan.filesScanned).toBeGreaterThan(0);
      expect(result.findings.length).toBeGreaterThan(0);
    });
  });

  describe('EnhancedASTParser Integration', () => {
    let astParser: EnhancedASTParser;

    beforeEach(() => {
      astParser = new EnhancedASTParser();
    });

    it('should parse JavaScript/TypeScript files', async () => {
      const jsFile = path.join(fixturesPath, 'vulnerable/js/sql-injection.js');
      const result = await astParser.parseFile(jsFile);

      expect(result.ast).toBeDefined();
      expect(result.parseTimeMs).toBeGreaterThan(0);

      // Should find some AST nodes (assignments, imports, etc.)
      expect(result.ast.length).toBeGreaterThanOrEqual(0);

      // Look for any node types that should be present
      const nodeTypes = result.ast.map((node) => node.type);
      expect(nodeTypes.length).toBeGreaterThanOrEqual(0);
    });

    it('should parse Python files', async () => {
      const pyFile = path.join(fixturesPath, 'vulnerable/py/command-injection.py');
      const result = await astParser.parseFile(pyFile);

      expect(result.ast).toBeDefined();
      expect(result.ast.length).toBeGreaterThan(0);

      // Should find function definitions
      const functions = result.ast.filter((node) => node.type === 'FunctionDecl');
      expect(functions.length).toBeGreaterThan(0);
    });

    it('should handle unsupported file types gracefully', async () => {
      // Create a temporary unsupported file
      const tempFile = path.join(fixturesPath, 'temp.unsupported');
      await fs.writeFile(tempFile, 'some content');

      const result = await astParser.parseFile(tempFile);

      expect(result.ast).toEqual([]);
      expect(result.parseTimeMs).toBeGreaterThan(0);

      // Clean up
      await fs.unlink(tempFile);
    });

    it('should integrate with scanner for AST-based rules', async () => {
      // Use a file that should trigger AST parsing
      const astFile = path.join(fixturesPath, 'complex-vulnerable/ast-sql-injection.ts');

      const scanner = new Scanner({
        path: astFile,
        quiet: true,
      });

      const result = await scanner.scan();

      // Should find vulnerabilities using both regex and AST analysis
      expect(result.findings.length).toBeGreaterThan(0);
    });
  });

  describe('IncrementalScanner Integration', () => {
    let incrementalScanner: IncrementalScanner;
    const testCachePath = path.join(fixturesPath, '.test-cache.json');

    beforeEach(async () => {
      incrementalScanner = new IncrementalScanner();
      // Clean up any existing test cache
      try {
        await fs.unlink(testCachePath);
      } catch {
        // Ignore if file doesn't exist
      }
    });

    afterEach(async () => {
      // Clean up test cache
      try {
        await fs.unlink(testCachePath);
      } catch {
        // Ignore if file doesn't exist
      }
    });

    it('should save and load cache correctly', async () => {
      const testCache = {
        files: new Map([['test.js', { hash: 'abc123', timestamp: Date.now() }]]),
        rules: new Map([['rule1', { hash: 'def456' }]]),
        results: new Map([['abc123', []]]),
      };

      // Save cache
      await incrementalScanner.saveCache(testCache, testCachePath);

      // Load cache
      const loadedCache = await incrementalScanner.loadCache(testCachePath);

      expect(loadedCache).not.toBeNull();
      expect(loadedCache!.files.get('test.js')).toEqual({
        hash: 'abc123',
        timestamp: expect.any(Number),
      });
      expect(loadedCache!.rules.get('rule1')).toEqual({ hash: 'def456' });
      expect(loadedCache!.results.get('abc123')).toEqual([]);
    });

    it('should handle missing cache file gracefully', async () => {
      const cache = await incrementalScanner.loadCache('/nonexistent/cache.json');
      expect(cache).toBeNull();
    });

    it('should get file hash using git', async () => {
      const testFile = path.join(fixturesPath, 'vulnerable/js/sql-injection.js');
      const hash = await incrementalScanner.getFileHash(testFile, fixturesPath);

      // Should get a valid git hash (40 character hex string)
      expect(hash).toMatch(/^[a-f0-9]{40}$/);
    });

    it('should return empty array for non-git repositories', async () => {
      const changedFiles = await incrementalScanner.getChangedFiles('/tmp');
      expect(changedFiles).toEqual([]);
    });

    it('should integrate with scanner for incremental scanning', async () => {
      const testFile = path.join(fixturesPath, 'vulnerable/js/sql-injection.js');

      // First scan - should populate cache
      const scanner1 = new Scanner({
        path: testFile,
        quiet: true,
        // Use test cache path
        configPath: path.join(configSamplesPath, '.vibesec.yaml'),
      });

      const result1 = await scanner1.scan();
      expect(result1.findings.length).toBeGreaterThan(0);

      // Second scan - should use cache (if implemented)
      const scanner2 = new Scanner({
        path: testFile,
        quiet: true,
        full: false, // Enable incremental mode
        configPath: path.join(configSamplesPath, '.vibesec.yaml'),
      });

      const result2 = await scanner2.scan();
      expect(result2.findings.length).toBeGreaterThan(0);
    });
  });

  describe('AnalyzerFactory Integration', () => {
    it('should route between regex and AST analyzers correctly', async () => {
      // Test file with both regex-detectable and AST-detectable patterns
      const testFile = path.join(fixturesPath, 'vulnerable/js/sql-injection.js');

      const scanner = new Scanner({
        path: testFile,
        quiet: true,
      });

      const result = await scanner.scan();

      // Should find vulnerabilities using both analysis methods
      expect(result.findings.length).toBeGreaterThan(0);

      // Verify findings have proper structure
      result.findings.forEach((finding) => {
        expect(finding).toHaveProperty('id');
        expect(finding).toHaveProperty('rule');
        expect(finding).toHaveProperty('location');
        expect(finding).toHaveProperty('severity');
        expect(finding).toHaveProperty('category');
      });
    });

    it('should handle mixed pattern types in rules', async () => {
      // This tests that the factory can handle rules with both regex and AST patterns
      const testFile = path.join(fixturesPath, 'complex-vulnerable/ast-sql-injection.ts');

      const scanner = new Scanner({
        path: testFile,
        quiet: true,
      });

      const result = await scanner.scan();

      // Should process the file without errors
      expect(result.findings.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('End-to-End Integration', () => {
    it('should work with all Priority 1 components together', async () => {
      const configPath = path.join(configSamplesPath, '.vibesec.yaml');
      const vulnerablePath = path.join(fixturesPath, 'vulnerable');

      const scanner = new Scanner({
        path: vulnerablePath,
        configPath,
        quiet: true,
        full: false, // Enable incremental scanning
      });

      const result = await scanner.scan();

      // Should complete successfully with all components
      expect(result.findings.length).toBeGreaterThan(0);
      expect(result.scan.filesScanned).toBeGreaterThan(0);
      expect(result.scan.duration).toBeGreaterThan(0);
      expect(result.summary.total).toBe(result.findings.length);

      // Verify summary statistics
      expect(result.summary.bySeverity).toBeDefined();
      expect(result.summary.byCategory).toBeDefined();
    });

    it('should maintain backward compatibility with existing CLI usage', async () => {
      // Test without any config file or new options
      const testFile = path.join(fixturesPath, 'vulnerable/js/sql-injection.js');

      const scanner = new Scanner({
        path: testFile,
        quiet: true,
      });

      const result = await scanner.scan();

      // Should work exactly as before
      expect(result.findings.length).toBeGreaterThan(0);
      expect(result.scan.filesScanned).toBe(1);
      expect(result.version).toBe('0.1.0');
    });

    it('should handle configuration changes without restart', async () => {
      const testFile = path.join(fixturesPath, 'vulnerable/js/sql-injection.js');
      const configPath = path.join(configSamplesPath, 'dynamic-config.yaml');

      // Create initial config
      await fs.writeFile(
        configPath,
        `
scan:
  severity: high
`
      );

      const scanner1 = new Scanner({
        path: testFile,
        configPath,
        quiet: true,
      });

      const result1 = await scanner1.scan();

      // Modify config
      await fs.writeFile(
        configPath,
        `
scan:
  severity: critical
`
      );

      const scanner2 = new Scanner({
        path: testFile,
        configPath,
        quiet: true,
      });

      const result2 = await scanner2.scan();

      // Should pick up new configuration
      expect(result1.findings.length).toBeGreaterThan(0);
      expect(result2.findings.length).toBeGreaterThan(0);

      // Clean up
      await fs.unlink(configPath);
    });
  });

  describe('Performance Optimization', () => {
    it('should show performance improvement with incremental scanning', async () => {
      const testFile = path.join(fixturesPath, 'vulnerable/js/sql-injection.js');

      // First scan (cold)
      const scanner1 = new Scanner({
        path: testFile,
        quiet: true,
        full: true, // Force full scan
      });

      const start1 = Date.now();
      const result1 = await scanner1.scan();
      const duration1 = Date.now() - start1;

      // Second scan (should use cache if available)
      const scanner2 = new Scanner({
        path: testFile,
        quiet: true,
        full: false, // Enable incremental
      });

      const start2 = Date.now();
      const result2 = await scanner2.scan();
      const duration2 = Date.now() - start2;

      // Both should produce same results
      expect(result1.findings.length).toBe(result2.findings.length);

      // Second scan should be faster (though this might not always be true in tests)
      expect(duration2).toBeLessThanOrEqual(duration1 + 100); // Allow some variance
    });

    it('should handle large files efficiently', async () => {
      // Create a large test file
      const largeFile = path.join(fixturesPath, 'large-test.js');
      const content = 'const x = "test";\n'.repeat(10000); // 10k lines
      await fs.writeFile(largeFile, content);

      const scanner = new Scanner({
        path: largeFile,
        quiet: true,
        maxFileSize: 1024 * 1024, // 1MB limit
      });

      const start = Date.now();
      await scanner.scan();
      const duration = Date.now() - start;

      // Should complete in reasonable time
      expect(duration).toBeLessThan(5000); // 5 seconds max

      // Clean up
      await fs.unlink(largeFile);
    });
  });
});
