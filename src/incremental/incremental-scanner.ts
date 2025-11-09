import { spawn } from 'child_process';
import { readFile, writeFile, access } from 'fs/promises';
import { Finding } from '../../scanner/core/types';

export interface ScanCache {
  files: Map<string, { hash: string; timestamp: number }>;
  rules: Map<string, { hash: string }>;
  results: Map<string, Finding[]>;
}

export class IncrementalScanner {
  private gitQueue: Promise<void> = Promise.resolve();
  private readonly MAX_CONCURRENT_GIT_PROCESSES = 5;
  private gitProcessCount = 0;

  private async execGit(args: string[], cwd: string): Promise<string> {
    return new Promise((resolve, reject) => {
      // Wait for available slot
      const waitForSlot = () => {
        if (this.gitProcessCount < this.MAX_CONCURRENT_GIT_PROCESSES) {
          this.gitProcessCount++;
          return;
        }
        setTimeout(waitForSlot, 10);
      };

      waitForSlot();

      const proc = spawn('git', args, { cwd });
      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => (stdout += data.toString()));
      proc.stderr.on('data', (data) => (stderr += data.toString()));

      proc.on('close', (code) => {
        this.gitProcessCount--;
        if (code !== 0) reject(new Error(stderr));
        else resolve(stdout.trim());
      });

      proc.on('error', (error) => {
        this.gitProcessCount--;
        reject(error);
      });
    });
  }

  async batchGitHashes(filePaths: string[], cwd: string): Promise<Map<string, string>> {
    const results = new Map<string, string>();
    const batchSize = 10;

    for (let i = 0; i < filePaths.length; i += batchSize) {
      const batch = filePaths.slice(i, i + batchSize);
      const batchPromises = batch.map(async (filePath) => {
        try {
          const hash = await this.execGit(['hash-object', filePath], cwd);
          return { filePath, hash };
        } catch {
          return { filePath, hash: '' };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      batchResults.forEach(({ filePath, hash }) => {
        if (hash) results.set(filePath, hash);
      });

      // Small delay between batches to prevent overwhelming the system
      if (i + batchSize < filePaths.length) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    }

    return results;
  }

  async getChangedFiles(cwd: string, baseBranch = 'main'): Promise<string[]> {
    try {
      const output = await this.execGit(['diff', '--name-only', baseBranch, 'HEAD'], cwd);
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

  getCachedResults(cache: ScanCache, fileHash: string): Finding[] | undefined {
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
