#!/usr/bin/env node

import { Command } from 'commander';
import { scanCommand } from './commands/scan';
import { benchmarkCommand } from './commands/benchmark';

const program = new Command();

program.name('vibesec').description('Security scanner for AI-generated code').version('0.1.0');

program
  .command('scan')
  .description('Scan a directory or file for security vulnerabilities')
  .argument('[path]', 'Path to scan', '.')
  .option('-f, --format <format>', 'Output format (text|json|stakeholder)', 'text')
  .option('-s, --severity <level>', 'Minimum severity level (critical|high|medium|low)', 'low')
  .option('-o, --output <file>', 'Output file path (default: stdout)')
  .option('-e, --exclude <patterns...>', 'File patterns to exclude')
  .option('-i, --include <patterns...>', 'File patterns to include')
  .option('--explain', 'Use plain language for non-technical users')
  .option('--no-color', 'Disable colored output')
  .option('--rules <path>', 'Custom rules directory path')
  .option('--no-parallel', 'Disable parallel scanning')
  .addHelpText(
    'after',
    `
Examples:
  $ vibesec scan                        Scan current directory
  $ vibesec scan ./myproject            Scan specific folder
  $ vibesec scan --explain              Use plain language (great for non-developers!)
  $ vibesec scan --severity critical    Show only critical issues
  $ vibesec scan -f stakeholder -o report.txt  Generate executive report
  $ vibesec scan --no-color             Disable colors (for terminals/screen readers)

Tips:
  • First time? Try: vibesec scan --explain
  • Need help understanding results? Add --explain flag
  • Presenting to stakeholders? Use: --format stakeholder
  • Terminal issues? Add --no-color flag
  • Have questions? Check docs at https://github.com/vibesec/vibesec
`
  )
  .action(scanCommand);

program
  .command('benchmark')
  .description('Run performance benchmarks')
  .option('-o, --output <file>', 'Output report file path')
  .option('-v, --verbose', 'Verbose output')
  .addHelpText(
    'after',
    `
Examples:
  $ vibesec benchmark                     Run all performance benchmarks
  $ vibesec benchmark -o report.txt       Save report to file
  $ vibesec benchmark --verbose           Detailed output

Benchmarks:
  • Small Project (50 files)
  • Medium Project (500 files)
  • Large Project (2000 files)
  • Vulnerable Code (100 files)
  • Clean Code (100 files)
  • Mixed Languages (200 files)

Target Performance:
  • Speed: <2 minutes for 10,000 files
  • Memory: <500MB peak usage
`
  )
  .action(benchmarkCommand);

program.parse();
