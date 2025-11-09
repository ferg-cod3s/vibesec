import { Scanner } from '../../scanner/core/engine';
import { ConfigLoader } from '../../src/config/config-loader';
import { IncrementalScanner } from '../../src/incremental/incremental-scanner';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('Priority 2 Performance Benchmarks', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'vibesec-perf-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('End-to-End Scan Performance', () => {
    test('should scan 1000 files within performance target', async () => {
      const fileCount = 1000;
      const vulnerablePattern = `
function testFunction() {
  const userInput = req.body.data;
  const query = "SELECT * FROM users WHERE id = " + userInput;
  return db.query(query);
}
      `;

      // Create test files
      for (let i = 0; i < fileCount; i++) {
        const filePath = path.join(tempDir, `file${i}.js`);
        await fs.writeFile(filePath, vulnerablePattern);
      }

      const startTime = Date.now();

      const scanner = new Scanner({
        path: tempDir,
        rulesPath: '../../rules/default',
        parallel: true,
        maxFileSize: 1024 * 1024,
      });

      const result = await scanner.scan();

      const scanTime = Date.now() - startTime;
      const filesPerSecond = fileCount / (scanTime / 1000);

      // Performance target: <2 minutes for 10K files = <12 seconds for 1K files
      expect(scanTime).toBeLessThan(12000);
      expect(filesPerSecond).toBeGreaterThan(80);
      expect(result.summary.filesScanned).toBe(fileCount);
      expect(result.findings.length).toBeGreaterThan(0);

      console.log(
        `Scan Performance: ${fileCount} files in ${scanTime}ms (${filesPerSecond.toFixed(2)} files/sec)`
      );
    });

    test('should handle mixed file types efficiently', async () => {
      const fileTypes = [
        { ext: '.js', content: 'const x = 1;' },
        { ext: '.ts', content: 'const x: number = 1;' },
        { ext: '.py', content: 'x = 1' },
        { ext: '.jsx', content: 'const App = () => <div>Test</div>;' },
      ];

      const filesPerType = 250;

      // Create mixed file types
      for (const type of fileTypes) {
        for (let i = 0; i < filesPerType; i++) {
          const filePath = path.join(tempDir, `file${i}${type.ext}`);
          await fs.writeFile(filePath, type.content);
        }
      }

      const startTime = Date.now();

      const scanner = new Scanner({
        path: tempDir,
        rulesPath: '../../rules/default',
        parallel: true,
      });

      const result = await scanner.scan();

      const scanTime = Date.now() - startTime;
      const totalFiles = filesPerType * fileTypes.length;

      expect(scanTime).toBeLessThan(15000); // Should handle mixed types efficiently
      expect(result.summary.filesScanned).toBe(totalFiles);

      console.log(`Mixed Types Performance: ${totalFiles} files in ${scanTime}ms`);
    });
  });

  describe('Incremental Scan Performance', () => {
    test('should complete incremental scan within target', async () => {
      // Initialize git repo
      const { execSync } = require('child_process');
      execSync('git init', { cwd: tempDir });
      execSync('git config user.email "test@example.com"', { cwd: tempDir });
      execSync('git config user.name "Test User"', { cwd: tempDir });

      // Create initial files
      const initialFileCount = 500;
      for (let i = 0; i < initialFileCount; i++) {
        const filePath = path.join(tempDir, `initial${i}.js`);
        await fs.writeFile(filePath, 'const x = 1;');
      }

      execSync('git add .', { cwd: tempDir });
      execSync('git commit -m "Initial commit"', { cwd: tempDir });

      // Modify subset of files
      const changedFileCount = 100;
      for (let i = 0; i < changedFileCount; i++) {
        const filePath = path.join(tempDir, `changed${i}.js`);
        await fs.writeFile(
          filePath,
          `
const userInput = req.body.data;
const query = "SELECT * FROM table WHERE id = " + userInput;
        `
        );
      }

      // Test incremental scanning
      const incrementalScanner = new IncrementalScanner();
      const changedFiles = await incrementalScanner.getChangedFiles(tempDir, 'HEAD');

      const startTime = Date.now();

      const scanner = new Scanner({
        path: tempDir,
        rulesPath: '../../rules/default',
        incremental: true,
        parallel: true,
      });

      const result = await scanner.scan();

      const scanTime = Date.now() - startTime;

      // Target: <10 seconds for 100 files (typical PR size)
      expect(scanTime).toBeLessThan(10000);
      expect(result.summary.filesScanned).toBeLessThanOrEqual(changedFileCount);

      console.log(`Incremental Performance: ${result.summary.filesScanned} files in ${scanTime}ms`);
    });

    test('should show speedup with caching', async () => {
      const fileCount = 200;

      // Create test files
      for (let i = 0; i < fileCount; i++) {
        const filePath = path.join(tempDir, `file${i}.js`);
        await fs.writeFile(
          filePath,
          `
const secret = "secret-key-${i}";
        `
        );
      }

      // First scan (no cache)
      const scanner1 = new Scanner({
        path: tempDir,
        rulesPath: '../../rules/default',
        parallel: true,
      });

      const firstScanStart = Date.now();
      const result1 = await scanner1.scan();
      const firstScanTime = Date.now() - firstScanStart;

      // Second scan (with cache)
      const scanner2 = new Scanner({
        path: tempDir,
        rulesPath: '../../rules/default',
        parallel: true,
        incremental: true,
      });

      const secondScanStart = Date.now();
      const result2 = await scanner2.scan();
      const secondScanTime = Date.now() - secondScanStart;

      // Cache should provide significant speedup
      const speedupRatio = firstScanTime / secondScanTime;
      expect(speedupRatio).toBeGreaterThan(2); // At least 2x speedup
      expect(result1.findings.length).toBe(result2.findings.length);

      console.log(
        `Cache Speedup: ${speedupRatio.toFixed(2)}x (${firstScanTime}ms → ${secondScanTime}ms)`
      );
    });
  });

  describe('Memory Usage', () => {
    test('should maintain memory usage within limits', async () => {
      const fileCount = 1000;

      // Create larger test files
      for (let i = 0; i < fileCount; i++) {
        const filePath = path.join(tempDir, `file${i}.js`);
        const content = `
// Large file ${i}
${Array.from(
  { length: 100 },
  (_, j) => `
const variable${j} = "some string content ${i}-${j}";
function function${j}() {
  const userInput = req.body.data${j};
  const query = "SELECT * FROM users WHERE id = " + userInput;
  return db.query(query);
}
`
).join('\n')}
        `;
        await fs.writeFile(filePath, content);
      }

      const initialMemory = process.memoryUsage();

      const scanner = new Scanner({
        path: tempDir,
        rulesPath: '../../rules/default',
        parallel: true,
        maxFileSize: 1024 * 1024,
      });

      const result = await scanner.scan();

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      const memoryPerFile = memoryIncrease / fileCount;

      // Memory target: <100KB per file
      expect(memoryPerFile).toBeLessThan(100 * 1024);
      expect(result.summary.filesScanned).toBe(fileCount);

      console.log(`Memory Usage: ${(memoryPerFile / 1024).toFixed(2)}KB per file`);
    });
  });

  describe('AST Parsing Performance', () => {
    test('should parse AST efficiently', async () => {
      const { EnhancedASTParser } = require('../../src/ast/enhanced-ast-parser');
      const parser = new EnhancedASTParser();

      const fileCount = 100;
      const parseTimes: number[] = [];

      // Create complex JavaScript files
      for (let i = 0; i < fileCount; i++) {
        const filePath = path.join(tempDir, `complex${i}.js`);
        const content = `
// Complex file ${i}
class ComplexClass${i} {
  constructor(data) {
    this.data = data;
    this.processedData = this.processData(data);
  }

  processData(input) {
    const result = input.map(item => {
      if (item.type === 'user') {
        return this.processUser(item);
      } else if (item.type === 'admin') {
        return this.processAdmin(item);
      }
      return item;
    });
    return result.filter(item => item !== null);
  }

  processUser(user) {
    const query = "SELECT * FROM users WHERE id = " + user.id;
    return db.query(query);
  }

  processAdmin(admin) {
    const cmd = "ls " + admin.path;
    return exec(cmd);
  }

  async renderTemplate(template, data) {
    const html = template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] || '';
    });
    return html;
  }
}

module.exports = ComplexClass${i};
        `;
        await fs.writeFile(filePath, content);

        // Measure AST parsing time
        const parseStart = Date.now();
        await parser.parseFile(filePath);
        const parseTime = Date.now() - parseStart;
        parseTimes.push(parseTime);
      }

      const averageParseTime = parseTimes.reduce((a, b) => a + b, 0) / parseTimes.length;
      const maxParseTime = Math.max(...parseTimes);

      // Target: <1ms per AST query
      expect(averageParseTime).toBeLessThan(1);
      expect(maxParseTime).toBeLessThan(5);

      console.log(
        `AST Parsing: avg ${averageParseTime.toFixed(2)}ms, max ${maxParseTime}ms per file`
      );
    });
  });

  describe('Parallel Processing Performance', () => {
    test('should show benefit from parallel processing', async () => {
      const fileCount = 500;

      // Create test files with vulnerabilities
      for (let i = 0; i < fileCount; i++) {
        const filePath = path.join(tempDir, `parallel${i}.js`);
        await fs.writeFile(
          filePath,
          `
const secret${i} = "secret-key-${i}";
const query${i} = "SELECT * FROM table WHERE id = " + req.body.id${i};
        `
        );
      }

      // Sequential scan
      const sequentialScanner = new Scanner({
        path: tempDir,
        rulesPath: '../../rules/default',
        parallel: false,
      });

      const sequentialStart = Date.now();
      const sequentialResult = await sequentialScanner.scan();
      const sequentialTime = Date.now() - sequentialStart;

      // Parallel scan
      const parallelScanner = new Scanner({
        path: tempDir,
        rulesPath: '../../rules/default',
        parallel: true,
      });

      const parallelStart = Date.now();
      const parallelResult = await parallelScanner.scan();
      const parallelTime = Date.now() - parallelStart;

      // Parallel should be faster
      const speedupRatio = sequentialTime / parallelTime;
      expect(speedupRatio).toBeGreaterThan(1.5); // At least 50% speedup
      expect(sequentialResult.findings.length).toBe(parallelResult.findings.length);

      console.log(
        `Parallel Speedup: ${speedupRatio.toFixed(2)}x (${sequentialTime}ms → ${parallelTime}ms)`
      );
    });
  });
});
