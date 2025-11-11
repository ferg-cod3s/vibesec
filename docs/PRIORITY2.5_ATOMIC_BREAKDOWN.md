# Priority 2.5: MCP Server - Atomic Implementation Plan

**Priority**: 2.5 (AI-Native Integration)
**Total Effort**: 48 hours
**Timeline**: Weeks 4.5-6 (6 working days)
**Status**: PLANNING → IMPLEMENTATION

---

## Executive Summary

Transform VibeSec from a CLI-only tool into the **first AI-native security scanner** by implementing a Model Context Protocol (MCP) server. This enables AI assistants (Claude Code, Cursor, etc.) to scan code, detect vulnerabilities, get fix suggestions, and validate corrections automatically during code generation.

**Market Impact**: Unique competitive differentiator - no other security scanner is callable by AI assistants.

---

## Phase Breakdown

### Phase 1: Core MCP Infrastructure (16 hours)

Build the foundational MCP server with stdio transport and tool registration.

### Phase 2: Basic Tools (16 hours)

Implement `vibesec_scan` and `vibesec_list_rules` for core functionality.

### Phase 3: Advanced Tools (12 hours)

Implement `vibesec_fix_suggestion`, `vibesec_validate_fix`, and `vibesec_init_config`.

### Phase 4: Testing & Documentation (4 hours)

Comprehensive tests, integration testing, and documentation.

---

## Phase 1: Core MCP Infrastructure (16 hours)

### Task 1.1: MCP Server Scaffolding (4 hours)

**Objective**: Create the base MCP server structure with proper type definitions.

**Atomic Tasks**:

1. **Create directory structure** (15min)

   ```
   src/mcp/
   ├── server.ts           # Main MCP server class
   ├── types.ts            # MCP type definitions
   ├── transport/
   │   ├── stdio.ts        # Stdio transport implementation
   │   └── base.ts         # Base transport interface
   └── tools/              # Tool implementations (next phase)
   ```

2. **Define MCP types** (45min) - `src/mcp/types.ts`

   ```typescript
   // MCP Protocol Types
   export interface MCPRequest {
     id: string;
     method: string;
     params?: Record<string, unknown>;
   }

   export interface MCPResponse {
     id: string;
     result?: unknown;
     error?: MCPError;
   }

   export interface MCPError {
     code: number;
     message: string;
     data?: unknown;
   }

   // Tool Types
   export interface MCPTool {
     name: string;
     description: string;
     inputSchema: JSONSchema;
     handler: (params: unknown) => Promise<unknown>;
   }

   export interface JSONSchema {
     type: string;
     properties?: Record<string, unknown>;
     required?: string[];
   }

   // Server Config
   export interface MCPServerConfig {
     name: string;
     version: string;
     capabilities: string[];
   }
   ```

3. **Create base transport interface** (30min) - `src/mcp/transport/base.ts`

   ```typescript
   export abstract class BaseTransport {
     abstract send(message: MCPResponse): Promise<void>;
     abstract receive(): Promise<MCPRequest>;
     abstract close(): Promise<void>;
   }
   ```

4. **Implement stdio transport** (1h 30min) - `src/mcp/transport/stdio.ts`

   ```typescript
   export class StdioTransport extends BaseTransport {
     private reader: ReadableStreamDefaultReader;
     private writer: WritableStreamDefaultWriter;

     async send(message: MCPResponse): Promise<void> {
       // Write JSON-RPC message to stdout
       const json = JSON.stringify(message);
       await this.writer.write(`${json}\n`);
     }

     async receive(): Promise<MCPRequest> {
       // Read JSON-RPC message from stdin
       const line = await this.readLine();
       return JSON.parse(line);
     }

     async close(): Promise<void> {
       await this.writer.close();
       await this.reader.cancel();
     }

     private async readLine(): Promise<string> {
       // Read until \n character
     }
   }
   ```

5. **Add error handling utilities** (30min)
   ```typescript
   export class MCPErrorHandler {
     static createError(code: number, message: string, data?: unknown): MCPError;
     static isValidRequest(req: unknown): req is MCPRequest;
     static sanitizeParams(params: unknown): Record<string, unknown>;
   }
   ```

**Deliverables**:

- ✅ Type-safe MCP protocol implementation
- ✅ Stdio transport (Claude Code compatible)
- ✅ Error handling framework

**Validation**:

```bash
bun test src/mcp/transport/stdio.test.ts
```

---

### Task 1.2: MCP Server Core (4 hours)

**Objective**: Implement the main server class with tool registration and request routing.

**Atomic Tasks**:

1. **Create MCPServer class** (2h) - `src/mcp/server.ts`

   ```typescript
   export class MCPServer {
     private tools: Map<string, MCPTool> = new Map();
     private transport: BaseTransport;
     private config: MCPServerConfig;

     constructor(config: MCPServerConfig, transport: BaseTransport) {
       this.config = config;
       this.transport = transport;
     }

     registerTool(tool: MCPTool): void {
       this.tools.set(tool.name, tool);
     }

     async start(): Promise<void> {
       // Main event loop
       while (true) {
         const request = await this.transport.receive();
         const response = await this.handleRequest(request);
         await this.transport.send(response);
       }
     }

     private async handleRequest(req: MCPRequest): Promise<MCPResponse> {
       try {
         if (req.method === 'tools/list') {
           return this.listTools(req.id);
         } else if (req.method === 'tools/call') {
           return await this.callTool(req.id, req.params);
         } else {
           throw new Error(`Unknown method: ${req.method}`);
         }
       } catch (error) {
         return this.errorResponse(req.id, error);
       }
     }

     private listTools(id: string): MCPResponse {
       const tools = Array.from(this.tools.values()).map((t) => ({
         name: t.name,
         description: t.description,
         inputSchema: t.inputSchema,
       }));
       return { id, result: { tools } };
     }

     private async callTool(id: string, params: unknown): Promise<MCPResponse> {
       const { name, arguments: args } = params as { name: string; arguments: unknown };
       const tool = this.tools.get(name);
       if (!tool) throw new Error(`Tool not found: ${name}`);

       const result = await tool.handler(args);
       return { id, result };
     }

     private errorResponse(id: string, error: unknown): MCPResponse {
       return {
         id,
         error: {
           code: -32603,
           message: error instanceof Error ? error.message : 'Internal error',
         },
       };
     }
   }
   ```

2. **Add logging integration** (30min)

   ```typescript
   import { Logger } from '../observability/logger';

   export class MCPServer {
     private logger: Logger;

     logToolCall(toolName: string, duration: number, success: boolean) {
       this.logger.info('Tool called', {
         tool: toolName,
         duration,
         success,
       });
     }
   }
   ```

3. **Add metrics tracking** (30min)

   ```typescript
   import { MetricsCollector } from '../observability/metrics';

   export class MCPServer {
     private metrics: MetricsCollector;

     trackToolCall(toolName: string, duration: number) {
       this.metrics.increment('mcp.tool.calls', { tool: toolName });
       this.metrics.histogram('mcp.tool.duration', duration, { tool: toolName });
     }
   }
   ```

4. **Add graceful shutdown** (1h)

   ```typescript
   export class MCPServer {
     private running = false;

     async start(): Promise<void> {
       this.running = true;

       // Handle SIGINT/SIGTERM
       process.on('SIGINT', () => this.shutdown());
       process.on('SIGTERM', () => this.shutdown());

       while (this.running) {
         // Event loop
       }
     }

     async shutdown(): Promise<void> {
       this.running = false;
       await this.transport.close();
       await this.logger.close();
       process.exit(0);
     }
   }
   ```

**Deliverables**:

- ✅ Fully functional MCP server
- ✅ Tool registration system
- ✅ Request routing
- ✅ Observability integration
- ✅ Graceful shutdown

**Validation**:

```bash
bun test src/mcp/server.test.ts
```

---

### Task 1.3: CLI Entry Point (2 hours)

**Objective**: Create executable for running the MCP server.

**Atomic Tasks**:

1. **Create entry point script** (1h) - `bin/vibesec-mcp`

   ```typescript
   #!/usr/bin/env bun
   import { MCPServer } from '../src/mcp/server';
   import { StdioTransport } from '../src/mcp/transport/stdio';
   import { initSentryFromEnv } from '../src/observability/integrations/sentry';
   import { Logger } from '../src/observability/logger';

   // Initialize observability
   initSentryFromEnv();
   const logger = new Logger('vibesec-mcp');

   // Create server
   const server = new MCPServer(
     {
       name: 'vibesec',
       version: process.env.VIBESEC_VERSION || '1.0.0',
       capabilities: ['tools'],
     },
     new StdioTransport()
   );

   // Register tools (Phase 2)
   // await registerTools(server);

   // Start server
   logger.info('Starting VibeSec MCP Server');
   await server.start();
   ```

2. **Add to package.json** (15min)

   ```json
   {
     "bin": {
       "vibesec": "./dist/cli/index.js",
       "vibesec-mcp": "./bin/vibesec-mcp"
     },
     "scripts": {
       "mcp": "bun run bin/vibesec-mcp"
     }
   }
   ```

3. **Create example .mcp.json** (15min) - `docs/examples/mcp-config.json`

   ```json
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

4. **Write installation docs** (30min) - `docs/MCP_INSTALLATION.md`
   - How to install globally
   - How to configure in Claude Code
   - How to configure in Cursor
   - Troubleshooting guide

**Deliverables**:

- ✅ Executable MCP server binary
- ✅ npm run script
- ✅ Configuration examples
- ✅ Installation documentation

**Validation**:

```bash
# Test stdio communication
echo '{"id":"1","method":"tools/list"}' | bun run mcp
```

---

### Task 1.4: Integration Testing Framework (6 hours)

**Objective**: Build testing infrastructure for MCP server and tools.

**Atomic Tasks**:

1. **Create MCP test client** (2h) - `tests/mcp/client.ts`

   ```typescript
   export class MCPTestClient {
     private server: ChildProcess;

     async start(): Promise<void> {
       this.server = spawn('bun', ['run', 'bin/vibesec-mcp']);
     }

     async callTool(name: string, args: unknown): Promise<unknown> {
       const id = crypto.randomUUID();
       const request = {
         id,
         method: 'tools/call',
         params: { name, arguments: args },
       };

       this.server.stdin.write(JSON.stringify(request) + '\n');
       const response = await this.readResponse(id);
       return response.result;
     }

     async listTools(): Promise<MCPTool[]> {
       // Similar to callTool
     }

     async stop(): Promise<void> {
       this.server.kill();
     }
   }
   ```

2. **Create test fixtures** (1h)

   ```typescript
   // tests/mcp/fixtures/vulnerable-code.ts
   export const VULNERABLE_CODE = {
     sqlInjection: `const query = "SELECT * FROM users WHERE id=" + userId;`,
     xss: `element.innerHTML = userInput;`,
     commandInjection: `exec(userCommand);`,
   };

   export const SECURE_CODE = {
     sqlInjection: `const query = db.prepare("SELECT * FROM users WHERE id=?");`,
     xss: `element.textContent = userInput;`,
     commandInjection: `execFile(command, [arg1, arg2]);`,
   };
   ```

3. **Write server lifecycle tests** (1h) - `tests/mcp/server.test.ts`

   ```typescript
   describe('MCP Server', () => {
     test('starts and responds to tools/list', async () => {
       const client = new MCPTestClient();
       await client.start();

       const tools = await client.listTools();
       expect(tools.length).toBeGreaterThan(0);

       await client.stop();
     });

     test('handles invalid requests gracefully', async () => {
       // Test error handling
     });

     test('shuts down cleanly on SIGTERM', async () => {
       // Test graceful shutdown
     });
   });
   ```

4. **Write transport tests** (1h) - `tests/mcp/transport/stdio.test.ts`

   ```typescript
   describe('Stdio Transport', () => {
     test('reads JSON-RPC messages from stdin', async () => {
       // Mock stdin
     });

     test('writes JSON-RPC messages to stdout', async () => {
       // Mock stdout
     });

     test('handles malformed JSON', async () => {
       // Error handling
     });
   });
   ```

5. **Setup performance benchmarks** (1h)
   ```typescript
   describe('MCP Performance', () => {
     test('tool call overhead <200ms', async () => {
       const start = performance.now();
       await client.callTool('vibesec_scan', { files: ['test.ts'] });
       const duration = performance.now() - start;
       expect(duration).toBeLessThan(200);
     });
   });
   ```

**Deliverables**:

- ✅ MCP test client
- ✅ Test fixtures
- ✅ Server lifecycle tests
- ✅ Transport tests
- ✅ Performance benchmarks

**Validation**:

```bash
bun test tests/mcp/
```

---

## Phase 2: Basic Tools (16 hours)

### Task 2.1: vibesec_scan Tool (10 hours)

**Objective**: Implement the core scanning tool that AI assistants can call.

**Atomic Tasks**:

1. **Define tool schema** (30min) - `src/mcp/tools/scan.ts`

   ```typescript
   export const SCAN_TOOL_SCHEMA: MCPTool = {
     name: 'vibesec_scan',
     description: 'Scan code files for security vulnerabilities using VibeSec',
     inputSchema: {
       type: 'object',
       properties: {
         files: {
           type: 'array',
           items: { type: 'string' },
           description: 'Paths to files to scan (relative or absolute)',
         },
         rules: {
           type: 'array',
           items: { type: 'string' },
           description: 'Optional: specific rule IDs to check',
           optional: true,
         },
         severity: {
           type: 'string',
           enum: ['critical', 'high', 'medium', 'low', 'info'],
           description: 'Optional: minimum severity level',
           optional: true,
         },
         incremental: {
           type: 'boolean',
           description: 'Optional: only scan changed files (git diff)',
           optional: true,
         },
         format: {
           type: 'string',
           enum: ['json', 'text', 'sarif'],
           description: 'Optional: output format',
           optional: true,
         },
       },
       required: ['files'],
     },
     handler: handleScan,
   };
   ```

2. **Implement scan handler** (3h)

   ```typescript
   async function handleScan(params: unknown): Promise<ScanResult> {
     const args = validateScanParams(params);

     // Initialize scanner with existing engine
     const engine = new ScanEngine(await loadConfig());

     // Apply filters
     let filesToScan = args.files;
     if (args.incremental) {
       filesToScan = await filterChangedFiles(filesToScan);
     }

     // Run scan
     const findings = await engine.scanFiles(filesToScan);

     // Apply severity filter
     const filteredFindings = args.severity
       ? findings.filter((f) => severityLevel(f.severity) >= severityLevel(args.severity))
       : findings;

     // Apply rule filter
     const ruleFilteredFindings = args.rules
       ? filteredFindings.filter((f) => args.rules.includes(f.ruleId))
       : filteredFindings;

     // Calculate score
     const score = calculateSecurityScore(ruleFilteredFindings);

     // Format result
     return {
       findings: ruleFilteredFindings,
       score,
       summary: {
         total: ruleFilteredFindings.length,
         bySeverity: groupBySeverity(ruleFilteredFindings),
         byCategory: groupByCategory(ruleFilteredFindings),
       },
       status: ruleFilteredFindings.length === 0 ? 'SECURE' : 'VULNERABLE',
       scannedFiles: filesToScan.length,
       timestamp: new Date().toISOString(),
     };
   }
   ```

3. **Add result formatting** (1h)

   ```typescript
   function formatScanResult(findings: Finding[], format: string): unknown {
     switch (format) {
       case 'json':
         return { findings };
       case 'text':
         return formatTextReport(findings);
       case 'sarif':
         return convertToSARIF(findings);
       default:
         return { findings };
     }
   }
   ```

4. **Implement incremental scanning support** (2h)

   ```typescript
   async function filterChangedFiles(files: string[]): Promise<string[]> {
     // Use existing IncrementalScanner
     const scanner = new IncrementalScanner();
     const changedFiles = await scanner.getChangedFiles();
     return files.filter((f) => changedFiles.includes(f));
   }
   ```

5. **Add caching** (1h 30min)

   ```typescript
   export class ScanCache {
     private cache = new Map<string, CacheEntry>();

     async get(fileHash: string): Promise<Finding[] | null> {
       const entry = this.cache.get(fileHash);
       if (!entry || this.isExpired(entry)) return null;
       return entry.findings;
     }

     async set(fileHash: string, findings: Finding[]): Promise<void> {
       this.cache.set(fileHash, {
         findings,
         timestamp: Date.now(),
       });
     }
   }
   ```

6. **Add error handling** (1h)

   ```typescript
   async function handleScan(params: unknown): Promise<ScanResult> {
     try {
       // Scan logic
     } catch (error) {
       if (error instanceof ParseError) {
         throw new MCPError(-32001, 'Parse error', {
           file: error.file,
           message: error.message,
         });
       } else if (error instanceof ConfigError) {
         throw new MCPError(-32002, 'Config error', {
           message: error.message,
         });
       } else {
         throw new MCPError(-32603, 'Internal error', {
           message: error instanceof Error ? error.message : 'Unknown error',
         });
       }
     }
   }
   ```

7. **Write tests** (1h)

   ```typescript
   describe('vibesec_scan', () => {
     test('scans files and returns findings', async () => {
       const result = await client.callTool('vibesec_scan', {
         files: ['tests/fixtures/vulnerable/sql-injection.js'],
       });

       expect(result.findings.length).toBeGreaterThan(0);
       expect(result.status).toBe('VULNERABLE');
     });

     test('filters by severity', async () => {
       const result = await client.callTool('vibesec_scan', {
         files: ['tests/fixtures/vulnerable/'],
         severity: 'high',
       });

       expect(result.findings.every((f) => ['critical', 'high'].includes(f.severity))).toBe(true);
     });

     test('incremental scan only checks changed files', async () => {
       // Test incremental mode
     });
   });
   ```

**Deliverables**:

- ✅ vibesec_scan tool fully functional
- ✅ Support for all filtering options
- ✅ Caching for performance
- ✅ Comprehensive error handling
- ✅ Unit tests

**Validation**:

```bash
bun test src/mcp/tools/scan.test.ts
```

---

### Task 2.2: vibesec_list_rules Tool (6 hours)

**Objective**: Allow AI to discover available detection rules.

**Atomic Tasks**:

1. **Define tool schema** (30min)

   ```typescript
   export const LIST_RULES_TOOL_SCHEMA: MCPTool = {
     name: 'vibesec_list_rules',
     description: 'List available security detection rules and categories',
     inputSchema: {
       type: 'object',
       properties: {
         category: {
           type: 'string',
           description: 'Optional: filter by category (injection, auth, etc.)',
           optional: true,
         },
         severity: {
           type: 'string',
           enum: ['critical', 'high', 'medium', 'low', 'info'],
           description: 'Optional: filter by minimum severity',
           optional: true,
         },
         language: {
           type: 'string',
           description: 'Optional: filter by language (javascript, python, etc.)',
           optional: true,
         },
       },
       required: [],
     },
     handler: handleListRules,
   };
   ```

2. **Implement rules loader** (2h)

   ```typescript
   async function handleListRules(params: unknown): Promise<RulesListResult> {
     const args = validateListRulesParams(params);

     // Load all rules using existing RuleLoader
     const ruleLoader = new RuleLoader();
     let rules = await ruleLoader.loadAllRules();

     // Apply filters
     if (args.category) {
       rules = rules.filter((r) => r.category === args.category);
     }

     if (args.severity) {
       const minLevel = severityLevel(args.severity);
       rules = rules.filter((r) => severityLevel(r.severity) >= minLevel);
     }

     if (args.language) {
       rules = rules.filter((r) => r.languages?.includes(args.language) || !r.languages);
     }

     // Group by category
     const categories = Array.from(new Set(rules.map((r) => r.category || 'other')));
     const byCategory = categories.reduce(
       (acc, cat) => {
         acc[cat] = rules.filter((r) => (r.category || 'other') === cat);
         return acc;
       },
       {} as Record<string, Rule[]>
     );

     return {
       rules: rules.map(formatRuleInfo),
       categories,
       totalRules: rules.length,
       byCategory: Object.entries(byCategory).reduce(
         (acc, [cat, rules]) => {
           acc[cat] = rules.length;
           return acc;
         },
         {} as Record<string, number>
       ),
     };
   }

   function formatRuleInfo(rule: Rule): RuleInfo {
     return {
       id: rule.id,
       name: rule.name,
       severity: rule.severity,
       category: rule.category,
       description: rule.description,
       languages: rule.languages,
       cwe: rule.cwe,
       owasp: rule.owasp,
     };
   }
   ```

3. **Add caching for rules** (1h)

   ```typescript
   class RulesCache {
     private cache: Rule[] | null = null;
     private lastLoaded: number = 0;
     private TTL = 60000; // 1 minute

     async getRules(): Promise<Rule[]> {
       if (this.cache && Date.now() - this.lastLoaded < this.TTL) {
         return this.cache;
       }

       const loader = new RuleLoader();
       this.cache = await loader.loadAllRules();
       this.lastLoaded = Date.now();
       return this.cache;
     }

     invalidate(): void {
       this.cache = null;
     }
   }
   ```

4. **Add search functionality** (1h 30min)

   ```typescript
   interface ListRulesParams {
     category?: string;
     severity?: string;
     language?: string;
     search?: string; // NEW: text search
   }

   async function handleListRules(params: unknown): Promise<RulesListResult> {
     // ... existing logic

     // Add text search
     if (args.search) {
       const searchLower = args.search.toLowerCase();
       rules = rules.filter(
         (r) =>
           r.id.toLowerCase().includes(searchLower) ||
           r.name.toLowerCase().includes(searchLower) ||
           r.description?.toLowerCase().includes(searchLower)
       );
     }

     // ... rest of logic
   }
   ```

5. **Write tests** (1h)

   ```typescript
   describe('vibesec_list_rules', () => {
     test('lists all rules', async () => {
       const result = await client.callTool('vibesec_list_rules', {});
       expect(result.totalRules).toBeGreaterThan(0);
       expect(result.categories.length).toBeGreaterThan(0);
     });

     test('filters by category', async () => {
       const result = await client.callTool('vibesec_list_rules', {
         category: 'injection',
       });
       expect(result.rules.every((r) => r.category === 'injection')).toBe(true);
     });

     test('filters by severity', async () => {
       const result = await client.callTool('vibesec_list_rules', {
         severity: 'high',
       });
       expect(result.rules.every((r) => ['critical', 'high'].includes(r.severity))).toBe(true);
     });

     test('searches by text', async () => {
       const result = await client.callTool('vibesec_list_rules', {
         search: 'sql',
       });
       expect(
         result.rules.every(
           (r) =>
             r.id.includes('sql') ||
             r.name.toLowerCase().includes('sql') ||
             r.description?.toLowerCase().includes('sql')
         )
       ).toBe(true);
     });
   });
   ```

**Deliverables**:

- ✅ vibesec_list_rules tool
- ✅ Filtering by category, severity, language
- ✅ Text search functionality
- ✅ Caching for performance
- ✅ Unit tests

**Validation**:

```bash
bun test src/mcp/tools/list-rules.test.ts
```

---

## Phase 3: Advanced Tools (12 hours)

### Task 3.1: vibesec_fix_suggestion Tool (4 hours)

**Objective**: Provide AI-friendly fix recommendations for vulnerabilities.

**Atomic Tasks**:

1. **Define tool schema** (30min)

   ```typescript
   export const FIX_SUGGESTION_TOOL_SCHEMA: MCPTool = {
     name: 'vibesec_fix_suggestion',
     description: 'Get specific fix recommendations for a vulnerability',
     inputSchema: {
       type: 'object',
       properties: {
         finding: {
           type: 'object',
           description: 'The vulnerability finding to get a fix for',
           properties: {
             ruleId: { type: 'string' },
             filePath: { type: 'string' },
             line: { type: 'number' },
             message: { type: 'string' },
           },
           required: ['ruleId', 'filePath', 'line'],
         },
         context: {
           type: 'string',
           description: 'Optional: surrounding code context',
           optional: true,
         },
       },
       required: ['finding'],
     },
     handler: handleFixSuggestion,
   };
   ```

2. **Create fix template system** (1h 30min)

   ```typescript
   // src/mcp/tools/fix-templates.ts
   export const FIX_TEMPLATES: Record<string, FixTemplate> = {
     'sql-injection': {
       recommendation: 'Use parameterized queries instead of string concatenation',
       codeExample: {
         vulnerable: `const query = "SELECT * FROM users WHERE id=" + userId;`,
         fixed: `const query = db.prepare("SELECT * FROM users WHERE id=?");\nconst result = query.get(userId);`,
       },
       difficulty: 'easy',
       references: [
         'https://owasp.org/www-community/attacks/SQL_Injection',
         'https://cwe.mitre.org/data/definitions/89.html',
       ],
     },
     xss: {
       recommendation: 'Use textContent or sanitize with DOMPurify instead of innerHTML',
       codeExample: {
         vulnerable: `element.innerHTML = userInput;`,
         fixed: `element.textContent = userInput;\n// Or: element.innerHTML = DOMPurify.sanitize(userInput);`,
       },
       difficulty: 'easy',
       references: [
         'https://owasp.org/www-project-top-ten/2017/A7_2017-Cross-Site_Scripting_(XSS)',
         'https://cwe.mitre.org/data/definitions/79.html',
       ],
     },
     // ... more templates
   };
   ```

3. **Implement AI-friendly fix suggestions** (1h 30min)

   ```typescript
   async function handleFixSuggestion(params: unknown): Promise<FixSuggestionResult> {
     const args = validateFixSuggestionParams(params);
     const { finding, context } = args;

     // Get rule details
     const rule = await getRuleById(finding.ruleId);
     if (!rule) {
       throw new MCPError(-32001, 'Rule not found', { ruleId: finding.ruleId });
     }

     // Get fix template
     const template = FIX_TEMPLATES[finding.ruleId];

     // Generate context-aware recommendation
     let recommendation =
       template?.recommendation || rule.fixRecommendation || 'Review and fix this vulnerability';

     // If context provided, try to generate specific fix
     let specificFix = null;
     if (context && template?.codeExample) {
       specificFix = generateContextualFix(context, template);
     }

     return {
       recommendation,
       codeExample: template?.codeExample,
       specificFix,
       references: [
         ...(template?.references || []),
         ...(rule.cwe ? [`https://cwe.mitre.org/data/definitions/${rule.cwe}.html`] : []),
         ...(rule.owasp ? [`https://owasp.org/www-project-top-ten/`] : []),
       ],
       difficulty: template?.difficulty || 'medium',
       ruleDetails: {
         id: rule.id,
         name: rule.name,
         severity: rule.severity,
         category: rule.category,
       },
     };
   }

   function generateContextualFix(context: string, template: FixTemplate): string | null {
     // Use simple pattern matching to generate specific fix
     // This can be enhanced with AST analysis later
     try {
       const lines = context.split('\n');
       const vulnerableLine = lines.find((line) =>
         template.codeExample.vulnerable.includes(line.trim())
       );

       if (vulnerableLine) {
         return vulnerableLine.replace(template.codeExample.vulnerable, template.codeExample.fixed);
       }
     } catch {
       return null;
     }
     return null;
   }
   ```

4. **Write tests** (30min)

   ```typescript
   describe('vibesec_fix_suggestion', () => {
     test('provides fix for SQL injection', async () => {
       const result = await client.callTool('vibesec_fix_suggestion', {
         finding: {
           ruleId: 'sql-injection',
           filePath: 'src/api.ts',
           line: 42,
           message: 'SQL injection detected',
         },
       });

       expect(result.recommendation).toContain('parameterized');
       expect(result.codeExample).toBeDefined();
       expect(result.references.length).toBeGreaterThan(0);
     });

     test('generates context-aware fix when context provided', async () => {
       const context = `
         const userId = req.params.id;
         const query = "SELECT * FROM users WHERE id=" + userId;
         const user = await db.query(query);
       `;

       const result = await client.callTool('vibesec_fix_suggestion', {
         finding: {
           ruleId: 'sql-injection',
           filePath: 'src/api.ts',
           line: 2,
         },
         context,
       });

       expect(result.specificFix).toContain('db.prepare');
     });
   });
   ```

**Deliverables**:

- ✅ vibesec_fix_suggestion tool
- ✅ Fix template system
- ✅ Context-aware recommendations
- ✅ CWE/OWASP references
- ✅ Unit tests

---

### Task 3.2: vibesec_validate_fix Tool (4 hours)

**Objective**: Verify that AI-generated fixes actually resolve vulnerabilities.

**Atomic Tasks**:

1. **Define tool schema** (30min)

   ```typescript
   export const VALIDATE_FIX_TOOL_SCHEMA: MCPTool = {
     name: 'vibesec_validate_fix',
     description: 'Verify that modified code fixes the vulnerability',
     inputSchema: {
       type: 'object',
       properties: {
         originalCode: {
           type: 'string',
           description: 'Original vulnerable code',
         },
         fixedCode: {
           type: 'string',
           description: 'Modified code with attempted fix',
         },
         findingId: {
           type: 'string',
           description: 'ID of the finding being fixed',
         },
         ruleId: {
           type: 'string',
           description: 'ID of the rule that detected the vulnerability',
         },
       },
       required: ['originalCode', 'fixedCode', 'ruleId'],
     },
     handler: handleValidateFix,
   };
   ```

2. **Implement validation logic** (2h)

   ```typescript
   async function handleValidateFix(params: unknown): Promise<ValidateFixResult> {
     const args = validateFixParams(params);
     const { originalCode, fixedCode, ruleId } = args;

     // 1. Scan original code
     const originalFindings = await scanCodeSnippet(originalCode, ruleId);

     // 2. Scan fixed code
     const fixedFindings = await scanCodeSnippet(fixedCode, ruleId);

     // 3. Compare results
     const wasVulnerable = originalFindings.length > 0;
     const isNowSecure = fixedFindings.length === 0;
     const fixed = wasVulnerable && isNowSecure;

     // 4. Check for new issues
     const allFixedFindings = await scanCodeSnippet(fixedCode);
     const newIssues = allFixedFindings.filter(
       (f) => !originalFindings.some((of) => of.ruleId === f.ruleId)
     );

     // 5. Calculate score
     const originalScore = calculateSecurityScore(originalFindings);
     const fixedScore = calculateSecurityScore(fixedFindings);
     const improvement = fixedScore - originalScore;

     return {
       fixed,
       wasVulnerable,
       isNowSecure,
       remainingIssues: fixedFindings,
       newIssues,
       originalScore,
       fixedScore,
       improvement,
       recommendation: generateValidationRecommendation(fixed, newIssues, improvement),
     };
   }

   async function scanCodeSnippet(code: string, specificRuleId?: string): Promise<Finding[]> {
     // Create temp file
     const tempFile = `/tmp/vibesec-${crypto.randomUUID()}.tmp`;
     await writeFile(tempFile, code);

     try {
       // Scan with existing engine
       const engine = new ScanEngine(await loadConfig());
       const findings = await engine.scanFile(tempFile);

       // Filter to specific rule if provided
       return specificRuleId ? findings.filter((f) => f.ruleId === specificRuleId) : findings;
     } finally {
       // Cleanup
       await unlink(tempFile);
     }
   }

   function generateValidationRecommendation(
     fixed: boolean,
     newIssues: Finding[],
     improvement: number
   ): string {
     if (fixed && newIssues.length === 0) {
       return '✅ Fix successful! The vulnerability has been resolved and no new issues were introduced.';
     } else if (fixed && newIssues.length > 0) {
       return `⚠️ Vulnerability fixed, but ${newIssues.length} new issue(s) introduced. Please review.`;
     } else if (!fixed && improvement > 0) {
       return `📈 Partial improvement (security score +${improvement}), but the original vulnerability remains.`;
     } else {
       return '❌ Fix unsuccessful. The vulnerability persists. Try a different approach.';
     }
   }
   ```

3. **Add diff visualization** (1h)

   ```typescript
   import * as diff from 'diff';

   function generateCodeDiff(originalCode: string, fixedCode: string): string {
     const changes = diff.createPatch('code', originalCode, fixedCode);
     return changes;
   }

   // Add to result:
   return {
     // ... existing fields
     diff: generateCodeDiff(originalCode, fixedCode),
   };
   ```

4. **Write tests** (30min)

   ```typescript
   describe('vibesec_validate_fix', () => {
     test('validates successful SQL injection fix', async () => {
       const originalCode = `const query = "SELECT * FROM users WHERE id=" + userId;`;
       const fixedCode = `const query = db.prepare("SELECT * FROM users WHERE id=?");`;

       const result = await client.callTool('vibesec_validate_fix', {
         originalCode,
         fixedCode,
         ruleId: 'sql-injection',
       });

       expect(result.fixed).toBe(true);
       expect(result.isNowSecure).toBe(true);
       expect(result.newIssues.length).toBe(0);
     });

     test('detects incomplete fix', async () => {
       const originalCode = `element.innerHTML = userInput;`;
       const fixedCode = `element.innerHTML = sanitize(userInput); // Not using proper library`;

       const result = await client.callTool('vibesec_validate_fix', {
         originalCode,
         fixedCode,
         ruleId: 'xss',
       });

       expect(result.fixed).toBe(false);
     });

     test('detects new issues introduced by fix', async () => {
       const originalCode = `const x = eval(input);`;
       const fixedCode = `const x = Function(input)(); // Still dangerous!`;

       const result = await client.callTool('vibesec_validate_fix', {
         originalCode,
         fixedCode,
         ruleId: 'command-injection',
       });

       expect(result.newIssues.length).toBeGreaterThan(0);
     });
   });
   ```

**Deliverables**:

- ✅ vibesec_validate_fix tool
- ✅ Code snippet scanning
- ✅ Diff visualization
- ✅ New issue detection
- ✅ Unit tests

---

### Task 3.3: vibesec_init_config Tool (4 hours)

**Objective**: Generate project configuration automatically.

**Atomic Tasks**:

1. **Define tool schema** (30min)

   ```typescript
   export const INIT_CONFIG_TOOL_SCHEMA: MCPTool = {
     name: 'vibesec_init_config',
     description: 'Generate .vibesec.yaml configuration for a project',
     inputSchema: {
       type: 'object',
       properties: {
         projectPath: {
           type: 'string',
           description: 'Path to project root',
         },
         languages: {
           type: 'array',
           items: { type: 'string' },
           description: 'Optional: languages to scan (auto-detected if not provided)',
           optional: true,
         },
         framework: {
           type: 'string',
           description: 'Optional: framework (react, vue, express, etc.)',
           optional: true,
         },
         strictMode: {
           type: 'boolean',
           description: 'Optional: enable strict mode (fail on any finding)',
           optional: true,
         },
       },
       required: ['projectPath'],
     },
     handler: handleInitConfig,
   };
   ```

2. **Implement project detection** (1h 30min)

   ```typescript
   async function handleInitConfig(params: unknown): Promise<InitConfigResult> {
     const args = validateInitConfigParams(params);
     const { projectPath, languages, framework, strictMode } = args;

     // Detect project type
     const detectedLanguages = languages || (await detectProjectLanguages(projectPath));
     const detectedFramework = framework || (await detectFramework(projectPath));

     // Generate config
     const config = await generateConfig({
       languages: detectedLanguages,
       framework: detectedFramework,
       strictMode: strictMode || false,
     });

     // Get recommended rules
     const recommendedRules = await getRecommendedRules(detectedLanguages, detectedFramework);

     return {
       config: yaml.dump(config),
       detectedLanguages,
       detectedFramework,
       recommendedRules: recommendedRules.length,
       configPath: join(projectPath, '.vibesec.yaml'),
     };
   }

   async function detectProjectLanguages(projectPath: string): Promise<string[]> {
     const languages: string[] = [];

     if (await exists(join(projectPath, 'package.json'))) {
       languages.push('javascript', 'typescript');
     }
     if (
       (await exists(join(projectPath, 'requirements.txt'))) ||
       (await exists(join(projectPath, 'pyproject.toml')))
     ) {
       languages.push('python');
     }
     if (await exists(join(projectPath, 'go.mod'))) {
       languages.push('go');
     }
     if (await exists(join(projectPath, 'Cargo.toml'))) {
       languages.push('rust');
     }

     return languages;
   }

   async function detectFramework(projectPath: string): Promise<string | null> {
     try {
       const packageJson = await readFile(join(projectPath, 'package.json'), 'utf-8');
       const pkg = JSON.parse(packageJson);
       const deps = { ...pkg.dependencies, ...pkg.devDependencies };

       if (deps.react) return 'react';
       if (deps.vue) return 'vue';
       if (deps['@angular/core']) return 'angular';
       if (deps.express) return 'express';
       if (deps.fastify) return 'fastify';
       if (deps.next) return 'nextjs';

       return null;
     } catch {
       return null;
     }
   }
   ```

3. **Create config templates** (1h)

   ```typescript
   async function generateConfig(options: ConfigOptions): Promise<VibeSec Configuration> {
     const baseConfig = {
       version: '1.0',
       scan: {
         include: ['src/**/*', 'lib/**/*'],
         exclude: ['node_modules/**', 'dist/**', 'build/**', '*.test.*'],
         languages: options.languages
       },
       rules: {
         enabled: true,
         severity: options.strictMode ? 'low' : 'medium'
       },
       output: {
         format: 'text',
         verbose: false
       }
     };

     // Add framework-specific config
     if (options.framework) {
       baseConfig.scan.framework = options.framework;

       // Framework-specific excludes
       if (options.framework === 'nextjs') {
         baseConfig.scan.exclude.push('.next/**');
       } else if (options.framework === 'react') {
         baseConfig.scan.include.push('public/**/*.html');
       }
     }

     return baseConfig;
   }
   ```

4. **Write tests** (1h)

   ```typescript
   describe('vibesec_init_config', () => {
     test('detects Node.js project', async () => {
       const result = await client.callTool('vibesec_init_config', {
         projectPath: '/path/to/node-project',
       });

       expect(result.detectedLanguages).toContain('javascript');
       expect(result.detectedLanguages).toContain('typescript');
       expect(result.config).toContain('version: ');
     });

     test('detects React framework', async () => {
       const result = await client.callTool('vibesec_init_config', {
         projectPath: '/path/to/react-app',
       });

       expect(result.detectedFramework).toBe('react');
     });

     test('generates strict mode config', async () => {
       const result = await client.callTool('vibesec_init_config', {
         projectPath: '/path/to/project',
         strictMode: true,
       });

       const config = yaml.parse(result.config);
       expect(config.rules.severity).toBe('low');
     });
   });
   ```

**Deliverables**:

- ✅ vibesec_init_config tool
- ✅ Project type detection
- ✅ Framework detection
- ✅ Config templates
- ✅ Unit tests

---

## Phase 4: Testing & Documentation (4 hours)

### Task 4.1: Integration Testing (2 hours)

**Objective**: End-to-end testing of MCP server with real AI assistant workflows.

**Atomic Tasks**:

1. **Create workflow tests** (1h)

   ```typescript
   describe('MCP Workflows', () => {
     test('AI generates code → scans → gets fix → validates', async () => {
       const client = new MCPTestClient();
       await client.start();

       // 1. AI generates vulnerable code
       const vulnerableCode = `const query = "SELECT * FROM users WHERE id=" + userId;`;
       await writeFile('test-file.js', vulnerableCode);

       // 2. Scan the code
       const scanResult = await client.callTool('vibesec_scan', {
         files: ['test-file.js'],
       });
       expect(scanResult.findings.length).toBeGreaterThan(0);

       // 3. Get fix suggestion
       const fixSuggestion = await client.callTool('vibesec_fix_suggestion', {
         finding: scanResult.findings[0],
       });
       expect(fixSuggestion.codeExample).toBeDefined();

       // 4. Apply fix
       const fixedCode = `const query = db.prepare("SELECT * FROM users WHERE id=?");`;

       // 5. Validate fix
       const validation = await client.callTool('vibesec_validate_fix', {
         originalCode: vulnerableCode,
         fixedCode,
         ruleId: scanResult.findings[0].ruleId,
       });
       expect(validation.fixed).toBe(true);

       await client.stop();
     });
   });
   ```

2. **Performance testing** (1h)

   ```typescript
   describe('MCP Performance', () => {
     test('scan 100 files <5s', async () => {
       const files = Array(100)
         .fill(0)
         .map((_, i) => `test-${i}.js`);

       const start = performance.now();
       await client.callTool('vibesec_scan', { files });
       const duration = performance.now() - start;

       expect(duration).toBeLessThan(5000);
     });

     test('tool call overhead <200ms', async () => {
       const calls = 10;
       const durations: number[] = [];

       for (let i = 0; i < calls; i++) {
         const start = performance.now();
         await client.callTool('vibesec_list_rules', {});
         durations.push(performance.now() - start);
       }

       const avgOverhead = durations.reduce((a, b) => a + b) / calls;
       expect(avgOverhead).toBeLessThan(200);
     });
   });
   ```

---

### Task 4.2: Documentation (2 hours)

**Objective**: Comprehensive user and developer documentation.

**Atomic Tasks**:

1. **User guide** (1h) - `docs/MCP_USER_GUIDE.md`
   - Installation instructions
   - Configuration examples
   - Usage with Claude Code
   - Usage with Cursor
   - Troubleshooting

2. **API reference** (30min) - `docs/MCP_API_REFERENCE.md`
   - All 5 tools documented
   - Input/output schemas
   - Examples for each tool
   - Error codes

3. **Developer guide** (30min) - `docs/MCP_DEVELOPER_GUIDE.md`
   - How to add new tools
   - Testing guidelines
   - Performance best practices
   - Contributing guidelines

**Deliverables**:

- ✅ Complete integration tests
- ✅ Performance benchmarks
- ✅ User documentation
- ✅ API reference
- ✅ Developer guide

---

## Success Criteria

### Technical

- [ ] All 5 MCP tools functional
- [ ] Tool call overhead <200ms
- [ ] Scan 100 files in <5s
- [ ] 100% test coverage for tools
- [ ] 0 crashes on invalid input

### Functional

- [ ] Claude Code integration working
- [ ] AI can scan, fix, and validate automatically
- [ ] Error messages are clear and actionable
- [ ] Documentation is comprehensive

### User Experience

- [ ] Installation takes <5 minutes
- [ ] First scan completes in <30 seconds
- [ ] Fix suggestions are actionable
- [ ] Validation gives clear feedback

---

## Deliverables Checklist

### Code

- [ ] `src/mcp/server.ts` - Main MCP server
- [ ] `src/mcp/types.ts` - Type definitions
- [ ] `src/mcp/transport/stdio.ts` - Stdio transport
- [ ] `src/mcp/tools/scan.ts` - vibesec_scan
- [ ] `src/mcp/tools/list-rules.ts` - vibesec_list_rules
- [ ] `src/mcp/tools/fix-suggestion.ts` - vibesec_fix_suggestion
- [ ] `src/mcp/tools/validate-fix.ts` - vibesec_validate_fix
- [ ] `src/mcp/tools/init-config.ts` - vibesec_init_config
- [ ] `bin/vibesec-mcp` - MCP server executable

### Tests

- [ ] `tests/mcp/server.test.ts` - Server tests
- [ ] `tests/mcp/transport/stdio.test.ts` - Transport tests
- [ ] `tests/mcp/tools/*.test.ts` - Tool tests (5 files)
- [ ] `tests/mcp/integration/workflows.test.ts` - Integration tests
- [ ] `tests/mcp/performance/benchmarks.test.ts` - Performance tests

### Documentation

- [ ] `docs/MCP_INSTALLATION.md` - Installation guide
- [ ] `docs/MCP_USER_GUIDE.md` - User guide
- [ ] `docs/MCP_API_REFERENCE.md` - API reference
- [ ] `docs/MCP_DEVELOPER_GUIDE.md` - Developer guide
- [ ] `docs/MCP_SERVER_PROPOSAL.md` - (Already created)
- [ ] `README.md` updated with MCP info

### Configuration

- [ ] `.mcp.json.example` - Example config
- [ ] `package.json` updated with bin entry
- [ ] GitHub issue created
- [ ] PROJECT_STATUS.md updated

---

## Risk Mitigation

### Risk 1: Performance Overhead

**Mitigation**: Implement aggressive caching, incremental scanning, streaming results

### Risk 2: Complex Error Handling

**Mitigation**: Comprehensive error codes, clear error messages, detailed logging

### Risk 3: AI Integration Complexity

**Mitigation**: Start with Claude Code (simplest), document thoroughly, provide examples

---

## Timeline

| Day | Hours | Tasks                                        |
| --- | ----- | -------------------------------------------- |
| 1   | 8h    | Phase 1.1-1.2: MCP infrastructure            |
| 2   | 8h    | Phase 1.3-1.4: CLI entry + testing           |
| 3   | 8h    | Phase 2.1: vibesec_scan tool                 |
| 4   | 8h    | Phase 2.2 + 3.1: list_rules + fix_suggestion |
| 5   | 8h    | Phase 3.2-3.3: validate_fix + init_config    |
| 6   | 8h    | Phase 4: Integration testing + docs          |

**Total: 48 hours over 6 working days**

---

**Status**: READY FOR IMPLEMENTATION
**Next Step**: Create GitHub issue and begin Phase 1

**Last Updated**: 2025-10-17
