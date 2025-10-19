import { spawn } from 'child_process';
import { readFile, writeFile, access } from 'fs/promises';
import { Finding } from '../../scanner/core/types';

export interface ScanCache {
  files: Map<string, { hash: string; timestamp: number }>;
  rules: Map<string, { hash: string }>;
  results: Map<string, Finding[]>;
}

export class IncrementalScanner {
  private async execGit(args: string[], cwd: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const proc = spawn('git', args, { cwd });
      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => (stdout += data.toString()));
      proc.stderr.on('data', (data) => (stderr += data.toString()));

      proc.on('close', (code) => {
        if (code !== 0) reject(new Error(stderr));
        else resolve(stdout.trim());
      });
    });
  }

  async getChangedFiles(cwd: string, baseBranch = 'main'): Promise<string[]> {
    try {
      const output = await this.execGit(
        ['diff', '--name-only', baseBranch, 'HEAD'],
        cwd
      );
      return output ? output.split('\n').filter((f) => f.length > 0) : [];
    } catch {
      return [];
    }
  }

  async getFileHash(filePath: string, cwd: string): Promise<string> {
    try {
      return await this.execGit(['hash-object', filePath], cwd);
    } catch {
      return '';
    }
  }

  getCachedResults(
    cache: ScanCache,
    fileHash: string
  ): Finding[] | undefined {
    for (const [hash, results] of cache.results.entries()) {
      if (hash === fileHash) return results;
    }
    return undefined;
  }

  async saveCache(cache: ScanCache, path: string): Promise<void> {
    const serialized = {
      files: Array.from(cache.files.entries()),
      rules: Array.from(cache.rules.entries()),
      results: Array.from(cache.results.entries()),
    };
    await writeFile(path, JSON.stringify(serialized, null, 2));
  }

  async loadCache(path: string): Promise<ScanCache | null> {
    try {
      await access(path);
      const content = await readFile(path, 'utf-8');
      const data = JSON.parse(content);
      return {
        files: new Map(data.files || []),
        rules: new Map(data.rules || []),
        results: new Map(data.results || []),
      };
    } catch {
      return null;
    }
  }
}
