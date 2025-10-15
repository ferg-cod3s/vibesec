#!/usr/bin/env node

import { Command } from 'commander';
import { scanCommand } from './commands/scan';

const program = new Command();

program
  .name('vibesec')
  .description('Security scanner for AI-generated code')
  .version('0.1.0');

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

program.parse();
