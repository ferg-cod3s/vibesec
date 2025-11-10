import * as path from 'path';
import * as fs from 'fs/promises';
import fg from 'fast-glob';
import { Severity, } from './types';
import { RuleLoader } from './rule-loader';
import { RegexAnalyzer } from '../analyzers/regex';
import { DependencyAnalyzer } from '../analyzers/dependency';
export class Scanner {
    constructor(options) {
        this.options = {
            exclude: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.git/**'],
            include: ['**/*.js', '**/*.ts', '**/*.py', '**/*.jsx', '**/*.tsx'],
            parallel: true,
            maxFileSize: 5 * 1024 * 1024,
            ...options,
        };
        this.ruleLoader = new RuleLoader(this.options.rulesPath);
        this.analyzer = new RegexAnalyzer();
        this.dependencyAnalyzer = new DependencyAnalyzer();
    }
    async scan() {
        const startTime = new Date().toISOString();
        const scanStart = Date.now();
        const rules = await this.ruleLoader.load();
        if (!this.options.quiet)
            console.error(`📋 Loaded ${rules.length} rules`);
        const files = await this.findFiles();
        if (!this.options.quiet)
            console.error(`📁 Found ${files.length} files to scan`);
        const findings = [];
        let filesScanned = 0;
        if (this.options.parallel) {
            const promises = files.map((file) => this.scanFile(file, rules).catch((err) => {
                console.error(`⚠️  Error scanning ${file}:`, err.message);
                return [];
            }));
            const results = await Promise.all(promises);
            results.forEach((fileFindings) => findings.push(...fileFindings));
            filesScanned = files.length;
        }
        else {
            for (const file of files) {
                try {
                    const fileFindings = await this.scanFile(file, rules);
                    findings.push(...fileFindings);
                    filesScanned++;
                }
                catch (err) {
                    console.error(`⚠️  Error scanning ${file}:`, err.message);
                }
            }
        }
        const filteredFindings = this.filterBySeverity(findings);
        const summary = this.generateSummary(filteredFindings);
        const duration = (Date.now() - scanStart) / 1000;
        return {
            version: '0.1.0',
            scan: {
                path: this.options.path,
                filesScanned,
                duration,
                timestamp: startTime,
                version: '0.1.0',
            },
            summary,
            findings: filteredFindings,
        };
    }
    async findFiles() {
        const searchPath = path.resolve(this.options.path);
        try {
            const stat = await fs.stat(searchPath);
            if (stat.isFile()) {
                return [searchPath];
            }
        }
        catch {
            throw new Error(`Path not found: ${searchPath}`);
        }
        const patterns = this.options.include || ['**/*.{js,ts,py,jsx,tsx}'];
        const ignore = this.options.exclude || [];
        const files = await fg(patterns, {
            cwd: searchPath,
            absolute: true,
            ignore,
            onlyFiles: true,
        });
        return files;
    }
    async scanFile(filePath, rules) {
        const stat = await fs.stat(filePath);
        if (stat.size > (this.options.maxFileSize || 5 * 1024 * 1024)) {
            console.error(`⚠️  Skipping large file: ${filePath} (${stat.size} bytes)`);
            return [];
        }
        const content = await fs.readFile(filePath, 'utf-8');
        const ext = path.extname(filePath).slice(1);
        const language = this.mapExtensionToLanguage(ext);
        const applicableRules = rules.filter((rule) => rule.enabled &&
            (rule.languages.includes(language) || rule.languages.includes('*')));
        const findings = [];
        for (const rule of applicableRules) {
            const ruleFindings = await this.analyzer.analyze(filePath, content, rule);
            findings.push(...ruleFindings);
        }
        return findings;
    }
    mapExtensionToLanguage(ext) {
        const mapping = {
            js: 'javascript',
            jsx: 'javascript',
            ts: 'typescript',
            tsx: 'typescript',
            py: 'python',
        };
        return mapping[ext] || ext;
    }
    filterBySeverity(findings) {
        if (!this.options.severity) {
            return findings;
        }
        const severityOrder = [
            Severity.CRITICAL,
            Severity.HIGH,
            Severity.MEDIUM,
            Severity.LOW,
        ];
        const minIndex = severityOrder.indexOf(this.options.severity);
        return findings.filter((finding) => {
            const findingIndex = severityOrder.indexOf(finding.severity);
            return findingIndex <= minIndex;
        });
    }
    generateSummary(findings) {
        const summary = {
            total: findings.length,
            bySeverity: {
                critical: 0,
                high: 0,
                medium: 0,
                low: 0,
            },
            byCategory: {},
        };
        for (const finding of findings) {
            summary.bySeverity[finding.severity]++;
            summary.byCategory[finding.category] =
                (summary.byCategory[finding.category] || 0) + 1;
        }
        return summary;
    }
}
