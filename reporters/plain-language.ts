import chalk from 'chalk';
import { ScanResult, Finding, Severity, Category } from '../scanner/core/types';
import { calculateSecurityScore, getBenchmarkComparison } from '../lib/utils/security-score';

/**
 * Plain language severity information for non-technical users
 */
interface PlainSeverity {
  emoji: string;
  label: string;
  timeframe: string;
  businessImpact: string;
}

/**
 * Plain Language Reporter
 * Translates technical security findings into business language for non-technical users.
 *
 * Features:
 * - Uses analogies instead of jargon
 * - Explains business impact
 * - Provides fix time estimates
 * - Suggests who can fix each issue
 * - "What/Why/How" structure for clarity
 */
export class PlainLanguageReporter {
  /**
   * Analogies for common vulnerability types
   * Makes technical concepts relatable through everyday comparisons
   */
  private readonly analogies: Record<string, string> = {
    secrets: 'password written on a sticky note on your monitor',
    injection: 'unlocked front door that anyone can walk through',
    'sql-injection': 'unlocked front door that anyone can walk through',
    xss: 'poisoned water supply affecting everyone who drinks',
    'command-injection': 'blank check handed to a stranger',
    'path-traversal': 'skeleton key that opens any room',
    auth: 'broken lock on your front door',
    incomplete: 'half-built security fence with gaps',
    'ai-specific': 'AI system that can be tricked into misbehaving',
  };

  /**
   * Severity mapping to plain language
   */
  private readonly severityMap: Record<Severity, PlainSeverity> = {
    [Severity.CRITICAL]: {
      emoji: '🚨',
      label: 'Urgent - Fix Today',
      timeframe: 'immediately',
      businessImpact: 'High risk of data breach, legal liability, and financial loss',
    },
    [Severity.HIGH]: {
      emoji: '⚠️',
      label: 'Important - Fix This Week',
      timeframe: 'within 7 days',
      businessImpact: 'Moderate risk to data security and user trust',
    },
    [Severity.MEDIUM]: {
      emoji: '📋',
      label: 'Notable - Fix Soon',
      timeframe: 'within 30 days',
      businessImpact: 'Could lead to security problems if not addressed',
    },
    [Severity.LOW]: {
      emoji: 'ℹ️',
      label: 'Good to Know - Consider Fixing',
      timeframe: 'when convenient',
      businessImpact: 'Minimal risk, follows best practices',
    },
  };

  /**
   * Fix time estimates based on complexity
   */
  private readonly fixTimeEstimates: Record<string, string> = {
    secrets: '10-15 minutes',
    injection: '15-30 minutes',
    'sql-injection': '15-30 minutes',
    xss: '20-40 minutes',
    'command-injection': '15-30 minutes',
    auth: '1-2 hours',
    incomplete: '30 minutes - 2 hours',
    'ai-specific': '1-4 hours',
    default: '30 minutes - 1 hour',
  };

  /**
   * Suggestions for who can fix each type of issue
   */
  private readonly whoCanFix: Record<string, string> = {
    secrets: 'Any developer',
    injection: 'Backend developer',
    'sql-injection': 'Backend developer',
    xss: 'Frontend or full-stack developer',
    'command-injection': 'Backend developer',
    auth: 'Senior developer or security engineer',
    incomplete: 'Original developer or tech lead',
    'ai-specific': 'AI/ML engineer or senior developer',
    default: 'Any developer',
  };

  /**
   * Generate plain language report
   */
  generate(result: ScanResult): string {
    const lines: string[] = [];

    // Header
    lines.push(chalk.bold('═'.repeat(70)));
    lines.push(chalk.bold.cyan('         VibeSec Security Scan - Plain Language Report'));
    lines.push(chalk.bold('═'.repeat(70)));
    lines.push('');

    // Scan metadata
    lines.push(chalk.gray(`📁 Scanned: ${result.scan.path}`));
    lines.push(chalk.gray(`📊 Files checked: ${result.scan.filesScanned}`));
    lines.push(chalk.gray(`⏱️  Time taken: ${result.scan.duration.toFixed(2)} seconds`));
    lines.push('');

    // Security Score
    const securityScore = calculateSecurityScore(result);
    const scoreColor = this.getScoreColor(securityScore.score);

    lines.push(chalk.bold('Security Score:'));
    lines.push('');
    lines.push(
      scoreColor(`  ${securityScore.score}/100 (${securityScore.grade}) - ${securityScore.rating}`)
    );
    lines.push(
      chalk.gray(`  ${getBenchmarkComparison(securityScore.score, result.scan.filesScanned)}`)
    );
    lines.push('');

    // Summary in plain language
    lines.push(chalk.bold('Summary:'));
    lines.push('');

    const { bySeverity } = result.summary;

    if (bySeverity.critical > 0) {
      lines.push(
        chalk.red.bold(
          `🚨 ${bySeverity.critical} urgent issue${bySeverity.critical > 1 ? 's' : ''} need${bySeverity.critical === 1 ? 's' : ''} immediate attention`
        )
      );
    }

    if (bySeverity.high > 0) {
      lines.push(
        chalk.yellow.bold(
          `⚠️  ${bySeverity.high} important issue${bySeverity.high > 1 ? 's' : ''} should be fixed this week`
        )
      );
    }

    if (bySeverity.medium > 0) {
      lines.push(
        chalk.blue(
          `📋 ${bySeverity.medium} issue${bySeverity.medium > 1 ? 's' : ''} should be addressed soon`
        )
      );
    }

    if (bySeverity.low > 0) {
      lines.push(
        chalk.gray(`ℹ️  ${bySeverity.low} minor issue${bySeverity.low > 1 ? 's' : ''} to consider`)
      );
    }

    lines.push('');

    // Findings in plain language
    if (result.findings.length === 0) {
      lines.push(chalk.green.bold('✅ Great news! No security issues found.'));
      lines.push('');
      lines.push('Your code looks secure. Keep up the good work!');
      lines.push('');
    } else {
      lines.push(chalk.bold('═'.repeat(70)));
      lines.push(chalk.bold('Detailed Findings:'));
      lines.push(chalk.bold('═'.repeat(70)));
      lines.push('');

      // Group by severity and show in order of importance
      const grouped = this.groupBySeverity(result.findings);
      const severityOrder: Severity[] = [
        Severity.CRITICAL,
        Severity.HIGH,
        Severity.MEDIUM,
        Severity.LOW,
      ];

      let findingNumber = 1;
      for (const severity of severityOrder) {
        const findings = grouped[severity] || [];
        if (findings.length === 0) continue;

        for (const finding of findings) {
          lines.push(this.formatFinding(finding, findingNumber));
          lines.push(chalk.bold('─'.repeat(70)));
          lines.push('');
          findingNumber++;
        }
      }
    }

    // Footer with actionable next steps
    lines.push(chalk.bold('═'.repeat(70)));
    lines.push('');

    if (result.summary.total > 0) {
      lines.push(chalk.bold('💡 What to do next:'));
      lines.push('');

      if (bySeverity.critical > 0) {
        lines.push(
          chalk.red(
            `  1. Fix the ${bySeverity.critical} urgent issue${bySeverity.critical > 1 ? 's' : ''} TODAY`
          )
        );
      }

      if (bySeverity.high > 0) {
        lines.push(
          chalk.yellow(
            `  ${bySeverity.critical > 0 ? '2' : '1'}. Address the ${bySeverity.high} important issue${bySeverity.high > 1 ? 's' : ''} this week`
          )
        );
      }

      const nextStep =
        bySeverity.critical > 0 && bySeverity.high > 0
          ? '3'
          : bySeverity.critical > 0 || bySeverity.high > 0
            ? '2'
            : '1';
      lines.push(
        chalk.blue(`  ${nextStep}. Run 'vibesec scan --explain' again after making fixes`)
      );
      lines.push('');

      lines.push(chalk.gray('💭 Need help understanding these issues?'));
      lines.push(chalk.gray('   Ask your development team to review the findings with you.'));
      lines.push('');
    } else {
      lines.push(chalk.green('✨ Your code is secure!'));
      lines.push('');
      lines.push('Keep running scans regularly to catch issues early.');
      lines.push('');
    }

    lines.push(chalk.bold('═'.repeat(70)));

    return lines.join('\n');
  }

  /**
   * Format a single finding in plain language
   */
  private formatFinding(finding: Finding, number: number): string {
    const lines: string[] = [];
    const plainSeverity = this.severityMap[finding.severity];
    const color = this.getSeverityColor(finding.severity);

    // Title with severity
    lines.push(color.bold(`${plainSeverity.emoji} [${number}] ${plainSeverity.label}`));
    lines.push('');

    // What was found
    lines.push(chalk.bold('Found:'));
    lines.push(
      `${finding.title} in ${chalk.cyan(finding.location.file + ':' + finding.location.line)}`
    );
    lines.push('');

    // What this means (plain language explanation)
    lines.push(chalk.bold('What this means:'));
    lines.push(this.explainInPlainLanguage(finding));
    lines.push('');

    // Why it matters (business impact)
    lines.push(chalk.bold('Why it matters:'));
    lines.push(plainSeverity.businessImpact);
    lines.push('');
    lines.push(this.describeRealWorldImpact(finding));
    lines.push('');

    // Code snippet (what the code looks like)
    if (finding.snippet && finding.snippet.trim()) {
      lines.push(chalk.bold('The code:'));
      lines.push(chalk.gray(finding.snippet));
      lines.push('');
    }

    // How to fix
    lines.push(chalk.bold('How to fix:'));
    lines.push(finding.fix.recommendation);
    lines.push('');

    // Show before/after if available
    if (finding.fix.before && finding.fix.after) {
      lines.push(chalk.gray('Before:'));
      lines.push(chalk.red(`  ${finding.fix.before}`));
      lines.push('');
      lines.push(chalk.gray('After:'));
      lines.push(chalk.green(`  ${finding.fix.after}`));
      lines.push('');
    }

    // Practical information
    const fixTime = this.estimateFixTime(finding);
    const whoFixes = this.suggestWhoCanFix(finding);

    lines.push(chalk.bold('Practical details:'));
    lines.push(`• Time needed: ${chalk.cyan(fixTime)}`);
    lines.push(`• Who can fix: ${chalk.cyan(whoFixes)}`);
    lines.push(`• Priority: ${chalk.cyan(plainSeverity.timeframe)}`);
    lines.push('');

    // Additional resources
    if (finding.fix.references && finding.fix.references.length > 0) {
      lines.push(chalk.bold('Learn more:'));
      finding.fix.references.forEach((ref) => {
        lines.push(chalk.gray(`  • ${ref}`));
      });
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Explain the technical finding in plain language
   */
  private explainInPlainLanguage(finding: Finding): string {
    const analogy = this.getAnalogy(finding.category);

    // Start with the basic description
    let explanation = finding.description;

    // Add analogy
    if (analogy) {
      explanation += `\n\nThink of this like having ${analogy}.`;
    }

    return explanation;
  }

  /**
   * Get an analogy for a finding category
   */
  private getAnalogy(category: Category): string {
    const categoryKey = category.toLowerCase();
    return this.analogies[categoryKey] || this.analogies['incomplete'];
  }

  /**
   * Describe real-world impact of the vulnerability
   */
  private describeRealWorldImpact(finding: Finding): string {
    const impacts: Record<string, string> = {
      secrets:
        'If this code is shared (GitHub, email, etc.), anyone who sees it can:\n  • Use your API keys and credentials\n  • Rack up charges on your accounts\n  • Access your private data',

      injection:
        'An attacker could:\n  • Steal all your data\n  • Delete your database\n  • Take over user accounts',

      'sql-injection':
        'An attacker could:\n  • Read all data in your database\n  • Modify or delete records\n  • Bypass authentication and access any account',

      xss: 'Attackers could:\n  • Steal user session cookies\n  • Redirect users to malicious sites\n  • Deface your website',

      'command-injection':
        'An attacker could:\n  • Execute commands on your server\n  • Read sensitive files\n  • Take complete control of your system',

      auth: "Users could:\n  • Access features they haven't paid for\n  • View other users' private data\n  • Bypass security restrictions",

      default:
        'This could lead to:\n  • Security vulnerabilities\n  • Data exposure\n  • System compromise',
    };

    const categoryKey = finding.category.toLowerCase();
    const ruleKey = finding.rule.toLowerCase();

    // Check for specific rule match first, then category
    return impacts[ruleKey] || impacts[categoryKey] || impacts['default'];
  }

  /**
   * Estimate fix time based on finding type
   */
  private estimateFixTime(finding: Finding): string {
    const categoryKey = finding.category.toLowerCase();
    const ruleKey = finding.rule.toLowerCase();

    return (
      this.fixTimeEstimates[ruleKey] ||
      this.fixTimeEstimates[categoryKey] ||
      this.fixTimeEstimates['default']
    );
  }

  /**
   * Suggest who can fix this type of issue
   */
  private suggestWhoCanFix(finding: Finding): string {
    const categoryKey = finding.category.toLowerCase();
    const ruleKey = finding.rule.toLowerCase();

    return this.whoCanFix[ruleKey] || this.whoCanFix[categoryKey] || this.whoCanFix['default'];
  }

  /**
   * Get color function for severity level
   */
  private getSeverityColor(severity: Severity): chalk.Chalk {
    const colors = {
      [Severity.CRITICAL]: chalk.red,
      [Severity.HIGH]: chalk.yellow,
      [Severity.MEDIUM]: chalk.blue,
      [Severity.LOW]: chalk.gray,
    };
    return colors[severity] || chalk.white;
  }

  /**
   * Get color for security score
   */
  private getScoreColor(score: number): chalk.Chalk {
    if (score >= 90) return chalk.green.bold;
    if (score >= 80) return chalk.blue.bold;
    if (score >= 70) return chalk.yellow.bold;
    return chalk.red.bold;
  }

  /**
   * Group findings by severity
   */
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
