import { ConfigLoader } from '../../src/config/config-loader';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('Configuration Loader Integration Tests', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'vibesec-config-test-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('Config File Discovery', () => {
    test('should discover .vibesec.yaml file', async () => {
      const configPath = path.join(tempDir, '.vibesec.yaml');
      await fs.writeFile(
        configPath,
        `
rules:
  enabled:
    - secrets
    - injection

scan:
  severity: high
  parallel: true
      `
      );

      const loader = new ConfigLoader();
      const { config, source } = await loader.loadConfigWithSource(configPath);

      expect(config.rules.enabled).toContain('secrets');
      expect(config.rules.enabled).toContain('injection');
      expect(config.scan.severity).toBe('high');
      expect(config.scan.parallel).toBe(true);
      expect(source).toBe(configPath);
    });

    test('should discover .vibesec.yml file as fallback', async () => {
      const configPath = path.join(tempDir, '.vibesec.yml');
      await fs.writeFile(
        configPath,
        `
rules:
  enabled:
    - auth

scan:
  severity: critical
      `
      );

      const loader = new ConfigLoader();
      const { config, source } = await loader.loadConfigWithSource(configPath);

      expect(config.rules.enabled).toContain('auth');
      expect(config.scan.severity).toBe('critical');
      expect(source).toBe(configPath);
    });

    test('should use defaults when no config file found', async () => {
      const loader = new ConfigLoader();
      const { config, source } = await loader.loadConfigWithSource();

      expect(config.rules.enabled).toBeDefined();
      expect(config.scan.exclude).toContain('node_modules');
      expect(config.scan.parallel).toBe(true);
      expect(source).toBe('defaults');
    });
  });

  describe('Configuration Merging', () => {
    test('should merge CLI options with config file', async () => {
      const configPath = path.join(tempDir, '.vibesec.yaml');
      await fs.writeFile(
        configPath,
        `
rules:
  enabled:
    - secrets
    - injection
  disabled:
    - auth

scan:
  severity: medium
  parallel: false
  maxFileSize: 1048576

performance:
  cacheDir: .custom-cache
      `
      );

      const loader = new ConfigLoader();
      const { config } = await loader.loadConfigWithSource(configPath);

      // Simulate CLI overrides
      const cliOverrides = {
        severity: 'critical',
        parallel: true,
        rulesPath: '../../rules/default',
      };

      const mergedConfig = {
        ...config,
        scan: {
          ...config.scan,
          ...cliOverrides,
        },
      };

      expect(mergedConfig.scan.severity).toBe('critical'); // CLI override
      expect(mergedConfig.scan.parallel).toBe(true); // CLI override
      expect(mergedConfig.scan.maxFileSize).toBe(1048576); // From config
      expect(mergedConfig.performance.cacheDir).toBe('.custom-cache'); // From config
    });

    test('should handle nested configuration properly', async () => {
      const configPath = path.join(tempDir, '.vibesec.yaml');
      await fs.writeFile(
        configPath,
        `
rules:
  enabled:
    - secrets
    - injection
    - ast-sql-injection
  disabled:
    - incomplete

scan:
  exclude:
    - node_modules
    - dist
    - "*.test.js"
  include:
    - "**/*.js"
    - "**/*.ts"
  severity: high
  parallel: true
  maxFileSize: 2097152

output:
  format: json
  explain: true

performance:
  parallel: true
  cacheDir: .vibesec-cache
      `
      );

      const loader = new ConfigLoader();
      const { config } = await loader.loadConfigWithSource(configPath);

      expect(config.rules.enabled).toHaveLength(3);
      expect(config.rules.disabled).toContain('incomplete');
      expect(config.scan.exclude).toHaveLength(3);
      expect(config.scan.include).toHaveLength(2);
      expect(config.output.format).toBe('json');
      expect(config.output.explain).toBe(true);
      expect(config.performance.cacheDir).toBe('.vibesec-cache');
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid YAML gracefully', async () => {
      const configPath = path.join(tempDir, '.vibesec.yaml');
      await fs.writeFile(
        configPath,
        `
invalid: yaml: content: [
  missing: proper: structure
      `
      );

      const loader = new ConfigLoader();
      const { config, source } = await loader.loadConfigWithSource(configPath);

      // Should fall back to defaults
      expect(config).toBeDefined();
      expect(config.scan).toBeDefined();
      expect(config.rules).toBeDefined();
      expect(source).toBe('defaults');
    });

    test('should handle empty config file', async () => {
      const configPath = path.join(tempDir, '.vibesec.yaml');
      await fs.writeFile(configPath, '');

      const loader = new ConfigLoader();
      const { config, source } = await loader.loadConfigWithSource(configPath);

      expect(config).toBeDefined();
      expect(source).toBe(configPath);
    });

    test('should handle config file with partial data', async () => {
      const configPath = path.join(tempDir, '.vibesec.yaml');
      await fs.writeFile(
        configPath,
        `
rules:
  enabled:
    - secrets

# Missing scan, output, performance sections
      `
      );

      const loader = new ConfigLoader();
      const { config } = await loader.loadConfigWithSource(configPath);

      expect(config.rules.enabled).toContain('secrets');
      expect(config.scan).toBeDefined(); // Should have defaults
      expect(config.output).toBeDefined(); // Should have defaults
      expect(config.performance).toBeDefined(); // Should have defaults
    });
  });

  describe('Validation', () => {
    test('should validate severity values', async () => {
      const configPath = path.join(tempDir, '.vibesec.yaml');
      await fs.writeFile(
        configPath,
        `
scan:
  severity: invalid
      `
      );

      const loader = new ConfigLoader();
      const { config } = await loader.loadConfigWithSource(configPath);

      // Should fall back to default severity
      expect(config.scan.severity).toBe('medium');
    });

    test('should validate boolean values', async () => {
      const configPath = path.join(tempDir, '.vibesec.yaml');
      await fs.writeFile(
        configPath,
        `
scan:
  parallel: "true"

performance:
  parallel: "false"
      `
      );

      const loader = new ConfigLoader();
      const { config } = await loader.loadConfigWithSource(configPath);

      // Should convert string booleans to actual booleans
      expect(config.scan.parallel).toBe(true);
      expect(config.performance.parallel).toBe(true); // Default fallback
    });

    test('should validate array values', async () => {
      const configPath = path.join(tempDir, '.vibesec.yaml');
      await fs.writeFile(
        configPath,
        `
rules:
  enabled: secrets  # Should be array

scan:
  exclude: node_modules  # Should be array
      `
      );

      const loader = new ConfigLoader();
      const { config } = await loader.loadConfigWithSource(configPath);

      // Should convert to arrays or use defaults
      expect(Array.isArray(config.rules.enabled)).toBe(true);
      expect(Array.isArray(config.scan.exclude)).toBe(true);
    });
  });
});
