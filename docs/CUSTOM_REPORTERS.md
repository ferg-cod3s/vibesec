# Creating Custom Reporters for VibeSec

**Comprehensive guide for building custom output formats**

## Table of Contents

1. [Overview](#overview)
2. [Reporter Interface](#reporter-interface)
3. [Step-by-Step Guide](#step-by-step-guide)
4. [Examples](#examples)
5. [Best Practices](#best-practices)
6. [Advanced Techniques](#advanced-techniques)

---

## Overview

VibeSec's reporter system allows you to create custom output formats for scan results. This enables you to:

- Format results for specific tools or platforms
- Create custom visualizations
- Integrate with notification systems
- Generate reports for different audiences

---

## Reporter Interface

All reporters must implement the `Reporter` interface:

```typescript
interface Reporter {
  name: string;
  format(result: ScanResult, options?: ReporterOptions): Promise<string>;
}

interface ReporterOptions {
  color?: boolean;
  verbose?: boolean;
  [key: string]: unknown; // Custom options
}
```

### Required Properties

- **`name`**: Unique identifier for your reporter (e.g., 'slack', 'html', 'csv')
- **`format()`**: Async method that transforms `ScanResult` into a string

---

## Step-by-Step Guide

### Step 1: Create Reporter Class

```typescript
import { Reporter, ScanResult, ReporterOptions } from 'vibesec';

export class MyReporter implements Reporter {
  name = 'my-reporter';

  async format(result: ScanResult, options?: ReporterOptions): Promise<string> {
    // Your formatting logic here
    return 'formatted output';
  }
}
```

### Step 2: Access Scan Data

The `ScanResult` object contains all scan data:

```typescript
async format(result: ScanResult): Promise<string> {
  // Metadata
  const path = result.scan.path;
  const filesScanned = result.scan.filesScanned;
  const duration = result.scan.duration;
  const timestamp = result.scan.timestamp;

  // Summary statistics
  const total = result.summary.total;
  const critical = result.summary.bySeverity.critical;
  const high = result.summary.bySeverity.high;

  // Individual findings
  const findings = result.findings;

  // Format your output...
}
```

### Step 3: Format Output

Build your output string:

```typescript
async format(result: ScanResult): Promise<string> {
  const lines: string[] = [];

  lines.push(`Scan Report: ${result.scan.path}`);
  lines.push(`Found ${result.summary.total} issues`);
  lines.push('');

  for (const finding of result.findings) {
    lines.push(`${finding.severity.toUpperCase()}: ${finding.title}`);
    lines.push(`  Location: ${finding.location.file}:${finding.location.line}`);
    lines.push('');
  }

  return lines.join('\n');
}
```

### Step 4: Use Reporter

```typescript
import { Scanner } from 'vibesec';
import { MyReporter } from './my-reporter';

const scanner = new Scanner({ path: './src' });
const result = await scanner.scan();

const reporter = new MyReporter();
const output = await reporter.format(result);

console.log(output);
```

---

## Examples

### Example 1: CSV Reporter

Generate CSV output for spreadsheet analysis:

```typescript
import { Reporter, ScanResult } from 'vibesec';

export class CSVReporter implements Reporter {
  name = 'csv';

  async format(result: ScanResult): Promise<string> {
    const rows: string[] = [];

    // Header
    rows.push('File,Line,Severity,Category,Title,Description,CWE,Confidence');

    // Data rows
    for (const finding of result.findings) {
      const row = [
        this.escapeCSV(finding.location.file),
        finding.location.line.toString(),
        finding.severity,
        finding.category,
        this.escapeCSV(finding.title),
        this.escapeCSV(finding.description),
        finding.metadata.cwe || '',
        finding.metadata.confidence.toString(),
      ];
      rows.push(row.join(','));
    }

    return rows.join('\n');
  }

  private escapeCSV(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }
}

// Usage
import * as fs from 'fs/promises';

const scanner = new Scanner({ path: './src' });
const result = await scanner.scan();

const csv = await new CSVReporter().format(result);
await fs.writeFile('security-report.csv', csv);
```

### Example 2: HTML Reporter

Create interactive HTML reports:

```typescript
import { Reporter, ScanResult, Finding } from 'vibesec';

export class HTMLReporter implements Reporter {
  name = 'html';

  async format(result: ScanResult): Promise<string> {
    const severityColors = {
      critical: '#d32f2f',
      high: '#f57c00',
      medium: '#fbc02d',
      low: '#7cb342',
    };

    return `
<!DOCTYPE html>
<html>
<head>
  <title>VibeSec Security Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .header {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-bottom: 20px;
    }
    .stat {
      background: white;
      padding: 15px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .stat-value {
      font-size: 2em;
      font-weight: bold;
      margin: 5px 0;
    }
    .stat-label {
      color: #666;
      font-size: 0.9em;
    }
    .finding {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 15px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      border-left: 4px solid;
    }
    .finding.critical { border-left-color: ${severityColors.critical}; }
    .finding.high { border-left-color: ${severityColors.high}; }
    .finding.medium { border-left-color: ${severityColors.medium}; }
    .finding.low { border-left-color: ${severityColors.low}; }
    .finding-title {
      font-size: 1.2em;
      font-weight: bold;
      margin-bottom: 10px;
    }
    .severity-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 0.85em;
      font-weight: bold;
      color: white;
      text-transform: uppercase;
    }
    .location {
      font-family: 'Monaco', 'Courier New', monospace;
      background: #f5f5f5;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.9em;
    }
    pre {
      background: #272822;
      color: #f8f8f2;
      padding: 15px;
      border-radius: 4px;
      overflow-x: auto;
      font-size: 0.9em;
    }
    .fix {
      background: #e8f5e9;
      padding: 15px;
      border-radius: 4px;
      margin-top: 10px;
      border-left: 3px solid #4caf50;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🔒 VibeSec Security Report</h1>
    <p><strong>Project:</strong> ${result.scan.path}</p>
    <p><strong>Scanned:</strong> ${new Date(result.scan.timestamp).toLocaleString()}</p>
    <p><strong>Files:</strong> ${result.scan.filesScanned} | <strong>Duration:</strong> ${result.scan.duration.toFixed(2)}s</p>
  </div>

  <div class="stats">
    <div class="stat">
      <div class="stat-label">Total Issues</div>
      <div class="stat-value">${result.summary.total}</div>
    </div>
    <div class="stat">
      <div class="stat-label">Critical</div>
      <div class="stat-value" style="color: ${severityColors.critical}">${result.summary.bySeverity.critical}</div>
    </div>
    <div class="stat">
      <div class="stat-label">High</div>
      <div class="stat-value" style="color: ${severityColors.high}">${result.summary.bySeverity.high}</div>
    </div>
    <div class="stat">
      <div class="stat-label">Medium</div>
      <div class="stat-value" style="color: ${severityColors.medium}">${result.summary.bySeverity.medium}</div>
    </div>
  </div>

  <h2>Findings</h2>
  ${result.findings.map((finding) => this.formatFinding(finding, severityColors)).join('\n')}

</body>
</html>
    `.trim();
  }

  private formatFinding(finding: Finding, severityColors: Record<string, string>): string {
    return `
    <div class="finding ${finding.severity}">
      <div class="finding-title">
        <span class="severity-badge" style="background: ${severityColors[finding.severity]}">${finding.severity}</span>
        ${this.escapeHTML(finding.title)}
      </div>
      <p><strong>Location:</strong> <span class="location">${this.escapeHTML(finding.location.file)}:${finding.location.line}</span></p>
      <p><strong>Category:</strong> ${finding.category}</p>
      <p>${this.escapeHTML(finding.description)}</p>
      ${finding.snippet ? `<pre>${this.escapeHTML(finding.snippet)}</pre>` : ''}
      <div class="fix">
        <strong>💡 How to Fix:</strong><br>
        ${this.escapeHTML(finding.fix.recommendation)}
      </div>
      ${finding.metadata.cwe ? `<p><small><strong>CWE:</strong> ${finding.metadata.cwe}</small></p>` : ''}
    </div>
    `;
  }

  private escapeHTML(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
```

### Example 3: Email Reporter

Send scan results via email:

```typescript
import { Reporter, ScanResult } from 'vibesec';
import nodemailer from 'nodemailer';

interface EmailReporterOptions {
  to: string;
  from: string;
  smtp: {
    host: string;
    port: number;
    auth?: {
      user: string;
      pass: string;
    };
  };
}

export class EmailReporter implements Reporter {
  name = 'email';

  constructor(private emailOptions: EmailReporterOptions) {}

  async format(result: ScanResult): Promise<string> {
    const subject = `VibeSec: ${result.summary.total} issues found in ${result.scan.path}`;

    const body = `
<h2>🔒 VibeSec Security Report</h2>

<p><strong>Project:</strong> ${result.scan.path}</p>
<p><strong>Scanned:</strong> ${new Date(result.scan.timestamp).toLocaleString()}</p>
<p><strong>Files:</strong> ${result.scan.filesScanned}</p>

<h3>Summary</h3>
<ul>
  <li><strong>Total Issues:</strong> ${result.summary.total}</li>
  <li><strong>Critical:</strong> ${result.summary.bySeverity.critical}</li>
  <li><strong>High:</strong> ${result.summary.bySeverity.high}</li>
  <li><strong>Medium:</strong> ${result.summary.bySeverity.medium}</li>
  <li><strong>Low:</strong> ${result.summary.bySeverity.low}</li>
</ul>

<h3>Top Issues</h3>
<ul>
${result.findings
  .slice(0, 10)
  .map(
    (f) =>
      `<li><strong>${f.severity.toUpperCase()}:</strong> ${f.title} (${f.location.file}:${f.location.line})</li>`
  )
  .join('\n')}
</ul>

${result.summary.total > 10 ? `<p><em>... and ${result.summary.total - 10} more issues</em></p>` : ''}
    `.trim();

    // Send email
    const transporter = nodemailer.createTransporter(this.emailOptions.smtp);

    await transporter.sendMail({
      from: this.emailOptions.from,
      to: this.emailOptions.to,
      subject,
      html: body,
    });

    return `Email sent to ${this.emailOptions.to}`;
  }
}

// Usage
const emailReporter = new EmailReporter({
  to: 'security-team@company.com',
  from: 'vibesec@company.com',
  smtp: {
    host: 'smtp.company.com',
    port: 587,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  },
});

const scanner = new Scanner({ path: './src' });
const result = await scanner.scan();
await emailReporter.format(result);
```

### Example 4: Markdown Reporter

Generate GitHub-friendly markdown:

````typescript
import { Reporter, ScanResult, Finding } from 'vibesec';

export class MarkdownReporter implements Reporter {
  name = 'markdown';

  async format(result: ScanResult): Promise<string> {
    const lines: string[] = [];

    // Header
    lines.push(`# 🔒 VibeSec Security Report\n`);
    lines.push(`**Project:** ${result.scan.path}`);
    lines.push(`**Scanned:** ${new Date(result.scan.timestamp).toLocaleString()}`);
    lines.push(
      `**Files:** ${result.scan.filesScanned} | **Duration:** ${result.scan.duration.toFixed(2)}s\n`
    );

    // Summary
    lines.push(`## Summary\n`);
    lines.push(`| Severity | Count |`);
    lines.push(`|----------|-------|`);
    lines.push(`| Critical | ${result.summary.bySeverity.critical} |`);
    lines.push(`| High     | ${result.summary.bySeverity.high} |`);
    lines.push(`| Medium   | ${result.summary.bySeverity.medium} |`);
    lines.push(`| Low      | ${result.summary.bySeverity.low} |`);
    lines.push(`| **Total** | **${result.summary.total}** |\n`);

    // Findings by severity
    const grouped = this.groupBySeverity(result.findings);

    for (const severity of ['critical', 'high', 'medium', 'low']) {
      const findings = grouped[severity] || [];
      if (findings.length === 0) continue;

      const emoji = this.getSeverityEmoji(severity);
      lines.push(`## ${emoji} ${severity.toUpperCase()} (${findings.length})\n`);

      for (const finding of findings) {
        lines.push(`### ${finding.title}\n`);
        lines.push(`**Location:** \`${finding.location.file}:${finding.location.line}\``);
        lines.push(`**Category:** ${finding.category}\n`);
        lines.push(finding.description + '\n');

        if (finding.snippet) {
          lines.push('```javascript');
          lines.push(finding.snippet);
          lines.push('```\n');
        }

        lines.push('**💡 How to Fix:**');
        lines.push(finding.fix.recommendation + '\n');

        if (finding.metadata.cwe) {
          lines.push(`**CWE:** ${finding.metadata.cwe}\n`);
        }

        lines.push('---\n');
      }
    }

    return lines.join('\n');
  }

  private groupBySeverity(findings: Finding[]): Record<string, Finding[]> {
    const grouped: Record<string, Finding[]> = {};
    for (const finding of findings) {
      if (!grouped[finding.severity]) {
        grouped[finding.severity] = [];
      }
      grouped[finding.severity].push(finding);
    }
    return grouped;
  }

  private getSeverityEmoji(severity: string): string {
    const emojis: Record<string, string> = {
      critical: '🔴',
      high: '🟠',
      medium: '🟡',
      low: '🟢',
    };
    return emojis[severity] || '⚪';
  }
}
````

---

## Best Practices

### 1. Handle Options

Support both color and non-color output:

```typescript
async format(result: ScanResult, options?: ReporterOptions): Promise<string> {
  const useColor = options?.color !== false;

  if (useColor) {
    return chalk.red('Error:') + ' ' + message;
  } else {
    return 'Error: ' + message;
  }
}
```

### 2. Escape Output

Always escape user-controlled content:

```typescript
// HTML escaping
private escapeHTML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// CSV escaping
private escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

// Markdown escaping
private escapeMarkdown(str: string): string {
  return str.replace(/[*_\[\]()#+-]/g, '\\$&');
}
```

### 3. Error Handling

Handle failures gracefully:

```typescript
async format(result: ScanResult): Promise<string> {
  try {
    // Your formatting logic
    return formattedOutput;
  } catch (error) {
    console.error(`Reporter ${this.name} failed:`, error);
    throw new Error(`Failed to format report: ${error.message}`);
  }
}
```

### 4. Performance

For large result sets, use streaming or pagination:

```typescript
async format(result: ScanResult): Promise<string> {
  if (result.findings.length > 1000) {
    // Only show top 1000 findings
    const topFindings = result.findings.slice(0, 1000);
    // ... format top findings
    return formatted + `\n\n(${result.findings.length - 1000} more findings omitted)`;
  }
  // ... format all findings
}
```

---

## Advanced Techniques

### Conditional Formatting

Adjust output based on result severity:

```typescript
async format(result: ScanResult): Promise<string> {
  const hasCritical = result.summary.bySeverity.critical > 0;
  const hasHigh = result.summary.bySeverity.high > 0;

  if (hasCritical || hasHigh) {
    return this.formatDetailed(result);
  } else {
    return this.formatSummary(result);
  }
}
```

### Template-Based Formatting

Use templates for flexibility:

```typescript
export class TemplateReporter implements Reporter {
  name = 'template';

  constructor(private template: string) {}

  async format(result: ScanResult): Promise<string> {
    return this.template
      .replace('{{path}}', result.scan.path)
      .replace('{{total}}', result.summary.total.toString())
      .replace('{{critical}}', result.summary.bySeverity.critical.toString());
    // ... more replacements
  }
}

// Usage
const template = `
Project: {{path}}
Total Issues: {{total}}
Critical: {{critical}}
`;

const reporter = new TemplateReporter(template);
```

---

## Related Documentation

- [Programmatic API](./PROGRAMMATIC_API.md) - Full API reference
- [Architecture](./ARCHITECTURE.md) - System design
- [Quick Start](./QUICK_START.md) - Getting started

---

**Last Updated:** 2025-10-15
**Version:** 0.1.0
