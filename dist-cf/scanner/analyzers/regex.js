export class RegexAnalyzer {
    async analyze(filePath, content, rule) {
        const findings = [];
        for (const pattern of rule.patterns) {
            const regex = new RegExp(pattern.regex, pattern.flags || 'g');
            const lines = content.split('\n');
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                const matches = line.matchAll(regex);
                for (const match of matches) {
                    const location = {
                        file: filePath,
                        line: i + 1,
                        column: match.index || 0,
                    };
                    const snippet = this.getSnippet(lines, i);
                    const fix = {
                        recommendation: rule.fix?.template || 'Review and fix this security issue',
                        before: line.trim(),
                        after: '',
                        references: rule.fix?.references || [],
                    };
                    const finding = {
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
                            confidence: this.calculateConfidence(match[0], pattern.regex),
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
    getSnippet(lines, lineIndex, context = 2) {
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
    calculateConfidence(match, pattern) {
        let confidence = 0.7;
        if (match.length > 20)
            confidence += 0.1;
        if (match.length > 40)
            confidence += 0.1;
        if (pattern.includes('\\b'))
            confidence += 0.05;
        if (pattern.includes('[A-Z]') || pattern.includes('[a-z]'))
            confidence += 0.05;
        return Math.min(confidence, 1.0);
    }
}
