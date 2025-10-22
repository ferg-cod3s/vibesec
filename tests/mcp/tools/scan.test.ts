/**
 * Tests for vibesec_scan MCP tool
 */

import { vibesecScanTool, handleScan } from '../../../src/mcp/tools/scan';
import { writeFile, mkdir, rm } from 'fs/promises';
import { join } from 'path';

describe('vibesec_scan MCP Tool', () => {
  const testDir = join(process.cwd(), 'tests', 'mcp', 'fixtures', 'scan-test');

  beforeAll(async () => {
    // Create test directory
    await mkdir(testDir, { recursive: true });

    // Create a test file with a vulnerability
    await writeFile(
      join(testDir, 'test-file.ts'),
      `
// Test file with hardcoded secret
const API_KEY = "sk-1234567890abcdef";
const PASSWORD = "admin123";

function authenticateUser(username: string, password: string) {
  // Incomplete implementation
  // TODO: Add authentication logic
}
      `.trim()
    );
  });

  describe('Tool Schema', () => {
    it('should have correct name', () => {
      expect(vibesecScanTool.name).toBe('vibesec_scan');
    });

    it('should have description', () => {
      expect(vibesecScanTool.description).toBeTruthy();
      expect(typeof vibesecScanTool.description).toBe('string');
    });

    it('should have valid input schema', () => {
      expect(vibesecScanTool.inputSchema).toBeTruthy();
      expect(vibesecScanTool.inputSchema.type).toBe('object');
      expect(vibesecScanTool.inputSchema.properties).toBeTruthy();
      expect(vibesecScanTool.inputSchema.properties.files).toBeTruthy();
    });

    it('should require files parameter', () => {
      expect(vibesecScanTool.inputSchema.required).toContain('files');
    });

    it('should have handler function', () => {
      expect(typeof vibesecScanTool.handler).toBe('function');
    });
  });

  describe('Parameter Validation', () => {
    it('should reject missing parameters', async () => {
      await expect(handleScan(undefined)).rejects.toThrow('Invalid parameters');
    });

    it('should reject non-object parameters', async () => {
      await expect(handleScan('invalid')).rejects.toThrow('Invalid parameters');
    });

    it('should reject missing files parameter', async () => {
      await expect(handleScan({})).rejects.toThrow('"files" is required');
    });

    it('should reject empty files array', async () => {
      await expect(handleScan({ files: [] })).rejects.toThrow('cannot be empty');
    });

    it('should reject non-array files', async () => {
      await expect(handleScan({ files: 'not-an-array' })).rejects.toThrow('must be an array');
    });

    it('should reject non-string files elements', async () => {
      await expect(handleScan({ files: [123, 'valid'] })).rejects.toThrow('must be strings');
    });

    it('should reject invalid severity', async () => {
      await expect(
        handleScan({ files: ['test.ts'], severity: 'invalid' })
      ).rejects.toThrow('severity');
    });

    it('should reject invalid format', async () => {
      await expect(
        handleScan({ files: ['test.ts'], format: 'invalid' })
      ).rejects.toThrow('format');
    });
  });

  describe('Scanning Functionality', () => {
    it('should scan a single file', async () => {
      const result = await handleScan({
        files: [join(testDir, 'test-file.ts')],
        basePath: testDir,
      });

      expect(result).toBeTruthy();
      expect(result.findings).toBeInstanceOf(Array);
      expect(result.summary).toBeTruthy();
      expect(result.scan).toBeTruthy();
      expect(result.status).toBeTruthy();
    });

    it('should include summary statistics', async () => {
      const result = await handleScan({
        files: [join(testDir, 'test-file.ts')],
        basePath: testDir,
      });

      expect(result.summary.total).toBeGreaterThanOrEqual(0);
      expect(result.summary.critical).toBeGreaterThanOrEqual(0);
      expect(result.summary.high).toBeGreaterThanOrEqual(0);
      expect(result.summary.medium).toBeGreaterThanOrEqual(0);
      expect(result.summary.low).toBeGreaterThanOrEqual(0);
      expect(result.summary.filesScanned).toBeGreaterThan(0);
    });

    it('should include scan metadata', async () => {
      const result = await handleScan({
        files: [join(testDir, 'test-file.ts')],
        basePath: testDir,
      });

      expect(result.scan.timestamp).toBeTruthy();
      expect(typeof result.scan.duration).toBe('number');
      expect(result.scan.path).toBeTruthy();
    });

    it('should return appropriate status', async () => {
      const result = await handleScan({
        files: [join(testDir, 'test-file.ts')],
        basePath: testDir,
      });

      expect(['pass', 'warning', 'fail']).toContain(result.status);
    });

    it('should respect severity filtering', async () => {
      const result = await handleScan({
        files: [join(testDir, 'test-file.ts')],
        basePath: testDir,
        severity: 'high',
      });

      expect(result.findings.every((f) => ['critical', 'high'].includes(f.severity))).toBe(true);
    });
  });

  describe('Finding Format', () => {
    it('should return findings with required fields', async () => {
      const result = await handleScan({
        files: [join(testDir, 'test-file.ts')],
        basePath: testDir,
      });

      if (result.findings.length > 0) {
        const finding = result.findings[0];
        expect(finding.id).toBeTruthy();
        expect(finding.rule).toBeTruthy();
        expect(finding.severity).toBeTruthy();
        expect(finding.category).toBeTruthy();
        expect(finding.title).toBeTruthy();
        expect(finding.description).toBeTruthy();
        expect(finding.location).toBeTruthy();
      }
    });
  });
});
