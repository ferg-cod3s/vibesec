import { ScanResult, Severity } from '../../scanner/core/types';

/**
 * Security Score Calculator
 * Calculates a security score (0-100) based on scan findings
 *
 * Scoring methodology:
 * - Start with 100 points (perfect score)
 * - Deduct points based on severity and quantity of findings
 * - Weight: CRITICAL=25, HIGH=10, MEDIUM=5, LOW=2
 * - Minimum score: 0
 */

export interface SecurityScore {
  score: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  rating: string;
  color: string;
  issues: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    total: number;
  };
  recommendation: string;
}

/**
 * Calculate security score from scan results
 */
export function calculateSecurityScore(result: ScanResult): SecurityScore {
  const { bySeverity } = result.summary;

  // Point deductions per severity
  const weights = {
    critical: 25,
    high: 10,
    medium: 5,
    low: 2,
  };

  // Calculate total deductions
  const deductions =
    bySeverity.critical * weights.critical +
    bySeverity.high * weights.high +
    bySeverity.medium * weights.medium +
    bySeverity.low * weights.low;

  // Calculate final score (0-100)
  const score = Math.max(0, 100 - deductions);

  // Determine grade
  const grade = getGrade(score);

  // Get rating description
  const rating = getRating(score);

  // Get color for display
  const color = getColor(score);

  // Get recommendation
  const recommendation = getRecommendation(score, bySeverity);

  return {
    score,
    grade,
    rating,
    color,
    issues: {
      critical: bySeverity.critical,
      high: bySeverity.high,
      medium: bySeverity.medium,
      low: bySeverity.low,
      total: result.summary.total,
    },
    recommendation,
  };
}

/**
 * Convert score to letter grade
 */
function getGrade(score: number): SecurityScore['grade'] {
  if (score >= 98) return 'A+';
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

/**
 * Get rating description
 */
function getRating(score: number): string {
  if (score >= 98) return 'Excellent';
  if (score >= 90) return 'Very Good';
  if (score >= 80) return 'Good';
  if (score >= 70) return 'Fair';
  if (score >= 60) return 'Poor';
  return 'Critical';
}

/**
 * Get color based on score
 */
function getColor(score: number): string {
  if (score >= 90) return 'green';
  if (score >= 80) return 'blue';
  if (score >= 70) return 'yellow';
  return 'red';
}

/**
 * Get recommendation based on score and findings
 */
function getRecommendation(
  score: number,
  bySeverity: { critical: number; high: number; medium: number; low: number }
): string {
  if (score >= 98) {
    return 'Your code is very secure! Keep following best practices.';
  }

  if (score >= 90) {
    return 'Good security posture. Address remaining issues to maintain security.';
  }

  if (score >= 80) {
    if (bySeverity.high > 0) {
      return 'Address high severity issues this week to improve security posture.';
    }
    return 'Improve security by addressing medium and low severity issues.';
  }

  if (score >= 70) {
    return 'Security needs attention. Focus on high and medium severity issues.';
  }

  if (score >= 60) {
    return 'Significant security concerns. Prioritize fixing critical and high issues.';
  }

  if (bySeverity.critical > 0) {
    return `URGENT: Fix ${bySeverity.critical} critical issue${bySeverity.critical > 1 ? 's' : ''} immediately to prevent security incidents.`;
  }

  return 'Major security improvements needed. Address all high severity issues urgently.';
}

/**
 * Format security score for display
 */
export function formatSecurityScore(securityScore: SecurityScore): string {
  const { score, grade, rating, issues } = securityScore;

  const lines: string[] = [];

  lines.push(`Score: ${score}/100 (${grade})`);
  lines.push(`Rating: ${rating}`);
  lines.push('');
  lines.push('Issues breakdown:');
  lines.push(`  Critical: ${issues.critical}`);
  lines.push(`  High: ${issues.high}`);
  lines.push(`  Medium: ${issues.medium}`);
  lines.push(`  Low: ${issues.low}`);
  lines.push('');
  lines.push(`Recommendation: ${securityScore.recommendation}`);

  return lines.join('\n');
}

/**
 * Get benchmark comparison
 */
export function getBenchmarkComparison(score: number, filesScanned: number): string {
  // Industry benchmarks (estimated)
  const benchmarks = {
    small: { files: 50, avgScore: 85, description: 'small projects' },
    medium: { files: 200, avgScore: 80, description: 'medium projects' },
    large: { files: 1000, avgScore: 75, description: 'large projects' },
  };

  let benchmark = benchmarks.small;
  if (filesScanned > 200) benchmark = benchmarks.large;
  else if (filesScanned > 50) benchmark = benchmarks.medium;

  const diff = score - benchmark.avgScore;
  const comparison =
    diff > 0 ? `${diff} points above` : diff < 0 ? `${Math.abs(diff)} points below` : 'at';

  return `Your score is ${comparison} the average for ${benchmark.description} (avg: ${benchmark.avgScore}/100)`;
}
