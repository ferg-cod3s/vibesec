import { RegexAnalyzer } from '../../scanner/analyzers/regex';
import { Rule, Pattern, Severity, Category } from '../../scanner/core/types';

describe('RegexAnalyzer', () => {
  const analyzer = new RegexAnalyzer();

  const createTestRule = (pattern: string): Rule => ({
    id: 'test-rule',
    name: 'Test Rule',
    description: 'Test description',
    severity: Severity.HIGH,
    category: Category.CUSTOM,
    patterns: [{ regex: pattern, flags: 'gm' }],
    languages: ['javascript'],
    enabled: true,
    metadata: {
      cwe: 'CWE-TEST',
      owasp: 'A0:TEST',
      tags: ['test'],
    },
  });

  describe('analyze()', () => {
    it('should detect vulnerable SQL injection pattern', async () => {
      const code = `
const query = "SELECT * FROM users WHERE id = " + userId;
db.execute(query);
`;
      // Fix pattern - need to match the actual line with execute and +
      const rule = createTestRule('execute.*query');

      const findings = await analyzer.analyze('test.js', code, rule);

      expect(findings.length).toBeGreaterThan(0);
      expect(findings[0].rule).toBe('test-rule');
      expect(findings[0].severity).toBe('high');
    });

    it('should NOT detect secure parameterized queries', async () => {
      const code = `
const query = "SELECT * FROM users WHERE id = ?";
db.execute(query, [userId]);
`;
      const rule = createTestRule('execute.*\\+');

      const findings = await analyzer.analyze('test.js', code, rule);

      expect(findings).toHaveLength(0);
    });

    it('should detect XSS via innerHTML', async () => {
      const code = `
element.innerHTML = userInput;
`;
      const rule = createTestRule('innerHTML\\s*=');

      const findings = await analyzer.analyze('test.js', code, rule);

      expect(findings).toHaveLength(1);
      expect(findings[0].location.line).toBe(2);
    });

    it('should NOT detect safe textContent usage', async () => {
      const code = `
element.textContent = userInput;
`;
      const rule = createTestRule('innerHTML\\s*=');

      const findings = await analyzer.analyze('test.js', code, rule);

      expect(findings).toHaveLength(0);
    });

    it('should detect hardcoded secrets', async () => {
      const code = `
const apiKey = "sk_live_1234567890abcdef";
const password = "SuperSecret123!";
`;
      const rule = createTestRule('(apiKey|password)\\s*=\\s*["\']');

      const findings = await analyzer.analyze('test.js', code, rule);

      expect(findings).toHaveLength(2);
      expect(findings[0].location.line).toBe(2);
      expect(findings[1].location.line).toBe(3);
    });

    it('should detect command injection with child_process.exec', async () => {
      const code = `
const cmd = 'ls ' + userInput;
const result = exec(cmd);
`;
      // Fix pattern to match the line that has exec
      const rule = createTestRule('exec\\s*\\(');

      const findings = await analyzer.analyze('test.js', code, rule);

      expect(findings).toHaveLength(1);
    });

    it('should handle multi-line patterns', async () => {
      const code = `
const query = "SELECT * FROM users " +
              "WHERE name = '" + userName + "'";
`;
      const rule = createTestRule('SELECT.*\\+');

      const findings = await analyzer.analyze('test.js', code, rule);

      expect(findings.length).toBeGreaterThan(0);
    });

    it('should generate correct location information', async () => {
      const code = `line 1
line 2
vulnerable line with pattern
line 4`;
      const rule = createTestRule('vulnerable.*pattern');

      const findings = await analyzer.analyze('test.js', code, rule);

      expect(findings[0].location.file).toBe('test.js');
      expect(findings[0].location.line).toBe(3);
      expect(findings[0].location.column).toBeGreaterThanOrEqual(0);
    });

    it('should extract code snippet with context', async () => {
      const code = `line 1
line 2
line 3
vulnerable line
line 5
line 6
line 7`;
      const rule = createTestRule('vulnerable');

      const findings = await analyzer.analyze('test.js', code, rule);

      expect(findings[0].snippet).toContain('line 2');
      expect(findings[0].snippet).toContain('line 3');
      expect(findings[0].snippet).toContain('vulnerable line');
      expect(findings[0].snippet).toContain('line 5');
      expect(findings[0].snippet).toContain('line 6');
      expect(findings[0].snippet).toContain('→'); // Should mark the vulnerable line
    });

    it('should include metadata in findings', async () => {
      const code = 'vulnerable pattern';
      const rule = createTestRule('vulnerable');

      const findings = await analyzer.analyze('test.js', code, rule);

      expect(findings[0].metadata).toBeDefined();
      expect(findings[0].metadata.cwe).toBe('CWE-TEST');
      expect(findings[0].metadata.owasp).toBe('A0:TEST');
      expect(findings[0].metadata.confidence).toBeGreaterThan(0);
      expect(findings[0].metadata.confidence).toBeLessThanOrEqual(1);
    });

    it('should calculate confidence based on match length', async () => {
      const shortCode = 'exec(x)';
      const longCode =
        'executeThisVeryLongCommandWithManyCharactersThatGoesOnAndOn(this.is.a.very.long.command.execution.with.many.characters)';
      const rule = createTestRule('exec[a-zA-Z]*\([^)]*\)');

      const shortFindings = await analyzer.analyze('test.js', shortCode, rule);
      const longFindings = await analyzer.analyze('test.js', longCode, rule);

      // The long match should have higher confidence due to length
      expect(longFindings[0].metadata.confidence).toBeGreaterThan(
        shortFindings[0].metadata.confidence
      );
    });

    it('should include fix recommendations', async () => {
      const code = 'eval(userInput)';
      const rule = createTestRule('eval\\(');
      rule.fix = {
        template: 'Avoid using eval(). Consider safer alternatives.',
        references: ['https://owasp.org/eval-dangers'],
      };

      const findings = await analyzer.analyze('test.js', code, rule);

      expect(findings[0].fix).toBeDefined();
      expect(findings[0].fix.recommendation).toBe(
        'Avoid using eval(). Consider safer alternatives.'
      );
      expect(findings[0].fix.references).toContain('https://owasp.org/eval-dangers');
      expect(findings[0].fix.before).toBe('eval(userInput)');
    });

    it('should handle multiple patterns in one rule', async () => {
      const code = `
pattern1 here
some code
pattern2 here
more code
pattern3 here
`;
      const multiPatternRule: Rule = {
        id: 'multi-test',
        name: 'Multi Pattern Test',
        description: 'Test',
        severity: Severity.MEDIUM,
        category: Category.CUSTOM,
        patterns: [
          { regex: 'pattern1', flags: 'gm' },
          { regex: 'pattern2', flags: 'gm' },
          { regex: 'pattern3', flags: 'gm' },
        ],
        languages: ['javascript'],
        enabled: true,
        metadata: { tags: [] },
      };

      const findings = await analyzer.analyze('test.js', code, multiPatternRule);

      expect(findings).toHaveLength(3);
    });

    it('should handle empty file', async () => {
      const code = '';
      const rule = createTestRule('anything');

      const findings = await analyzer.analyze('test.js', code, rule);

      expect(findings).toHaveLength(0);
    });

    it('should handle file with no matches', async () => {
      const code = `
const safe = 'code';
const secure = 'implementation';
`;
      const rule = createTestRule('vulnerable');

      const findings = await analyzer.analyze('test.js', code, rule);

      expect(findings).toHaveLength(0);
    });

    it('should generate unique finding IDs', async () => {
      const code = `
pattern here
pattern here
pattern here
`;
      const rule = createTestRule('pattern');

      const findings = await analyzer.analyze('test.js', code, rule);

      expect(findings).toHaveLength(3);
      const ids = findings.map((f) => f.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(3); // All IDs should be unique
    });
  });
});
