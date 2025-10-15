import * as path from 'path';
import * as fs from 'fs/promises';
import { execSync } from 'child_process';
import { Finding, Severity, Category, Location, FixRecommendation } from '../core/types';

interface NpmAuditVulnerability {
  severity: 'info' | 'low' | 'moderate' | 'high' | 'critical';
  title: string;
  url: string;
  via: string | any[];
  range: string;
}

interface NpmAuditResult {
  vulnerabilities: Record<string, NpmAuditVulnerability>;
  metadata: {
    vulnerabilities: {
      info: number;
      low: number;
      moderate: number;
      high: number;
      critical: number;
      total: number;
    };
  };
}

export class DependencyAnalyzer {
  /**
   * Scan for dependency vulnerabilities using npm audit or cargo audit
   */
  async analyze(projectPath: string): Promise<Finding[]> {
    const findings: Finding[] = [];

    // Check for package.json (npm/yarn)
    const packageJsonPath = path.join(projectPath, 'package.json');
    if (await this.fileExists(packageJsonPath)) {
      const npmFindings = await this.analyzeNpm(projectPath);
      findings.push(...npmFindings);
    }

    // Check for Cargo.toml (Rust)
    const cargoTomlPath = path.join(projectPath, 'Cargo.toml');
    if (await this.fileExists(cargoTomlPath)) {
      const cargoFindings = await this.analyzeCargo(projectPath);
      findings.push(...cargoFindings);
    }

    // Check for requirements.txt (Python)
    const requirementsPath = path.join(projectPath, 'requirements.txt');
    if (await this.fileExists(requirementsPath)) {
      const pythonFindings = await this.analyzePython(projectPath);
      findings.push(...pythonFindings);
    }

    return findings;
  }

  private async analyzeNpm(projectPath: string): Promise<Finding[]> {
    const findings: Finding[] = [];

    try {
      // Run npm audit with JSON output
      const result = execSync('npm audit --json', {
        cwd: projectPath,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 30000, // 30 second timeout
      });

      const auditData: NpmAuditResult = JSON.parse(result);

      // Convert npm audit results to findings
      for (const [packageName, vuln] of Object.entries(auditData.vulnerabilities)) {
        const location: Location = {
          file: path.join(projectPath, 'package.json'),
          line: 0,
          column: 0,
        };

        const fix: FixRecommendation = {
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
    } catch (error: any) {
      // npm audit returns non-zero exit code when vulnerabilities found
      // Parse the error output if it contains JSON
      if (error.stdout) {
        try {
          const auditData: NpmAuditResult = JSON.parse(error.stdout);

          for (const [packageName, vuln] of Object.entries(auditData.vulnerabilities)) {
            const location: Location = {
              file: path.join(projectPath, 'package.json'),
              line: 0,
              column: 0,
            };

            const fix: FixRecommendation = {
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
        } catch (parseError) {
          // If we can't parse the output, log but don't fail
          console.error('⚠️  Could not parse npm audit output');
        }
      }
    }

    return findings;
  }

  private async analyzeCargo(projectPath: string): Promise<Finding[]> {
    const findings: Finding[] = [];

    try {
      // Check if cargo-audit is installed
      execSync('cargo audit --version', { stdio: 'ignore' });

      // Run cargo audit
      const result = execSync('cargo audit --json', {
        cwd: projectPath,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 30000,
      });

      const auditData = JSON.parse(result);

      if (auditData.vulnerabilities && auditData.vulnerabilities.list) {
        for (const vuln of auditData.vulnerabilities.list) {
          const location: Location = {
            file: path.join(projectPath, 'Cargo.toml'),
            line: 0,
            column: 0,
          };

          const fix: FixRecommendation = {
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
    } catch (error) {
      // cargo-audit might not be installed, skip silently
      console.error('⚠️  cargo-audit not available, skipping Rust dependency scan');
    }

    return findings;
  }

  private async analyzePython(projectPath: string): Promise<Finding[]> {
    const findings: Finding[] = [];

    try {
      // Check if pip-audit is installed
      execSync('pip-audit --version', { stdio: 'ignore' });

      // Run pip-audit
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
            const location: Location = {
              file: path.join(projectPath, 'requirements.txt'),
              line: 0,
              column: 0,
            };

            const fix: FixRecommendation = {
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
    } catch (error) {
      // pip-audit might not be installed, skip silently
      console.error('⚠️  pip-audit not available, skipping Python dependency scan');
    }

    return findings;
  }

  private mapNpmSeverity(npmSeverity: string): Severity {
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

  private mapCargoSeverity(cargoSeverity: string): Severity {
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

  private mapPythonSeverity(pythonSeverity: string): Severity {
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

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}
