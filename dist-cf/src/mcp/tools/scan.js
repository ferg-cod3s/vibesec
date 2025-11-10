import { Scanner } from '../../../scanner/core/engine';
import { Severity } from '../../../scanner/core/types';
export const vibesecScanTool = {
    name: 'vibesec_scan',
    description: `Scan code files for security vulnerabilities using VibeSec's AI-native security scanner.

This tool detects:
- Hardcoded secrets and credentials
- SQL injection vulnerabilities
- Command injection risks
- Path traversal issues
- Incomplete implementations
- Authentication/authorization flaws
- AI-specific security risks (prompt injection, unsafe LLM calls)

Returns detailed findings with severity levels, descriptions, and fix recommendations.`,
    inputSchema: {
        type: 'object',
        properties: {
            files: {
                type: 'array',
                items: { type: 'string' },
                description: 'Array of file paths or glob patterns to scan (e.g., ["src/**/*.ts", "lib/auth.js"])',
            },
            severity: {
                type: 'string',
                enum: ['critical', 'high', 'medium', 'low'],
                description: 'Filter findings by minimum severity level. If omitted, returns all findings.',
            },
            rules: {
                type: 'array',
                items: { type: 'string' },
                description: 'Optional: Specific rule IDs to run (e.g., ["hardcoded-secret", "sql-injection"]). If omitted, runs all applicable rules.',
            },
            format: {
                type: 'string',
                enum: ['json', 'text', 'sarif'],
                description: 'Output format (default: json)',
                default: 'json',
            },
            basePath: {
                type: 'string',
                description: 'Base directory for scanning. Defaults to current working directory.',
            },
            parallel: {
                type: 'boolean',
                description: 'Enable parallel file scanning for better performance (default: true)',
                default: true,
            },
        },
        required: ['files'],
    },
    handler: handleScan,
};
export async function handleScan(params) {
    const scanParams = validateScanParams(params);
    const scanPath = scanParams.basePath || process.cwd();
    const scanner = new Scanner({
        path: scanPath,
        severity: scanParams.severity ? scanParams.severity.toLowerCase() : Severity.LOW,
        format: scanParams.format === 'text' ? 'text' : 'json',
        include: scanParams.files.length > 0 ? scanParams.files : ['**/*.{js,ts,py,jsx,tsx}'],
        parallel: scanParams.parallel !== false,
        quiet: true,
    });
    const result = await scanner.scan();
    return transformScanResult(result, scanParams);
}
function validateScanParams(params) {
    if (!params || typeof params !== 'object') {
        throw new Error('Invalid parameters: expected object');
    }
    const p = params;
    if (!p.files || !Array.isArray(p.files)) {
        throw new Error('Invalid parameters: "files" is required and must be an array');
    }
    if (p.files.length === 0) {
        throw new Error('Invalid parameters: "files" array cannot be empty');
    }
    if (!p.files.every((f) => typeof f === 'string')) {
        throw new Error('Invalid parameters: all items in "files" must be strings');
    }
    if (p.severity && typeof p.severity !== 'string') {
        throw new Error('Invalid parameters: "severity" must be a string');
    }
    if (p.severity && !['critical', 'high', 'medium', 'low'].includes(p.severity)) {
        throw new Error('Invalid parameters: "severity" must be one of: critical, high, medium, low');
    }
    if (p.rules !== undefined) {
        if (!Array.isArray(p.rules) || !p.rules.every((r) => typeof r === 'string')) {
            throw new Error('Invalid parameters: "rules" must be an array of strings');
        }
    }
    if (p.format && !['json', 'text', 'sarif'].includes(p.format)) {
        throw new Error('Invalid parameters: "format" must be one of: json, text, sarif');
    }
    if (p.basePath && typeof p.basePath !== 'string') {
        throw new Error('Invalid parameters: "basePath" must be a string');
    }
    if (p.parallel !== undefined && typeof p.parallel !== 'boolean') {
        throw new Error('Invalid parameters: "parallel" must be a boolean');
    }
    return {
        files: p.files,
        severity: p.severity,
        rules: p.rules,
        format: p.format || 'json',
        basePath: p.basePath,
        parallel: p.parallel,
    };
}
function transformScanResult(coreResult, params) {
    let findings = coreResult.findings;
    if (params.rules && params.rules.length > 0) {
        findings = findings.filter((f) => params.rules.includes(f.rule));
    }
    const summary = {
        total: findings.length,
        critical: findings.filter((f) => f.severity === Severity.CRITICAL).length,
        high: findings.filter((f) => f.severity === Severity.HIGH).length,
        medium: findings.filter((f) => f.severity === Severity.MEDIUM).length,
        low: findings.filter((f) => f.severity === Severity.LOW).length,
        filesScanned: coreResult.scan.filesScanned,
    };
    let status;
    if (summary.critical > 0) {
        status = 'fail';
    }
    else if (summary.high > 0) {
        status = 'warning';
    }
    else {
        status = 'pass';
    }
    return {
        findings,
        summary,
        scan: {
            timestamp: coreResult.scan.timestamp,
            duration: coreResult.scan.duration,
            path: coreResult.scan.path,
        },
        status,
    };
}
