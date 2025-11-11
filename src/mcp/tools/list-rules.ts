/**
 * VibeSec List Rules Tool for MCP
 *
 * Provides rule discovery and browsing functionality to AI assistants via the Model Context Protocol.
 * Lists available security detection rules with filtering capabilities.
 */

import { RuleLoader } from '../../../scanner/core/rule-loader';
import { Severity, Category } from '../../../scanner/core/types';
import { MCPTool } from '../types';

/**
 * Input parameters for vibesec_list_rules tool
 */
export interface ListRulesParams {
  /** Optional: Filter by category (e.g., 'secrets', 'injection', 'auth') */
  category?: string;
  /** Optional: Filter by minimum severity level */
  severity?: 'critical' | 'high' | 'medium' | 'low';
  /** Optional: Filter by programming language */
  language?: string;
  /** Optional: Search text in rule ID, name, or description */
  search?: string;
  /** Optional: Include only enabled rules (default: true) */
  enabledOnly?: boolean;
}

/**
 * Information about a single rule
 */
export interface RuleInfo {
  id: string;
  name: string;
  description: string;
  severity: Severity;
  category: Category;
  languages: string[];
  enabled: boolean;
  metadata?: {
    cwe?: string;
    owasp?: string;
    tags?: string[];
  };
}

/**
 * Result from vibesec_list_rules tool
 */
export interface ListRulesResult {
  /** Array of matching rules */
  rules: RuleInfo[];
  /** Total number of matching rules */
  totalRules: number;
  /** Available categories */
  categories: string[];
  /** Rules grouped by category */
  byCategory: Record<string, number>;
  /** Summary statistics */
  summary: {
    bySeverity: Record<string, number>;
    byLanguage: Record<string, number>;
  };
}

/**
 * MCP tool schema for vibesec_list_rules
 */
export const vibesecListRulesTool: MCPTool = {
  name: 'vibesec_list_rules',
  description: `List available security detection rules from VibeSec's rule database.

Use this tool to:
- Discover what security checks are available
- Understand rule categories and severities
- Filter rules by language, category, or severity
- Search for specific security patterns

Returns detailed information about each rule including:
- Rule ID and name
- Severity level (critical, high, medium, low)
- Category (secrets, injection, auth, etc.)
- Supported programming languages
- CWE/OWASP mappings (if available)`,

  inputSchema: {
    type: 'object',
    properties: {
      category: {
        type: 'string',
        description: 'Filter by security category (e.g., "secrets", "injection", "auth", "incomplete", "ai-specific")',
      },
      severity: {
        type: 'string',
        enum: ['critical', 'high', 'medium', 'low'],
        description: 'Filter by minimum severity level',
      },
      language: {
        type: 'string',
        description: 'Filter by programming language (e.g., "typescript", "python", "javascript")',
      },
      search: {
        type: 'string',
        description: 'Search text in rule ID, name, or description (case-insensitive)',
      },
      enabledOnly: {
        type: 'boolean',
        description: 'Include only enabled rules (default: true)',
        default: true,
      },
    },
    required: [],
  },

  handler: handleListRules,
};

/**
 * Handler for vibesec_list_rules tool
 */
export async function handleListRules(params: unknown): Promise<ListRulesResult> {
  // Validate and parse parameters
  const listParams = validateListRulesParams(params);

  // Load all rules
  const ruleLoader = new RuleLoader();
  const allRules = await ruleLoader.load();

  // Apply filters
  let filteredRules = allRules;

  // Filter by enabled status
  if (listParams.enabledOnly !== false) {
    filteredRules = filteredRules.filter((r) => r.enabled);
  }

  // Filter by category
  if (listParams.category) {
    filteredRules = filteredRules.filter(
      (r) => r.category.toLowerCase() === listParams.category!.toLowerCase()
    );
  }

  // Filter by severity (minimum level)
  if (listParams.severity) {
    const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    const minLevel = severityOrder[listParams.severity];
    filteredRules = filteredRules.filter(
      (r) => severityOrder[r.severity as keyof typeof severityOrder] >= minLevel
    );
  }

  // Filter by language
  if (listParams.language) {
    filteredRules = filteredRules.filter(
      (r) =>
        r.languages.includes('*') ||
        r.languages.some((lang) => lang.toLowerCase() === listParams.language!.toLowerCase())
    );
  }

  // Filter by search text
  if (listParams.search) {
    const searchLower = listParams.search.toLowerCase();
    filteredRules = filteredRules.filter(
      (r) =>
        r.id.toLowerCase().includes(searchLower) ||
        r.name.toLowerCase().includes(searchLower) ||
        r.description.toLowerCase().includes(searchLower)
    );
  }

  // Convert to RuleInfo format
  const ruleInfos: RuleInfo[] = filteredRules.map((rule) => ({
    id: rule.id,
    name: rule.name,
    description: rule.description,
    severity: rule.severity,
    category: rule.category,
    languages: rule.languages,
    enabled: rule.enabled,
    metadata: rule.metadata,
  }));

  // Calculate statistics
  const categories = [...new Set(filteredRules.map((r) => r.category))];

  const byCategory: Record<string, number> = {};
  for (const category of categories) {
    byCategory[category] = filteredRules.filter((r) => r.category === category).length;
  }

  const bySeverity: Record<string, number> = {
    critical: filteredRules.filter((r) => r.severity === Severity.CRITICAL).length,
    high: filteredRules.filter((r) => r.severity === Severity.HIGH).length,
    medium: filteredRules.filter((r) => r.severity === Severity.MEDIUM).length,
    low: filteredRules.filter((r) => r.severity === Severity.LOW).length,
  };

  const byLanguage: Record<string, number> = {};
  for (const rule of filteredRules) {
    for (const lang of rule.languages) {
      byLanguage[lang] = (byLanguage[lang] || 0) + 1;
    }
  }

  return {
    rules: ruleInfos,
    totalRules: ruleInfos.length,
    categories: categories.sort(),
    byCategory,
    summary: {
      bySeverity,
      byLanguage,
    },
  };
}

/**
 * Validate and parse list rules parameters
 */
function validateListRulesParams(params: unknown): ListRulesParams {
  // params is optional for this tool
  if (!params || typeof params !== 'object') {
    return {};
  }

  const p = params as Record<string, unknown>;

  // Validate category (optional)
  if (p.category && typeof p.category !== 'string') {
    throw new Error('Invalid parameters: "category" must be a string');
  }

  // Validate severity (optional)
  if (p.severity) {
    if (typeof p.severity !== 'string') {
      throw new Error('Invalid parameters: "severity" must be a string');
    }
    if (!['critical', 'high', 'medium', 'low'].includes(p.severity)) {
      throw new Error('Invalid parameters: "severity" must be one of: critical, high, medium, low');
    }
  }

  // Validate language (optional)
  if (p.language && typeof p.language !== 'string') {
    throw new Error('Invalid parameters: "language" must be a string');
  }

  // Validate search (optional)
  if (p.search && typeof p.search !== 'string') {
    throw new Error('Invalid parameters: "search" must be a string');
  }

  // Validate enabledOnly (optional)
  if (p.enabledOnly !== undefined && typeof p.enabledOnly !== 'boolean') {
    throw new Error('Invalid parameters: "enabledOnly" must be a boolean');
  }

  return {
    category: p.category as string | undefined,
    severity: p.severity as 'critical' | 'high' | 'medium' | 'low' | undefined,
    language: p.language as string | undefined,
    search: p.search as string | undefined,
    enabledOnly: p.enabledOnly as boolean | undefined,
  };
}
