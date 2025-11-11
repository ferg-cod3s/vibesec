import { readFile } from 'fs/promises';
import { resolve } from 'path';
const DEFAULT_CONFIG = {
    rules: {
        enabled: [],
        disabled: [],
        custom: [],
    },
    scan: {
        exclude: ['node_modules', 'dist', 'build', '.git'],
        include: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
        maxFileSize: 1048576,
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
    parseYaml(content) {
        const lines = content.split('\n');
        const config = {};
        let currentSection = null;
        let currentKey = null;
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#'))
                continue;
            const indent = line.length - line.trimStart().length;
            if (indent === 0 && trimmed.endsWith(':')) {
                currentSection = trimmed.slice(0, -1);
                config[currentSection] = {};
                currentKey = null;
            }
            else if (indent === 2 && currentSection && trimmed.endsWith(':')) {
                currentKey = trimmed.slice(0, -1);
                config[currentSection][currentKey] = [];
            }
            else if (indent === 4 && currentSection && currentKey && trimmed.startsWith('-')) {
                const value = trimmed.slice(1).trim();
                const arr = config[currentSection][currentKey];
                if (Array.isArray(arr)) {
                    arr.push(value.replace(/^['"]|['"]$/g, ''));
                }
            }
            else if (indent === 2 && currentSection && trimmed.includes(':')) {
                const [key, ...valueParts] = trimmed.split(':');
                const value = valueParts.join(':').trim();
                const parsedValue = value === 'true' ? true :
                    value === 'false' ? false :
                        /^\d+$/.test(value) ? parseInt(value, 10) :
                            value.replace(/^['"]|['"]$/g, '');
                config[currentSection][key.trim()] = parsedValue;
            }
        }
        return config;
    }
    async loadConfig(configPath) {
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
            }
            catch (error) {
                if (error.code !== 'ENOENT') {
                    throw new Error(`Failed to load config from ${path}: ${error}`);
                }
            }
        }
        return DEFAULT_CONFIG;
    }
}
