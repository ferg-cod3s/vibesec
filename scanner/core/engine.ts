import * as path from 'path';
import * as fs from 'fs/promises';
import fg from 'fast-glob';
import {
  ScanOptions,
  ScanResult,
  Finding,
  ScanSummary,
  Category,
  Severity,
} from './types';
import { RuleLoader } from './rule-loader';
import { RegexAnalyzer } from '../analyzers/regex';
import { DependencyAnalyzer } from '../analyzers/dependency';
import { validatePath, validateBaseDirectory, PathValidationError } from '../../lib/path-validator';

export class Scanner {
  private options: ScanOptions;
  private ruleLoader: RuleLoader;
  private analyzer: RegexAnalyzer;
  private dependencyAnalyzer: DependencyAnalyzer;

  constructor(options: ScanOptions) {
    this.options = {
      exclude: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.git/**'],
      include: ['**/*.js', '**/*.ts', '**/*.py', '**/*.jsx', '**/*.tsx'],
      parallel: true,
      maxFileSize: 5 * 1024 * 1024, // 5MB default
      ...options,
    };

    this.ruleLoader = new RuleLoader(this.options.rulesPath);
    this.analyzer = new RegexAnalyzer();
    this.dependencyAnalyzer = new DependencyAnalyzer();
  }

  async scan(): Promise<ScanResult> {
    const startTime = new Date().toISOString();
    const scanStart = Date.now();

    // Load rules
    const rules = await this.ruleLoader.load();
    if (!this.options.quiet) console.error(`📋 Loaded ${rules.length} rules`);

    // Find files to scan
    const files = await this.findFiles();
    if (!this.options.quiet) console.error(`📁 Found ${files.length} files to scan`);

    // Scan files
    const findings: Finding[] = [];
    let filesScanned = 0;

    if (this.options.parallel) {
      // Parallel scanning
      const promises = files.map((file) =>
        this.scanFile(file, rules).catch((err) => {
          console.error(`⚠️  Error scanning ${file}:`, err.message);
          return [];
        })
      );
      const results = await Promise.all(promises);
      results.forEach((fileFindings) => findings.push(...fileFindings));
      filesScanned = files.length;
    } else {
      // Sequential scanning
      for (const file of files) {
        try {
          const fileFindings = await this.scanFile(file, rules);
          findings.push(...fileFindings);
          filesScanned++;
        } catch (err) {
          console.error(`⚠️  Error scanning ${file}:`, (err as Error).message);
        }
      }
    }

    // Filter by severity
    const filteredFindings = this.filterBySeverity(findings);

    // Generate summary
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

  private async findFiles(): Promise<string[]> {
    // Validate and sanitize the input path to prevent path traversal
    let searchPath: string;
    try {
      // For scan paths, we allow external paths (user may want to scan anywhere)
      // but we still normalize and validate the path
      searchPath = validatePath(this.options.path, { allowExternal: true });
    } catch (error) {
      if (error instanceof PathValidationError) {
        throw new Error(`Invalid scan path: ${error.message}`);
      }
      throw error;
    }

    // Check if path exists and determine if it's a file or directory
    let stat;
    try {
      stat = await fs.stat(searchPath);
    } catch (error) {
      throw new Error(`Path not found or not accessible: ${searchPath}`);
    }

    // If single file, validate and return it
    if (stat.isFile()) {
      return [searchPath];
    }

    // Ensure it's a directory
    if (!stat.isDirectory()) {
      throw new Error(`Path is neither a file nor a directory: ${searchPath}`);
    }

    // Scan directory with glob patterns
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

  private async scanFile(filePath: string, rules: any[]): Promise<Finding[]> {
    // Check file size
    const stat = await fs.stat(filePath);
    if (stat.size > (this.options.maxFileSize || 5 * 1024 * 1024)) {
      console.error(`⚠️  Skipping large file: ${filePath} (${stat.size} bytes)`);
      return [];
    }

    // Read file content
    const content = await fs.readFile(filePath, 'utf-8');

    // Detect language from extension
    const ext = path.extname(filePath).slice(1);
    const language = this.mapExtensionToLanguage(ext);

    // Filter rules by language
    const applicableRules = rules.filter(
      (rule) =>
        rule.enabled &&
        (rule.languages.includes(language) || rule.languages.includes('*'))
    );

    // Run detection
    const findings: Finding[] = [];
    for (const rule of applicableRules) {
      const ruleFindings = await this.analyzer.analyze(filePath, content, rule);
      findings.push(...ruleFindings);
    }

    return findings;
  }

  private mapExtensionToLanguage(ext: string): string {
    const mapping: Record<string, string> = {
      js: 'javascript',
      jsx: 'javascript',
      ts: 'typescript',
      tsx: 'typescript',
      py: 'python',
    };
    return mapping[ext] || ext;
  }

  private filterBySeverity(findings: Finding[]): Finding[] {
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

  private generateSummary(findings: Finding[]): ScanSummary {
    const summary: ScanSummary = {
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
