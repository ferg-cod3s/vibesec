import { DependencyAnalyzer } from '../../scanner/analyzers/dependency';
import { Finding, Severity, Category } from '../../scanner/core/types';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('DependencyAnalyzer', () => {
  let analyzer: DependencyAnalyzer;
  let tempDir: string;

  beforeEach(() => {
    analyzer = new DependencyAnalyzer();
    tempDir = '/tmp/vibesec-test-' + Math.random().toString(36).substring(7);
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('fileExists', () => {
    it('should return true for existing files', async () => {
      const testFile = path.join(tempDir, 'test.txt');
      await fs.writeFile(testFile, 'test');
      
      const exists = await (analyzer as any).fileExists(testFile);
      expect(exists).toBe(true);
    });

    it('should return false for non-existing files', async () => {
      const nonExistentFile = path.join(tempDir, 'nonexistent.txt');
      
      const exists = await (analyzer as any).fileExists(nonExistentFile);
      expect(exists).toBe(false);
    });
  });

  describe('analyzeNpm', () => {
    beforeEach(async () => {
      await fs.mkdir(tempDir, { recursive: true });
    });

    it('should handle npm audit command not found gracefully', async () => {
      const packageJson = { name: 'test-project', dependencies: {} };
      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      // Mock execSync to throw command not found error
      const { execSync } = require('child_process');
      const originalExecSync = execSync;
      (global as any).execSync = jest.fn(() => {
        const error = new Error('Command not found: npm-audit') as any;
        (error as any).code = 'ENOENT';
        throw error;
      });

      const findings = await (analyzer as any).analyzeNpm(tempDir);
      
      // Should return empty findings when npm audit fails
      expect(findings).toHaveLength(0);

      // Restore original execSync
      (global as any).execSync = originalExecSync;
    });

    it('should handle malformed npm audit output gracefully', async () => {
      const packageJson = { name: 'test-project', dependencies: {} };
      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      // Mock execSync to return malformed JSON
      const { execSync } = require('child_process');
      const originalExecSync = execSync;
      (global as any).execSync = jest.fn(() => 'invalid json output');

      const findings = await (analyzer as any).analyzeNpm(tempDir);
      
      // Should handle malformed JSON gracefully
      expect(findings).toHaveLength(0);

      // Restore original execSync
      (global as any).execSync = originalExecSync;
    });

    it('should handle empty dependencies', async () => {
      const packageJson = { name: 'test-project', dependencies: {} };
      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      // Mock successful audit with no vulnerabilities
      const { execSync } = require('child_process');
      const originalExecSync = execSync;
      (global as any).execSync = jest.fn(() => JSON.stringify({ vulnerabilities: {} }));

      const findings = await (analyzer as any).analyzeNpm(tempDir);
      
      expect(findings).toHaveLength(0);

      // Restore original execSync
      (global as any).execSync = originalExecSync;
    });
  });

  describe('analyzeCargo', () => {
    beforeEach(async () => {
      await fs.mkdir(tempDir, { recursive: true });
    });

    it('should handle cargo audit command not found gracefully', async () => {
      const cargoToml = `
[package]
name = "test-project"
version = "0.1.0"
      `.trim();

      await fs.writeFile(
        path.join(tempDir, 'Cargo.toml'),
        cargoToml
      );

      // Mock execSync to throw command not found error
      const { execSync } = require('child_process');
      const originalExecSync = execSync;
      (global as any).execSync = jest.fn(() => {
        const error = new Error('Command not found: cargo-audit') as any;
        (error as any).code = 'ENOENT';
        throw error;
      });

      const findings = await (analyzer as any).analyzeCargo(tempDir);
      
      // Should return empty findings when cargo audit fails
      expect(findings).toHaveLength(0);

      // Restore original execSync
      (global as any).execSync = originalExecSync;
    });

    it('should map cargo severity levels correctly', async () => {
      const analyzer = new DependencyAnalyzer();
      
      expect((analyzer as any).mapCargoSeverity('critical')).toBe(Severity.CRITICAL);
      expect((analyzer as any).mapCargoSeverity('high')).toBe(Severity.HIGH);
      expect((analyzer as any).mapCargoSeverity('medium')).toBe(Severity.MEDIUM);
      expect((analyzer as any).mapCargoSeverity('moderate')).toBe(Severity.MEDIUM);
      expect((analyzer as any).mapCargoSeverity('low')).toBe(Severity.LOW);
      expect((analyzer as any).mapCargoSeverity('informational')).toBe(Severity.LOW);
      expect((analyzer as any).mapCargoSeverity('unknown')).toBe(Severity.MEDIUM);
      expect((analyzer as any).mapCargoSeverity(null)).toBe(Severity.MEDIUM);
      expect((analyzer as any).mapCargoSeverity(undefined)).toBe(Severity.MEDIUM);
    });
  });

  describe('analyzePython', () => {
    beforeEach(async () => {
      await fs.mkdir(tempDir, { recursive: true });
    });

    it('should handle pip-audit command not found gracefully', async () => {
      const requirementsTxt = 'requests==2.25.0\n';
      await fs.writeFile(
        path.join(tempDir, 'requirements.txt'),
        requirementsTxt
      );

      // Mock execSync to throw command not found error
      const { execSync } = require('child_process');
      const originalExecSync = execSync;
      (global as any).execSync = jest.fn(() => {
        const error = new Error('Command not found: pip-audit') as any;
        (error as any).code = 'ENOENT';
        throw error;
      });

      const findings = await (analyzer as any).analyzePython(tempDir);
      
      // Should return empty findings when pip-audit fails
      expect(findings).toHaveLength(0);

      // Restore original execSync
      (global as any).execSync = originalExecSync;
    });

    it('should map Python severity levels correctly', async () => {
      const analyzer = new DependencyAnalyzer();
      
      expect((analyzer as any).mapPythonSeverity('critical')).toBe(Severity.CRITICAL);
      expect((analyzer as any).mapPythonSeverity('high')).toBe(Severity.HIGH);
      expect((analyzer as any).mapPythonSeverity('medium')).toBe(Severity.MEDIUM);
      expect((analyzer as any).mapPythonSeverity('low')).toBe(Severity.LOW);
      expect((analyzer as any).mapPythonSeverity('unknown')).toBe(Severity.MEDIUM);
      expect((analyzer as any).mapPythonSeverity(null)).toBe(Severity.MEDIUM);
      expect((analyzer as any).mapPythonSeverity(undefined)).toBe(Severity.MEDIUM);
    });
  });

  describe('analyze', () => {
    beforeEach(async () => {
      await fs.mkdir(tempDir, { recursive: true });
    });

    it('should handle project with no dependencies', async () => {
      // Empty directory with no package files
      const findings = await analyzer.analyze(tempDir);
      
      expect(findings).toHaveLength(0);
    });

    it('should handle project with no dependency files', async () => {
      // Empty directory with no package files
      const findings = await analyzer.analyze(tempDir);
      
      expect(findings).toHaveLength(0);
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      await fs.mkdir(tempDir, { recursive: true });
    });

    it('should handle file system errors gracefully', async () => {
      const packageJson = { name: 'test-project', dependencies: {} };
      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      // Mock fs.readFile to throw error
      const originalReadFile = fs.readFile;
      (fs as any).readFile = jest.fn().mockRejectedValue(new Error('Permission denied'));

      const findings = await analyzer.analyze(tempDir);
      
      // Should handle error and continue
      expect(Array.isArray(findings)).toBe(true);

      // Restore
      (fs as any).readFile = originalReadFile;
    });

    it('should handle execSync timeout or failure', async () => {
      const packageJson = { name: 'test-project', dependencies: {} };
      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      // Mock execSync to throw timeout error
      const { execSync } = require('child_process');
      const originalExecSync = execSync;
      (global as any).execSync = jest.fn(() => {
        const error = new Error('Command timed out') as any;
        (error as any).code = 'ETIMEDOUT';
        throw error;
      });

      const findings = await analyzer.analyze(tempDir);
      
      // Should handle timeout gracefully
      expect(Array.isArray(findings)).toBe(true);

      // Restore
      (global as any).execSync = originalExecSync;
    });
  });
});