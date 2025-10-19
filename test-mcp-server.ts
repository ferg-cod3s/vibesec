#!/usr/bin/env bun
/**
 * Manual MCP Server Test
 *
 * Tests the VibeSec MCP server by simulating client requests
 */

import { spawn } from 'child_process';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

interface MCPRequest {
  id: string | number;
  jsonrpc: '2.0';
  method: string;
  params?: Record<string, unknown>;
}

interface MCPResponse {
  id: string | number;
  jsonrpc: '2.0';
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

async function testMCPServer() {
  console.log('🧪 Testing VibeSec MCP Server...\n');

  // Start the server
  const server = spawn('bun', ['run', 'bin/vibesec-mcp'], {
    stdio: ['pipe', 'pipe', 'inherit'],
  });

  let responseBuffer = '';

  // Helper to send request and get response
  const sendRequest = (request: MCPRequest): Promise<MCPResponse> => {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Timeout waiting for response to ${request.method}`));
      }, 5000);

      const handleData = (data: Buffer) => {
        responseBuffer += data.toString();

        // Check if we have a complete response (newline-delimited JSON)
        if (responseBuffer.includes('\n')) {
          const lines = responseBuffer.split('\n');
          responseBuffer = lines.pop() || ''; // Keep incomplete line

          for (const line of lines) {
            if (line.trim()) {
              try {
                const response = JSON.parse(line) as MCPResponse;
                if (response.id === request.id) {
                  clearTimeout(timeout);
                  server.stdout!.off('data', handleData);
                  resolve(response);
                  return;
                }
              } catch (err) {
                // Ignore parse errors, might be partial JSON
              }
            }
          }
        }
      };

      server.stdout!.on('data', handleData);

      // Send request
      server.stdin!.write(JSON.stringify(request) + '\n');
    });
  };

  try {
    // Test 1: Initialize
    console.log('📋 Test 1: Initialize connection');
    const initResponse = await sendRequest({
      id: 1,
      jsonrpc: '2.0',
      method: 'initialize',
      params: {
        clientName: 'test-client',
        clientVersion: '1.0.0',
      },
    });

    if (initResponse.error) {
      throw new Error(`Initialize failed: ${initResponse.error.message}`);
    }

    console.log('✅ Server initialized:', initResponse.result);
    console.log();

    // Test 2: List tools
    console.log('📋 Test 2: List available tools');
    const toolsResponse = await sendRequest({
      id: 2,
      jsonrpc: '2.0',
      method: 'tools/list',
      params: {},
    });

    if (toolsResponse.error) {
      throw new Error(`List tools failed: ${toolsResponse.error.message}`);
    }

    const tools = (toolsResponse.result as any).tools;
    console.log(`✅ Found ${tools.length} tools:`);
    tools.forEach((tool: any) => {
      console.log(`   - ${tool.name}: ${tool.description.substring(0, 80)}...`);
    });
    console.log();

    // Test 3: List rules
    console.log('📋 Test 3: Call vibesec_list_rules');
    const rulesResponse = await sendRequest({
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

    if (rulesResponse.error) {
      throw new Error(`List rules failed: ${rulesResponse.error.message}`);
    }

    const rulesResult = rulesResponse.result as any;
    console.log(`✅ Found ${rulesResult.totalRules} secret detection rules`);
    console.log('   Categories:', rulesResult.categories.join(', '));
    console.log();

    // Test 4: Scan a file
    console.log('📋 Test 4: Call vibesec_scan on test file');

    // Create a test file with vulnerabilities
    const testDir = join(process.cwd(), 'test-mcp-output');
    await mkdir(testDir, { recursive: true });
    const testFile = join(testDir, 'vulnerable.ts');
    await writeFile(
      testFile,
      `
// Test file with intentional vulnerabilities
const API_KEY = "sk-test-1234567890abcdef";
const PASSWORD = "admin123";

function query(userInput: string) {
  const sql = "SELECT * FROM users WHERE name = '" + userInput + "'";
  // TODO: Implement actual database query
}
      `.trim()
    );

    const scanResponse = await sendRequest({
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

    if (scanResponse.error) {
      throw new Error(`Scan failed: ${scanResponse.error.message}`);
    }

    const scanResult = scanResponse.result as any;
    console.log(`✅ Scan complete!`);
    console.log(`   Status: ${scanResult.status}`);
    console.log(`   Findings: ${scanResult.summary.total}`);
    console.log(`   - Critical: ${scanResult.summary.critical}`);
    console.log(`   - High: ${scanResult.summary.high}`);
    console.log(`   - Medium: ${scanResult.summary.medium}`);
    console.log(`   - Low: ${scanResult.summary.low}`);

    if (scanResult.findings.length > 0) {
      console.log(`\n   Sample finding:`);
      const finding = scanResult.findings[0];
      console.log(`   - ${finding.title}`);
      console.log(`   - Severity: ${finding.severity}`);
      console.log(`   - File: ${finding.location.file}:${finding.location.line}`);
    }
    console.log();

    // All tests passed!
    console.log('🎉 All MCP server tests passed!');
    console.log('\n✅ VibeSec MCP server is working correctly');
    console.log('✅ Ready to use with Claude Code, Cursor, or Cline');
    console.log('\n💡 Next step: Restart Claude Code to activate VibeSec');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  } finally {
    // Clean up
    server.kill();
  }
}

// Run tests
testMCPServer().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
