export function calculateSecurityScore(result) {
    const { bySeverity } = result.summary;
    const weights = {
        critical: 25,
        high: 10,
        medium: 5,
        low: 2,
    };
    const deductions = bySeverity.critical * weights.critical +
        bySeverity.high * weights.high +
        bySeverity.medium * weights.medium +
        bySeverity.low * weights.low;
    const score = Math.max(0, 100 - deductions);
    const grade = getGrade(score);
    const rating = getRating(score);
    const color = getColor(score);
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
function getGrade(score) {
    if (score >= 98)
        return 'A+';
    if (score >= 90)
        return 'A';
    if (score >= 80)
        return 'B';
    if (score >= 70)
        return 'C';
    if (score >= 60)
        return 'D';
    return 'F';
}
function getRating(score) {
    if (score >= 98)
        return 'Excellent';
    if (score >= 90)
        return 'Very Good';
    if (score >= 80)
        return 'Good';
    if (score >= 70)
        return 'Fair';
    if (score >= 60)
        return 'Poor';
    return 'Critical';
}
function getColor(score) {
    if (score >= 90)
        return 'green';
    if (score >= 80)
        return 'blue';
    if (score >= 70)
        return 'yellow';
    return 'red';
}
function getRecommendation(score, bySeverity) {
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
export function formatSecurityScore(securityScore) {
    const { score, grade, rating, issues } = securityScore;
    const lines = [];
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
export function getBenchmarkComparison(score, filesScanned) {
    const benchmarks = {
        small: { files: 50, avgScore: 85, description: 'small projects' },
        medium: { files: 200, avgScore: 80, description: 'medium projects' },
        large: { files: 1000, avgScore: 75, description: 'large projects' },
    };
    let benchmark = benchmarks.small;
    if (filesScanned > 200)
        benchmark = benchmarks.large;
    else if (filesScanned > 50)
        benchmark = benchmarks.medium;
    const diff = score - benchmark.avgScore;
    const comparison = diff > 0
        ? `${diff} points above`
        : diff < 0
            ? `${Math.abs(diff)} points below`
            : 'at';
    return `Your score is ${comparison} the average for ${benchmark.description} (avg: ${benchmark.avgScore}/100)`;
}
