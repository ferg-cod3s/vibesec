# VibeSec Performance Testing Suite

Comprehensive performance and load testing for VibeSec security scanner using `bun:test` framework with secure agent injection.

## 🚀 Quick Start

```bash
# Run all performance tests
bun run test:performance

# Run specific test suites
bun run test:performance:scanner      # Scanner performance tests
bun run test:performance:mcp          # MCP server performance tests  
bun run test:performance:deps          # Dependency analyzer performance tests
bun run test:performance:cross         # Cross-project performance tests

# Run with coverage
bun run test:coverage

# Run individual test files
bun --expose-gc test tests/performance/scanner.test.ts
```

## 📊 Test Suites

### 1. Scanner Performance Tests (`scanner.test.ts`)

Tests the core VibeSec scanner engine with enterprise-scale workloads:

- **Large Codebase Testing**: 1000+ files scanning
- **Memory Usage Monitoring**: Leak detection and usage tracking
- **Concurrent Operations**: Parallel vs sequential scanning
- **File Type Benchmarking**: Performance across different file types

**Key Metrics:**
- Target: <2 minutes for 10K files
- Memory: <500MB peak usage
- Throughput: Files per second measurement

### 2. MCP Server Performance Tests (`mcp-server.test.ts`)

Tests the MCP server's ability to handle concurrent requests:

- **Concurrent Request Handling**: 100+ simultaneous requests
- **Response Time Performance**: Latency measurements
- **Memory Usage Under Load**: Resource management
- **Stress Testing**: Maximum load handling

**Key Metrics:**
- Response time: <100ms average
- Concurrency: 100+ simultaneous requests
- Memory: Stable under load
- Error rate: <5% under normal load

### 3. Dependency Analyzer Performance Tests (`dependency-analyzer.test.ts`)

Tests dependency analysis across different package managers:

- **Large Dependency Trees**: 1000+ dependencies
- **Package Manager Benchmarking**: npm, cargo, pip performance
- **Concurrent Analysis**: Multiple projects simultaneously
- **Memory Efficiency**: Large dependency file handling

**Key Metrics:**
- Analysis time: <15 seconds for 1000 deps
- Memory: <300MB peak usage
- Support: npm, cargo, pip package managers

### 4. Cross-Project Performance Tests (`cross-projects.test.ts`)

Tests VibeSec across all projects in `~/Github/`:

- **Multi-Language Testing**: JavaScript, TypeScript, Python, Go, Rust
- **Project Size Scaling**: Small, medium, large projects
- **Real-World Performance**: Actual codebase testing
- **Error Handling**: Graceful failure management

**Key Metrics:**
- Success rate: >90% across projects
- Average scan time: <60 seconds
- Language coverage: Multiple programming languages
- Memory efficiency: <1GB peak usage

## 🔒 Security Features

### Secure Agent Injection

All tests use the `SecureAgentInjector` class with:

- **Path Validation**: Prevents directory traversal attacks
- **Concurrency Limits**: Controls simultaneous operations
- **Timeout Protection**: Prevents hanging tests
- **Output Sanitization**: Removes sensitive information

### Security Configurations

```typescript
// Development testing
SECURITY_CONFIGS.development = {
  allowedPaths: ['/Users/johnferguson/Github/vibesec'],
  maxConcurrency: 5,
  defaultTimeout: 120000, // 2 minutes
  sanitizeOutput: true
}

// Cross-project testing  
SECURITY_CONFIGS.crossProject = {
  allowedPaths: ['/Users/johnferguson/Github'],
  maxConcurrency: 3,
  defaultTimeout: 300000, // 5 minutes
  sanitizeOutput: true
}

// CI/CD testing
SECURITY_CONFIGS.ci = {
  allowedPaths: ['/tmp', './tests'],
  maxConcurrency: 2,
  defaultTimeout: 60000, // 1 minute
  sanitizeOutput: true
}
```

## 📈 Performance Monitoring

### Memory Profiling

Uses `MemoryProfiler` for comprehensive memory tracking:

```typescript
const memoryProfiler = new MemoryProfiler();
memoryProfiler.start(100); // Snapshot every 100ms

// ... run test ...

const memoryProfile = memoryProfiler.stop();
console.log(`Peak memory: ${MemoryProfiler.formatMemory(memoryProfile.peakHeapUsed)}`);
```

### Benchmarking

Uses `PerformanceBenchmark` for performance metrics:

```typescript
const benchmark = new PerformanceBenchmark();
benchmark.start();

// ... run test ...

const result = benchmark.stop('test-name', filesScanned);
console.log(`Duration: ${PerformanceBenchmark.formatDuration(result.duration)}`);
console.log(`Throughput: ${result.filesPerSecond.toFixed(2)} files/sec`);
```

### Memory Leak Detection

Automatic leak detection with configurable thresholds:

```typescript
const leak = MemoryProfiler.detectLeak(memoryProfile);
if (leak.detected) {
  console.warn(`Memory leak detected: ${MemoryProfiler.formatMemory(leak.growthRate)}/s`);
}
```

## 🎯 Performance Targets

### Scanner Targets
- **Speed**: <2 minutes for 10K files
- **Memory**: <500MB peak usage
- **Throughput**: >100 files/second
- **Scalability**: Linear performance scaling

### MCP Server Targets  
- **Response Time**: <100ms average
- **Concurrency**: 100+ simultaneous requests
- **Memory**: Stable under load
- **Error Rate**: <1% under normal load

### Dependency Analyzer Targets
- **Analysis Speed**: <15 seconds for 1000 deps
- **Memory**: <300MB peak usage
- **Package Managers**: Full npm, cargo, pip support
- **Concurrent Analysis**: 5+ simultaneous projects

## 🛠️ Test Configuration

### Environment Variables

```bash
# Enable performance testing mode
export VIBESEC_TEST_MODE=performance

# Set maximum projects for cross-project testing
export VIBESEC_TEST_MAX_PROJECTS=20

# Enable garbage collection for accurate memory measurement
export NODE_OPTIONS="--expose-gc"
```

### Test Data Generation

Tests automatically generate realistic test data:

```typescript
// Generate 1000 mixed files
await generateTestFiles(tempDir, 1000, 'mixed');

// Generate dependency files
await generateDependencyFiles('npm', 1000, tempDir);

// Create large files
await createLargeFiles(tempDir, [
  { name: 'large.js', size: 1024 * 1024 * 4 } // 4MB
]);
```

## 📋 Running Tests

### Individual Test Execution

```bash
# Run specific test with timeout
bun --expose-gc test tests/performance/scanner.test.ts

# Run with coverage report
bun test --coverage tests/performance/

# Run with verbose output
bun test --verbose tests/performance/
```

### Batch Execution

```bash
# Use the performance test runner
bun run scripts/run-performance-tests.ts

# This provides:
# - Automatic test discovery
# - Timeout handling
# - Retry logic
# - Clean output formatting
# - Comprehensive reporting
```

## 📊 Reporting

### Test Runner Output

```
🚀 Starting VibeSec Performance Test Suite
📁 Test directory: /path/to/tests/performance

📋 Running Scanner Performance Tests
  ✅ scanner.test.ts (45.23s)
  ✅ large-codebase (12.34s)
  ✅ memory-usage (8.91s)

📋 Running MCP Server Performance Tests  
  ✅ mcp-server.test.ts (38.45s)
  ✅ concurrent-requests (15.67s)

═════════════════════════════════════════════════════════
                    PERFORMANCE TEST SUMMARY                     
═══════════════════════════════════════════════════════════

📊 RESULTS:
  Total Tests: 15
  Passed: 14 ✅
  Failed: 1 ❌
  Timeout: 0 ⏰
  Success Rate: 93.3%
```

### Cross-Project Report

```
═══════════════════════════════════════════════════════════
              VibeSec Cross-Project Performance Report           
═══════════════════════════════════════════════════════════

📊 SUMMARY
Total Projects: 8
Successful: 7 ✅
Failed: 1 ❌
Total Files Scanned: 2,847
Total Findings: 156

⚡ PERFORMANCE METRICS
Average Scan Time: 23.45s
Maximum Scan Time: 67.89s
Average Memory Usage: 245.67 MB
Maximum Memory Usage: 512.34 MB

📝 LANGUAGE BREAKDOWN
javascript: 4 projects, avg 18.23s
typescript: 2 projects, avg 31.45s
python: 1 project, avg 45.67s
go: 1 project, avg 12.34s
```

## 🔧 Troubleshooting

### Common Issues

**Tests timing out:**
```bash
# Increase timeout
export VIBESEC_TEST_TIMEOUT=600000  # 10 minutes

# Run with more memory
export NODE_OPTIONS="--max-old-space-size=4096 --expose-gc"
```

**Memory issues:**
```bash
# Force garbage collection before tests
bun --expose-gc test

# Check available memory
free -h
```

**Path issues:**
```bash
# Verify allowed paths
echo $HOME/Github

# Check permissions
ls -la $HOME/Github
```

### Debug Mode

Enable detailed logging:

```typescript
// In test files
const secureInjector = new SecureAgentInjector({
  ...SECURITY_CONFIGS.development,
  logLevel: 'detailed'  // Enable detailed logging
});
```

## 📝 Development

### Adding New Tests

1. Create test file in `tests/performance/`
2. Use `SecureAgentInjector` for security
3. Include performance benchmarks
4. Add memory profiling
5. Update test runner configuration

### Test Structure

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { createSecureInjector } from '../utils/secure-injector';

describe('New Performance Test', () => {
  let secureInjector = createSecureInjector('performance');

  it('should perform efficiently', async () => {
    const result = await secureInjector.execute(
      '/test/path',
      async () => {
        // Test implementation
        return performOperation();
      },
      {
        timeout: 30000,
        sanitization: { hideSecrets: true }
      }
    );

    expect(result).toBeDefined();
    expect(result.duration).toBeLessThan(5000);
  });
});
```

## 📚 Additional Resources

- [bun:test Documentation](https://bun.sh/docs/test)
- [VibeSec Performance Guidelines](./docs/PERFORMANCE.md)
- [Security Testing Best Practices](./docs/SECURITY.md)
- [Memory Profiling Guide](./docs/MEMORY_PROFILING.md)