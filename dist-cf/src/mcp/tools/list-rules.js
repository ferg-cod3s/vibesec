import { RuleLoader } from '../../../scanner/core/rule-loader';
import { Severity } from '../../../scanner/core/types';
export const vibesecListRulesTool = {
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
export async function handleListRules(params) {
    const listParams = validateListRulesParams(params);
    const ruleLoader = new RuleLoader();
    const allRules = await ruleLoader.load();
    let filteredRules = allRules;
    if (listParams.enabledOnly !== false) {
        filteredRules = filteredRules.filter((r) => r.enabled);
    }
    if (listParams.category) {
        filteredRules = filteredRules.filter((r) => r.category.toLowerCase() === listParams.category.toLowerCase());
    }
    if (listParams.severity) {
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const minLevel = severityOrder[listParams.severity];
        filteredRules = filteredRules.filter((r) => severityOrder[r.severity] >= minLevel);
    }
    if (listParams.language) {
        filteredRules = filteredRules.filter((r) => r.languages.includes('*') ||
            r.languages.some((lang) => lang.toLowerCase() === listParams.language.toLowerCase()));
    }
    if (listParams.search) {
        const searchLower = listParams.search.toLowerCase();
        filteredRules = filteredRules.filter((r) => r.id.toLowerCase().includes(searchLower) ||
            r.name.toLowerCase().includes(searchLower) ||
            r.description.toLowerCase().includes(searchLower));
    }
    const ruleInfos = filteredRules.map((rule) => ({
        id: rule.id,
        name: rule.name,
        description: rule.description,
        severity: rule.severity,
        category: rule.category,
        languages: rule.languages,
        enabled: rule.enabled,
        metadata: rule.metadata,
    }));
    const categories = [...new Set(filteredRules.map((r) => r.category))];
    const byCategory = {};
    for (const category of categories) {
        byCategory[category] = filteredRules.filter((r) => r.category === category).length;
    }
    const bySeverity = {
        critical: filteredRules.filter((r) => r.severity === Severity.CRITICAL).length,
        high: filteredRules.filter((r) => r.severity === Severity.HIGH).length,
        medium: filteredRules.filter((r) => r.severity === Severity.MEDIUM).length,
        low: filteredRules.filter((r) => r.severity === Severity.LOW).length,
    };
    const byLanguage = {};
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
function validateListRulesParams(params) {
    if (!params || typeof params !== 'object') {
        return {};
    }
    const p = params;
    if (p.category && typeof p.category !== 'string') {
        throw new Error('Invalid parameters: "category" must be a string');
    }
    if (p.severity) {
        if (typeof p.severity !== 'string') {
            throw new Error('Invalid parameters: "severity" must be a string');
        }
        if (!['critical', 'high', 'medium', 'low'].includes(p.severity)) {
            throw new Error('Invalid parameters: "severity" must be one of: critical, high, medium, low');
        }
    }
    if (p.language && typeof p.language !== 'string') {
        throw new Error('Invalid parameters: "language" must be a string');
    }
    if (p.search && typeof p.search !== 'string') {
        throw new Error('Invalid parameters: "search" must be a string');
    }
    if (p.enabledOnly !== undefined && typeof p.enabledOnly !== 'boolean') {
        throw new Error('Invalid parameters: "enabledOnly" must be a boolean');
    }
    return {
        category: p.category,
        severity: p.severity,
        language: p.language,
        search: p.search,
        enabledOnly: p.enabledOnly,
    };
}
