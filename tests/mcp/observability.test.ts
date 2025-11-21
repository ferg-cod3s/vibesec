import { MCPServer } from '../../src/mcp/server';
import { MockTransport } from '../mocks/mock-transport';
import * as fs from 'fs/promises';

describe('MCP Server Observability Tests', () => {
  let server: MCPServer;
  let mockTransport: MockTransport;
  let tempDir: string;
  let logMessages: string[];

  beforeEach(() => {
    logMessages = [];
    
    // Mock console methods to capture log output
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    
    console.log = (...args: any[]) => {
      logMessages.push(args.join(' '));
      originalConsoleLog(...args);
    };
    
    console.error = (...args: any[]) => {
      logMessages.push(args.join(' '));
      originalConsoleError(...args);
    };

    mockTransport = {
      requests: [],
      responses: [],
      lastResponse: null,
      
      queueRequest: function(request: any) {
        this.requests.push(request);
      },
      
      queueResponse: function(response: any) {
        this.responses.push(response);
        this.lastResponse = response;
      },
      
      getLastRequest: function() {
        return this.requests[this.requests.length - 1];
      },
      
      getLastResponse: function() {
        return this.lastResponse;
      },
      
      getAllResponses: function() {
        return this.responses;
      },
      
      receive: async () => {
        return this.requests.shift();
      }
    };
    
    tempDir = '/tmp/vibesec-test-' + Math.random().toString(36).substring(7);
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  it('should log server startup', async () => {
    await server.start();
      
    // Should log initialization
    expect(logMessages.length).toBeGreaterThan(0);
    expect(logMessages.some(msg => msg.includes('Client initialized'))).toBe(true);
    expect(logMessages.some(msg => msg.includes('Registered tool'))).toBe(true);
  });

  it('should log request handling', async () => {
    const request = {
        id: 1,
        jsonrpc: '2.0',
        method: 'tools/list'
      };

    mockTransport.queueRequest(request);
      
    const response = await (server as any).handleRequest(request);
      
    // Should log request received
    expect(logMessages.length).toBeGreaterThan(0);
    expect(logMessages.some(msg => msg.includes('Request handled: tools/list'))).toBe(true);
  });

  it('should log tool execution', async () => {
    const request = {
      id: 2,
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        name: 'vibesec_scan',
        arguments: {
          files: ['test.js']
        }
      }
    };

    mockTransport.queueRequest(request);
      
    const response = await (server as any).handleRequest(request);
      
    // Should log tool execution
    expect(logMessages.length).toBeGreaterThan(0);
    expect(logMessages.some(msg => msg.includes('Executing tool: vibesec_scan'))).toBe(true);
    expect(logMessages.some(msg => msg.includes('Tool executed successfully: vibesec_scan'))).toBe(true);
  });

  it('should log errors appropriately', async () => {
    const originalConsoleError = console.error;
    let errorMessages: string[] = [];
    
    console.error = (...args: any[]) => {
      errorMessages.push(args.join(' '));
      originalConsoleError(...args);
    };

    const request = {
      id: 3,
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        name: 'nonexistent_tool',
        arguments: {}
      }
    };

    mockTransport.queueRequest(request);
      
    const response = await (server as any).handleRequest(request);
      
    // Should log errors
    expect(errorMessages.length).toBeGreaterThan(0);
    expect(errorMessages.some(msg => msg.includes('Request failed: tools/call'))).toBe(true);
    expect(errorMessages.some(msg => msg.includes('Tool not found: nonexistent_tool'))).toBe(true);
      
    // Restore original console.error
    console.error = originalConsoleError;
  });

  it('should collect performance metrics', async () => {
    const request = {
      id: 5,
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        name: 'vibesec_scan',
        arguments: {
          files: ['test.js']
        }
      }
    };

    mockTransport.queueRequest(request);
      
    const response = await (server as any).handleRequest(request);
      
    // Should log performance metrics
    expect(logMessages.length).toBeGreaterThan(0);
    expect(logMessages.some(msg => msg.includes('Tool executed successfully: vibesec_scan'))).toBe(true);
    expect(logMessages.some(msg => msg.includes('duration:'))).toBe(true);
    expect(logMessages.some(msg => msg.includes('files scanned:'))).toBe(true);
    expect(logMessages.some(msg => msg.includes('findings found:'))).toBe(true);
  });
});