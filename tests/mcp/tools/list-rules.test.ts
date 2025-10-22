/**
 * Tests for vibesec_list_rules MCP tool
 */

import { describe, it, expect } from 'bun:test';
import { vibesecListRulesTool, handleListRules } from '../../../src/mcp/tools/list-rules';

describe('vibesec_list_rules MCP Tool', () => {
  describe('Tool Schema', () => {
    it('should have correct name', () => {
      expect(vibesecListRulesTool.name).toBe('vibesec_list_rules');
    });

    it('should have description', () => {
      expect(vibesecListRulesTool.description).toBeTruthy();
      expect(typeof vibesecListRulesTool.description).toBe('string');
    });

    it('should have valid input schema', () => {
      expect(vibesecListRulesTool.inputSchema).toBeTruthy();
      expect(vibesecListRulesTool.inputSchema.type).toBe('object');
      expect(vibesecListRulesTool.inputSchema.properties).toBeTruthy();
    });

    it('should have no required parameters', () => {
      const required = vibesecListRulesTool.inputSchema.required;
      expect(required).toBeInstanceOf(Array);
      expect(required.length).toBe(0);
    });

    it('should have handler function', () => {
      expect(typeof vibesecListRulesTool.handler).toBe('function');
    });
  });

  describe('Parameter Validation', () => {
    it('should accept no parameters', async () => {
      const result = await handleListRules(undefined);
      expect(result).toBeTruthy();
    });

    it('should accept empty object', async () => {
      const result = await handleListRules({});
      expect(result).toBeTruthy();
    });

    it('should reject invalid category type', async () => {
      await expect(handleListRules({ category: 123 })).rejects.toThrow('category');
    });

    it('should reject invalid severity', async () => {
      await expect(handleListRules({ severity: 'invalid' })).rejects.toThrow('severity');
    });

    it('should reject invalid language type', async () => {
      await expect(handleListRules({ language: 123 })).rejects.toThrow('language');
    });

    it('should reject invalid search type', async () => {
      await expect(handleListRules({ search: 123 })).rejects.toThrow('search');
    });

    it('should reject invalid enabledOnly type', async () => {
      await expect(handleListRules({ enabledOnly: 'yes' })).rejects.toThrow('enabledOnly');
    });

    it('should accept valid parameters', async () => {
      const result = await handleListRules({
        category: 'secrets',
        severity: 'high',
        language: 'typescript',
        search: 'password',
        enabledOnly: true,
      });
      expect(result).toBeTruthy();
    });
  });

  describe('Listing Functionality', () => {
    it('should return list of rules', async () => {
      const result = await handleListRules({});

      expect(result).toBeTruthy();
      expect(result.rules).toBeInstanceOf(Array);
      expect(result.totalRules).toBeGreaterThanOrEqual(0);
      expect(result.categories).toBeInstanceOf(Array);
      expect(result.byCategory).toBeTruthy();
      expect(result.summary).toBeTruthy();
    });

    it('should include rule information', async () => {
      const result = await handleListRules({});

      if (result.rules.length > 0) {
        const rule = result.rules[0];
        expect(rule.id).toBeTruthy();
        expect(rule.name).toBeTruthy();
        expect(rule.description).toBeTruthy();
        expect(rule.severity).toBeTruthy();
        expect(rule.category).toBeTruthy();
        expect(rule.languages).toBeInstanceOf(Array);
        expect(typeof rule.enabled).toBe('boolean');
      }
    });

    it('should include summary statistics', async () => {
      const result = await handleListRules({});

      expect(result.summary.bySeverity).toBeTruthy();
      expect(result.summary.byLanguage).toBeTruthy();
      expect(typeof result.summary.bySeverity.critical).toBe('number');
      expect(typeof result.summary.bySeverity.high).toBe('number');
      expect(typeof result.summary.bySeverity.medium).toBe('number');
      expect(typeof result.summary.bySeverity.low).toBe('number');
    });

    it('should group rules by category', async () => {
      const result = await handleListRules({});

      expect(result.byCategory).toBeTruthy();
      expect(typeof result.byCategory).toBe('object');

      // Verify counts match
      let totalFromCategories = 0;
      for (const count of Object.values(result.byCategory)) {
        totalFromCategories += count;
      }
      expect(totalFromCategories).toBe(result.totalRules);
    });
  });

  describe('Filtering', () => {
    it('should filter by category', async () => {
      const allRules = await handleListRules({});

      if (allRules.categories.length > 0) {
        const category = allRules.categories[0];
        const filtered = await handleListRules({ category });

        expect(filtered.rules.every((r) => r.category === category)).toBe(true);
        expect(filtered.categories).toContain(category);
      }
    });

    it('should filter by severity', async () => {
      const result = await handleListRules({ severity: 'high' });

      expect(result.rules.every((r) => ['critical', 'high'].includes(r.severity))).toBe(true);
    });

    it('should filter by language', async () => {
      const result = await handleListRules({ language: 'javascript' });

      expect(
        result.rules.every((r) => r.languages.includes('*') || r.languages.includes('javascript'))
      ).toBe(true);
    });

    it('should filter by search text', async () => {
      const result = await handleListRules({ search: 'secret' });

      if (result.rules.length > 0) {
        expect(
          result.rules.every(
            (r) =>
              r.id.toLowerCase().includes('secret') ||
              r.name.toLowerCase().includes('secret') ||
              r.description.toLowerCase().includes('secret')
          )
        ).toBe(true);
      }
    });

    it('should filter by enabled status', async () => {
      const onlyEnabled = await handleListRules({ enabledOnly: true });
      const all = await handleListRules({ enabledOnly: false });

      expect(onlyEnabled.rules.every((r) => r.enabled)).toBe(true);
      expect(onlyEnabled.totalRules).toBeLessThanOrEqual(all.totalRules);
    });

    it('should combine multiple filters', async () => {
      const result = await handleListRules({
        category: 'secrets',
        severity: 'high',
        enabledOnly: true,
      });

      expect(result.rules.every((r) => r.category === 'secrets')).toBe(true);
      expect(result.rules.every((r) => ['critical', 'high'].includes(r.severity))).toBe(true);
      expect(result.rules.every((r) => r.enabled)).toBe(true);
    });
  });

  describe('Categories', () => {
    it('should return unique categories', async () => {
      const result = await handleListRules({});

      const uniqueCategories = new Set(result.categories);
      expect(result.categories.length).toBe(uniqueCategories.size);
    });

    it('should sort categories alphabetically', async () => {
      const result = await handleListRules({});

      const sorted = [...result.categories].sort();
      expect(result.categories).toEqual(sorted);
    });
  });

  describe('Edge Cases', () => {
    it('should handle no matching rules gracefully', async () => {
      const result = await handleListRules({
        search: 'xyz123nonexistent456abc',
      });

      expect(result.totalRules).toBe(0);
      expect(result.rules).toEqual([]);
      expect(result.categories).toEqual([]);
    });

    it('should handle case-insensitive filtering', async () => {
      const lower = await handleListRules({ category: 'secrets' });
      const upper = await handleListRules({ category: 'SECRETS' });

      expect(lower.totalRules).toBe(upper.totalRules);
    });
  });
});
