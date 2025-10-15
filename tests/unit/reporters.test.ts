import { JsonReporter } from '../../reporters/json';
import { PlainTextReporter } from '../../reporters/plaintext';
import { ScanResult, Finding, Severity } from '../../scanner/core/types';

describe('Reporters', () => {
  const createTestFinding = (overrides: Partial<Finding> = {}): Finding => ({
    id: 'test-finding-1',
    rule: 'test-rule',
    severity: Severity.HIGH,
    category: 'injection',
    title: 'SQL Injection',
    description: 'SQL injection vulnerability detected',
    location: {
      file: 'test.js',
      line: 10,
      column: 5,
    },
    snippet: '  10 | const query = "SELECT * FROM users WHERE id = " + userId;',
    fix: {
      recommendation: 'Use parameterized queries',
      before: 'const query = "SELECT * FROM users WHERE id = " + userId;',
      after: 'const query = "SELECT * FROM users WHERE id = ?";',
      references: ['https://owasp.org/sql-injection'],
    },
    metadata: {
      confidence: 0.89,
      cwe: 'CWE-89',
      owasp: 'A1:2017',
    },
    ...overrides,
  });

  const createTestResult = (findings: Finding[] = []): ScanResult => ({
    scan: {
      path: '/test/path',
      timestamp: new Date('2025-01-01T00:00:00Z'),
      filesScanned: 10,
      rulesApplied: 5,
      duration: 1.23,
    },
    summary: {
      total: findings.length,
      bySeverity: {
        critical: findings.filter(f => f.severity === Severity.CRITICAL).length,
        high: findings.filter(f => f.severity === Severity.HIGH).length,
        medium: findings.filter(f => f.severity === Severity.MEDIUM).length,
        low: findings.filter(f => f.severity === Severity.LOW).length,
      },
      byCategory: {
        injection: findings.filter(f => f.category === 'injection').length,
        crypto: findings.filter(f => f.category === 'crypto').length,
        'auth-authz': findings.filter(f => f.category === 'auth-authz').length,
        'insecure-config': findings.filter(f => f.category === 'insecure-config').length,
        'data-exposure': findings.filter(f => f.category === 'data-exposure').length,
        other: 0,
      },
    },
    findings,
  });

  describe('JsonReporter', () => {
    const reporter = new JsonReporter();

    it('should generate valid JSON', () => {
      const finding = createTestFinding();
      const result = createTestResult([finding]);
      
      const output = reporter.generate(result);
      
      expect(() => JSON.parse(output)).not.toThrow();
    });

    it('should include all scan metadata', () => {
      const result = createTestResult([]);
      const output = reporter.generate(result);
      const parsed = JSON.parse(output);
      
      expect(parsed.scan).toBeDefined();
      expect(parsed.scan.path).toBe('/test/path');
      expect(parsed.scan.filesScanned).toBe(10);
      expect(parsed.scan.rulesApplied).toBe(5);
      expect(parsed.scan.duration).toBe(1.23);
    });

    it('should include summary statistics', () => {
      const findings = [
        createTestFinding({ severity: Severity.CRITICAL }),
        createTestFinding({ severity: Severity.HIGH }),
        createTestFinding({ severity: Severity.MEDIUM }),
      ];
      const result = createTestResult(findings);
      const output = reporter.generate(result);
      const parsed = JSON.parse(output);
      
      expect(parsed.summary.total).toBe(3);
      expect(parsed.summary.bySeverity.critical).toBe(1);
      expect(parsed.summary.bySeverity.high).toBe(1);
      expect(parsed.summary.bySeverity.medium).toBe(1);
    });

    it('should include all finding fields', () => {
      const finding = createTestFinding();
      const result = createTestResult([finding]);
      const output = reporter.generate(result);
      const parsed = JSON.parse(output);
      
      const outputFinding = parsed.findings[0];
      expect(outputFinding.id).toBe('test-finding-1');
      expect(outputFinding.rule).toBe('test-rule');
      expect(outputFinding.severity).toBe('high');
      expect(outputFinding.category).toBe('injection');
      expect(outputFinding.title).toBe('SQL Injection');
      expect(outputFinding.description).toBeDefined();
      expect(outputFinding.location).toBeDefined();
      expect(outputFinding.snippet).toBeDefined();
      expect(outputFinding.fix).toBeDefined();
      expect(outputFinding.metadata).toBeDefined();
    });

    it('should include CWE and OWASP metadata', () => {
      const finding = createTestFinding();
      const result = createTestResult([finding]);
      const output = reporter.generate(result);
      const parsed = JSON.parse(output);
      
      const outputFinding = parsed.findings[0];
      expect(outputFinding.metadata.cwe).toBe('CWE-89');
      expect(outputFinding.metadata.owasp).toBe('A1:2017');
      expect(outputFinding.metadata.confidence).toBe(0.89);
    });

    it('should format JSON with proper indentation', () => {
      const result = createTestResult([]);
      const output = reporter.generate(result);
      
      expect(output).toContain('\n');
      expect(output).toContain('  '); // Should have 2-space indentation
    });

    it('should handle empty findings', () => {
      const result = createTestResult([]);
      const output = reporter.generate(result);
      const parsed = JSON.parse(output);
      
      expect(parsed.findings).toEqual([]);
      expect(parsed.summary.total).toBe(0);
    });
  });

  describe('PlainTextReporter', () => {
    const reporter = new PlainTextReporter();

    it('should generate text output', () => {
      const result = createTestResult([]);
      const output = reporter.generate(result);
      
      expect(typeof output).toBe('string');
      expect(output.length).toBeGreaterThan(0);
    });

    it('should include header', () => {
      const result = createTestResult([]);
      const output = reporter.generate(result);
      
      expect(output).toContain('VibeSec Security Scan Results');
    });

    it('should include scan metadata', () => {
      const result = createTestResult([]);
      const output = reporter.generate(result);
      
      expect(output).toContain('/test/path');
      expect(output).toContain('10'); // files scanned
      expect(output).toContain('1.23'); // duration
    });

    it('should show success message when no findings', () => {
      const result = createTestResult([]);
      const output = reporter.generate(result);
      
      expect(output).toContain('No security issues detected');
    });

    it('should list findings when present', () => {
      const finding = createTestFinding();
      const result = createTestResult([finding]);
      const output = reporter.generate(result);
      
      expect(output).toContain('SQL Injection');
      expect(output).toContain('test.js:10');
      expect(output).toContain('Use parameterized queries');
    });

    it('should include severity indicators', () => {
      const findings = [
        createTestFinding({ severity: Severity.CRITICAL, title: 'Critical Issue' }),
        createTestFinding({ severity: Severity.HIGH, title: 'High Issue' }),
        createTestFinding({ severity: Severity.MEDIUM, title: 'Medium Issue' }),
        createTestFinding({ severity: Severity.LOW, title: 'Low Issue' }),
      ];
      const result = createTestResult(findings);
      const output = reporter.generate(result);
      
      expect(output).toContain('CRITICAL');
      expect(output).toContain('HIGH');
      expect(output).toContain('MEDIUM');
      expect(output).toContain('LOW');
    });

    it('should include code snippets', () => {
      const finding = createTestFinding({
        snippet: '  10 | const query = "SELECT * FROM users WHERE id = " + userId;',
      });
      const result = createTestResult([finding]);
      const output = reporter.generate(result);
      
      expect(output).toContain('Code:');
      expect(output).toContain('const query =');
    });

    it('should include fix recommendations', () => {
      const finding = createTestFinding();
      const result = createTestResult([finding]);
      const output = reporter.generate(result);
      
      expect(output).toContain('Fix:');
      expect(output).toContain('Use parameterized queries');
    });

    it('should include references', () => {
      const finding = createTestFinding();
      const result = createTestResult([finding]);
      const output = reporter.generate(result);
      
      expect(output).toContain('References:');
      expect(output).toContain('https://owasp.org/sql-injection');
    });

    it('should include CWE and OWASP metadata', () => {
      const finding = createTestFinding();
      const result = createTestResult([finding]);
      const output = reporter.generate(result);
      
      expect(output).toContain('CWE-89');
      expect(output).toContain('OWASP A1:2017');
    });

    it('should include summary statistics', () => {
      const findings = [
        createTestFinding({ severity: Severity.CRITICAL }),
        createTestFinding({ severity: Severity.HIGH }),
      ];
      const result = createTestResult(findings);
      const output = reporter.generate(result);
      
      expect(output).toContain('Summary:');
      expect(output).toContain('2 security issues detected');
    });

    it('should include next steps when findings exist', () => {
      const finding = createTestFinding();
      const result = createTestResult([finding]);
      const output = reporter.generate(result);
      
      expect(output).toContain('Next Steps:');
      expect(output).toContain('Fix CRITICAL issues immediately');
    });

    it('should sort findings by severity', () => {
      const findings = [
        createTestFinding({ severity: Severity.LOW, title: 'Low Issue' }),
        createTestFinding({ severity: Severity.CRITICAL, title: 'Critical Issue' }),
        createTestFinding({ severity: Severity.MEDIUM, title: 'Medium Issue' }),
        createTestFinding({ severity: Severity.HIGH, title: 'High Issue' }),
      ];
      const result = createTestResult(findings);
      const output = reporter.generate(result);
      
      const criticalPos = output.indexOf('Critical Issue');
      const highPos = output.indexOf('High Issue');
      const mediumPos = output.indexOf('Medium Issue');
      const lowPos = output.indexOf('Low Issue');
      
      expect(criticalPos).toBeLessThan(highPos);
      expect(highPos).toBeLessThan(mediumPos);
      expect(mediumPos).toBeLessThan(lowPos);
    });
  });
});
