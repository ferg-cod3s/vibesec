#!/usr/bin/env bun
/**
 * VibeSec Performance Test Runner
 * 
 * Executes all performance tests with proper configuration,
 * security measures, and clean output formatting.
 */

import { spawn } from 'bun';
import * as path from 'path';
import * as fs from 'fs';

interface TestConfig {
  pattern: string;
  timeout: number;
  retries: number;
  parallel: boolean;
  environment: Record<string, string>;
}

interface TestResult {
  name: string;
  status: 'passed' | 'failed' | 'timeout';
  duration: number;
  output: string;
  error?: string;
}

interface TestSuite {
  name: string;
  tests: TestConfig[];
  setup?: () => Promise<void>;
  teardown?: () => Promise<void>;
}

class PerformanceTestRunner {
  private testDir: string;
  private results: TestResult[] = [];
  private startTime: number = 0;

  constructor(testDir: string) {
    this.testDir = testDir;
  }

  async runAllTests(): Promise<void> {
    this.startTime = Date.now();
    console.log('🚀 Starting VibeSec Performance Test Suite');
    console.log(`📁 Test directory: ${this.testDir}`);
    console.log('');

    const testSuites = this.getTestSuites();

    for (const suite of testSuites) {
      console.log(`📋 Running ${suite.name}`);
      
      if (suite.setup) {
        await suite.setup();
      }

      for (const testConfig of suite.tests) {
        const result = await this.runTest(testConfig);
        this.results.push(result);
        this.printTestResult(result);
      }

      if (suite.teardown) {
        await suite.teardown();
      }

      console.log('');
    }

    this.printSummary();
  }

  private getTestSuites(): TestSuite[] {
    return [
      {
        name: 'Scanner Performance Tests',
        tests: [
          {
            pattern: 'scanner.test.ts',
            timeout: 300000, // 5 minutes
            retries: 2,
            parallel: false,
            environment: {
              'NODE_OPTIONS': '--expose-gc',
              'VIBESEC_TEST_MODE': 'performance'
            }
          }
        ]
      },
      {
        name: 'MCP Server Performance Tests', 
        tests: [
          {
            pattern: 'mcp-server.test.ts',
            timeout: 300000, // 5 minutes
            retries: 2,
            parallel: false,
            environment: {
              'NODE_OPTIONS': '--expose-gc',
              'VIBESEC_TEST_MODE': 'performance'
            }
          }
        ]
      },
      {
        name: 'Dependency Analyzer Performance Tests',
        tests: [
          {
            pattern: 'dependency-analyzer.test.ts',
            timeout: 300000, // 5 minutes
            retries: 2,
            parallel: false,
            environment: {
              'NODE_OPTIONS': '--expose-gc',
              'VIBESEC_TEST_MODE': 'performance'
            }
          }
        ]
      },
      {
        name: 'Cross-Project Performance Tests',
        tests: [
          {
            pattern: 'cross-projects.test.ts',
            timeout: 1800000, // 30 minutes
            retries: 1,
            parallel: false,
            environment: {
              'NODE_OPTIONS': '--expose-gc',
              'VIBESEC_TEST_MODE': 'performance',
              'VIBESEC_TEST_MAX_PROJECTS': '20' // Limit for CI
            }
          }
        ]
      }
    ];
  }

  private async runTest(config: TestConfig): Promise<TestResult> {
    const testFile = path.join(this.testDir, config.pattern);
    
    if (!fs.existsSync(testFile)) {
      return {
        name: config.pattern,
        status: 'failed',
        duration: 0,
        output: '',
        error: `Test file not found: ${testFile}`
      };
    }

    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= config.retries; attempt++) {
      if (attempt > 0) {
        console.log(`🔄 Retry ${attempt}/${config.retries} for ${config.pattern}`);
      }

      try {
        const result = await this.executeTest(testFile, config);
        if (result.status === 'passed') {
          return result;
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
      }
    }

    return {
      name: config.pattern,
      status: 'failed',
      duration: 0,
      output: '',
      error: lastError?.message || 'Unknown error'
    };
  }

  private async executeTest(testFile: string, config: TestConfig): Promise<TestResult> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      let output = '';
      let errorOutput = '';

      const child = spawn({
        cmd: ['bun', 'test', testFile],
        cwd: path.dirname(testFile),
        env: { ...process.env, ...config.environment },
        stdout: 'pipe',
        stderr: 'pipe'
      });

      // Collect output
      child.stdout?.on('data', (data: Buffer) => {
        output += data.toString();
      });

      child.stderr?.on('data', (data: Buffer) => {
        errorOutput += data.toString();
      });

      // Set timeout
      const timeout = setTimeout(() => {
        child.kill();
        resolve({
          name: config.pattern,
          status: 'timeout',
          duration: config.timeout,
          output: output,
          error: `Test timed out after ${config.timeout}ms`
        });
      }, config.timeout);

      child.on('close', (code: number) => {
        clearTimeout(timeout);
        const duration = Date.now() - startTime;

        if (code === 0) {
          resolve({
            name: config.pattern,
            status: 'passed',
            duration,
            output: output
          });
        } else {
          resolve({
            name: config.pattern,
            status: 'failed',
            duration,
            output: output,
            error: errorOutput || `Process exited with code ${code}`
          });
        }
      });

      child.on('error', (error: Error) => {
        clearTimeout(timeout);
        resolve({
          name: config.pattern,
          status: 'failed',
          duration: Date.now() - startTime,
          output: output,
          error: error.message
        });
      });
    });
  }

  private printTestResult(result: TestResult): void {
    const icon = result.status === 'passed' ? '✅' : 
                 result.status === 'timeout' ? '⏰' : '❌';
    
    console.log(`  ${icon} ${result.name} (${(result.duration / 1000).toFixed(2)}s)`);
    
    if (result.error) {
      console.log(`     Error: ${result.error}`);
    }
  }

  private printSummary(): void {
    const totalDuration = Date.now() - this.startTime;
    const passed = this.results.filter(r => r.status === 'passed').length;
    const failed = this.results.filter(r => r.status === 'failed').length;
    const timeout = this.results.filter(r => r.status === 'timeout').length;

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('                    PERFORMANCE TEST SUMMARY                     ');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');
    console.log(`📊 RESULTS:`);
    console.log(`  Total Tests: ${this.results.length}`);
    console.log(`  Passed: ${passed} ✅`);
    console.log(`  Failed: ${failed} ❌`);
    console.log(`  Timeout: ${timeout} ⏰`);
    console.log(`  Success Rate: ${((passed / this.results.length) * 100).toFixed(1)}%`);
    console.log('');
    console.log(`⏱️  DURATION:`);
    console.log(`  Total: ${(totalDuration / 1000).toFixed(2)}s`);
    console.log(`  Average: ${(totalDuration / this.results.length / 1000).toFixed(2)}s per test`);
    console.log('');

    // Performance summary
    if (passed > 0) {
      const passedResults = this.results.filter(r => r.status === 'passed');
      const avgDuration = passedResults.reduce((sum, r) => sum + r.duration, 0) / passedResults.length;
      const maxDuration = Math.max(...passedResults.map(r => r.duration));
      const minDuration = Math.min(...passedResults.map(r => r.duration));

      console.log(`⚡ PERFORMANCE:`);
      console.log(`  Average: ${(avgDuration / 1000).toFixed(2)}s`);
      console.log(`  Fastest: ${(minDuration / 1000).toFixed(2)}s`);
      console.log(`  Slowest: ${(maxDuration / 1000).toFixed(2)}s`);
      console.log('');
    }

    // Failed tests details
    if (failed > 0 || timeout > 0) {
      console.log(`❌ FAILED TESTS:`);
      this.results
        .filter(r => r.status === 'failed' || r.status === 'timeout')
        .forEach(result => {
          console.log(`  • ${result.name}: ${result.error || 'Unknown error'}`);
        });
      console.log('');
    }

    console.log('═══════════════════════════════════════════════════════════════');
    
    // Exit with appropriate code
    const exitCode = (failed + timeout) > 0 ? 1 : 0;
    process.exit(exitCode);
  }
}

// Main execution
async function main() {
  const testDir = path.join(import.meta.dir, '..', 'performance');
  
  if (!fs.existsSync(testDir)) {
    console.error(`❌ Performance test directory not found: ${testDir}`);
    process.exit(1);
  }

  const runner = new PerformanceTestRunner(testDir);
  
  try {
    await runner.runAllTests();
  } catch (error) {
    console.error('❌ Test runner failed:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled rejection:', reason);
  process.exit(1);
});

// Run if called directly
if (import.meta.main) {
  main();
}