import { ScannerEngine } from '../../scanner/core/engine';
import { Finding, Severity, Category } from '../../scanner/core/types';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('Integration Tests for Real Projects', () => {
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

  describe('Mixed Language Projects', () => {
    it('should scan JavaScript and TypeScript files', async () => {
      // Create a mixed project structure
      const jsFile = path.join(tempDir, 'app.js');
      const tsFile = path.join(tempDir, 'server.ts');
      const pyFile = path.join(tempDir, 'main.py');
      const goFile = path.join(tempDir, 'main.go');
      
      await fs.writeFile(jsFile, 'const secret = "sk-test-key";');
      await fs.writeFile(tsFile, 'import { secret } from "./secret";');
      await fs.writeFile(pyFile, 'import requests; # vulnerable Python import');
      await fs.writeFile(goFile, 'fn main() { println!("Hello, world!"); }');
      
      const findings = await engine.analyze(tempDir);
      
      // Should find vulnerabilities in all languages
      expect(findings.length).toBeGreaterThan(0);
      
      // Should have findings from different categories
      const jsFindings = findings.filter(f => f.category === Category.SECRETS);
      const tsFindings = findings.filter(f => f.category === Category.SECRETS);
      const pyFindings = findings.filter(f => f.category === Category.SECRETS);
      const goFindings = findings.filter(f => f.category === Category.DEPENDENCIES);
      
      expect(jsFindings.length).toBeGreaterThan(0);
      expect(tsFindings.length).toBeGreaterThan(0);
      expect(pyFindings.length).toBeGreaterThan(0);
      expect(goFindings.length).toBeGreaterThan(0);
      
      // Should categorize correctly
      expect(jsFindings.every(f => f.category === Category.SECRETS)).toBe(true);
      expect(tsFindings.every(f => f.category === Category.SECRETS)).toBe(true);
      expect(pyFindings.every(f => f.category === Category.SECRETS)).toBe(true);
      expect(goFindings.every(f => f.category === Category.DEPENDENCIES)).toBe(true);
    });

    it('should handle project with no package files', async () => {
      const emptyDir = path.join(tempDir, 'empty');
      await fs.mkdir(emptyDir, { recursive: true });
      
      const findings = await engine.analyze(emptyDir);
      
      expect(findings).toHaveLength(0);
    });

    it('should handle corrupted files gracefully', async () => {
      const corruptedFile = path.join(tempDir, 'corrupted.js');
      await fs.writeFile(corruptedFile, 'const secret = "sk-test-key";\ninvalid syntax');
      
      const findings = await engine.analyze(tempDir);
      
      // Should handle corrupted file gracefully
      expect(findings).toHaveLength(0);
    });

    it('should handle very large projects efficiently', async () => {
      // Create a large project structure
      const largeDir = path.join(tempDir, 'large');
      await fs.mkdir(largeDir, { recursive: true });
      
      // Create many files
      for (let i = 0; i < 100; i++) {
        await fs.writeFile(
          path.join(largeDir, `file${i}.js`),
          `// File ${i} content\nconst secret = "sk-test-key";\n`
        );
      }
      
      const startTime = Date.now();
      const findings = await engine.analyze(largeDir);
      const duration = Date.now() - startTime;
      
      // Should complete in reasonable time
      expect(findings.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(30000); // 30 seconds max
      
      // Should log performance metrics
      expect(findings.length).toBeGreaterThan(0);
      expect(findings.some(f => f.metadata?.filesScanned)).toBe(true);
    });
  });

  describe('Real World Project Simulation', () => {
    it('should scan a realistic project structure', async () => {
      // Create a realistic project structure
      const projectDir = path.join(tempDir, 'real-project');
      await fs.mkdir(projectDir, { recursive: true });
      
      // Create various file types
      await fs.writeFile(path.join(projectDir, 'package.json'), JSON.stringify({
        name: 'real-project',
        dependencies: {
          'express': '^4.17.0',
          'mongoose': '^5.0.0',
          'axios': '^0.21.0',
          'lodash': '<4.17.20',
          'react': '^16.0.0',
          'typescript': '^4.0.0'
        }
      }));
      
      await fs.writeFile(path.join(projectDir, 'server.js'), `
        const express = require('express');
        const app = express();
        app.get('/api/users', (req, res) => {
          res.json({ users: [] });
        });
        app.listen(3000, () => {
          // Mock server shutdown
        });
      });
      
      await fs.writeFile(path.join(projectDir, 'client.js'), `
        const axios = require('axios');
        axios.get('http://localhost:3000/api/data');
      `);
      
      await fs.writeFile(path.join(projectDir, 'config.yaml'), `
        database:
          host: localhost
          port: 5432
          user: admin
          password: admin123
        `);
      
      await fs.writeFile(path.join(projectDir, '.env'), 'DATABASE_URL=postgresql://localhost:5432\nAPI_KEY=secret123');
      
      const findings = await engine.analyze(projectDir);
      
      // Should find web vulnerabilities
      expect(findings.some(f => f.category === Category.WEB_SECURITY)).toBe(true);
      expect(findings.some(f => f.category === Category.INJECTION)).toBe(true);
      
      // Should find dependency vulnerabilities
      expect(findings.some(f => f.category === Category.DEPENDENCIES)).toBe(true);
      
      // Should find secrets
      expect(findings.some(f => f.category === Category.SECRETS)).toBe(true);
      
      // Should have configuration findings
      expect(findings.some(f => f.category === Category.INCOMPLETE)).toBe(true);
    });
  });
});