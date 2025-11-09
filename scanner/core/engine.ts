import * as path from 'path';
import * as fs from 'fs/promises';
import fg from 'fast-glob';
import { ScanOptions, ScanResult, Finding, ScanSummary, Severity } from './types';
import { RuleLoader } from './rule-loader';
import { RegexAnalyzer } from '../analyzers/regex';
import { DependencyAnalyzer } from '../analyzers/dependency';
import { IncrementalScanner, ScanCache } from '../../src/incremental/incremental-scanner';

export class Scanner {
  private options: ScanOptions;
  private ruleLoader: RuleLoader;
  private analyzer: RegexAnalyzer;
  private dependencyAnalyzer: DependencyAnalyzer;
  private incremental: IncrementalScanner;
  private cache: ScanCache | null = null;
  private cachePath: string | null = null;

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
    this.incremental = new IncrementalScanner();
  }

  async scan(): Promise<ScanResult> {
    const startTime = new Date().toISOString();
    const scanStart = Date.now();

    // Load rules
    const rules = await this.ruleLoader.load();
    if (!this.options.quiet) console.error(`📋 Loaded ${rules.length} rules`);

    // Initialize incremental cache (skip if full scan explicitly requested)
    const cacheDir = this.options.cacheDir || '.vibesec-cache';
    this.cachePath = path.resolve(process.cwd(), cacheDir, 'scan-cache.json');
    if (!this.options.full) {
      try {
        await fs.mkdir(path.dirname(this.cachePath), { recursive: true });
        this.cache = (await this.incremental.loadCache(this.cachePath)) || {
          files: new Map(),
          rules: new Map(),
          results: new Map(),
        };
      } catch (error) {
        if (!this.options.quiet) {
          console.error('⚠️  Failed to initialize cache:', (error as Error).message);
        }
        this.cache = null;
      }
    } else {
      this.cache = null;
    }

    // Find files to scan
    const files = await this.findFiles();
    if (!this.options.quiet) console.error(`📁 Found ${files.length} files to scan`);

    // Pre-compute file hashes in batches for better performance
    const fileHashes = new Map<string, string>();
    if (this.cache && files.length > 0) {
      try {
        const hashes = await this.incremental.batchGitHashes(files, process.cwd());
        hashes.forEach((hash, filePath) => fileHashes.set(filePath, hash));
      } catch (error) {
        if (!this.options.quiet) {
          console.error('⚠️  Failed to batch compute file hashes:', (error as Error).message);
        }
      }
    }

    // Scan files
    const findings: Finding[] = [];
    let filesScanned = 0;

    if (this.options.parallel) {
      // Parallel scanning
      const promises = files.map((file) =>
        this.scanFile(file, rules, fileHashes.get(file) || '').catch((err) => {
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
          const fileFindings = await this.scanFile(file, rules, fileHashes.get(file) || '');
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

    // Save cache
    if (this.cache && this.cachePath) {
      try {
        await this.incremental.saveCache(this.cache, this.cachePath);
      } catch (e) {
        if (!this.options.quiet) console.error('⚠️  Failed to save cache');
      }
    }

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
    const searchPath = path.resolve(this.options.path);

    // Check if path is a file
    try {
      const stat = await fs.stat(searchPath);
      if (stat.isFile()) {
        return [searchPath];
      }
    } catch {
      throw new Error(`Path not found: ${searchPath}`);
    }

    // If incremental mode, limit to changed files
    if (this.options.incremental) {
      const changed = await this.incremental.getChangedFiles(process.cwd());
      const abs = changed
        .map((p) => path.resolve(process.cwd(), p))
        .filter((p) => p.startsWith(searchPath));
      // basic exclude filter
      const ignoreDirs = (this.options.exclude || []).map((pat) => pat.replace('**/', ''));
      const filtered = abs.filter((p) => !ignoreDirs.some((dir) => p.includes(dir)));
      return filtered;
    }

    // Scan directory
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

  private async scanFile(filePath: string, rules: any[], preComputedHash = ''): Promise<Finding[]> {
    // Check file size
    const stat = await fs.stat(filePath);
    if (stat.size > (this.options.maxFileSize || 5 * 1024 * 1024)) {
      console.error(`⚠️  Skipping large file: ${filePath} (${stat.size} bytes)`);
      return [];
    }

    // Incremental cache check
    let fileHash = preComputedHash;
    if (!fileHash) {
      try {
        fileHash = await this.incremental.getFileHash(filePath, process.cwd());
      } catch {
        fileHash = '';
      }
    }

    if (fileHash && this.cache) {
      const cached = this.incremental.getCachedResults(this.cache, fileHash);
      if (cached) return cached;
    }

    // Read file content
    const content = await fs.readFile(filePath, 'utf-8');

    // Detect language from extension
    const ext = path.extname(filePath).slice(1);
    const language = this.mapExtensionToLanguage(ext);

    // Filter rules by language and advanced optimizations
    let applicableRules = rules.filter(
      (rule) => rule.enabled && (rule.languages.includes(language) || rule.languages.includes('*'))
    );

    // Smart rule filtering based on file characteristics
    if (applicableRules.length > 30) {
      // For files with many applicable rules, apply intelligent filtering
      applicableRules = applicableRules.filter((rule) => {
        // Always include critical/high severity rules
        if (rule.severity === 'critical' || rule.severity === 'high') return true;

        // For medium/low rules, check content relevance
        if (rule.severity === 'medium' || rule.severity === 'low') {
          // Quick content check for obvious patterns
          const hasRelevantContent =
            content.includes('password') ||
            content.includes('secret') ||
            content.includes('token') ||
            content.includes('sql') ||
            content.includes('exec') ||
            content.includes('eval') ||
            content.includes('innerHTML') ||
            content.includes('document.write');

          return hasRelevantContent;
        }

        return true;
      });
    }

    // Run detection
    const findings: Finding[] = [];
    for (const rule of applicableRules) {
      const ruleFindings = await this.analyzer.analyze(filePath, content, rule);
      findings.push(...ruleFindings);
    }

    // Update cache with new results
    if (fileHash && this.cache) {
      this.cache.results.set(fileHash, findings);
      this.cache.files.set(filePath, { hash: fileHash, timestamp: Date.now() });
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

    const severityOrder = [Severity.CRITICAL, Severity.HIGH, Severity.MEDIUM, Severity.LOW];
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
      summary.byCategory[finding.category] = (summary.byCategory[finding.category] || 0) + 1;
    }

    return summary;
  }
}
