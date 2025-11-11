import * as path from 'path';
import * as fs from 'fs/promises';
import { execSync } from 'child_process';
import { Severity, Category } from '../core/types';
export class DependencyAnalyzer {
    async analyze(projectPath) {
        const findings = [];
        const packageJsonPath = path.join(projectPath, 'package.json');
        if (await this.fileExists(packageJsonPath)) {
            const npmFindings = await this.analyzeNpm(projectPath);
            findings.push(...npmFindings);
        }
        const cargoTomlPath = path.join(projectPath, 'Cargo.toml');
        if (await this.fileExists(cargoTomlPath)) {
            const cargoFindings = await this.analyzeCargo(projectPath);
            findings.push(...cargoFindings);
        }
        const requirementsPath = path.join(projectPath, 'requirements.txt');
        if (await this.fileExists(requirementsPath)) {
            const pythonFindings = await this.analyzePython(projectPath);
            findings.push(...pythonFindings);
        }
        return findings;
    }
    async analyzeNpm(projectPath) {
        const findings = [];
        try {
            const result = execSync('npm audit --json', {
                cwd: projectPath,
                encoding: 'utf-8',
                stdio: ['pipe', 'pipe', 'pipe'],
                timeout: 30000,
            });
            const auditData = JSON.parse(result);
            for (const [packageName, vuln] of Object.entries(auditData.vulnerabilities)) {
                const location = {
                    file: path.join(projectPath, 'package.json'),
                    line: 0,
                    column: 0,
                };
                const fix = {
                    recommendation: `Update ${packageName} to a secure version`,
                    before: `"${packageName}": "${vuln.range}"`,
                    after: `Run: npm update ${packageName} or npm audit fix`,
                    references: vuln.url ? [vuln.url] : [],
                };
                findings.push({
                    id: `npm-audit-${packageName}-${Date.now()}`,
                    rule: `npm-audit-${vuln.severity}`,
                    severity: this.mapNpmSeverity(vuln.severity),
                    category: Category.DEPENDENCIES,
                    title: `${packageName}: ${vuln.title}`,
                    description: `Vulnerable dependency detected by npm audit. ${vuln.title}`,
                    location,
                    snippet: `"${packageName}": "${vuln.range}"`,
                    fix,
                    metadata: {
                        cwe: 'CWE-1035',
                        owasp: 'A06:2021',
                        confidence: 0.95,
                    },
                });
            }
        }
        catch (error) {
            if (error.stdout) {
                try {
                    const auditData = JSON.parse(error.stdout);
                    for (const [packageName, vuln] of Object.entries(auditData.vulnerabilities)) {
                        const location = {
                            file: path.join(projectPath, 'package.json'),
                            line: 0,
                            column: 0,
                        };
                        const fix = {
                            recommendation: `Update ${packageName} to a secure version`,
                            before: `"${packageName}": "${vuln.range}"`,
                            after: `Run: npm update ${packageName} or npm audit fix`,
                            references: vuln.url ? [vuln.url] : [],
                        };
                        findings.push({
                            id: `npm-audit-${packageName}-${Date.now()}`,
                            rule: `npm-audit-${vuln.severity}`,
                            severity: this.mapNpmSeverity(vuln.severity),
                            category: Category.DEPENDENCIES,
                            title: `${packageName}: ${vuln.title}`,
                            description: `Vulnerable dependency detected by npm audit. ${vuln.title}`,
                            location,
                            snippet: `"${packageName}": "${vuln.range}"`,
                            fix,
                            metadata: {
                                cwe: 'CWE-1035',
                                owasp: 'A06:2021',
                                confidence: 0.95,
                            },
                        });
                    }
                }
                catch (parseError) {
                    console.error('⚠️  Could not parse npm audit output');
                }
            }
        }
        return findings;
    }
    async analyzeCargo(projectPath) {
        const findings = [];
        try {
            execSync('cargo audit --version', { stdio: 'ignore' });
            const result = execSync('cargo audit --json', {
                cwd: projectPath,
                encoding: 'utf-8',
                stdio: ['pipe', 'pipe', 'pipe'],
                timeout: 30000,
            });
            const auditData = JSON.parse(result);
            if (auditData.vulnerabilities && auditData.vulnerabilities.list) {
                for (const vuln of auditData.vulnerabilities.list) {
                    const location = {
                        file: path.join(projectPath, 'Cargo.toml'),
                        line: 0,
                        column: 0,
                    };
                    const fix = {
                        recommendation: `Update ${vuln.package.name} to patched version`,
                        before: `${vuln.package.name} = "${vuln.package.version}"`,
                        after: `${vuln.package.name} = "${vuln.versions.patched[0] || 'latest'}"`,
                        references: [vuln.advisory.url],
                    };
                    findings.push({
                        id: `cargo-audit-${vuln.advisory.id}-${Date.now()}`,
                        rule: `cargo-audit-${vuln.advisory.id}`,
                        severity: this.mapCargoSeverity(vuln.advisory.severity),
                        category: Category.DEPENDENCIES,
                        title: `${vuln.package.name}: ${vuln.advisory.title}`,
                        description: vuln.advisory.description,
                        location,
                        snippet: `${vuln.package.name} = "${vuln.package.version}"`,
                        fix,
                        metadata: {
                            cwe: vuln.advisory.cwe || 'CWE-1035',
                            owasp: 'A06:2021',
                            confidence: 0.95,
                        },
                    });
                }
            }
        }
        catch (error) {
            console.error('⚠️  cargo-audit not available, skipping Rust dependency scan');
        }
        return findings;
    }
    async analyzePython(projectPath) {
        const findings = [];
        try {
            execSync('pip-audit --version', { stdio: 'ignore' });
            const result = execSync('pip-audit -r requirements.txt --format json', {
                cwd: projectPath,
                encoding: 'utf-8',
                stdio: ['pipe', 'pipe', 'pipe'],
                timeout: 30000,
            });
            const auditData = JSON.parse(result);
            if (auditData.dependencies) {
                for (const dep of auditData.dependencies) {
                    for (const vuln of dep.vulns) {
                        const location = {
                            file: path.join(projectPath, 'requirements.txt'),
                            line: 0,
                            column: 0,
                        };
                        const fix = {
                            recommendation: `Update ${dep.name} to a secure version`,
                            before: `${dep.name}==${dep.version}`,
                            after: `Run: pip install --upgrade ${dep.name}`,
                            references: vuln.url ? [vuln.url] : [],
                        };
                        findings.push({
                            id: `pip-audit-${vuln.id}-${Date.now()}`,
                            rule: `pip-audit-${vuln.id}`,
                            severity: this.mapPythonSeverity(vuln.severity),
                            category: Category.DEPENDENCIES,
                            title: `${dep.name}: ${vuln.description}`,
                            description: `Vulnerable Python package detected. ${vuln.description}`,
                            location,
                            snippet: `${dep.name}==${dep.version}`,
                            fix,
                            metadata: {
                                cwe: 'CWE-1035',
                                owasp: 'A06:2021',
                                confidence: 0.95,
                            },
                        });
                    }
                }
            }
        }
        catch (error) {
            console.error('⚠️  pip-audit not available, skipping Python dependency scan');
        }
        return findings;
    }
    mapNpmSeverity(npmSeverity) {
        switch (npmSeverity) {
            case 'critical':
                return Severity.CRITICAL;
            case 'high':
                return Severity.HIGH;
            case 'moderate':
                return Severity.MEDIUM;
            case 'low':
            case 'info':
                return Severity.LOW;
            default:
                return Severity.MEDIUM;
        }
    }
    mapCargoSeverity(cargoSeverity) {
        const lower = cargoSeverity?.toLowerCase() || 'medium';
        switch (lower) {
            case 'critical':
                return Severity.CRITICAL;
            case 'high':
                return Severity.HIGH;
            case 'medium':
            case 'moderate':
                return Severity.MEDIUM;
            case 'low':
            case 'informational':
                return Severity.LOW;
            default:
                return Severity.MEDIUM;
        }
    }
    mapPythonSeverity(pythonSeverity) {
        const lower = pythonSeverity?.toLowerCase() || 'medium';
        switch (lower) {
            case 'critical':
                return Severity.CRITICAL;
            case 'high':
                return Severity.HIGH;
            case 'medium':
            case 'moderate':
                return Severity.MEDIUM;
            case 'low':
                return Severity.LOW;
            default:
                return Severity.MEDIUM;
        }
    }
    async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        }
        catch {
            return false;
        }
    }
}
