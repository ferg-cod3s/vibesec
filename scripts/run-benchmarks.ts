#!/usr/bin/env ts-node
/**
 * Standalone benchmark runner script
 *
 * Can be run directly: bun run scripts/run-benchmarks.ts
 * Or via npm: npm run benchmark
 */

import { BenchmarkSuite } from '../tests/performance/benchmark-suite';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  console.log('🚀 VibeSec Performance Benchmark Suite\n');

  // Check for --expose-gc flag
  if (!global.gc) {
    console.log(
      '⚠️  Note: Running without --expose-gc flag. Memory measurements may be less accurate.'
    );
    console.log('   For better results, run with: bun --expose-gc run scripts/run-benchmarks.ts\n');
  }

  const suite = new BenchmarkSuite();

  try {
    // Run all benchmarks
    console.log('Running comprehensive performance tests...');
    console.log('This may take 2-5 minutes depending on your hardware.\n');

    const reports = await suite.runAll();

    // Generate text report
    const reportText = BenchmarkSuite.generateReport(reports);
    console.log('\n' + reportText);

    // Save reports
    const outputDir = path.join(process.cwd(), 'benchmark-results');
    await fs.promises.mkdir(outputDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const textPath = path.join(outputDir, `benchmark-${timestamp}.txt`);
    const jsonPath = path.join(outputDir, `benchmark-${timestamp}.json`);

    await fs.promises.writeFile(textPath, reportText, 'utf8');
    await fs.promises.writeFile(jsonPath, JSON.stringify(reports, null, 2), 'utf8');

    console.log(`\n📄 Text report: ${textPath}`);
    console.log(`📊 JSON report: ${jsonPath}`);

    // Check if all tests passed
    const allPass = reports.every((r) => r.meetsTargets.speed && r.meetsTargets.memory);
    if (!allPass) {
      console.log('\n⚠️  Some benchmarks did not meet performance targets');
      console.log('    Review the report above for details.');
      process.exit(1);
    } else {
      console.log('\n✅ All benchmarks passed! VibeSec meets performance targets.');
    }
  } catch (error) {
    console.error('\n❌ Benchmark failed:', error);
    process.exit(1);
  } finally {
    // Cleanup
    await suite.cleanupTempDirs();
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
