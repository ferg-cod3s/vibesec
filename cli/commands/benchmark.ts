/**
 * Benchmark command for VibeSec CLI
 *
 * Runs performance benchmarks and generates reports
 */

import { BenchmarkSuite } from '../../tests/performance/benchmark-suite';
import * as fs from 'fs';
import * as path from 'path';

export interface BenchmarkOptions {
  output?: string;
  verbose?: boolean;
}

export async function benchmarkCommand(options: BenchmarkOptions = {}): Promise<void> {
  console.log('🚀 VibeSec Performance Benchmark Suite\n');
  console.log('This will run comprehensive performance tests.');
  console.log('Expected duration: 2-5 minutes depending on hardware.\n');

  if (!options.verbose) {
    console.log('💡 Tip: Use --verbose for detailed output\n');
  }

  const suite = new BenchmarkSuite();

  try {
    // Run all benchmarks
    const reports = await suite.runAll();

    // Generate report
    const reportText = BenchmarkSuite.generateReport(reports);
    console.log(reportText);

    // Save to file if output specified
    if (options.output) {
      const outputPath = path.resolve(options.output);
      await fs.promises.writeFile(outputPath, reportText, 'utf8');
      console.log(`\n📄 Report saved to: ${outputPath}`);
    }

    // Save JSON report
    const jsonOutput = options.output
      ? options.output.replace(/\.txt$/, '.json')
      : 'benchmark-report.json';
    const jsonPath = path.resolve(jsonOutput);
    await fs.promises.writeFile(jsonPath, JSON.stringify(reports, null, 2), 'utf8');
    console.log(`📊 JSON report saved to: ${jsonPath}`);

    // Check if all tests passed
    const allPass = reports.every((r) => r.meetsTargets.speed && r.meetsTargets.memory);
    if (!allPass) {
      console.log('\n⚠️  Some benchmarks did not meet performance targets');
      process.exit(1);
    } else {
      console.log('\n✅ All benchmarks passed!');
    }
  } catch (error) {
    console.error('\n❌ Benchmark failed:', error);
    throw error;
  } finally {
    // Cleanup temp directories
    await suite.cleanupTempDirs();
  }
}
