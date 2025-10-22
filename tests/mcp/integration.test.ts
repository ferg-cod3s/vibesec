/**
 * End-to-end integration tests for VibeSec MCP Server
 *
 * Tests the complete MCP server workflow:
 * 1. Server initialization
 * 2. Tool registration
 * 3. Tool discovery (tools/list)
 * 4. Tool execution (tools/call)
 */

import { MCPServer } from '../../src/mcp/server';
import { BaseTransport } from '../../src/mcp/transport/base';
import { MCPRequest, MCPResponse, MCPNotification } from '../../src/mcp/types';
import { vibesecScanTool } from '../../src/mcp/tools/scan';
import { vibesecListRulesTool } from '../../src/mcp/tools/list-rules';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

/**
 * Mock transport for testing
 * Simulates MCP communication without actual stdio
 */
class MockTransport extends BaseTransport {
  private requestQueue: MCPRequest[] = [];
  private responseQueue: Array<MCPResponse | MCPNotification> = [];

  /**
   * Queue a request to be processed
   */
  queueRequest(request: MCPRequest): void {
    this.requestQueue.push(request);
  }

  /**
   * Get the last response sent
   */
  getLastResponse(): MCPResponse | MCPNotification | undefined {
    return this.responseQueue[this.responseQueue.length - 1];
  }

  /**
   * Get all responses
   */
  getAllResponses(): Array<MCPResponse | MCPNotification> {
    return [...this.responseQueue];
  }

  /**
   * Clear response queue
   */
  clearResponses(): void {
    this.responseQueue = [];
  }

  async send(message: MCPResponse | MCPNotification): Promise<void> {
    this.responseQueue.push(message);
  }

  async receive(): Promise<MCPRequest> {
    if (this.requestQueue.length === 0) {
      throw new Error('No requests in queue');
    }
    return this.requestQueue.shift()!;
  }

  async close(): Promise<void> {
    this.running = false;
    this.requestQueue = [];
    this.responseQueue = [];
  }
}

describe('MCP Server End-to-End Integration', () => {
  const testDir = join(process.cwd(), 'tests', 'mcp', 'fixtures', 'integration-test');

  describe('Server Lifecycle', () => {
    it('should initialize and register tools', async () => {
      const transport = new MockTransport();
      const config = {
        name: 'vibesec-test',
        version: '1.0.0',
        capabilities: ['tools' as const],
      };

      const server = new MCPServer(config, transport);

      // Register tools
      server.registerTool(vibesecScanTool);
      server.registerTool(vibesecListRulesTool);

      expect(server.getTool('vibesec_scan')).toBeTruthy();
      expect(server.getTool('vibesec_list_rules')).toBeTruthy();
      expect(server.getTools().length).toBe(2);
    });

    it('should handle initialize request', async () => {
      const transport = new MockTransport();
      const server = new MCPServer(
        {
          name: 'vibesec-test',
          version: '1.0.0',
          capabilities: ['tools' as const],
        },
        transport
      );

      // Queue initialize request
      transport.queueRequest({
        id: 1,
        jsonrpc: '2.0',
        method: 'initialize',
        params: {
          clientName: 'test-client',
          clientVersion: '1.0.0',
        },
      });

      // Process one request
      const request = await transport.receive();
      const response = await (server as any).handleRequest(request);
      await transport.send(response);

      const lastResponse = transport.getLastResponse() as MCPResponse;
      expect(lastResponse.id).toBe(1);
      expect(lastResponse.result).toBeTruthy();

      const initResult = lastResponse.result as { name: string, capabilities: any };
      expect(initResult.name).toBe('vibesec-test');
      expect(initResult.capabilities).toBeTruthy();
    });

    it('should list registered tools', async () => {
      const transport = new MockTransport();
      const server = new MCPServer(
        {
          name: 'vibesec-test',
          version: '1.0.0',
          capabilities: ['tools' as const],
        },
        transport
      );

      server.registerTool(vibesecScanTool);
      server.registerTool(vibesecListRulesTool);

      // Queue tools/list request
      transport.queueRequest({
        id: 2,
        jsonrpc: '2.0',
        method: 'tools/list',
        params: {},
      });

      const request = await transport.receive();
      const response = await (server as any).handleRequest(request);
      await transport.send(response);

      const lastResponse = transport.getLastResponse() as MCPResponse;
      expect(lastResponse.id).toBe(2);
      expect(lastResponse.result).toBeTruthy();

      const toolsListResult = lastResponse.result as { tools: any[] };
      expect(toolsListResult.tools).toBeInstanceOf(Array);
      expect(toolsListResult.tools.length).toBe(2);

      const toolNames = toolsListResult.tools.map((t: any) => t.name);
      expect(toolNames).toContain('vibesec_scan');
      expect(toolNames).toContain('vibesec_list_rules');
    });
  });

  describe('Tool Execution', () => {
    it('should execute vibesec_list_rules tool', async () => {
      const transport = new MockTransport();
      const server = new MCPServer(
        {
          name: 'vibesec-test',
          version: '1.0.0',
          capabilities: ['tools' as const],
        },
        transport
      );

      server.registerTool(vibesecListRulesTool);

      // Queue tools/call request for list-rules
      transport.queueRequest({
        id: 3,
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          name: 'vibesec_list_rules',
          arguments: {
            category: 'secrets',
          },
        },
      });

      const request = await transport.receive();
      const response = await (server as any).handleRequest(request);
      await transport.send(response);

      const lastResponse = transport.getLastResponse() as MCPResponse;
      expect(lastResponse.id).toBe(3);
      expect(lastResponse.error).toBeUndefined();
      expect(lastResponse.result).toBeTruthy();

      const listRulesResult = lastResponse.result as { rules: any[], totalRules: number };
      expect(listRulesResult.rules).toBeInstanceOf(Array);
      expect(listRulesResult.totalRules).toBeGreaterThanOrEqual(0);
    });

    it('should execute vibesec_scan tool', async () => {
      // Create test file
      await mkdir(testDir, { recursive: true });
      const testFile = join(testDir, 'test-scan.ts');
      await writeFile(
        testFile,
        `
const API_KEY = "sk-test123456";
const password = "admin";
      `.trim()
      );

      const transport = new MockTransport();
      const server = new MCPServer(
        {
          name: 'vibesec-test',
          version: '1.0.0',
          capabilities: ['tools' as const],
        },
        transport
      );

      server.registerTool(vibesecScanTool);

      // Queue tools/call request for scan
      transport.queueRequest({
        id: 4,
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          name: 'vibesec_scan',
          arguments: {
            files: [testFile],
            basePath: testDir,
          },
        },
      });

      const request = await transport.receive();
      const response = await (server as any).handleRequest(request);
      await transport.send(response);

      const lastResponse = transport.getLastResponse() as MCPResponse;
      expect(lastResponse.id).toBe(4);
      expect(lastResponse.error).toBeUndefined();
      expect(lastResponse.result).toBeTruthy();

      const result = lastResponse.result as { findings: any[], summary: any, scan: any, status: string };
      expect(result.findings).toBeInstanceOf(Array);
      expect(result.summary).toBeTruthy();
      expect(result.scan).toBeTruthy();
      expect(result.status).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid method', async () => {
      const transport = new MockTransport();
      const server = new MCPServer(
        {
          name: 'vibesec-test',
          version: '1.0.0',
          capabilities: ['tools' as const],
        },
        transport
      );

      transport.queueRequest({
        id: 5,
        jsonrpc: '2.0',
        method: 'invalid/method',
        params: {},
      });

      const request = await transport.receive();
      const response = await (server as any).handleRequest(request);
      await transport.send(response);

      const lastResponse = transport.getLastResponse() as MCPResponse;
      expect(lastResponse.id).toBe(5);
      expect(lastResponse.error).toBeTruthy();
      expect(lastResponse.error?.code).toBe(-32601); // Method not found
    });

    it('should handle tool not found', async () => {
      const transport = new MockTransport();
      const server = new MCPServer(
        {
          name: 'vibesec-test',
          version: '1.0.0',
          capabilities: ['tools' as const],
        },
        transport
      );

      transport.queueRequest({
        id: 6,
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          name: 'nonexistent_tool',
          arguments: {},
        },
      });

      const request = await transport.receive();
      const response = await (server as any).handleRequest(request);
      await transport.send(response);

      const lastResponse = transport.getLastResponse() as MCPResponse;
      expect(lastResponse.id).toBe(6);
      expect(lastResponse.error).toBeTruthy();
      expect(lastResponse.error?.code).toBe(-32002); // Tool not found
    });

    it('should handle invalid tool arguments', async () => {
      const transport = new MockTransport();
      const server = new MCPServer(
        {
          name: 'vibesec-test',
          version: '1.0.0',
          capabilities: ['tools' as const],
        },
        transport
      );

      server.registerTool(vibesecScanTool);

      transport.queueRequest({
        id: 7,
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          name: 'vibesec_scan',
          arguments: {
            files: 'invalid', // Should be array
          },
        },
      });

      const request = await transport.receive();
      const response = await (server as any).handleRequest(request);
      await transport.send(response);

      const lastResponse = transport.getLastResponse() as MCPResponse;
      expect(lastResponse.id).toBe(7);
      expect(lastResponse.error).toBeTruthy();
    });
  });

  describe('Complete Workflow', () => {
    it('should demonstrate a complete AI assistant interaction', async () => {
      // This test demonstrates the typical workflow of an AI assistant
      // using VibeSec through MCP

      const transport = new MockTransport();
      const server = new MCPServer(
        {
          name: 'vibesec',
          version: '1.0.0',
          capabilities: ['tools' as const],
        },
        transport
      );

      server.registerTool(vibesecScanTool);
      server.registerTool(vibesecListRulesTool);

      // Step 1: Initialize connection
      transport.queueRequest({
        id: 'init',
        jsonrpc: '2.0',
        method: 'initialize',
        params: {
          clientName: 'claude-code',
          clientVersion: '1.0.0',
        },
      });

      let request = await transport.receive();
      let response = await (server as any).handleRequest(request);
      await transport.send(response);
      expect((transport.getLastResponse() as MCPResponse).error).toBeUndefined();

      // Step 2: Discover available tools
      transport.queueRequest({
        id: 'list-tools',
        jsonrpc: '2.0',
        method: 'tools/list',
        params: {},
      });

      request = await transport.receive();
      response = await (server as any).handleRequest(request);
      await transport.send(response);

      const toolsResponse = transport.getLastResponse() as MCPResponse;
      const toolsResult = toolsResponse.result as { tools: any[] };
      expect(toolsResult.tools.length).toBe(2);

      // Step 3: List available security rules
      transport.queueRequest({
        id: 'list-rules',
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          name: 'vibesec_list_rules',
          arguments: {},
        },
      });

      request = await transport.receive();
      response = await (server as any).handleRequest(request);
      await transport.send(response);

      const rulesResponse = transport.getLastResponse() as MCPResponse;
      const rulesResult = rulesResponse.result as { rules: any[] };
      expect(rulesResult.rules).toBeTruthy();

      // Step 4: Scan a file
      await mkdir(testDir, { recursive: true });
      const testFile = join(testDir, 'workflow-test.ts');
      await writeFile(testFile, 'const secret = "sk-prod-key123";');

      transport.queueRequest({
        id: 'scan-file',
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          name: 'vibesec_scan',
          arguments: {
            files: [testFile],
            basePath: testDir,
          },
        },
      });

      request = await transport.receive();
      response = await (server as any).handleRequest(request);
      await transport.send(response);

      const scanResponse = transport.getLastResponse() as MCPResponse;
      const scanResult = scanResponse.result as { findings: any[], summary: any, status: string };
      expect(scanResult.findings).toBeTruthy();
      expect(scanResult.summary).toBeTruthy();
      expect(scanResult.status).toBeTruthy();

      // Verify all 4 requests succeeded
      const allResponses = transport.getAllResponses();
      expect(allResponses.length).toBe(4);
      expect(allResponses.every((r) => !(r as MCPResponse).error)).toBe(true);
    });
  });
});
