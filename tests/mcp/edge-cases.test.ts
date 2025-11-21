import { MCPServer } from '../../src/mcp/server';
import { MCPError, MCPErrorCode } from '../../src/mcp/error';
import * as readline from 'readline/promises';

describe('MCP Server Edge Cases', () => {
  let server: MCPServer;
  let mockTransport: any;

  beforeEach(() => {
    mockTransport = {
      requests: [] as any[],
      responses: [] as any[],
      lastResponse: null as any,
      
      queueRequest: (request: any) => {
        mockTransport.requests.push(request);
      },
      
      send: async (response: any) => {
        mockTransport.responses.push(response);
        mockTransport.lastResponse = response;
      },
      
      getLastResponse: () => mockTransport.lastResponse,
      
      getAllResponses: () => mockTransport.responses,
      
      receive: async () => {
        return mockTransport.requests.shift();
      }
    };
    
    server = new MCPServer(
      {
        name: 'vibesec-test',
        version: '1.0.0',
        capabilities: ['tools']
      },
      mockTransport
    );
  });

  describe('Concurrent Request Handling', () => {
    it('should handle multiple simultaneous requests', async () => {
      const request1 = {
        id: 1,
        jsonrpc: '2.0',
        method: 'tools/list'
      };

      const request2 = {
        id: 2,
        jsonrpc: '2.0',
        method: 'tools/list'
      };

      mockTransport.queueRequest(request1);
      mockTransport.queueRequest(request2);
      
      // Process both requests concurrently
      const [response1, response2] = await Promise.all([
        (server as any).handleRequest(request1),
        (server as any).handleRequest(request2)
      ]);
      
      expect(response1.id).toBe(1);
      expect(response1.result).toBeDefined();
      expect(response2.id).toBe(2);
      expect(response2.result).toBeDefined();
      
      // Both should have tools list
      expect(response1.result.tools).toBeDefined();
      expect(response2.result.tools).toBeDefined();
    });

    it('should handle request queue overflow', async () => {
      // Create many requests to test queue management
      for (let i = 0; i < 100; i++) {
        const request = {
          id: i,
          jsonrpc: '2.0',
          method: 'tools/list'
        };
        mockTransport.queueRequest(request);
      }
      
      // Process first few requests
      const responses = [];
      for (let i = 0; i < 5; i++) {
        const response = await (server as any).handleRequest(mockTransport.requests[i]);
        responses.push(response);
      }
      
      // Should process first 5 requests
      expect(responses).toHaveLength(5);
      expect(mockTransport.requests).toHaveLength(95); // 100 - 5 processed
    });
  });

  describe('Malformed JSON-RPC Requests', () => {
    it('should handle invalid JSON-RPC version', async () => {
      const request = {
        id: 1,
        jsonrpc: '1.0', // Invalid version
        method: 'tools/list'
      };

      mockTransport.queueRequest(request);
      
      const response = await (server as any).handleRequest(request);
      
      expect(response.error).toBeDefined();
      expect(response.error.code).toBe(MCPErrorCode.INVALID_REQUEST);
      expect(response.error.message).toContain('Invalid JSON-RPC version');
    });

    it('should handle missing required fields', async () => {
      const request = {
        // Missing id
        jsonrpc: '2.0',
        method: 'tools/list'
      };

      mockTransport.queueRequest(request);
      
      const response = await (server as any).handleRequest(request);
      
      expect(response.error).toBeDefined();
      expect(response.error.code).toBe(MCPErrorCode.INVALID_REQUEST);
      expect(response.error.message).toContain('Invalid request');
    });

    it('should handle missing method field', async () => {
      const request = {
        id: 2,
        jsonrpc: '2.0',
        // Missing method
      };

      mockTransport.queueRequest(request);
      
      const response = await (server as any).handleRequest(request);
      
      expect(response.error).toBeDefined();
      expect(response.error.code).toBe(MCPErrorCode.INVALID_REQUEST);
      expect(response.error.message).toContain('Invalid request');
    });

    it('should handle invalid method name', async () => {
      const request = {
        id: 3,
        jsonrpc: '2.0',
        method: 'invalid_method'
      };

      mockTransport.queueRequest(request);
      
      const response = await (server as any).handleRequest(request);
      
      expect(response.error).toBeDefined();
      expect(response.error.code).toBe(MCPErrorCode.METHOD_NOT_FOUND);
      expect(response.error.message).toContain('Method not found: invalid_method');
    });
  });

  describe('Transport Errors', () => {
    it('should handle transport read errors', async () => {
      const mockTransport = {
        requests: [] as any[],
        responses: [] as any[],
        lastResponse: null as any,
        
        queueRequest: (request: any) => {
          mockTransport.requests.push(request);
        },
        
        send: async (response: any) => {
          mockTransport.responses.push(response);
          mockTransport.lastResponse = response;
        },
        
        getLastResponse: () => mockTransport.lastResponse,
        
        getAllResponses: () => mockTransport.responses,
        
        receive: async () => {
          throw new Error('Transport read error');
        }
      };
      
      const server = new MCPServer(
        {
          name: 'vibesec-test',
          version: '1.0.0',
          capabilities: ['tools']
        },
        mockTransport
      );

      const request = {
        id: 1,
        jsonrpc: '2.0',
        method: 'tools/list'
      };

      mockTransport.queueRequest(request);
      
      const response = await (server as any).handleRequest(request);
      
      expect(response.error).toBeDefined();
      expect(response.error.code).toBe(MCPErrorCode.TRANSPORT_ERROR);
      expect(response.error.message).toContain('Transport error');
    });

    it('should handle transport write errors', async () => {
      const mockTransport = {
        requests: [] as any[],
        responses: [] as any[],
        lastResponse: null as any,
        
        queueRequest: (request: any) => {
          mockTransport.requests.push(request);
        },
        
        send: async (response: any) => {
          mockTransport.responses.push(response);
          mockTransport.lastResponse = response;
        },
        
        getLastResponse: () => mockTransport.lastResponse,
        
        getAllResponses: () => mockTransport.responses,
        
        receive: async () => {
          throw new Error('Transport write error');
        }
      };
      
      const server = new MCPServer(
        {
          name: 'vibesec-test',
          version: '1.0.0',
          capabilities: ['tools']
        },
        mockTransport
      );

      const request = {
        id: 1,
        jsonrpc: '2.0',
        method: 'tools/list'
      };

      mockTransport.queueRequest(request);
      
      const response = await (server as any).handleRequest(request);
      
      expect(response.error).toBeDefined();
      expect(response.error.code).toBe(MCPErrorCode.TRANSPORT_ERROR);
      expect(response.error.message).toContain('Transport error');
    });
  });

  describe('Response Format Validation', () => {
    it('should always include jsonrpc version in successful responses', async () => {
      const request = {
        id: 1,
        jsonrpc: '2.0',
        method: 'tools/list'
      };

      mockTransport.queueRequest(request);
      
      const response = await (server as any).handleRequest(request);
      
      expect(response.jsonrpc).toBe('2.0');
      expect(response.id).toBe(1);
      expect(response.result).toBeDefined();
      expect(response.error).toBeUndefined();
    });

    it('should always include jsonrpc version in error responses', async () => {
      const request = {
        id: 2,
        jsonrpc: '2.0',
        method: 'tools/list',
        params: {
          name: 'nonexistent_tool',
          arguments: {}
        }
      };

      mockTransport.queueRequest(request);
      
      const response = await (server as any).handleRequest(request);
      
      expect(response.jsonrpc).toBe('2.0');
      expect(response.id).toBe(2);
      expect(response.error).toBeDefined();
      expect(response.error.code).toBeDefined();
      expect(response.error.message).toContain('Tool not found: nonexistent_tool');
    });
  });

  describe('Error Message Sanitization', () => {
    it('should sanitize error messages', async () => {
      const request = {
        id: 1,
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          name: 'vibesec_scan',
          arguments: {
            files: ['test.js'],
            stack_trace: 'Error: at /some/path/file.js:10:5'
          }
        }
      };

      mockTransport.queueRequest(request);
      
      const response = await (server as any).handleRequest(request);
      
      expect(response.error).toBeDefined();
      expect(response.error.code).toBe(MCPErrorCode.TOOL_EXECUTION_ERROR);
      expect(response.error.message).toContain('Tool execution failed: vibesec_scan');
      
      // Error message should be sanitized (no stack traces in production)
      expect(response.error.message).not.toContain('at ');
      expect(response.error.message).not.toContain('Error:');
    });
  });

  describe('Server Initialization', () => {
    it('should handle initialization errors gracefully', async () => {
      // Mock transport that fails during initialization
      const mockTransport = {
        requests: [] as any[],
        responses: [] as any[],
        lastResponse: null as any,
        
        queueRequest: (request: any) => {
          mockTransport.requests.push(request);
        },
        
        send: async (response: any) => {
          mockTransport.responses.push(response);
          mockTransport.lastResponse = response;
        },
        
        getLastResponse: () => mockTransport.lastResponse,
        
        getAllResponses: () => mockTransport.responses,
        
        receive: async () => {
          throw new Error('Initialization failed');
        }
      };
      
      // Mock server constructor to throw during initialization
      const originalMCPServer = MCPServer;
      (global as any).MCPServer = jest.fn(() => {
        throw new Error('Server initialization failed');
      }) as any;

      // Create server that should fail
      const failingServer = new MCPServer(
        {
          name: 'vibesec-test',
          version: '1.0.0',
          capabilities: ['tools']
        },
        mockTransport
      );

      await expect(failingServer.start()).rejects.toThrow('Server initialization failed');
      
      // Original server should work fine
      await expect(server.start()).resolves.toBeUndefined();
    });
  });
});