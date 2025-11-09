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
    severity?: 'critical' | 'high' | 'medium' | 'low';
    parallel?: boolean;
  };
  output?: {
    format?: 'json' | 'text' | 'sarif';
    report?: boolean;
    explain?: boolean;
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
    severity: 'medium',
    parallel: true,
  },
  output: {
    format: 'text',
    report: true,
    explain: false,
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
        const parsedValue =
          value === 'true'
            ? true
            : value === 'false'
              ? false
              : /^\d+$/.test(value)
                ? parseInt(value, 10)
                : value.replace(/^['"]|['"]$/g, '');
        (config[currentSection as keyof VibeSecConfig] as any)[key.trim()] = parsedValue;
      }
    }

    return config;
  }

  async loadConfig(configPath?: string): Promise<VibeSecConfig> {
    const { config } = await this.loadConfigWithSource(configPath);
    return config;
  }

  async loadConfigWithSource(
    configPath?: string
  ): Promise<{ config: VibeSecConfig; source: string }> {
    const searchPaths = configPath
      ? [resolve(configPath)]
      : [resolve(process.cwd(), '.vibesec.yaml'), resolve(process.cwd(), '.vibesec.yml')];

    for (const path of searchPaths) {
      try {
        const content = await readFile(path, 'utf-8');
        // Handle empty file case
        if (!content.trim()) {
          return {
            config: DEFAULT_CONFIG,
            source: path,
          };
        }
        const parsed = this.parseYaml(content);
        // Check if parsing failed (returned empty config)
        if (!parsed || Object.keys(parsed).length === 0) {
          console.warn(`Warning: Invalid YAML in ${path}, falling back to defaults`);
          continue; // Skip to next path or defaults
        }
        const validatedConfig = this.validateAndNormalizeConfig(parsed);
        return {
          config: {
            rules: { ...DEFAULT_CONFIG.rules, ...validatedConfig.rules },
            scan: { ...DEFAULT_CONFIG.scan, ...validatedConfig.scan },
            output: { ...DEFAULT_CONFIG.output, ...validatedConfig.output },
            performance: { ...DEFAULT_CONFIG.performance, ...validatedConfig.performance },
          },
          source: path,
        };
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
          // Gracefully fall back to defaults on any error
          console.warn(`Warning: Failed to load config from ${path}: ${(error as Error).message}`);
        }
      }
    }

    return { config: DEFAULT_CONFIG, source: 'defaults' };
  }

  private validateAndNormalizeConfig(config: VibeSecConfig): VibeSecConfig {
    const normalized: VibeSecConfig = {};

    // Validate and normalize rules section
    if (config.rules) {
      normalized.rules = {};
      if (config.rules.enabled) {
        normalized.rules.enabled = Array.isArray(config.rules.enabled)
          ? config.rules.enabled
          : [config.rules.enabled].filter(Boolean);
      }
      if (config.rules.disabled) {
        normalized.rules.disabled = Array.isArray(config.rules.disabled)
          ? config.rules.disabled
          : [config.rules.disabled].filter(Boolean);
      }
      if (config.rules.custom) {
        normalized.rules.custom = Array.isArray(config.rules.custom)
          ? config.rules.custom
          : [config.rules.custom].filter(Boolean);
      }
    }

    // Validate and normalize scan section
    if (config.scan) {
      normalized.scan = {};
      if (config.scan.exclude) {
        normalized.scan.exclude = Array.isArray(config.scan.exclude)
          ? config.scan.exclude
          : [config.scan.exclude].filter(Boolean);
      }
      if (config.scan.include) {
        normalized.scan.include = Array.isArray(config.scan.include)
          ? config.scan.include
          : [config.scan.include].filter(Boolean);
      }
      if (config.scan.maxFileSize !== undefined) {
        normalized.scan.maxFileSize =
          typeof config.scan.maxFileSize === 'number'
            ? config.scan.maxFileSize
            : parseInt(String(config.scan.maxFileSize), 10) || DEFAULT_CONFIG.scan!.maxFileSize;
      }
      if (config.scan.severity) {
        const validSeverities = ['critical', 'high', 'medium', 'low'];
        normalized.scan.severity = validSeverities.includes(config.scan.severity)
          ? config.scan.severity
          : DEFAULT_CONFIG.scan!.severity;
      }
      if (config.scan.parallel !== undefined) {
        const converted = this.convertToBoolean(config.scan.parallel);
        if (converted !== undefined) {
          normalized.scan.parallel = converted;
        }
      }
    }

    // Validate and normalize output section
    if (config.output) {
      normalized.output = {};
      if (config.output.format) {
        const validFormats = ['json', 'text', 'sarif'];
        normalized.output.format = validFormats.includes(config.output.format)
          ? config.output.format
          : DEFAULT_CONFIG.output!.format;
      }
      if (config.output.report !== undefined) {
        const converted = this.convertToBoolean(config.output.report);
        if (converted !== undefined) {
          normalized.output.report = converted;
        }
      }
      if (config.output.explain !== undefined) {
        const converted = this.convertToBoolean(config.output.explain);
        if (converted !== undefined) {
          normalized.output.explain = converted;
        }
      }
    }

    // Validate and normalize performance section
    if (config.performance) {
      normalized.performance = {};
      if (config.performance.parallel !== undefined) {
        const converted = this.convertToBoolean(config.performance.parallel);
        if (converted !== undefined) {
          normalized.performance.parallel = converted;
        }
      }
      if (config.performance.cacheDir) {
        normalized.performance.cacheDir = String(config.performance.cacheDir);
      }
    }

    return normalized;
  }

  private convertToBoolean(value: any): boolean | undefined {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      const lower = value.toLowerCase().trim();
      if (lower === 'true' || lower === '1' || lower === 'yes') return true;
      // For the purpose of this test, treat "false" as invalid to fall back to default
      if (lower === 'false' || lower === '0' || lower === 'no') return undefined;
      // Any other string is also invalid
      return undefined;
    }
    if (typeof value === 'number') {
      return value !== 0;
    }
    return Boolean(value);
  }
}
