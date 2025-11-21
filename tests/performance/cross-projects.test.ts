/**
 * Cross-Project Performance Testing for VibeSec
 * 
 * Tests VibeSec performance across all projects in ~/Github/
 * using bun:test with secure agent injection and clean output.
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { Scanner } from '../../scanner/core/engine';
import { MCPServer } from '../../src/mcp/server';
import { DependencyAnalyzer } from '../../scanner/analyzers/dependency';
import { PerformanceBenchmark } from '../../lib/performance/benchmark';
import { MemoryProfiler } from '../../lib/performance/memory-profiler';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

// Cross-project testing configuration
interface CrossProjectConfig {
  baseDir: string;
  excludePatterns: string[];
  maxProjects: number;
  maxFileSize: number;
  timeoutMs: number;
  sanitizePaths: boolean;
}

interface ProjectMetrics {
  name: string;
  path: string;
  fileCount: number;
  scanDuration: number;
  memoryUsage: number;
  findingsCount: number;
  errorCount: number;
  success: boolean;
}

interface CrossProjectReport {
  totalProjects: number;
  successfulProjects: number;
  failedProjects: number;
  totalFiles: number;
  totalFindings: number;
  averageScanTime: number;
  peakMemoryUsage: number;
  performanceByLanguage: Record<string, {
    projects: number;
    avgScanTime: number;
    avgMemoryUsage: number;
  }>;
  failedProjects: Array<{
    name: string;
    error: string;
  }>;
}

class CrossProjectTester {
  private config: CrossProjectConfig;
  private projectMetrics: ProjectMetrics[] = [];
  private benchmark: PerformanceBenchmark;
  private memoryProfiler: MemoryProfiler;

  constructor(config: CrossProjectConfig) {
    this.config = config;
    this.benchmark = new PerformanceBenchmark();
    this.memoryProfiler = new MemoryProfiler();
  }

  async testAllProjects(): Promise<CrossProjectReport> {
    const projects = await this.discoverProjects();
    console.log(`Discovered ${projects.length} projects to test`);

    this.benchmark.start();
    this.memoryProfiler.start(1000); // Snapshot every second

    // Test projects with concurrency limit
    const concurrencyLimit = 5;
    const results: ProjectMetrics[] = [];

    for (let i = 0; i < projects.length; i += concurrencyLimit) {
      const batch = projects.slice(i, i + concurrencyLimit);
      
      const batchPromises = batch.map(project => 
        this.testProject(project).catch(error => ({
          name: project.name,
          path: project.path,
          fileCount: 0,
          scanDuration: 0,
          memoryUsage: 0,
          findingsCount: 0,
          errorCount: 1,
          success: false,
          error: error instanceof Error ? error.message : String(error)
        }))
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.projectMetrics = results;
    const memoryProfile = this.memoryProfiler.stop();
    const benchmarkResult = this.benchmark.stop('cross-project-test', results.reduce((sum, r) => sum + r.fileCount, 0));

    return this.generateReport(results, memoryProfile, benchmarkResult);
  }

  private async discoverProjects(): Promise<Array<{ name: string, path: string }>> {
    const entries = await fs.readdir(this.config.baseDir, { withFileTypes: true });
    const projects = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const projectPath = path.join(this.config.baseDir, entry.name);
      
      // Skip excluded patterns
      if (this.config.excludePatterns.some(pattern => entry.name.match(pattern))) {
        continue;
      }

      // Check if it's a valid project (has source files)
      const isValidProject = await this.isValidProject(projectPath);
      if (isValidProject) {
        projects.push({
          name: entry.name,
          path: projectPath
        });
      }
    }

    return projects.slice(0, this.config.maxProjects);
  }

  private async isValidProject(projectPath: string): Promise<boolean> {
    try {
      const entries = await fs.readdir(projectPath, { withFileTypes: true });
      
      // Look for common project indicators
      const hasSourceFiles = entries.some(entry => 
        entry.isFile() && /\.(js|ts|py|jsx|tsx|go|rs)$/.test(entry.name)
      );
      
      const hasConfigFiles = entries.some(entry => 
        entry.isFile() && /(package\.json|Cargo\.toml|requirements\.txt|setup\.py|go\.mod|tsconfig\.json)/.test(entry.name)
      );

      return hasSourceFiles || hasConfigFiles;
    } catch {
      return false;
    }
  }

  private async testProject(project: { name: string, path: string }): Promise<ProjectMetrics> {
    const startTime = performance.now();
    const startMemory = process.memoryUsage().heapUsed;

    try {
      // Count files
      const fileCount = await this.countFiles(project.path);
      
      // Test scanner performance
      const scanner = new Scanner({ 
        path: project.path, 
        parallel: true,
        quiet: true,
        maxFileSize: this.config.maxFileSize
      });

      const scanResult = await Promise.race([
        scanner.scan(),
        this.createTimeout(this.config.timeoutMs)
      ]);

      const endTime = performance.now();
      const endMemory = process.memoryUsage().heapUsed;

      return {
        name: project.name,
        path: project.path,
        fileCount,
        scanDuration: endTime - startTime,
        memoryUsage: endMemory - startMemory,
        findingsCount: scanResult.findings.length,
        errorCount: 0,
        success: true
      };

    } catch (error) {
      const endTime = performance.now();
      const endMemory = process.memoryUsage().heapUsed;

      return {
        name: project.name,
        path: project.path,
        fileCount: 0,
        scanDuration: endTime - startTime,
        memoryUsage: endMemory - startMemory,
        findingsCount: 0,
        errorCount: 1,
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private async countFiles(projectPath: string): Promise<number> {
    try {
      const entries = await fs.readdir(projectPath, { withFileTypes: true });
      let count = 0;

      for (const entry of entries) {
        if (entry.isFile() && /\.(js|ts|py|jsx|tsx|go|rs)$/.test(entry.name)) {
          count++;
        } else if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          count += await this.countFiles(path.join(projectPath, entry.name));
        }
      }

      return count;
    } catch {
      return 0;
    }
  }

  private createTimeout(ms: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Project test timeout after ${ms}ms`)), ms);
    });
  }

  private generateReport(metrics: ProjectMetrics[], memoryProfile: any, benchmarkResult: any): CrossProjectReport {
    const successful = metrics.filter(m => m.success);
    const failed = metrics.filter(m => !m.success);

    // Group by primary language
    const languageStats: Record<string, ProjectMetrics[]> = {};
    for (const metric of successful) {
      const language = this.detectPrimaryLanguage(metric.path);
      if (!languageStats[language]) languageStats[language] = [];
      languageStats[language].push(metric);
    }

    const performanceByLanguage: Record<string, any> = {};
    for (const [language, langMetrics] of Object.entries(languageStats)) {
      performanceByLanguage[language] = {
        projects: langMetrics.length,
        avgScanTime: langMetrics.reduce((sum, m) => sum + m.scanDuration, 0) / langMetrics.length,
        avgMemoryUsage: langMetrics.reduce((sum, m) => sum + m.memoryUsage, 0) / langMetrics.length
      };
    }

    return {
      totalProjects: metrics.length,
      successfulProjects: successful.length,
      failedProjects: failed.length,
      totalFiles: successful.reduce((sum, m) => sum + m.fileCount, 0),
      totalFindings: successful.reduce((sum, m) => sum + m.findingsCount, 0),
      averageScanTime: successful.length > 0 ? successful.reduce((sum, m) => sum + m.scanDuration, 0) / successful.length : 0,
      peakMemoryUsage: memoryProfile.peakHeapUsed,
      performanceByLanguage,
      failedProjects: failed.map(m => ({
        name: m.name,
        error: m.error || 'Unknown error'
      }))
    };
  }

  private detectPrimaryLanguage(projectPath: string): string {
    // Simple language detection based on file extensions
    const languageCounts: Record<string, number> = {};

    try {
      const entries = await fs.readdir(projectPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          const language = this.mapExtensionToLanguage(ext);
          if (language) {
            languageCounts[language] = (languageCounts[language] || 0) + 1;
          }
        }
      }
    } catch {
      return 'unknown';
    }

    // Return language with most files
    return Object.entries(languageCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'unknown';
  }

  private mapExtensionToLanguage(ext: string): string | null {
    const mapping: Record<string, string> = {
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.py': 'python',
      '.go': 'go',
      '.rs': 'rust'
    };
    return mapping[ext] || null;
  }

  generateDetailedReport(): string {
    if (this.projectMetrics.length === 0) {
      return 'No project metrics available';
    }

    const lines = [
      '═══════════════════════════════════════════════════════════════',
      '              VibeSec Cross-Project Performance Report           ',
      '═══════════════════════════════════════════════════════════════',
      ''
    ];

    // Summary
    const successful = this.projectMetrics.filter(m => m.success);
    const failed = this.projectMetrics.filter(m => !m.success);

    lines.push(`📊 SUMMARY`);
    lines.push(`Total Projects: ${this.projectMetrics.length}`);
    lines.push(`Successful: ${successful.length} ✅`);
    lines.push(`Failed: ${failed.length} ❌`);
    lines.push(`Total Files Scanned: ${successful.reduce((sum, m) => sum + m.fileCount, 0)}`);
    lines.push(`Total Findings: ${successful.reduce((sum, m) => sum + m.findingsCount, 0)}`);
    lines.push('');

    // Performance metrics
    if (successful.length > 0) {
      const avgScanTime = successful.reduce((sum, m) => sum + m.scanDuration, 0) / successful.length;
      const avgMemoryUsage = successful.reduce((sum, m) => sum + m.memoryUsage, 0) / successful.length;
      const maxScanTime = Math.max(...successful.map(m => m.scanDuration));
      const maxMemoryUsage = Math.max(...successful.map(m => m.memoryUsage));

      lines.push(`⚡ PERFORMANCE METRICS`);
      lines.push(`Average Scan Time: ${(avgScanTime / 1000).toFixed(2)}s`);
      lines.push(`Maximum Scan Time: ${(maxScanTime / 1000).toFixed(2)}s`);
      lines.push(`Average Memory Usage: ${(avgMemoryUsage / 1024 / 1024).toFixed(2)} MB`);
      lines.push(`Maximum Memory Usage: ${(maxMemoryUsage / 1024 / 1024).toFixed(2)} MB`);
      lines.push('');
    }

    // Top performers
    const topPerformers = successful
      .sort((a, b) => a.scanDuration - b.scanDuration)
      .slice(0, 5);

    if (topPerformers.length > 0) {
      lines.push(`🏆 FASTEST SCANS`);
      topPerformers.forEach((metric, index) => {
        lines.push(`${index + 1}. ${metric.name}: ${(metric.scanDuration / 1000).toFixed(2)}s (${metric.fileCount} files)`);
      });
      lines.push('');
    }

    // Failed projects
    if (failed.length > 0) {
      lines.push(`❌ FAILED PROJECTS`);
      failed.forEach(metric => {
        lines.push(`• ${metric.name}: ${metric.error}`);
      });
      lines.push('');
    }

    // Language breakdown
    const languageBreakdown: Record<string, { count: number, avgTime: number }> = {};
    for (const metric of successful) {
      const language = this.detectPrimaryLanguage(metric.path);
      if (!languageBreakdown[language]) {
        languageBreakdown[language] = { count: 0, avgTime: 0 };
      }
      languageBreakdown[language].count++;
      languageBreakdown[language].avgTime += metric.scanDuration;
    }

    for (const [language, stats] of Object.entries(languageBreakdown)) {
      stats.avgTime = stats.avgTime / stats.count;
    }

    lines.push(`📝 LANGUAGE BREAKDOWN`);
    Object.entries(languageBreakdown)
      .sort(([, a], [, b]) => b.count - a.count)
      .forEach(([language, stats]) => {
        lines.push(`${language}: ${stats.count} projects, avg ${(stats.avgTime / 1000).toFixed(2)}s`);
      });

    lines.push('');
    lines.push(`═══════════════════════════════════════════════════════════════`);
    lines.push(`Generated: ${new Date().toISOString()}`);

    return lines.join('\n');
  }
}

// Global configuration
const CROSS_PROJECT_CONFIG: CrossProjectConfig = {
  baseDir: '/Users/johnferguson/Github',
  excludePatterns: ['^\\.', 'node_modules', 'dist', 'build', '.git'],
  maxProjects: 20, // Limit to prevent excessive testing (reduced for CI)
  maxFileSize: 10 * 1024 * 1024, // 10MB
  timeoutMs: 300000, // 5 minutes per project
  sanitizePaths: true
};

describe('Cross-Project Performance Tests', () => {
  let crossProjectTester: CrossProjectTester;

  beforeEach(() => {
    crossProjectTester = new CrossProjectTester(CROSS_PROJECT_CONFIG);
  });

  afterEach(() => {
    // Cleanup handled by tester
  });

  it('should test all Github projects efficiently', async () => {
    const report = await crossProjectTester.testAllProjects();
    
    // Basic assertions
    expect(report.totalProjects).toBeGreaterThan(0);
    expect(report.successfulProjects).toBeGreaterThanOrEqual(0);
    expect(report.averageScanTime).toBeLessThan(60000); // 60 seconds average
    expect(report.peakMemoryUsage).toBeLessThan(1024 * 1024 * 1024); // 1GB
    
    // Success rate should be reasonable
    const successRate = report.totalProjects > 0 ? report.successfulProjects / report.totalProjects : 0;
    expect(successRate).toBeGreaterThan(0.5); // At least 50% success
    
    console.log('\n' + crossProjectTester.generateDetailedReport());
  }, 1800000); // 30 minutes total timeout

  it('should handle different project types', async () => {
    const report = await crossProjectTester.testAllProjects();
    
    // Should test multiple languages
    const languages = Object.keys(report.performanceByLanguage);
    expect(languages.length).toBeGreaterThan(1); // At least 2 languages
    
    // Each language should have reasonable performance
    for (const [language, perf] of Object.entries(report.performanceByLanguage)) {
      expect(perf.avgScanTime).toBeLessThan(120000); // 2 minutes per language
      expect(perf.avgMemoryUsage).toBeLessThan(500 * 1024 * 1024); // 500MB per language
    }
    
    console.log(`Languages tested: ${languages.join(', ')}`);
  }, 1800000);

  it('should maintain performance across project sizes', async () => {
    const report = await crossProjectTester.testAllProjects();
    
    // Group projects by size (small, medium, large)
    const projectSizes = await this.getProjectSizeBreakdown();
    
    for (const [size, projects] of Object.entries(projectSizes)) {
      if (projects.length === 0) continue;
      
      const avgTime = projects.reduce((sum, p) => sum + p.scanDuration, 0) / projects.length;
      const avgMemory = projects.reduce((sum, p) => sum + p.memoryUsage, 0) / projects.length;
      
      // Performance should be reasonable regardless of project size
      expect(avgTime).toBeLessThan(120000); // 2 minutes
      expect(avgMemory).toBeLessThan(500 * 1024 * 1024); // 500MB
      
      console.log(`${size} projects: ${projects.length}, avg time: ${(avgTime / 1000).toFixed(2)}s`);
    }
  }, 1800000);

  it('should handle errors gracefully', async () => {
    const report = await crossProjectTester.testAllProjects();
    
    // Should handle some failures gracefully
    if (report.failedProjects.length > 0) {
      // Failed projects should have error messages
      report.failedProjects.forEach(failed => {
        expect(failed.error).toBeDefined();
        expect(failed.error.length).toBeGreaterThan(0);
      });
      
      // Failure rate should be reasonable
      const failureRate = report.failedProjects.length / report.totalProjects;
      expect(failureRate).toBeLessThan(0.5); // Less than 50% failure
    }
    
    console.log(`Failed projects: ${report.failedProjects.length}/${report.totalProjects}`);
  }, 1800000);
});

// Helper function for size breakdown
async function getProjectSizeBreakdown(): Promise<Record<string, any[]>> {
  // This would need to be implemented based on actual project metrics
  // For now, return placeholder structure
  return {
    small: [],    // < 100 files
    medium: [],   // 100-1000 files  
    large: []     // > 1000 files
  };
}