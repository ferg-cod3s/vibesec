import { Finding, Rule, Pattern, RegexPattern, AstPattern } from '../core/types';
import { RegexAnalyzer } from './regex';
import { ASTAnalyzer } from './ast-analyzer';
import { EnhancedASTParser, ASTNode } from '../../src/ast/enhanced-ast-parser';

export class AnalyzerFactory {
  private regexAnalyzer: RegexAnalyzer;
  private astAnalyzer: ASTAnalyzer;
  private astParser: EnhancedASTParser;

  constructor(astParser?: EnhancedASTParser) {
    this.regexAnalyzer = new RegexAnalyzer();
    this.astAnalyzer = new ASTAnalyzer();
    this.astParser = astParser || new EnhancedASTParser();
  }

  /**
   * Analyze a file with the appropriate analyzer(s) based on rule patterns.
   * Combines findings across regex and AST patterns, deduplicating by location/rule.
   */
  async analyze(
    filePath: string,
    content: string,
    rule: Rule,
    opts?: { ast?: ASTNode[] }
  ): Promise<Finding[]> {
    const patterns = rule.patterns || [];

    const regexPatterns: RegexPattern[] = [];
    const astPatterns: AstPattern[] = [];

    for (const p of patterns as Pattern[]) {
      // Route by explicit type or presence of keys
      if ('type' in p && p.type === 'ast') {
        const query = (p as { query: string }).query;
        if (query) astPatterns.push({ type: 'ast', query });
        continue;
      }

      // Regex-like patterns: support both {regex} and {pattern}
      const regex = ('regex' in p && p.regex) ?? ('pattern' in p && p.pattern);
      if (typeof regex === 'string') {
        regexPatterns.push({
          type: 'regex',
          regex,
          flags: (p as any).flags,
          multiline: (p as any).multiline,
        });
      }
    }

    const findings: Finding[] = [];

    // Run regex analyzer if any regex patterns exist
    if (regexPatterns.length > 0) {
      for (const rp of regexPatterns) {
        const tmpRule: Rule = { ...rule, patterns: [rp] };
        const res = await this.regexAnalyzer.analyze(filePath, content, tmpRule);
        findings.push(...res);
      }
    }

    // Run AST analyzer if any ast patterns exist
    if (astPatterns.length > 0) {
      const ast = opts?.ast || (await this.astParser.parseFile(filePath)).ast;
      const tmpRule: Rule = { ...rule, patterns: astPatterns as unknown as Pattern[] };
      const res = await this.astAnalyzer.analyze(filePath, content, ast, tmpRule);
      findings.push(...res);
    }

    // Deduplicate findings by rule + file + line + column
    const dedup = new Map<string, Finding>();
    for (const f of findings) {
      const key = `${f.rule}:${f.location.file}:${f.location.line}:${f.location.column}`;
      if (!dedup.has(key)) dedup.set(key, f);
    }

    return Array.from(dedup.values());
  }
}
