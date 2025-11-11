import { Severity, ScanOptions } from '../../scanner/core/types';
import { Scanner } from '../../scanner/core/engine';
import { PlainTextReporter } from '../../reporters/plaintext';
import { JsonReporter } from '../../reporters/json';
import { PlainLanguageReporter } from '../../reporters/plain-language';
import { StakeholderReporter } from '../../reporters/stakeholder';
import { FriendlyErrorHandler } from '../../lib/errors/friendly-handler';
import ora from 'ora';
import chalk from 'chalk';

// Check if colors should be disabled
const NO_COLOR = process.env.NO_COLOR !== undefined || process.argv.includes('--no-color');

// Disable chalk if --no-color is set
if (NO_COLOR) {
  chalk.level = 0;
}

interface ScanCommandOptions {
  format: string;
  severity: string;
  output?: string;
  exclude?: string[];
  include?: string[];
  explain?: boolean;
  color?: boolean;
  rules?: string;
  parallel: boolean;
}

export async function scanCommand(path: string, options: ScanCommandOptions): Promise<void> {
  const errorHandler = new FriendlyErrorHandler();

  try {
    const isJson = options.format === 'json';
    const useExplain = options.explain || false;

    // Validate severity
    const severity = validateSeverity(options.severity);

    // Build scan options
    const scanOptions: ScanOptions = {
      path,
      severity,
      format: options.format as 'text' | 'json',
      output: options.output,
      exclude: options.exclude,
      include: options.include,
      rulesPath: options.rules,
      parallel: options.parallel,
      quiet: isJson, // Suppress progress messages for JSON output
    };

    // Create scanner
    const scanner = new Scanner(scanOptions);

    // Progress indicator (only for non-JSON output)
    const spinner = !isJson ? ora('Initializing scan...').start() : null;

    try {
      // Run scan with progress updates
      const startTime = Date.now();

      if (spinner) spinner.text = 'Finding files to scan...';

      const result = await scanner.scan();

      const duration = (Date.now() - startTime) / 1000;
      result.scan.duration = duration;

      if (spinner) {
        spinner.succeed(chalk.green('Scan complete!'));
        console.error(''); // Empty line for spacing
      }

      // Select reporter based on options
      let reporter;
      if (options.format === 'json') {
        reporter = new JsonReporter();
      } else if (options.format === 'stakeholder') {
        reporter = new StakeholderReporter();
      } else if (useExplain) {
        reporter = new PlainLanguageReporter();
      } else {
        reporter = new PlainTextReporter();
      }

      const report = reporter.generate(result);

      // Output report
      if (options.output) {
        const fs = await import('fs').then((m) => m.promises);
        await fs.writeFile(options.output, report);
        if (!isJson) {
          console.error(chalk.green(`✅ Report saved to ${options.output}`));
        }
      } else {
        console.log(report);
      }

      // Show success summary (non-JSON only)
      if (!isJson && !options.output) {
        console.error(''); // Empty line
        console.error(chalk.bold('📊 Scan Summary:'));
        console.error(chalk.gray(`   Files scanned: ${result.scan.filesScanned}`));
        console.error(chalk.gray(`   Time taken: ${result.scan.duration.toFixed(2)}s`));
        console.error('');

        const { bySeverity } = result.summary;

        if (result.summary.total === 0) {
          console.error(chalk.green.bold('✨ Excellent! No security issues found.'));
          console.error(chalk.green('   Your code looks secure. Keep up the good work!'));
          console.error('');
        } else {
          // Show helpful next steps based on findings
          if (bySeverity.critical > 0) {
            console.error(
              chalk.red.bold(
                `⚠️  Action needed: ${bySeverity.critical} critical issue${bySeverity.critical > 1 ? 's' : ''} found`
              )
            );
          } else if (bySeverity.high > 0) {
            console.error(
              chalk.yellow.bold(
                `⚠️  ${bySeverity.high} important issue${bySeverity.high > 1 ? 's' : ''} found`
              )
            );
          } else {
            console.error(
              chalk.blue.bold(
                `ℹ️  ${result.summary.total} issue${result.summary.total > 1 ? 's' : ''} found`
              )
            );
          }
          console.error('');

          console.error(chalk.bold('💡 Next steps:'));
          if (bySeverity.critical > 0) {
            console.error(chalk.red(`   1. Fix critical issues immediately`));
          }
          if (!useExplain) {
            console.error(
              chalk.cyan(
                `   ${bySeverity.critical > 0 ? '2' : '1'}. Try running with --explain for plain language help`
              )
            );
          }
          console.error(
            chalk.gray(
              `   ${bySeverity.critical > 0 ? (useExplain ? '2' : '3') : useExplain ? '1' : '2'}. Run scan again after making fixes`
            )
          );
          console.error('');
        }
      }

      // Exit with error code if critical/high issues found
      if (result.summary.bySeverity.critical > 0 || result.summary.bySeverity.high > 0) {
        process.exit(1);
      }
    } catch (scanError) {
      if (spinner) {
        spinner.fail(chalk.red('Scan failed'));
      }
      throw scanError;
    }
  } catch (error) {
    errorHandler.handle(error as Error, {
      action: 'scan project',
      path,
      userLevel: options.explain ? 'non-technical' : 'technical',
    });
    process.exit(1);
  }
}

function validateSeverity(severity: string): Severity {
  const validSeverities = ['critical', 'high', 'medium', 'low'];
  if (!validSeverities.includes(severity.toLowerCase())) {
    throw new Error(`Invalid severity: ${severity}. Must be one of: ${validSeverities.join(', ')}`);
  }
  return severity.toLowerCase() as Severity;
}
