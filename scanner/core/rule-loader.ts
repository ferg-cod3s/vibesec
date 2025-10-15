import * as path from 'path';
import * as fs from 'fs/promises';
import * as yaml from 'js-yaml';
import fg from 'fast-glob';
import { Rule, Pattern } from './types';

export class RuleLoader {
  private rulesPath: string;

  constructor(rulesPath?: string) {
    this.rulesPath = rulesPath || path.join(__dirname, '../../rules/default');
  }

  async load(): Promise<Rule[]> {
    const rules: Rule[] = [];

    try {
      // Find all YAML files in rules directory
      const ruleFiles = await fg('**/*.{yaml,yml}', {
        cwd: this.rulesPath,
        absolute: true,
        onlyFiles: true,
      });

      // Load each rule file
      for (const file of ruleFiles) {
        try {
          const content = await fs.readFile(file, 'utf-8');
          const parsed = yaml.load(content) as any;

          // Handle both single rule and multiple rules in a file
          if (Array.isArray(parsed)) {
            rules.push(...parsed.map((r) => this.validateRule(r, file)));
          } else if (parsed.rules && Array.isArray(parsed.rules)) {
            rules.push(...parsed.rules.map((r: any) => this.validateRule(r, file)));
          } else {
            rules.push(this.validateRule(parsed, file));
          }
        } catch (err) {
          console.error(`⚠️  Error loading rule file ${file}:`, (err as Error).message);
        }
      }
    } catch (err) {
      console.error(`⚠️  Error scanning rules directory:`, (err as Error).message);
    }

    return rules;
  }

  private validateRule(rule: any, file: string): Rule {
    // Basic validation
    if (!rule.id || !rule.name || !rule.patterns) {
      throw new Error(`Invalid rule in ${file}: missing required fields`);
    }

    // Convert patterns to Pattern[] format
    const patterns: Pattern[] = (Array.isArray(rule.patterns) ? rule.patterns : [rule.patterns]).map(
      (p: string | Pattern) => {
        if (typeof p === 'string') {
          return { regex: p, flags: 'gm' };
        }
        return p;
      }
    );

    // Parse fix metadata
    const fix = rule.fix
      ? {
          template: typeof rule.fix === 'string' ? rule.fix : rule.fix.template || rule.fix,
          references: rule.fix.references || rule.references || [],
        }
      : undefined;

    // Parse metadata - check both nested metadata object and top-level fields
    const metadata: any = {
      cwe: rule.metadata?.cwe || rule.cwe,
      owasp: rule.metadata?.owasp || rule.owasp,
      tags: rule.metadata?.tags || rule.tags || [],
    };

    // Add risk as description if provided
    const description = rule.risk || rule.description || '';

    return {
      id: rule.id,
      name: rule.name,
      description,
      severity: rule.severity || 'medium',
      category: rule.category || 'custom',
      patterns,
      languages: Array.isArray(rule.languages) ? rule.languages : ['*'],
      enabled: rule.enabled !== false,
      fix,
      metadata,
    };
  }
}
