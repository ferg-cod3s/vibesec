import { describe, it, expect, beforeEach } from 'bun:test';
import { Scanner } from '../../scanner/core/engine';
import { Finding } from '../../scanner/core/types';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('Enhanced Detection Capabilities', () => {
  let scanner: Scanner;
  const testFixturesDir = path.join(process.cwd(), 'tests/fixtures');

  beforeEach(() => {
    scanner = new Scanner({
      path: testFixturesDir,
      parallel: false,
      quiet: true,
      full: true,
    });
  });

  describe('AST Pattern Detection', () => {
    it('should detect SQL injection using AST patterns', async () => {
      const result = await scanner.scan();
      const sqlFindings = result.findings.filter(
        (f) => f.rule.includes('sql-injection') && f.category === 'injection'
      );

      expect(sqlFindings.length).toBeGreaterThan(0);
      expect(sqlFindings.some((f) => f.location.file.includes('sql-injection'))).toBe(true);
    });

    it('should detect XSS using AST patterns', async () => {
      const result = await scanner.scan();
      const xssFindings = result.findings.filter(
        (f) => f.rule.includes('xss') && f.category === 'injection'
      );

      expect(xssFindings.length).toBeGreaterThan(0);
      expect(xssFindings.some((f) => f.location.file.includes('xss'))).toBe(true);
    });

    it('should detect command injection using AST patterns', async () => {
      const result = await scanner.scan();
      const cmdFindings = result.findings.filter(
        (f) => f.rule.includes('command-injection') && f.category === 'injection'
      );

      expect(cmdFindings.length).toBeGreaterThan(0);
      expect(cmdFindings.some((f) => f.location.file.includes('command-injection'))).toBe(true);
    });
  });

  describe('Taint Analysis Detection', () => {
    it('should detect tainted data flows in vulnerable code', async () => {
      const result = await scanner.scan();
      const taintFindings = result.findings.filter(
        (f) => f.metadata?.confidence && f.metadata.confidence > 0.7
      );

      // Should have high-confidence findings from taint analysis
      expect(taintFindings.length).toBeGreaterThan(0);
    });

    it('should track source-to-sink data flows', async () => {
      const result = await scanner.scan();
      const complexFindings = result.findings.filter((f) =>
        f.location.file.includes('complex-vulnerable')
      );

      // Complex vulnerable files should have multiple findings
      expect(complexFindings.length).toBeGreaterThan(5);
    });
  });

  describe('EQL Pattern Detection', () => {
    it('should detect patterns using EQL queries', async () => {
      const result = await scanner.scan();
      // EQL patterns should provide more precise detection
      const eqlFindings = result.findings.filter(
        (f) => f.metadata?.confidence === 1.0 // Perfect confidence from EQL
      );

      expect(eqlFindings.length).toBeGreaterThan(0);
    });

    it('should handle complex logical expressions in EQL', async () => {
      const result = await scanner.scan();
      // Should detect patterns with AND/OR logic
      const logicalFindings = result.findings.filter(
        (f) => f.description.includes('AND') || f.description.includes('OR')
      );

      expect(logicalFindings.length).toBeGreaterThan(0);
    });
  });

  describe('Multi-Language Support', () => {
    it('should detect vulnerabilities in JavaScript files', async () => {
      const result = await scanner.scan();
      const jsFindings = result.findings.filter((f) => f.location.file.endsWith('.js'));

      expect(jsFindings.length).toBeGreaterThan(0);
    });

    it('should detect vulnerabilities in Python files', async () => {
      const result = await scanner.scan();
      const pyFindings = result.findings.filter((f) => f.location.file.endsWith('.py'));

      expect(pyFindings.length).toBeGreaterThan(0);
    });

    it('should detect vulnerabilities in TypeScript files', async () => {
      const result = await scanner.scan();
      const tsFindings = result.findings.filter((f) => f.location.file.endsWith('.ts'));

      expect(tsFindings.length).toBeGreaterThan(0);
    });
  });

  describe('Enhanced Finding Quality', () => {
    it('should provide detailed location information', async () => {
      const result = await scanner.scan();
      const detailedFindings = result.findings.filter(
        (f) => f.location.line > 0 && f.location.column >= 0 && f.snippet.length > 0
      );

      expect(detailedFindings.length).toBeGreaterThan(0);
    });

    it('should include fix recommendations with actionable advice', async () => {
      const result = await scanner.scan();
      const actionableFindings = result.findings.filter(
        (f) =>
          f.fix.recommendation.length > 50 && // Detailed recommendation
          f.fix.references.length > 0 // Has references
      );

      expect(actionableFindings.length).toBeGreaterThan(0);
    });

    it('should include security metadata (CWE/OWASP)', async () => {
      const result = await scanner.scan();
      const secureFindings = result.findings.filter((f) => f.metadata?.cwe || f.metadata?.owasp);

      expect(secureFindings.length).toBeGreaterThan(0);
    });
  });

  describe('Performance Under Load', () => {
    it('should handle multiple complex files without timeout', async () => {
      const start = Date.now();
      const result = await scanner.scan();
      const duration = Date.now() - start;

      // Should complete within reasonable time even with enhanced analysis
      expect(duration).toBeLessThan(30000); // 30 seconds max
      expect(result.findings.length).toBeGreaterThan(100);
    });

    it('should maintain accuracy with parallel processing', async () => {
      const parallelScanner = new Scanner({
        path: testFixturesDir,
        parallel: true,
        quiet: true,
        full: true,
      });

      const sequentialScanner = new Scanner({
        path: testFixturesDir,
        parallel: false,
        quiet: true,
        full: true,
      });

      const [parallelResult, sequentialResult] = await Promise.all([
        parallelScanner.scan(),
        sequentialScanner.scan(),
      ]);

      // Results should be consistent regardless of parallel/sequential
      expect(parallelResult.findings.length).toBe(sequentialResult.findings.length);
      expect(parallelResult.summary.total).toBe(sequentialResult.summary.total);
    });
  });
});
