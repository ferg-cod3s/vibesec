import { MCPServer } from '../../src/mcp/server';
import { MCPError, MCPErrorCode, ToolValidationError, ToolExecutionError } from '../../src/mcp/error';
import * as readline from 'readline/promises';

describe('MCP Server Error Handling', () => {
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

  describe('Tool Execution Errors', () => {
    it('should handle tool not found error', async () => {
      const request = {
        id: 1,
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          name: 'nonexistent_tool',
          arguments: {}
        }
      };

      mockTransport.queueRequest(request);
      
      const response = await (server as any).handleRequest(request);
      
      expect(response.error).toBeDefined();
      expect(response.error.code).toBe(MCPErrorCode.TOOL_NOT_FOUND);
      expect(response.error.message).toContain('Tool not found: nonexistent_tool');
      expect(response.result).toBeUndefined();
    });

    it('should handle invalid tool arguments error', async () => {
      const request = {
        id: 2,
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          name: 'vibesec_scan',
          arguments: {
            invalid_param: 'value'
          }
        }
      };

      mockTransport.queueRequest(request);
      
      const response = await (server as any).handleRequest(request);
      
      expect(response.error).toBeDefined();
      expect(response.error.code).toBe(MCPErrorCode.INVALID_TOOL_ARGS);
      expect(response.error.message).toContain('Invalid parameters');
      expect(response.result).toBeUndefined();
    });

    it('should handle tool execution failure', async () => {
      const request = {
        id: 3,
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          name: 'vibesec_scan',
          arguments: {
            files: ['/nonexistent/file']
          }
        }
      };

      mockTransport.queueRequest(request);
      
      const response = await (server as any).handleRequest(request);
      
      expect(response.error).toBeDefined();
      expect(response.error.code).toBe(MCPErrorCode.TOOL_EXECUTION_ERROR);
      expect(response.error.message).toContain('Tool execution failed: vibesec_scan');
      expect(response.result).toBeUndefined();
    });
  });

  describe('Request Validation Errors', () => {
    it('should handle invalid JSON-RPC request', async () => {
      const request = {
        // Missing required fields
        jsonrpc: '2.0'
      };

      mockTransport.queueRequest(request);
      
      const response = await (server as any).handleRequest(request);
      
      expect(response.error).toBeDefined();
      expect(response.error.code).toBe(MCPErrorCode.INVALID_REQUEST);
      expect(response.error.message).toContain('Invalid JSON-RPC request');
    });

    it('should handle malformed JSON-RPC version', async () => {
      const request = {
        id: 4,
        jsonrpc: '1.0', // Invalid version
        method: 'tools/list'
      };

      mockTransport.queueRequest(request);
      
      const response = await (server as any).handleRequest(request);
      
      expect(response.error).toBeDefined();
      expect(response.error.code).toBe(MCPErrorCode.INVALID_REQUEST);
      expect(response.error.message).toContain('Invalid JSON-RPC version');
    });

    it('should handle missing method', async () => {
      const request = {
        id: 5,
        jsonrpc: '2.0'
        // Missing method field
      };

      mockTransport.queueRequest(request);
      
      const response = await (server as any).handleRequest(request);
      
      expect(response.error).toBeDefined();
      expect(response.error.code).toBe(MCPErrorCode.INVALID_REQUEST);
      expect(response.error.message).toContain('Invalid JSON-RPC request');
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
        id: 6,
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
          throw new Error('Transport write error');
        },
        
        getLastResponse: () => mockTransport.lastResponse,
        
        getAllResponses: () => mockTransport.responses,
        
        receive: async () => {
          return mockTransport.requests.shift();
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
        id: 7,
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

  describe('Concurrent Request Handling', () => {
    it('should handle multiple simultaneous requests', async () => {
      const request1 = {
        id: 8,
        jsonrpc: '2.0',
        method: 'tools/list'
      };

      const request2 = {
        id: 9,
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
      
      expect(response1.id).toBe(8);
      expect(response1.result).toBeDefined();
      expect(response2.id).toBe(9);
      expect(response2.result).toBeDefined();
      
      // Both should have tools list
      expect(response1.result.tools).toBeDefined();
      expect(response2.result.tools).toBeDefined();
    });
  });

  describe('Error Message Sanitization', () => {
    it('should sanitize error messages', async () => {
      const request = {
        id: 10,
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
      
      expect(response.error).toBeDefined();
      expect(response.error.code).toBe(MCPErrorCode.TOOL_EXECUTION_ERROR);
      // Error message should be sanitized (no stack traces in production)
      expect(response.error.message).not.toContain('at ');
      expect(response.error.message).not.toContain('Error:');
    });
  });

  describe('Response Format Validation', () => {
    it('should always include jsonrpc version in successful responses', async () => {
      const request = {
        id: 11,
        jsonrpc: '2.0',
        method: 'tools/list'
      };

      mockTransport.queueRequest(request);
      
      const response = await (server as any).handleRequest(request);
      
      expect(response.jsonrpc).toBe('2.0');
      expect(response.id).toBe(11);
      expect(response.result).toBeDefined();
      expect(response.error).toBeUndefined();
    });

    it('should always include jsonrpc version in error responses', async () => {
      const request = {
        id: 12,
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          name: 'nonexistent_tool',
          arguments: {}
        }
      };

      mockTransport.queueRequest(request);
      
      const response = await (server as any).handleRequest(request);
      
      expect(response.jsonrpc).toBe('2.0');
      expect(response.id).toBe(12);
      expect(response.result).toBeUndefined();
      expect(response.error).toBeDefined();
      expect(response.error.code).toBeDefined();
    });
  });
});