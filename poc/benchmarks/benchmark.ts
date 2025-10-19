import * as fs from 'fs/promises';
import * as path from 'path';
import { performance } from 'perf_hooks';

export interface BenchmarkMetrics {
  totalFiles: number;
  totalParseTimeMs: number;
  averageParseTimeMs: number;
  minParseTimeMs: number;
  maxParseTimeMs: number;
  detectionCount: number;
  memoryUsedMB: number;
  timestampMs: number;
}

export interface BenchmarkResult {
  name: string;
  duration: {
    start: number;
    end: number;
    totalMs: number;
  };
  metrics: BenchmarkMetrics;
}

export async function getAllFilesInCorpus(corpusDir: string): Promise<string[]> {
  const files: string[] = [];
  const entries = await fs.readdir(corpusDir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.ts'))) {
      files.push(path.join(corpusDir, entry.name));
    }
  }

  return files.sort();
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function generateBenchmarkReport(results: BenchmarkResult[]): string {
  let report = `# Parser Benchmark Report\n\n`;
  report += `Generated: ${new Date().toISOString()}\n\n`;

  report += `## Summary\n\n`;
  report += `| Parser | Files | Avg Time (ms) | Total Time (s) | Memory (MB) | Detections |\n`;
  report += `|--------|-------|--------------|----------------|-------------|------------|\n`;

  for (const result of results) {
    const metrics = result.metrics;
    report += `| ${result.name} | ${metrics.totalFiles} | ${metrics.averageParseTimeMs.toFixed(2)} | ${(metrics.totalParseTimeMs / 1000).toFixed(2)} | ${metrics.memoryUsedMB.toFixed(1)} | ${metrics.detectionCount} |\n`;
  }

  report += `\n## Detailed Results\n\n`;

  for (const result of results) {
    const metrics = result.metrics;
    report += `### ${result.name}\n\n`;
    report += `- Total Files: ${metrics.totalFiles}\n`;
    report += `- Total Parse Time: ${metrics.totalParseTimeMs.toFixed(2)} ms (${(metrics.totalParseTimeMs / 1000).toFixed(2)} s)\n`;
    report += `- Average Parse Time: ${metrics.averageParseTimeMs.toFixed(2)} ms\n`;
    report += `- Min Parse Time: ${metrics.minParseTimeMs.toFixed(2)} ms\n`;
    report += `- Max Parse Time: ${metrics.maxParseTimeMs.toFixed(2)} ms\n`;
    report += `- Peak Memory: ${metrics.memoryUsedMB.toFixed(1)} MB\n`;
    report += `- Security Detections: ${metrics.detectionCount}\n`;
    report += `- Duration: ${result.duration.totalMs.toFixed(0)} ms\n\n`;
  }

  // Performance comparison
  if (results.length > 1) {
    report += `## Performance Comparison\n\n`;
    const baseline = results[0].metrics.averageParseTimeMs;
    for (let i = 1; i < results.length; i++) {
      const ratio = results[i].metrics.averageParseTimeMs / baseline;
      const improvement = ((ratio - 1) * 100).toFixed(1);
      const status = ratio < 1 ? '🟢' : '🔴';
      report += `${status} ${results[i].name} is ${Math.abs(improvement)}% ${ratio < 1 ? 'faster' : 'slower'} than ${results[0].name}\n`;
    }
    report += '\n';
  }

  return report;
}

export async function runBenchmark(
  name: string,
  parseFunction: (filePath: string) => Promise<any>,
  corpusDir: string,
  detectorFunction?: (result: any, content: string) => Promise<number>
): Promise<BenchmarkResult> {
  const startTime = performance.now();
  const files = await getAllFilesInCorpus(corpusDir);

  if (files.length === 0) {
    throw new Error(`No files found in corpus: ${corpusDir}`);
  }

  const parseTimes: number[] = [];
  let totalDetections = 0;
  const initialMemory = process.memoryUsage().heapUsed;

  console.log(`\nRunning benchmark: ${name}`);
  console.log(`Files to process: ${files.length}`);

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    // Parse file
    const parseStart = performance.now();
    const result = await parseFunction(file);
    const parseEnd = performance.now();
    const parseTime = parseEnd - parseStart;
    parseTimes.push(parseTime);

    // Run detectors if provided
    if (detectorFunction && result) {
      const content = await fs.readFile(file, 'utf-8');
      const detections = await detectorFunction(result, content);
      totalDetections += detections;
    }

    // Progress reporting
    if ((i + 1) % Math.max(1, Math.floor(files.length / 10)) === 0) {
      const progress = ((i + 1) / files.length) * 100;
      console.log(`  ${progress.toFixed(0)}% complete (${i + 1}/${files.length})`);
    }
  }

  const endTime = performance.now();
  const finalMemory = process.memoryUsage().heapUsed;
  const memoryUsedMB = (finalMemory - initialMemory) / 1024 / 1024;

  const totalParseTime = parseTimes.reduce((a, b) => a + b, 0);
  const avgParseTime = totalParseTime / files.length;
  const minParseTime = Math.min(...parseTimes);
  const maxParseTime = Math.max(...parseTimes);

  return {
    name,
    duration: {
      start: startTime,
      end: endTime,
      totalMs: endTime - startTime,
    },
    metrics: {
      totalFiles: files.length,
      totalParseTimeMs: totalParseTime,
      averageParseTimeMs: avgParseTime,
      minParseTimeMs: minParseTime,
      maxParseTimeMs: maxParseTime,
      detectionCount: totalDetections,
      memoryUsedMB: Math.max(0, memoryUsedMB),
      timestampMs: Date.now(),
    },
  };
}

export default { runBenchmark, generateBenchmarkReport, getAllFilesInCorpus };
