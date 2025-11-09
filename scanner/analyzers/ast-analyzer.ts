import {
  Finding,
  Rule,
  Severity,
  Category,
  Location,
  FixRecommendation,
  Pattern,
} from '../core/types';
import { ASTNode } from '../../src/ast/enhanced-ast-parser';

export class ASTAnalyzer {
  /**
   * Perform simplified AST-based analysis.
   * Supports basic query: "NodeType" or "NodeType[name=Identifier]".
   * Also supports naive dataflow queries: "flow(sourceRegex -> sinkRegex)".
   */
  async analyze(filePath: string, content: string, ast: ASTNode[], rule: Rule): Promise<Finding[]> {
    const findings: Finding[] = [];
    const lines = content.split('\n');

    for (const p of rule.patterns as Pattern[]) {
      if ((p as any).type !== 'ast') continue;
      const query = String((p as any).query || '').trim();
      if (!query) continue;

      // Dataflow query: flow(source -> sink)
      const flowMatch = query.match(/flow\((.+)->(.+)\)/i);
      if (flowMatch) {
        const sourceRe = new RegExp(flowMatch[1].trim());
        const sinkRe = new RegExp(flowMatch[2].trim());
        this.detectNaiveFlow(filePath, lines, sourceRe, sinkRe, rule, findings);
        continue;
      }

      // NodeType[name=Identifier]
      const nodeQuery = query.match(/^(\w+)(?:\s*\[\s*name\s*=\s*['"]?([^'"\]]+)['"]?\s*\])?$/);
      if (nodeQuery) {
        const qType = nodeQuery[1];
        const qName = nodeQuery[2];
        for (const node of ast) {
          if (node.type === qType && (!qName || node.name === qName)) {
            const location: Location = {
              file: filePath,
              line: node.line,
              column: node.column,
            };
            const snippet = this.getSnippet(lines, node.line - 1);
            const fix: FixRecommendation = {
              recommendation: rule.fix?.template || 'Review and fix this security issue',
              before: node.content.trim(),
              after: '',
              references: rule.fix?.references || [],
            };
            findings.push({
              id: `${rule.id}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
              rule: rule.id,
              severity: rule.severity,
              category: rule.category as Category,
              title: rule.name,
              description: rule.description,
              location,
              snippet,
              fix,
              metadata: {
                confidence: rule.confidence ?? 0.8,
                cwe: rule.metadata?.cwe,
                owasp: rule.metadata?.owasp,
              },
            });
          }
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

  // Very naive flow detection across lines: variable assigned from source appears in sink usage
  private detectNaiveFlow(
    filePath: string,
    lines: string[],
    sourceRe: RegExp,
    sinkRe: RegExp,
    rule: Rule,
    findings: Finding[]
  ): void {
    const varAssignments: Record<string, number> = {};

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // const x = req.body.name; or x = req.body
      const assignMatch = line.match(/(?:const|let|var)?\s*(\w+)\s*=\s*(.+)/);
      if (assignMatch && sourceRe.test(assignMatch[2])) {
        varAssignments[assignMatch[1]] = i;
      }
    }

    // Search for sink usage with any of the assigned vars
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!sinkRe.test(line)) continue;
      for (const v of Object.keys(varAssignments)) {
        if (line.includes(v)) {
          const location: Location = {
            file: filePath,
            line: i + 1,
            column: Math.max(0, line.indexOf(v)),
          };
          const fix: FixRecommendation = {
            recommendation: rule.fix?.template || 'Validate/sanitize untrusted input before use',
            before: line.trim(),
            after: '',
            references: rule.fix?.references || [],
          };
          findings.push({
            id: `${rule.id}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            rule: rule.id,
            severity: rule.severity as Severity,
            category: rule.category as Category,
            title: rule.name,
            description: rule.description,
            location,
            snippet: this.getSnippet(lines, i),
            fix,
            metadata: {
              confidence: 0.6,
              cwe: rule.metadata?.cwe,
              owasp: rule.metadata?.owasp,
            },
          });
        }
      }
    }
  }
}
