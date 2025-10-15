import chalk from 'chalk';
import { ScanResult, Finding, Severity } from '../scanner/core/types';

export class PlainTextReporter {
  generate(result: ScanResult): string {
    const lines: string[] = [];

    // Header
    lines.push(chalk.bold('═'.repeat(70)));
    lines.push(chalk.bold.cyan('               VibeSec Security Scan Results'));
    lines.push(chalk.bold('═'.repeat(70)));
    lines.push('');

    // Scan metadata
    lines.push(chalk.gray(`📁 Scanned: ${result.scan.path}`));
    lines.push(chalk.gray(`📊 Files scanned: ${result.scan.filesScanned}`));
    lines.push(chalk.gray(`⏱️  Duration: ${result.scan.duration.toFixed(2)}s`));
    lines.push('');

    // Summary
    lines.push(this.formatSeverityCount('CRITICAL', result.summary.bySeverity.critical));
    lines.push(this.formatSeverityCount('HIGH', result.summary.bySeverity.high));
    lines.push(this.formatSeverityCount('MEDIUM', result.summary.bySeverity.medium));
    lines.push(this.formatSeverityCount('LOW', result.summary.bySeverity.low));
    lines.push('');

    // Findings
    if (result.findings.length === 0) {
      lines.push(chalk.green.bold('✅ No security issues detected!'));
      lines.push('');
    } else {
      lines.push(chalk.bold('═'.repeat(70)));
      lines.push('');

      // Group findings by severity
      const grouped = this.groupBySeverity(result.findings);
      const severityOrder: Severity[] = [
        Severity.CRITICAL,
        Severity.HIGH,
        Severity.MEDIUM,
        Severity.LOW,
      ];

      for (const severity of severityOrder) {
        const findings = grouped[severity] || [];
        if (findings.length === 0) continue;

        for (const finding of findings) {
          lines.push(this.formatFinding(finding));
          lines.push(chalk.bold('─'.repeat(70)));
          lines.push('');
        }
      }
    }

    // Footer
    lines.push(chalk.bold('═'.repeat(70)));
    lines.push('');
    lines.push(chalk.bold('📋 Summary:'));
    lines.push(`  ✓ ${result.summary.total} security issues detected`);
    
    if (result.summary.bySeverity.critical > 0) {
      lines.push(
        chalk.red(`  ✓ ${result.summary.bySeverity.critical} require immediate attention (CRITICAL)`)
      );
    }
    
    lines.push('  ✓ All issues include fix recommendations');
    lines.push('');

    if (result.summary.total > 0) {
      lines.push(chalk.bold('💡 Next Steps:'));
      lines.push('  1. Fix CRITICAL issues immediately');
      lines.push('  2. Review HIGH severity issues');
      lines.push("  3. Run 'vibesec scan .' again to verify fixes");
      lines.push('');
    }

    lines.push(chalk.bold('═'.repeat(70)));

    return lines.join('\n');
  }

  private formatSeverityCount(label: string, count: number): string {
    const emoji = this.getSeverityEmoji(label.toLowerCase() as Severity);
    const color = this.getSeverityColor(label.toLowerCase() as Severity);
    return color(`${emoji} ${label} Issues: ${count}`);
  }

  private formatFinding(finding: Finding): string {
    const lines: string[] = [];
    const emoji = this.getSeverityEmoji(finding.severity);
    const color = this.getSeverityColor(finding.severity);

    // Title
    lines.push(color.bold(`${emoji} ${finding.severity.toUpperCase()}: ${finding.title}`));
    lines.push('');

    // Location
    lines.push(chalk.gray(`📍 Location: ${finding.location.file}:${finding.location.line}`));
    
    // Snippet
    lines.push(chalk.gray('📝 Code:'));
    lines.push(chalk.gray(finding.snippet));
    lines.push('');

    // Description
    lines.push(chalk.yellow(`⚠️  Risk: ${finding.description}`));
    lines.push('');

    // Fix
    lines.push(chalk.green('✅ Fix:'));
    lines.push(finding.fix.recommendation);
    lines.push('');
    
    if (finding.fix.before) {
      lines.push(chalk.gray('  Before:'));
      lines.push(chalk.red(`  ${finding.fix.before}`));
      lines.push('');
    }

    // References
    if (finding.fix.references.length > 0) {
      lines.push(chalk.gray('📚 References:'));
      finding.fix.references.forEach((ref) => {
        lines.push(chalk.gray(`  - ${ref}`));
      });
      lines.push('');
    }

    // Metadata
    if (finding.metadata.cwe || finding.metadata.owasp) {
      const meta: string[] = [];
      if (finding.metadata.cwe) meta.push(finding.metadata.cwe);
      if (finding.metadata.owasp) meta.push(`OWASP ${finding.metadata.owasp}`);
      lines.push(chalk.gray(`🔖 ${meta.join(' • ')}`));
      lines.push('');
    }

    return lines.join('\n');
  }

  private getSeverityEmoji(severity: Severity): string {
    const emojis = {
      [Severity.CRITICAL]: '🔴',
      [Severity.HIGH]: '🟡',
      [Severity.MEDIUM]: '🟢',
      [Severity.LOW]: '⚪',
    };
    return emojis[severity] || '⚪';
  }

  private getSeverityColor(severity: Severity): chalk.Chalk {
    const colors = {
      [Severity.CRITICAL]: chalk.red,
      [Severity.HIGH]: chalk.yellow,
      [Severity.MEDIUM]: chalk.blue,
      [Severity.LOW]: chalk.gray,
    };
    return colors[severity] || chalk.white;
  }

  private groupBySeverity(findings: Finding[]): Record<Severity, Finding[]> {
    const grouped: Record<Severity, Finding[]> = {
      [Severity.CRITICAL]: [],
      [Severity.HIGH]: [],
      [Severity.MEDIUM]: [],
      [Severity.LOW]: [],
    };

    for (const finding of findings) {
      grouped[finding.severity].push(finding);
    }

    return grouped;
  }
}
