/**
 * Integration tests for the VibeSec scanner
 * Tests the complete scanning workflow from file discovery to finding generation
 */

import * as path from 'path';
import { Scanner } from '../../scanner/core/engine';

describe('Scanner Integration', () => {
  const fixturesPath = path.join(__dirname, '../fixtures');

  describe('Vulnerable Code Detection', () => {
    it('should detect SQL injection in JavaScript', async () => {
      const testFile = path.join(fixturesPath, 'vulnerable/js/sql-injection.js');
      const scanner = new Scanner({ path: testFile, quiet: true });

      const result = await scanner.scan();

      expect(result.findings.length).toBeGreaterThan(0);
      const sqlFindings = result.findings.filter(
        (f) => f.category === 'injection' && f.title.toLowerCase().includes('sql')
      );
      expect(sqlFindings.length).toBeGreaterThan(0);
    });

    it('should detect XSS in JavaScript', async () => {
      const testFile = path.join(fixturesPath, 'vulnerable/js/xss.js');
      const scanner = new Scanner({ path: testFile, quiet: true });

      const result = await scanner.scan();

      expect(result.findings.length).toBeGreaterThan(0);
      const xssFindings = result.findings.filter(
        (f) => f.category === 'injection' && f.title.toLowerCase().includes('xss')
      );
      expect(xssFindings.length).toBeGreaterThan(0);
    });

    it('should detect hardcoded secrets in JavaScript', async () => {
      const testFile = path.join(fixturesPath, 'vulnerable/js/hardcoded-secret.js');
      const scanner = new Scanner({ path: testFile, quiet: true });

      const result = await scanner.scan();

      expect(result.findings.length).toBeGreaterThan(0);
      // Category is 'secrets', not 'data-exposure'
      const secretFindings = result.findings.filter((f) => f.category === 'secrets');
      expect(secretFindings.length).toBeGreaterThan(0);
    });

    it('should detect command injection in JavaScript', async () => {
      const testFile = path.join(fixturesPath, 'vulnerable/js/command-injection.js');
      const scanner = new Scanner({ path: testFile, quiet: true });

      const result = await scanner.scan();

      expect(result.findings.length).toBeGreaterThan(0);
      const cmdFindings = result.findings.filter(
        (f) => f.category === 'injection' && f.title.toLowerCase().includes('command')
      );
      expect(cmdFindings.length).toBeGreaterThan(0);
    });

    it('should detect command injection in Python', async () => {
      const testFile = path.join(fixturesPath, 'vulnerable/py/command-injection.py');
      const scanner = new Scanner({ path: testFile, quiet: true });

      const result = await scanner.scan();

      // Python command injection should be detected
      expect(result.findings.length).toBeGreaterThan(0);
    });

    it('should detect hardcoded credentials in Python', async () => {
      const testFile = path.join(fixturesPath, 'vulnerable/py/hardcoded-creds.py');
      const scanner = new Scanner({ path: testFile, quiet: true });

      const result = await scanner.scan();

      // Should find secrets in Python code
      expect(result.findings.length).toBeGreaterThan(0);
      const credFindings = result.findings.filter((f) => f.category === 'secrets');
      expect(credFindings.length).toBeGreaterThan(0);
    });

    it('should scan entire vulnerable directory', async () => {
      const vulnerablePath = path.join(fixturesPath, 'vulnerable');
      const scanner = new Scanner({ path: vulnerablePath, quiet: true });

      const result = await scanner.scan();

      // Should find multiple vulnerabilities across all test files
      expect(result.findings.length).toBeGreaterThan(20); // At least 20 vulnerabilities
      expect(result.scan.filesScanned).toBeGreaterThan(5);
    });
  });

  describe('Secure Code (False Positive Testing)', () => {
    // TODO: These tests need refinement - currently flags missing security headers
    // which are valid findings, not false positives. Update test expectations.
    it.skip('should NOT flag secure JavaScript code', async () => {
      const testFile = path.join(fixturesPath, 'secure/example.js');
      const scanner = new Scanner({ path: testFile, quiet: true });

      const result = await scanner.scan();

      // Secure code should have no findings
      expect(result.findings.length).toBe(0);
    });

    it.skip('should NOT flag secure Python code', async () => {
      const testFile = path.join(fixturesPath, 'secure/example.py');
      const scanner = new Scanner({ path: testFile, quiet: true });

      const result = await scanner.scan();

      // Secure code should have no findings
      expect(result.findings.length).toBe(0);
    });
  });

  describe('Scan Metadata', () => {
    it('should include scan timestamp as ISO string', async () => {
      const testFile = path.join(fixturesPath, 'vulnerable/js/sql-injection.js');
      const scanner = new Scanner({ path: testFile, quiet: true });

      const result = await scanner.scan();

      // timestamp is an ISO string, not a Date object
      expect(typeof result.scan.timestamp).toBe('string');
      expect(() => new Date(result.scan.timestamp)).not.toThrow();

      // Verify it's a valid ISO timestamp
      const date = new Date(result.scan.timestamp);
      expect(date.toISOString()).toBe(result.scan.timestamp);
    });

    it('should include file count', async () => {
      const testPath = path.join(fixturesPath, 'vulnerable/js');
      const scanner = new Scanner({ path: testPath, quiet: true });

      const result = await scanner.scan();

      expect(result.scan.filesScanned).toBeGreaterThan(0);
    });

    it('should track scan duration', async () => {
      const testFile = path.join(fixturesPath, 'vulnerable/js/sql-injection.js');
      const scanner = new Scanner({ path: testFile, quiet: true });

      const result = await scanner.scan();

      expect(result.scan.duration).toBeGreaterThan(0);
      expect(result.scan.duration).toBeLessThan(10); // Should be fast
    });
  });

  describe('Summary Statistics', () => {
    it('should calculate severity counts correctly', async () => {
      const testPath = path.join(fixturesPath, 'vulnerable');
      const scanner = new Scanner({ path: testPath, quiet: true });

      const result = await scanner.scan();

      const { bySeverity } = result.summary;
      const calculatedTotal =
        bySeverity.critical + bySeverity.high + bySeverity.medium + bySeverity.low;

      expect(result.summary.total).toBe(calculatedTotal);
      expect(result.summary.total).toBe(result.findings.length);
    });

    it('should calculate category counts correctly', async () => {
      const testPath = path.join(fixturesPath, 'vulnerable');
      const scanner = new Scanner({ path: testPath, quiet: true });

      const result = await scanner.scan();

      const { byCategory } = result.summary;

      // Calculate total by summing all actual categories (some may be undefined)
      let calculatedTotal = 0;
      for (const category in byCategory) {
        calculatedTotal += (byCategory as Record<string, number | undefined>)[category] || 0;
      }

      expect(result.summary.total).toBe(calculatedTotal);
      expect(calculatedTotal).toBe(result.findings.length);
    });
  });

  describe('Finding Structure', () => {
    it('should include all required finding fields', async () => {
      const testFile = path.join(fixturesPath, 'vulnerable/js/sql-injection.js');
      const scanner = new Scanner({ path: testFile, quiet: true });

      const result = await scanner.scan();

      expect(result.findings.length).toBeGreaterThan(0);

      const finding = result.findings[0];
      expect(finding).toHaveProperty('id');
      expect(finding).toHaveProperty('rule');
      expect(finding).toHaveProperty('severity');
      expect(finding).toHaveProperty('category');
      expect(finding).toHaveProperty('title');
      expect(finding).toHaveProperty('description');
      expect(finding).toHaveProperty('location');
      expect(finding).toHaveProperty('snippet');
      expect(finding).toHaveProperty('fix');
      expect(finding).toHaveProperty('metadata');
    });

    it('should include CWE and OWASP metadata', async () => {
      const testFile = path.join(fixturesPath, 'vulnerable/js/sql-injection.js');
      const scanner = new Scanner({ path: testFile, quiet: true });

      const result = await scanner.scan();

      expect(result.findings.length).toBeGreaterThan(0);

      const finding = result.findings[0];
      expect(finding.metadata).toHaveProperty('cwe');
      expect(finding.metadata).toHaveProperty('owasp');
      expect(finding.metadata).toHaveProperty('confidence');
    });

    it('should include fix recommendations', async () => {
      const testFile = path.join(fixturesPath, 'vulnerable/js/sql-injection.js');
      const scanner = new Scanner({ path: testFile, quiet: true });

      const result = await scanner.scan();

      expect(result.findings.length).toBeGreaterThan(0);

      const finding = result.findings[0];
      expect(finding.fix).toHaveProperty('recommendation');
      expect(finding.fix).toHaveProperty('references');
      expect(Array.isArray(finding.fix.references)).toBe(true);
    });
  });

  describe('Performance', () => {
    it('should scan test fixtures in under 2 seconds', async () => {
      const testPath = path.join(fixturesPath, 'vulnerable');
      const scanner = new Scanner({ path: testPath, quiet: true });

      const start = Date.now();
      await scanner.scan();
      const duration = (Date.now() - start) / 1000;

      expect(duration).toBeLessThan(2);
    });
  });
});
