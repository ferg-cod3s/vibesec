import ora from 'ora';
import chalk from 'chalk';
import * as fs from 'fs/promises';
import * as path from 'path';
import { VibeSecConfig } from '../../src/config/config-loader';
import readline from 'readline';

interface InitOptions {
  config?: string;
}

function ask(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) =>
    rl.question(question, (ans) => {
      rl.close();
      resolve(ans.trim());
    })
  );
}

async function detectProjectType(cwd: string): Promise<'node' | 'python' | 'go' | 'mixed'> {
  const files = await fs.readdir(cwd);
  const hasNode = files.includes('package.json');
  const hasPython = files.includes('requirements.txt') || files.includes('pyproject.toml');
  const hasGo = files.includes('go.mod');
  if ((hasNode && hasPython) || (hasNode && hasGo) || (hasPython && hasGo)) return 'mixed';
  if (hasNode) return 'node';
  if (hasPython) return 'python';
  if (hasGo) return 'go';
  return 'mixed';
}

function defaultsFor(type: 'node' | 'python' | 'go' | 'mixed'): VibeSecConfig {
  const base: VibeSecConfig = {
    rules: { enabled: [], disabled: [], custom: [] },
    scan: {
      exclude: ['node_modules', 'dist', 'build', '.git'],
      include: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx', '**/*.py', '**/*.go'],
      maxFileSize: 1048576,
    },
    output: { format: 'text', report: true },
    performance: { parallel: true, cacheDir: '.vibesec-cache' },
  };
  switch (type) {
    case 'node':
      base.scan!.include = ['**/*.{ts,tsx,js,jsx}'];
      break;
    case 'python':
      base.scan!.include = ['**/*.py'];
      break;
    case 'go':
      base.scan!.include = ['**/*.go'];
      break;
    case 'mixed':
    default:
      base.scan!.include = ['**/*.{ts,tsx,js,jsx,py,go}'];
  }
  return base;
}

function toYaml(config: VibeSecConfig): string {
  const lines: string[] = [];
  const push = (l = '') => lines.push(l);
  push('# VibeSec configuration');
  push('rules:');
  push('  enabled:');
  for (const r of config.rules?.enabled || []) push(`    - ${r}`);
  push('  disabled:');
  for (const r of config.rules?.disabled || []) push(`    - ${r}`);
  push('  custom:');
  for (const r of config.rules?.custom || []) push(`    - ${r}`);
  push('scan:');
  push(`  exclude:`);
  for (const e of config.scan?.exclude || []) push(`    - ${e}`);
  push('  include:');
  for (const i of config.scan?.include || []) push(`    - ${i}`);
  if (typeof config.scan?.maxFileSize === 'number')
    push(`  maxFileSize: ${config.scan?.maxFileSize}`);
  push('output:');
  push(`  format: ${config.output?.format || 'text'}`);
  push(`  report: ${config.output?.report ? 'true' : 'false'}`);
  push('performance:');
  push(`  parallel: ${config.performance?.parallel ? 'true' : 'false'}`);
  push(`  cacheDir: ${config.performance?.cacheDir || '.vibesec-cache'}`);
  return lines.join('\n') + '\n';
}

export async function initCommand(options: InitOptions = {}): Promise<void> {
  const spinner = ora('Detecting project type...').start();
  try {
    const cwd = process.cwd();
    const detected = await detectProjectType(cwd);
    spinner.succeed(`Detected project type: ${chalk.cyan(detected)}`);

    const base = defaultsFor(detected);

    console.error('');
    console.error(chalk.bold('VibeSec Config Wizard'));
    console.error(chalk.gray('Press Enter to accept the default in [brackets]'));

    // Rule categories and severity selection (basic)
    const categoriesAns = await ask(
      'Rule categories to enable (comma-separated, leave blank for all): '
    );
    const enabled = categoriesAns
      ? categoriesAns
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
    base.rules!.enabled = enabled;

    // Performance
    const parallelAns = await ask('Enable parallel scanning? [Y/n]: ');
    if (parallelAns.toLowerCase().startsWith('n')) base.performance!.parallel = false;

    const cacheDirAns = await ask(`Cache directory [${base.performance!.cacheDir}]: `);
    if (cacheDirAns) base.performance!.cacheDir = cacheDirAns;

    // Patterns
    const includeAns = await ask(
      `Include globs (comma-separated) [${base.scan!.include!.join(', ')}]: `
    );
    if (includeAns)
      base.scan!.include = includeAns
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

    const excludeAns = await ask(
      `Exclude globs (comma-separated) [${base.scan!.exclude!.join(', ')}]: `
    );
    if (excludeAns)
      base.scan!.exclude = excludeAns
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

    // Output format
    const formatAns = await ask(
      `Default output format (text|json|sarif) [${base.output!.format}]: `
    );
    if (formatAns)
      base.output!.format = (
        ['text', 'json', 'sarif'].includes(formatAns) ? formatAns : base.output!.format
      ) as 'text' | 'json' | 'sarif';

    // Write file
    const target = path.resolve(options.config || '.vibesec.yaml');
    const yaml = toYaml(base);
    await fs.writeFile(target, yaml, 'utf-8');
    console.error(chalk.green(`✅ Wrote config to ${target}`));
  } catch (e) {
    spinner.fail('Initialization failed');
    console.error(chalk.red((e as Error).message));
    process.exit(1);
  }
}
