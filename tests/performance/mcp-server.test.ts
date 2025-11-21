/**
 * Performance Tests for VibeSec MCP Server
 * 
 * Tests concurrent request handling, response times, memory usage,
 * and stress testing using bun:test framework.
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { MCPServer } from '../../src/mcp/server';
import { PerformanceBenchmark } from '../../lib/performance/benchmark';
import { MemoryProfiler } from '../../lib/performance/memory-profiler';
import { MCPRequest, MCPResponse } from '../../src/mcp/types';
import * as performance from 'perf_hooks';

// Mock transport for testing
class MockTransport {
  private messages: any[] = [];
  private running = false;

  async start(): Promise<void> {
    this.running = true;
  }

  async stop(): Promise<void> {
    this.running = false;
  }

  isRunning(): boolean {
    return this.running;
  }

  async receive(): Promise<MCPRequest> {
    // Return next message or wait
    if (this.messages.length > 0) {
      return this.messages.shift() as MCPRequest;
    }
    
    // Simulate waiting for message
    return new Promise((resolve) => {
      setTimeout(() => {
        // Default ping request for testing
        resolve({
          id: `ping-${Date.now()}`,
          method: 'ping',
          params: {}
        });
      }, 10);
    });
  }

  async send(response: MCPResponse): Promise<void> {
    // Store response for testing
    this.messages.push(response);
  }

  // Test helper to inject requests
  injectRequest(request: MCPRequest): void {
    this.messages.push(request);
  }

  getResponses(): MCPResponse[] {
    return this.messages.filter(msg => msg.id !== undefined);
  }

  clear(): void {
    this.messages = [];
  }
}

// Secure agent injection for MCP tests
interface MCPSecurityConfig {
  maxConcurrentRequests: number;
  requestTimeoutMs: number;
  maxPayloadSize: number;
  sanitizeResponses: boolean;
}

class SecureMCPTester {
  private config: MCPSecurityConfig;
  private activeRequests: Map<string, any> = new Map();

  constructor(config: MCPSecurityConfig) {
    this.config = config;
  }

  async executeRequest(
    server: MCPServer, 
    request: MCPRequest,
    requestId?: string
  ): Promise<MCPResponse> {
    const id = requestId || this.generateRequestId();
    
    // Validate request size
    const requestSize = JSON.stringify(request).length;
    if (requestSize > this.config.maxPayloadSize) {
      return {
        id: request.id,
        error: {
          code: -32600,
          message: 'Request too large'
        }
      };
    }

    try {
      this.activeRequests.set(id, {
        request,
        startTime: Date.now(),
        status: 'running'
      });

      // Execute with timeout
      const response = await Promise.race([
        server.handleRequest(request),
        this.createTimeout(this.config.requestTimeoutMs)
      ]);

      this.activeRequests.set(id, {
        ...this.activeRequests.get(id),
        status: 'completed',
        endTime: Date.now(),
        response
      });

      return this.sanitizeResponse(response);
    } catch (error) {
      this.activeRequests.set(id, {
        ...this.activeRequests.get(id),
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
        endTime: Date.now()
      });

      return {
        id: request.id,
        error: {
          code: -32603,
          message: 'Internal error'
        }
      };
    }
  }

  async executeConcurrentRequests(
    server: MCPServer,
    requests: MCPRequest[]
  ): Promise<MCPResponse[]> {
    // Limit concurrency
    const limitedRequests = requests.slice(0, this.config.maxConcurrentRequests);
    
    const promises = limitedRequests.map((request, index) => 
      this.executeRequest(server, request, `req_${index}_${Date.now()}`)
    );

    return Promise.all(promises);
  }

  private generateRequestId(): string {
    return `mcp_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  private createTimeout(ms: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Request timeout after ${ms}ms`)), ms);
    });
  }

  private sanitizeResponse(response: MCPResponse): MCPResponse {
    if (!this.config.sanitizeResponses) return response;

    // Remove sensitive information from responses
    if (response && typeof response === 'object') {
      const sanitized = { ...response };
      
      // Sanitize any potential secrets in tool results
      if ('result' in sanitized && typeof sanitized.result === 'object') {
        sanitized.result = this.sanitizeObject(sanitized.result);
      }

      return sanitized;
    }

    return response;
  }

  private sanitizeObject(obj: any): any {
    if (typeof obj !== 'object' || obj === null) return obj;

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }

    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string' && value.length > 20) {
        // Check for potential secrets
        if (value.match(/["'][\w\-_]{20,}["']/)) {
          sanitized[key] = value.replace(/["'][\w\-_]{20,}["']/g, '"***REDACTED***"');
        } else {
          sanitized[key] = value;
        }
      } else {
        sanitized[key] = this.sanitizeObject(value);
      }
    }

    return sanitized;
  }

  getStats(): { active: number, completed: number, failed: number } {
    const stats = { active: 0, completed: 0, failed: 0 };
    
    for (const request of this.activeRequests.values()) {
      stats[request.status]++;
    }

    return stats;
  }

  cleanup(): void {
    this.activeRequests.clear();
  }
}

// Global test configuration
const MCP_TEST_CONFIG: MCPSecurityConfig = {
  maxConcurrentRequests: 100,
  requestTimeoutMs: 30000, // 30 seconds
  maxPayloadSize: 1024 * 1024, // 1MB
  sanitizeResponses: true
};

const secureMCPTester = new SecureMCPTester(MCP_TEST_CONFIG);

describe('MCP Server Performance Tests', () => {
  let server: MCPServer;
  let transport: MockTransport;
  let benchmark: PerformanceBenchmark;
  let memoryProfiler: MemoryProfiler;

  beforeEach(() => {
    transport = new MockTransport();
    server = new MCPServer({
      name: 'test-server',
      version: '1.0.0',
      capabilities: ['tools']
    }, transport);
    
    benchmark = new PerformanceBenchmark();
    memoryProfiler = new MemoryProfiler();
    
    // Register test tools
    registerTestTools(server);
  });

  afterEach(async () => {
    if (server.isRunning()) {
      await server.stop();
    }
    transport.clear();
    secureMCPTester.cleanup();
  });

  describe('Concurrent Request Handling', () => {
    it('should handle 100 concurrent requests efficiently', async () => {
      const concurrentRequests = 100;
      const requests = Array.from({ length: concurrentRequests }, (_, i) => 
        createScanRequest(`test-path-${i}`)
      );
      
      benchmark.start();
      memoryProfiler.start(50);
      
      const responses = await secureMCPTester.executeConcurrentRequests(server, requests);
      
      const benchmarkResult = benchmark.stop('concurrent-requests', concurrentRequests);
      const memoryProfile = memoryProfiler.stop();
      
      expect(responses).toHaveLength(concurrentRequests);
      expect(responses.filter(r => r.error).length).toBeLessThan(5); // Allow some errors
      expect(benchmarkResult.duration).toBeLessThan(30000); // 30 seconds
      expect(MemoryProfiler.meetsTarget(memoryProfile)).toBe(true);
      
      // Verify response times are reasonable
      const avgResponseTime = benchmarkResult.duration / concurrentRequests;
      expect(avgResponseTime).toBeLessThan(100); // 100ms per request
    }, 60000);

    it('should handle mixed request types concurrently', async () => {
      const requests = [
        ...Array.from({ length: 30 }, () => createScanRequest()),
        ...Array.from({ length: 30 }, () => createListToolsRequest()),
        ...Array.from({ length: 20 }, () => createPingRequest()),
        ...Array.from({ length: 20 }, () => createInitializeRequest())
      ];
      
      benchmark.start();
      
      const responses = await secureMCPTester.executeConcurrentRequests(server, requests);
      
      const benchmarkResult = benchmark.stop('mixed-requests', requests.length);
      
      expect(responses).toHaveLength(requests.length);
      expect(responses.filter(r => r.error).length).toBeLessThan(10); // Allow some errors
      expect(benchmarkResult.duration).toBeLessThan(25000);
    }, 45000);

    it('should maintain performance under sustained load', async () => {
      const batches = 10;
      const requestsPerBatch = 20;
      const totalRequests = batches * requestsPerBatch;
      
      benchmark.start();
      memoryProfiler.start();
      
      for (let batch = 0; batch < batches; batch++) {
        const batchRequests = Array.from({ length: requestsPerBatch }, () => 
          createScanRequest(`batch-${batch}-req-${Math.random()}`)
        );
        
        await secureMCPTester.executeConcurrentRequests(server, batchRequests);
        
        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      const benchmarkResult = benchmark.stop('sustained-load', totalRequests);
      const memoryProfile = memoryProfiler.stop();
      
      expect(benchmarkResult.duration).toBeLessThan(60000); // 1 minute
      expect(MemoryProfiler.meetsTarget(memoryProfile)).toBe(true);
      
      // Check for memory leaks
      const leak = MemoryProfiler.detectLeak(memoryProfile);
      expect(leak.detected).toBe(false);
    }, 120000);
  });

  describe('Response Time Performance', () => {
    it('should respond to simple requests quickly', async () => {
      const simpleRequests = [
        createPingRequest(),
        createListToolsRequest(),
        createInitializeRequest()
      ];
      
      const responseTimes: number[] = [];
      
      for (const request of simpleRequests) {
        const startTime = performance.now();
        const response = await secureMCPTester.executeRequest(server, request);
        const endTime = performance.now();
        
        responseTimes.push(endTime - startTime);
        expect(response.error).toBeUndefined();
      }
      
      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const maxResponseTime = Math.max(...responseTimes);
      
      expect(avgResponseTime).toBeLessThan(50); // 50ms average
      expect(maxResponseTime).toBeLessThan(200); // 200ms max
    });

    it('should handle large payloads efficiently', async () => {
      const largePayload = createLargeScanPayload(1000); // 1000 files
      const request = createScanRequestWithPayload(largePayload);
      
      benchmark.start();
      
      const response = await secureMCPTester.executeRequest(server, request);
      const benchmarkResult = benchmark.stop('large-payload', 1);
      
      expect(response.error).toBeUndefined();
      expect(benchmarkResult.duration).toBeLessThan(10000); // 10 seconds
    }, 30000);

    it('should maintain response times under increasing load', async () => {
      const loadLevels = [1, 5, 10, 25, 50];
      const responseTimesByLoad: number[] = [];
      
      for (const load of loadLevels) {
        const requests = Array.from({ length: load }, () => createScanRequest());
        
        const startTime = performance.now();
        await secureMCPTester.executeConcurrentRequests(server, requests);
        const endTime = performance.now();
        
        const avgTimePerRequest = (endTime - startTime) / load;
        responseTimesByLoad.push(avgTimePerRequest);
      }
      
      // Response times should scale reasonably
      for (let i = 1; i < responseTimesByLoad.length; i++) {
        const scalingFactor = responseTimesByLoad[i] / responseTimesByLoad[0];
        expect(scalingFactor).toBeLessThan(loadLevels[i] * 0.5); // Allow 50% of linear scaling
      }
    }, 90000);
  });

  describe('Memory Usage Under Load', () => {
    it('should handle many simultaneous connections without memory leaks', async () => {
      const connectionCount = 50;
      const requestsPerConnection = 10;
      
      memoryProfiler.start(100);
      
      // Simulate many simultaneous connections
      const connectionPromises = Array.from({ length: connectionCount }, async (_, connId) => {
        const results = [];
        for (let i = 0; i < requestsPerConnection; i++) {
          const request = createScanRequest(`conn-${connId}-req-${i}`);
          const response = await secureMCPTester.executeRequest(server, request);
          results.push(response);
        }
        return results;
      });
      
      await Promise.all(connectionPromises);
      const memoryProfile = memoryProfiler.stop();
      
      expect(MemoryProfiler.meetsTarget(memoryProfile)).toBe(true);
      
      const leak = MemoryProfiler.detectLeak(memoryProfile);
      expect(leak.detected).toBe(false);
    }, 120000);

    it('should clean up resources after request completion', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Process many requests
      for (let i = 0; i < 100; i++) {
        const request = createScanRequest(`cleanup-test-${i}`);
        await secureMCPTester.executeRequest(server, request);
      }
      
      // Force garbage collection if available
      if (global.gc) global.gc();
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryGrowth = finalMemory - initialMemory;
      
      // Memory growth should be minimal
      expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024); // 50MB
    }, 60000);
  });

  describe('Stress Testing', () => {
    it('should handle maximum concurrent requests', async () => {
      const maxRequests = 200;
      const requests = Array.from({ length: maxRequests }, (_, i) => 
        createScanRequest(`stress-test-${i}`)
      );
      
      benchmark.start();
      memoryProfiler.start();
      
      const startTime = Date.now();
      const responses = await secureMCPTester.executeConcurrentRequests(server, requests);
      const endTime = Date.now();
      
      const benchmarkResult = benchmark.stop('max-concurrent', maxRequests);
      const memoryProfile = memoryProfiler.stop();
      
      const successful = responses.filter(r => !r.error).length;
      const failed = responses.filter(r => r.error).length;
      
      expect(successful).toBeGreaterThan(maxRequests * 0.8); // 80% success rate
      expect(endTime - startTime).toBeLessThan(60000); // 1 minute
      expect(MemoryProfiler.meetsTarget(memoryProfile)).toBe(true);
    }, 120000);

    it('should recover from temporary overload', async () => {
      // Create overload
      const overloadRequests = Array.from({ length: 150 }, () => createScanRequest());
      await secureMCPTester.executeConcurrentRequests(server, overloadRequests);
      
      // Wait for recovery
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Test normal operation
      const normalRequests = Array.from({ length: 20 }, () => createScanRequest());
      const responses = await secureMCPTester.executeConcurrentRequests(server, normalRequests);
      
      expect(responses.filter(r => !r.error).length).toBeGreaterThan(18); // 90% success
    }, 90000);
  });
});

// Helper functions
function registerTestTools(server: MCPServer): void {
  server.registerTool({
    name: 'scan',
    description: 'Test scan tool',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string' }
      }
    },
    handler: async (args: any) => {
      // Simulate scan operation
      await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
      return {
        findings: [],
        filesScanned: Math.floor(Math.random() * 100) + 1
      };
    }
  });
}

function createScanRequest(path?: string): MCPRequest {
  return {
    id: `req-${Math.random()}`,
    method: 'tools/call',
    params: {
      name: 'scan',
      arguments: { path: path || `/test/path/${Math.random()}` }
    }
  };
}

function createListToolsRequest(): MCPRequest {
  return {
    id: `req-${Math.random()}`,
    method: 'tools/list',
    params: {}
  };
}

function createPingRequest(): MCPRequest {
  return {
    id: `req-${Math.random()}`,
    method: 'ping',
    params: {}
  };
}

function createInitializeRequest(): MCPRequest {
  return {
    id: `req-${Math.random()}`,
    method: 'initialize',
    params: {
      clientName: 'test-client',
      clientVersion: '1.0.0'
    }
  };
}

function createLargeScanPayload(fileCount: number): any {
  return {
    path: '/large/project',
    options: {
      include: Array.from({ length: fileCount }, (_, i) => `file-${i}.js`),
      deep: true,
      verbose: true
    }
  };
}

function createScanRequestWithPayload(payload: any): MCPRequest {
  return {
    id: `req-${Math.random()}`,
    method: 'tools/call',
    params: {
      name: 'scan',
      arguments: payload
    }
  };
}