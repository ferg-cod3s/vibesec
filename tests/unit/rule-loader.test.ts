import * as path from 'path';
import * as fs from 'fs/promises';
import { RuleLoader } from '../../scanner/core/rule-loader';

describe('RuleLoader', () => {
  const testRulesPath = path.join(__dirname, '../fixtures/test-rules');

  beforeAll(async () => {
    // Create test rules directory
    await fs.mkdir(testRulesPath, { recursive: true });
  });

  afterAll(async () => {
    // Clean up test rules directory
    await fs.rm(testRulesPath, { recursive: true, force: true });
  });

  afterEach(async () => {
    // Clean up rule files after each test
    const files = await fs.readdir(testRulesPath);
    for (const file of files) {
      await fs.unlink(path.join(testRulesPath, file));
    }
  });

  describe('load()', () => {
    it('should load a valid YAML rule', async () => {
      const ruleYaml = `
id: test-sql-injection
name: SQL Injection
description: Detects SQL injection vulnerabilities
severity: critical
category: injection
patterns:
  - "executeQuery\\\\(.*(\\\\+|\\\\$\\\\{)"
languages:
  - javascript
  - typescript
metadata:
  cwe: CWE-89
  owasp: A1:2017
  tags:
    - injection
    - sql
`;
      await fs.writeFile(path.join(testRulesPath, 'test.yaml'), ruleYaml);

      const loader = new RuleLoader(testRulesPath);
      const rules = await loader.load();

      expect(rules).toHaveLength(1);
      expect(rules[0].id).toBe('test-sql-injection');
      expect(rules[0].name).toBe('SQL Injection');
      expect(rules[0].severity).toBe('critical');
      expect(rules[0].category).toBe('injection');
      expect(rules[0].languages).toEqual(['javascript', 'typescript']);
    });

    it('should parse metadata from nested metadata object', async () => {
      const ruleYaml = `
id: test-xss
name: XSS Test
severity: high
category: injection
patterns:
  - "innerHTML.*="
metadata:
  cwe: CWE-79
  owasp: A7:2017
  tags:
    - xss
    - injection
`;
      await fs.writeFile(path.join(testRulesPath, 'xss.yaml'), ruleYaml);

      const loader = new RuleLoader(testRulesPath);
      const rules = await loader.load();

      expect(rules[0].metadata?.cwe).toBe('CWE-79');
      expect(rules[0].metadata?.owasp).toBe('A7:2017');
      expect(rules[0].metadata?.tags).toContain('xss');
      expect(rules[0].metadata?.tags).toContain('injection');
    });

    it('should parse metadata from top-level fields (backward compatibility)', async () => {
      const ruleYaml = `
id: test-legacy
name: Legacy Rule
severity: medium
category: security
patterns:
  - "eval\\\\("
cwe: CWE-95
owasp: A1:2021
tags:
  - eval
  - dangerous
`;
      await fs.writeFile(path.join(testRulesPath, 'legacy.yaml'), ruleYaml);

      const loader = new RuleLoader(testRulesPath);
      const rules = await loader.load();

      expect(rules[0].metadata?.cwe).toBe('CWE-95');
      expect(rules[0].metadata?.owasp).toBe('A1:2021');
      expect(rules[0].metadata?.tags).toContain('eval');
    });

    it('should convert string patterns to Pattern objects', async () => {
      const ruleYaml = `
id: test-pattern
name: Pattern Test
severity: low
category: test
patterns:
  - "test.*pattern"
`;
      await fs.writeFile(path.join(testRulesPath, 'pattern.yaml'), ruleYaml);

      const loader = new RuleLoader(testRulesPath);
      const rules = await loader.load();

      expect(rules[0].patterns).toHaveLength(1);
      expect(rules[0].patterns[0]).toHaveProperty('regex');
      expect(rules[0].patterns[0]).toHaveProperty('flags');
      expect(rules[0].patterns[0].regex).toBe('test.*pattern');
      expect(rules[0].patterns[0].flags).toBe('gm');
    });

    it('should handle multiple patterns', async () => {
      const ruleYaml = `
id: test-multi
name: Multi Pattern
severity: medium
category: test
patterns:
  - "pattern1"
  - "pattern2"
  - "pattern3"
`;
      await fs.writeFile(path.join(testRulesPath, 'multi.yaml'), ruleYaml);

      const loader = new RuleLoader(testRulesPath);
      const rules = await loader.load();

      expect(rules[0].patterns).toHaveLength(3);
      expect(rules[0].patterns[0].regex).toBe('pattern1');
      expect(rules[0].patterns[1].regex).toBe('pattern2');
      expect(rules[0].patterns[2].regex).toBe('pattern3');
    });

    it('should load multiple rule files', async () => {
      const rule1 = `
id: test-rule-1
name: Rule 1
severity: high
category: test
patterns:
  - "pattern1"
`;
      const rule2 = `
id: test-rule-2
name: Rule 2
severity: low
category: test
patterns:
  - "pattern2"
`;
      await fs.writeFile(path.join(testRulesPath, 'rule1.yaml'), rule1);
      await fs.writeFile(path.join(testRulesPath, 'rule2.yaml'), rule2);

      const loader = new RuleLoader(testRulesPath);
      const rules = await loader.load();

      expect(rules).toHaveLength(2);
      expect(rules.map((r) => r.id)).toContain('test-rule-1');
      expect(rules.map((r) => r.id)).toContain('test-rule-2');
    });

    it('should handle rules array in single file', async () => {
      const rulesYaml = `
rules:
  - id: test-rule-1
    name: Rule 1
    severity: high
    category: test
    patterns:
      - "pattern1"
  - id: test-rule-2
    name: Rule 2
    severity: low
    category: test
    patterns:
      - "pattern2"
`;
      await fs.writeFile(path.join(testRulesPath, 'multiple.yaml'), rulesYaml);

      const loader = new RuleLoader(testRulesPath);
      const rules = await loader.load();

      expect(rules).toHaveLength(2);
      expect(rules[0].id).toBe('test-rule-1');
      expect(rules[1].id).toBe('test-rule-2');
    });

    it('should set default values for optional fields', async () => {
      const ruleYaml = `
id: test-defaults
name: Defaults Test
patterns:
  - "test"
`;
      await fs.writeFile(path.join(testRulesPath, 'defaults.yaml'), ruleYaml);

      const loader = new RuleLoader(testRulesPath);
      const rules = await loader.load();

      expect(rules[0].severity).toBe('medium');
      expect(rules[0].category).toBe('custom');
      expect(rules[0].languages).toEqual(['*']);
      expect(rules[0].enabled).toBe(true);
    });

    it('should respect enabled flag', async () => {
      const ruleYaml = `
id: test-disabled
name: Disabled Rule
patterns:
  - "test"
enabled: false
`;
      await fs.writeFile(path.join(testRulesPath, 'disabled.yaml'), ruleYaml);

      const loader = new RuleLoader(testRulesPath);
      const rules = await loader.load();

      expect(rules[0].enabled).toBe(false);
    });

    it('should parse fix templates', async () => {
      const ruleYaml = `
id: test-fix
name: Fix Test
severity: high
category: test
patterns:
  - "bad_function\\\\("
fix:
  template: "Use good_function() instead"
  references:
    - "https://example.com/docs"
`;
      await fs.writeFile(path.join(testRulesPath, 'fix.yaml'), ruleYaml);

      const loader = new RuleLoader(testRulesPath);
      const rules = await loader.load();

      expect(rules[0].fix).toBeDefined();
      expect(rules[0].fix?.template).toBe('Use good_function() instead');
      expect(rules[0].fix?.references).toContain('https://example.com/docs');
    });

    it('should handle malformed YAML gracefully', async () => {
      const badYaml = `
id: test-bad
name: Bad Rule
patterns: [
  - "unclosed
`;
      await fs.writeFile(path.join(testRulesPath, 'bad.yaml'), badYaml);

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const loader = new RuleLoader(testRulesPath);
      const rules = await loader.load();

      expect(rules).toHaveLength(0);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should handle missing required fields', async () => {
      const incompleteYaml = `
id: test-incomplete
name: Incomplete Rule
# missing patterns field
`;
      await fs.writeFile(path.join(testRulesPath, 'incomplete.yaml'), incompleteYaml);

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const loader = new RuleLoader(testRulesPath);
      const rules = await loader.load();

      expect(rules).toHaveLength(0);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error loading rule file'),
        expect.stringContaining('missing required fields')
      );

      consoleErrorSpy.mockRestore();
    });

    it('should load real rules from default directory', async () => {
      const loader = new RuleLoader();
      const rules = await loader.load();

      // Should load the actual rules from rules/default/
      expect(rules.length).toBeGreaterThan(0);

      // Verify at least one known rule exists
      const sqlInjectionRule = rules.find((r) => r.id.includes('sql-injection'));
      expect(sqlInjectionRule).toBeDefined();
      expect(sqlInjectionRule?.metadata?.cwe).toBeDefined();
    });
  });
});
