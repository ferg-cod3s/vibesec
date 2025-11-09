import { Finding, Rule, Location, FixRecommendation, Pattern } from '../core/types';

export class RegexAnalyzer {
  async analyze(filePath: string, content: string, rule: Rule): Promise<Finding[]> {
    const findings: Finding[] = [];

    for (const p of rule.patterns as Pattern[]) {
      // Support only regex-like patterns here
      const regexSource = (p as any).regex ?? (p as any).pattern;
      const flags = (p as any).flags || 'g';
      if (!regexSource || (p as any).type === 'ast') continue;

      const regex = new RegExp(regexSource as string, flags as string);
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const matches = line.matchAll(regex);

        for (const match of matches) {
          const location: Location = {
            file: filePath,
            line: i + 1,
            column: match.index || 0,
          };

          const snippet = this.getSnippet(lines, i);

          const fix: FixRecommendation = {
            recommendation: rule.fix?.template || 'Review and fix this security issue',
            before: line.trim(),
            after: '', // Will be populated by specific detectors
            references: rule.fix?.references || [],
          };

          const finding: Finding = {
            id: `${rule.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            rule: rule.id,
            severity: rule.severity,
            category: rule.category,
            title: rule.name,
            description: rule.description,
            location,
            snippet,
            fix,
            metadata: {
              confidence: this.calculateConfidence(match[0], String(regexSource)),
              cwe: rule.metadata?.cwe,
              owasp: rule.metadata?.owasp,
            },
          };

          findings.push(finding);
        }
      }
    }

    return findings;
  }

  private getSnippet(lines: string[], lineIndex: number, context: number = 2): string {
    const start = Math.max(0, lineIndex - context);
    const end = Math.min(lines.length, lineIndex + context + 1);

    return lines
      .slice(start, end)
      .map((line, i) => {
        const actualLine = start + i + 1;
        const prefix = actualLine === lineIndex + 1 ? '→ ' : '  ';
        return `${prefix}${actualLine.toString().padStart(4, ' ')} | ${line}`;
      })
      .join('\n');
  }

  private calculateConfidence(match: string, pattern: string): number {
    // Simple heuristic: longer matches and more specific patterns = higher confidence
    let confidence = 0.7;

    // Increase confidence for longer matches
    if (match.length > 20) confidence += 0.1;
    if (match.length > 40) confidence += 0.1;

    // Increase confidence for more specific patterns
    if (pattern.includes('\\b')) confidence += 0.05; // Word boundaries
    if (pattern.includes('[A-Z]') || pattern.includes('[a-z]')) confidence += 0.05; // Character classes

    return Math.min(confidence, 1.0);
  }
}
