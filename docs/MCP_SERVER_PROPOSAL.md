# VibeSec MCP Server - Integration Proposal

**Date**: 2025-10-17
**Status**: PROPOSAL
**Priority**: HIGH (Should be Priority 2.5 or Priority 3)

---

## Problem Statement

**VibeSec is currently invisible to AI coding assistants.**

### Current Reality

- ✅ VibeSec can scan AI-generated code
- ❌ AI assistants can't call VibeSec
- ❌ AI assistants don't know about vulnerabilities
- ❌ Manual feedback loop (slow, error-prone)

### Impact

- Developers must manually run scans
- AI generates vulnerable code without feedback
- No integration with "vibe coding" workflows
- Security is a post-generation step, not part of the loop

---

## Solution: VibeSec as MCP Server

Implement Model Context Protocol server so AI assistants can:

1. **Scan code directly** during generation
2. **Receive vulnerability reports** in real-time
3. **Iterate automatically** until code is secure
4. **Integrate with** Claude Code, Cursor, Windsurf, Copilot

---

## Proposed MCP Tools

### 1. `vibesec_scan`

**Scan files for security vulnerabilities**

```typescript
{
  name: "vibesec_scan",
  description: "Scan code files for security vulnerabilities using VibeSec",
  parameters: {
    files: string[],           // Paths to scan
    rules?: string[],          // Optional: specific rule IDs
    severity?: string,         // Optional: 'critical'|'high'|'medium'|'low'
    format?: string,           // Optional: 'json'|'text'|'sarif'
    incremental?: boolean,     // Optional: git-based incremental scan
  },
  returns: {
    findings: Finding[],
    score: number,             // 0-100 security score
    summary: {
      total: number,
      bySeverity: Record<string, number>,
      byCategory: Record<string, number>
    },
    status: 'SECURE' | 'VULNERABLE'
  }
}
```

### 2. `vibesec_fix_suggestion`

**Get AI-friendly fix recommendations**

```typescript
{
  name: "vibesec_fix_suggestion",
  description: "Get specific fix recommendations for a vulnerability",
  parameters: {
    finding: Finding,          // The vulnerability to fix
    context?: string,          // Optional: surrounding code
  },
  returns: {
    recommendation: string,    // Human-readable fix
    codeExample?: string,      // Fixed code example
    references: string[],      // CWE, OWASP links
    difficulty: 'easy'|'medium'|'hard'
  }
}
```

### 3. `vibesec_validate_fix`

**Verify a fix resolves the vulnerability**

```typescript
{
  name: "vibesec_validate_fix",
  description: "Check if modified code fixes the vulnerability",
  parameters: {
    originalCode: string,
    fixedCode: string,
    findingId: string
  },
  returns: {
    fixed: boolean,
    remainingIssues?: Finding[],
    score: number
  }
}
```

### 4. `vibesec_init_config`

**Generate project configuration**

```typescript
{
  name: "vibesec_init_config",
  description: "Generate .vibesec.yaml config for a project",
  parameters: {
    projectPath: string,
    languages?: string[],
    framework?: string
  },
  returns: {
    config: string,            // YAML content
    detectedLanguages: string[],
    recommendedRules: number
  }
}
```

### 5. `vibesec_list_rules`

**Discover available detection rules**

```typescript
{
  name: "vibesec_list_rules",
  description: "List available security rules and categories",
  parameters: {
    category?: string,         // Optional: filter by category
    severity?: string,         // Optional: filter by severity
    language?: string          // Optional: filter by language
  },
  returns: {
    rules: Rule[],
    categories: string[],
    totalRules: number
  }
}
```

---

## Integration Examples

### Example 1: Claude Code Auto-Fixing Vulnerable Code

```typescript
// User: "Create a user login API endpoint"

// 1. AI generates code
const code = `
async function login(req, res) {
  const { username, password } = req.body;
  const query = "SELECT * FROM users WHERE username='" + username + "'";
  const user = await db.query(query);
  // ...
}
`;

// 2. AI scans automatically
const result = await mcp__vibesec__scan({
  files: ['src/api/login.ts'],
  severity: 'high',
});

// 3. AI sees vulnerability
// result.findings: [{ rule: 'sql-injection', line: 3, severity: 'critical' }]

// 4. AI gets fix suggestion
const fix = await mcp__vibesec__fix_suggestion({
  finding: result.findings[0],
});

// 5. AI fixes code automatically
const fixedCode = `
async function login(req, res) {
  const { username, password } = req.body;
  const query = "SELECT * FROM users WHERE username = ?";
  const user = await db.query(query, [username]);
  // ...
}
`;

// 6. AI validates fix
const validation = await mcp__vibesec__validate_fix({
  originalCode: code,
  fixedCode: fixedCode,
  findingId: result.findings[0].id,
});

// ✅ validation.fixed: true
```

### Example 2: Cursor IDE Pre-Commit Scanning

```typescript
// Cursor: "Commit changes to src/api.ts"

// 1. Cursor scans before commit
const scan = await mcp__vibesec__scan({
  files: ['src/api.ts'],
  incremental: true,
});

// 2. If vulnerabilities found, block commit
if (scan.status === 'VULNERABLE') {
  // Show vulnerabilities to user
  // Ask: "Fix vulnerabilities before committing?"

  // 3. User accepts → AI fixes automatically
  for (const finding of scan.findings) {
    const fix = await mcp__vibesec__fix_suggestion({ finding });
    // Apply fix
  }

  // 4. Re-scan
  const rescan = await mcp__vibesec__scan({ files: ['src/api.ts'] });

  // 5. If clean → commit
  if (rescan.status === 'SECURE') {
    git.commit();
  }
}
```

### Example 3: GitHub Copilot Real-time Feedback

```typescript
// As developer types in VS Code:

// Copilot generates:
const user = eval(req.query.code); // ← DANGEROUS

// MCP server scans in background:
const scan = await mcp__vibesec__scan({
  files: [currentFile],
  incremental: true,
});

// Copilot shows inline warning:
// ⚠️ CRITICAL: eval() usage detected (Rule: command-injection)
// 💡 Suggestion: Use JSON.parse() for safe parsing
```

---

## Implementation Plan

### Phase 1: Core MCP Server (16 hours)

**Week 1:**

- [ ] Create MCP server scaffolding (`src/mcp/server.ts`)
- [ ] Implement stdio transport for Claude Code
- [ ] Add `vibesec_scan` tool
- [ ] Add `vibesec_list_rules` tool
- [ ] Basic error handling and logging

**Deliverables:**

- Working MCP server
- Claude Code integration
- 2 basic tools functional

### Phase 2: Advanced Tools (12 hours)

**Week 2:**

- [ ] Implement `vibesec_fix_suggestion`
- [ ] Implement `vibesec_validate_fix`
- [ ] Implement `vibesec_init_config`
- [ ] Add streaming support for large scans
- [ ] Performance optimization

**Deliverables:**

- 5 complete MCP tools
- Streaming for long scans
- Documentation

### Phase 3: Integrations & Testing (12 hours)

**Week 3:**

- [ ] Test with Claude Code
- [ ] Test with Cursor (if possible)
- [ ] Create example workflows
- [ ] Write integration tests
- [ ] Performance benchmarks

**Deliverables:**

- Integration tests
- Example workflows
- Performance benchmarks
- User documentation

### Phase 4: Distribution (8 hours)

**Week 4:**

- [ ] NPM package with MCP server
- [ ] Installation guide
- [ ] Video tutorial
- [ ] GitHub README update

**Deliverables:**

- Published MCP server
- Complete documentation
- Tutorial video

**Total Effort: 48 hours (6 days)**

---

## Technical Architecture

### File Structure

```
vibesec/
├── src/
│   ├── mcp/
│   │   ├── server.ts          # Main MCP server
│   │   ├── tools/
│   │   │   ├── scan.ts        # vibesec_scan tool
│   │   │   ├── fix.ts         # vibesec_fix_suggestion
│   │   │   ├── validate.ts    # vibesec_validate_fix
│   │   │   ├── init.ts        # vibesec_init_config
│   │   │   └── rules.ts       # vibesec_list_rules
│   │   ├── transport/
│   │   │   ├── stdio.ts       # stdio transport
│   │   │   └── http.ts        # HTTP transport (future)
│   │   └── types.ts           # MCP types
│   ├── scanner/ (existing)
│   └── cli/ (existing)
├── bin/
│   ├── vibesec             # CLI (existing)
│   └── vibesec-mcp         # MCP server
└── package.json
```

### MCP Server Entry Point

```typescript
// bin/vibesec-mcp
#!/usr/bin/env bun

import { MCPServer } from '../src/mcp/server';
import { StdioTransport } from '../src/mcp/transport/stdio';

const server = new MCPServer({
  name: 'vibesec',
  version: '1.0.0',
  transport: new StdioTransport()
});

await server.start();
```

### Claude Code Configuration

```json
// .mcp.json
{
  "mcpServers": {
    "vibesec": {
      "type": "stdio",
      "command": "npx",
      "args": ["vibesec-mcp"]
    }
  }
}
```

---

## Benefits

### For Developers

- ✅ **Automatic security checks** during AI coding
- ✅ **Faster feedback loops** (seconds vs minutes)
- ✅ **Self-correcting AI** that learns from security issues
- ✅ **Zero manual scanning** required

### For AI Assistants

- ✅ **Built-in security awareness**
- ✅ **Vulnerability knowledge** without training
- ✅ **Validation loop** for code quality
- ✅ **Context-aware fixes** based on real rules

### For Organizations

- ✅ **Shift-left security** (vulnerabilities caught at generation)
- ✅ **Reduced security debt** (no vulnerable code in repos)
- ✅ **Developer productivity** (AI handles security automatically)
- ✅ **Compliance** (automated security checks)

---

## Market Differentiation

### Unique Positioning

**"The only security scanner that AI assistants can call natively"**

### Competitive Advantage

| Tool        | CLI | MCP Server | AI-Native |
| ----------- | --- | ---------- | --------- |
| Snyk        | ✅  | ❌         | ❌        |
| SonarQube   | ✅  | ❌         | ❌        |
| Semgrep     | ✅  | ❌         | ❌        |
| **VibeSec** | ✅  | ✅         | ✅        |

### Use Cases

1. **Claude Code** - Auto-fix during generation
2. **Cursor** - Pre-commit validation
3. **Windsurf** - Real-time feedback
4. **GitHub Copilot** - Inline warnings
5. **AutoGPT/AgentGPT** - Self-validating agents
6. **Custom AI agents** - Security-aware automation

---

## Risks & Mitigations

### Risk 1: Performance Overhead

**Impact**: Slow scans block AI workflow

**Mitigation**:

- Incremental scanning (git diff only)
- Streaming results (show findings as found)
- Configurable timeout (fail-fast option)
- Caching (same code = same results)

### Risk 2: False Positives Annoy AI

**Impact**: AI repeatedly tries to "fix" non-issues

**Mitigation**:

- Confidence scores on findings
- Configurable severity threshold
- Allow AI to suppress findings
- Learn from user feedback

### Risk 3: Integration Complexity

**Impact**: Different AI platforms need different integrations

**Mitigation**:

- Start with MCP (Claude Code standard)
- Document API clearly for other platforms
- HTTP API for non-MCP platforms
- Plugin architecture for extensibility

---

## Success Metrics

### Technical KPIs

- [ ] Scan latency <2s for typical file
- [ ] MCP tool response <200ms overhead
- [ ] 0 crashes on malformed input
- [ ] 100% test coverage for MCP tools

### Adoption KPIs

- [ ] 100+ Claude Code users in first month
- [ ] 10+ GitHub stars on announcement
- [ ] Featured in Claude Code showcase
- [ ] Integration with 3+ AI coding platforms

### Business KPIs

- [ ] 50% reduction in vulnerabilities in AI-generated code
- [ ] 80% user retention after first scan
- [ ] Positive feedback from 90% of users

---

## Open Questions

1. **Should we support HTTP transport?**
   - Pros: Browser-based IDEs, remote agents
   - Cons: More complexity, auth required
   - Decision: Start with stdio, add HTTP in v1.1

2. **How to handle long-running scans?**
   - Option A: Streaming results (show findings incrementally)
   - Option B: Progress callbacks
   - Option C: Async jobs with polling
   - **Recommendation**: Start with streaming (A)

3. **Should AI be able to suppress findings?**
   - Pros: Reduces noise, learns from feedback
   - Cons: Could hide real vulnerabilities
   - **Recommendation**: Yes, but log suppressions

4. **Pricing model for MCP server?**
   - Option A: Free forever (open source)
   - Option B: Free tier + paid features
   - Option C: Enterprise licensing
   - **Recommendation**: Start free, add paid features later

---

## Recommendation

**IMPLEMENT THIS AS HIGH PRIORITY**

### Rationale

1. **Unique market position** - No other security scanner is AI-native
2. **Natural fit** - VibeSec is designed for AI-generated code
3. **Low effort** - 48 hours to MVP
4. **High impact** - Transforms security from post-gen to in-loop

### Suggested Priority

- **Insert as Priority 2.5** (after current P2, before P3)
- **Or replace** some of planned P2 (Snyk/Socket can wait)

### Proposed Timeline

- **Week 5-6**: MCP Server implementation
- **Week 7**: Testing and documentation
- **Week 8**: Launch and promotion

---

## Next Steps

If approved:

1. [ ] Create GitHub issue for MCP Server
2. [ ] Add to GitHub Project board
3. [ ] Create detailed technical spec
4. [ ] Set up development branch
5. [ ] Begin implementation

---

**Status**: AWAITING DECISION
**Estimated Effort**: 48 hours
**Estimated ROI**: HIGH - unique market differentiator

**Last Updated**: 2025-10-17
