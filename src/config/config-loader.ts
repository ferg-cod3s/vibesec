import { readFile } from 'fs/promises';
import { resolve } from 'path';

export interface VibeSecConfig {
  rules?: {
    enabled?: string[];
    disabled?: string[];
    custom?: string[];
  };
  scan?: {
    exclude?: string[];
    include?: string[];
    maxFileSize?: number;
  };
  output?: {
    format?: 'json' | 'text' | 'sarif';
    report?: boolean;
  };
  performance?: {
    parallel?: boolean;
    cacheDir?: string;
  };
}

const DEFAULT_CONFIG: VibeSecConfig = {
  rules: {
    enabled: [],
    disabled: [],
    custom: [],
  },
  scan: {
    exclude: ['node_modules', 'dist', 'build', '.git'],
    include: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    maxFileSize: 1048576, // 1MB
  },
  output: {
    format: 'text',
    report: true,
  },
  performance: {
    parallel: true,
    cacheDir: '.vibesec-cache',
  },
};

export class ConfigLoader {
  private parseYaml(content: string): VibeSecConfig {
    const lines = content.split('\n');
    const config: VibeSecConfig = {};
    let currentSection: string | null = null;
    let currentKey: string | null = null;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const indent = line.length - line.trimStart().length;

      if (indent === 0 && trimmed.endsWith(':')) {
        currentSection = trimmed.slice(0, -1);
        config[currentSection as keyof VibeSecConfig] = {} as any;
        currentKey = null;
      } else if (indent === 2 && currentSection && trimmed.endsWith(':')) {
        currentKey = trimmed.slice(0, -1);
        (config[currentSection as keyof VibeSecConfig] as any)[currentKey] = [];
      } else if (indent === 4 && currentSection && currentKey && trimmed.startsWith('-')) {
        const value = trimmed.slice(1).trim();
        const arr = (config[currentSection as keyof VibeSecConfig] as any)[currentKey];
        if (Array.isArray(arr)) {
          arr.push(value.replace(/^['"]|['"]$/g, ''));
        }
      } else if (indent === 2 && currentSection && trimmed.includes(':')) {
        const [key, ...valueParts] = trimmed.split(':');
        const value = valueParts.join(':').trim();
        const parsedValue = value === 'true' ? true :
                           value === 'false' ? false :
                           /^\d+$/.test(value) ? parseInt(value, 10) :
                           value.replace(/^['"]|['"]$/g, '');
        (config[currentSection as keyof VibeSecConfig] as any)[key.trim()] = parsedValue;
      }
    }

    return config;
  }

  async loadConfig(configPath?: string): Promise<VibeSecConfig> {
    const searchPaths = configPath
      ? [resolve(configPath)]
      : [
          resolve(process.cwd(), '.vibesec.yaml'),
          resolve(process.cwd(), '.vibesec.yml'),
        ];

    for (const path of searchPaths) {
      try {
        const content = await readFile(path, 'utf-8');
        const parsed = this.parseYaml(content);
        return {
          rules: { ...DEFAULT_CONFIG.rules, ...parsed.rules },
          scan: { ...DEFAULT_CONFIG.scan, ...parsed.scan },
          output: { ...DEFAULT_CONFIG.output, ...parsed.output },
          performance: { ...DEFAULT_CONFIG.performance, ...parsed.performance },
        };
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
          throw new Error(`Failed to load config from ${path}: ${error}`);
        }
      }
    }

    return DEFAULT_CONFIG;
  }
}
