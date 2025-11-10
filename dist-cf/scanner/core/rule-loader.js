import * as path from 'path';
import * as fs from 'fs/promises';
import * as yaml from 'js-yaml';
import fg from 'fast-glob';
export class RuleLoader {
    constructor(rulesPath) {
        this.rulesPath = rulesPath || path.join(__dirname, '../../rules/default');
    }
    async load() {
        const rules = [];
        try {
            const ruleFiles = await fg('**/*.{yaml,yml}', {
                cwd: this.rulesPath,
                absolute: true,
                onlyFiles: true,
            });
            for (const file of ruleFiles) {
                try {
                    const content = await fs.readFile(file, 'utf-8');
                    const parsed = yaml.load(content);
                    if (Array.isArray(parsed)) {
                        rules.push(...parsed.map((r) => this.validateRule(r, file)));
                    }
                    else if (parsed.rules && Array.isArray(parsed.rules)) {
                        rules.push(...parsed.rules.map((r) => this.validateRule(r, file)));
                    }
                    else {
                        rules.push(this.validateRule(parsed, file));
                    }
                }
                catch (err) {
                    console.error(`⚠️  Error loading rule file ${file}:`, err.message);
                }
            }
        }
        catch (err) {
            console.error(`⚠️  Error scanning rules directory:`, err.message);
        }
        return rules;
    }
    validateRule(rule, file) {
        if (!rule.id || !rule.name || !rule.patterns) {
            throw new Error(`Invalid rule in ${file}: missing required fields`);
        }
        const patterns = (Array.isArray(rule.patterns) ? rule.patterns : [rule.patterns]).map((p) => {
            if (typeof p === 'string') {
                return { regex: p, flags: 'gm' };
            }
            return p;
        });
        const fix = rule.fix
            ? {
                template: typeof rule.fix === 'string' ? rule.fix : rule.fix.template || rule.fix,
                references: rule.fix.references || rule.references || [],
            }
            : undefined;
        const metadata = {
            cwe: rule.metadata?.cwe || rule.cwe,
            owasp: rule.metadata?.owasp || rule.owasp,
            tags: rule.metadata?.tags || rule.tags || [],
        };
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
