/**
 * Secure Agent Injection Utility for VibeSec Testing
 * 
 * Provides secure, sanitized test execution with proper
 * path validation, timeout handling, and output sanitization.
 */

import * as path from 'path';
import * as crypto from 'crypto';

export interface SecurityConfig {
  allowedPaths: string[];
  maxConcurrency: number;
  defaultTimeout: number;
  maxPayloadSize: number;
  sanitizeOutput: boolean;
  logLevel: 'none' | 'basic' | 'detailed';
}

export interface ExecutionContext {
  id: string;
  startTime: number;
  endTime?: number;
  status: 'running' | 'completed' | 'failed' | 'timeout';
  error?: string;
  metadata?: Record<string, any>;
}

export interface SanitizationOptions {
  hideSecrets: boolean;
  hidePaths: boolean;
  hidePersonalInfo: boolean;
  maxLength?: number;
}

/**
 * Secure Agent Injector for safe test execution
 */
export class SecureAgentInjector {
  private config: SecurityConfig;
  private activeExecutions: Map<string, ExecutionContext> = new Map();
  private currentConcurrency = 0;

  constructor(config: SecurityConfig) {
    this.config = config;
    this.validateConfig();
  }

  /**
   * Execute a function with security constraints
   */
  async execute<T>(
    targetPath: string,
    executionFn: () => Promise<T>,
    options?: {
      timeout?: number;
      sanitization?: SanitizationOptions;
      metadata?: Record<string, any>;
    }
  ): Promise<T> {
    const executionId = this.generateExecutionId();
    const startTime = Date.now();

    // Validate and sanitize path
    const sanitizedPath = this.validateAndSanitizePath(targetPath);
    
    // Check concurrency limits
    if (this.currentConcurrency >= this.config.maxConcurrency) {
      throw new Error(`Maximum concurrency (${this.config.maxConcurrency}) exceeded`);
    }

    const context: ExecutionContext = {
      id: executionId,
      startTime,
      status: 'running',
      metadata: options?.metadata
    };

    this.activeExecutions.set(executionId, context);
    this.currentConcurrency++;

    try {
      // Execute with timeout
      const timeout = options?.timeout || this.config.defaultTimeout;
      const result = await Promise.race([
        executionFn(),
        this.createTimeout(timeout)
      ]);

      // Update context
      context.endTime = Date.now();
      context.status = 'completed';

      // Sanitize result if requested
      const sanitizedResult = options?.sanitization ? 
        this.sanitizeOutput(result, options.sanitization) : result;

      return sanitizedResult;

    } catch (error) {
      context.endTime = Date.now();
      context.status = error instanceof Error && error.message.includes('timeout') ? 'timeout' : 'failed';
      context.error = error instanceof Error ? error.message : String(error);
      throw error;

    } finally {
      this.currentConcurrency--;
      
      // Log execution if configured
      if (this.config.logLevel !== 'none') {
        this.logExecution(context, sanitizedPath);
      }
    }
  }

  /**
   * Execute multiple operations concurrently with security constraints
   */
  async executeConcurrent<T>(
    operations: Array<{
      path: string;
      fn: () => Promise<T>;
      options?: {
        timeout?: number;
        sanitization?: SanitizationOptions;
        metadata?: Record<string, any>;
      };
    }>
  ): Promise<Array<{ success: boolean; result?: T; error?: string }>> {
    // Limit concurrent operations
    const limitedOps = operations.slice(0, this.config.maxConcurrency);

    const promises = limitedOps.map(async (op, index) => {
      try {
        const result = await this.execute(
          op.path,
          op.fn,
          {
            ...op.options,
            metadata: { ...op.options?.metadata, index }
          }
        );
        return { success: true, result };
      } catch (error) {
        return { 
          success: false, 
          error: error instanceof Error ? error.message : String(error) 
        };
      }
    });

    return Promise.all(promises);
  }

  /**
   * Validate and sanitize file path
   */
  private validateAndSanitizePath(targetPath: string): string {
    // Resolve to absolute path
    const absolutePath = path.resolve(targetPath);
    
    // Check if path is allowed
    const isAllowed = this.config.allowedPaths.some(allowed => 
      absolutePath.startsWith(path.resolve(allowed))
    );

    if (!isAllowed) {
      throw new Error(`Path not allowed: ${targetPath}`);
    }

    // Check for directory traversal
    if (absolutePath.includes('..') || absolutePath.includes('~')) {
      throw new Error(`Path traversal detected: ${targetPath}`);
    }

    return absolutePath;
  }

  /**
   * Generate unique execution ID
   */
  private generateExecutionId(): string {
    return `exec_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }

  /**
   * Create timeout promise
   */
  private createTimeout(ms: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Execution timeout after ${ms}ms`)), ms);
    });
  }

  /**
   * Sanitize output to remove sensitive information
   */
  private sanitizeOutput<T>(output: T, options: SanitizationOptions): T {
    if (!this.config.sanitizeOutput) return output;

    try {
      const outputStr = JSON.stringify(output);
      let sanitized = outputStr;

      // Hide secrets
      if (options.hideSecrets) {
        sanitized = sanitized.replace(/["'][\w\-_]{20,}["']/g, '"***REDACTED***"');
        sanitized = sanitized.replace(/["'][A-Za-z0-9+/]{40,}["']/g, '"***REDACTED***"');
        sanitized = sanitized.replace(/sk-[a-zA-Z0-9]{20,}/g, 'sk-***REDACTED***');
      }

      // Hide paths
      if (options.hidePaths) {
        sanitized = sanitized.replace(/["'][^"']{10,}\/[^"']{1,}["']/g, '"/***REDACTED***/***PATH***"');
        sanitized = sanitized.replace(/\/Users\/[^"'\s]+/g, '/***USER***/');
      }

      // Hide personal information
      if (options.hidePersonalInfo) {
        sanitized = sanitized.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '***EMAIL***');
        sanitized = sanitized.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '***PHONE***');
      }

      // Truncate if too long
      if (options.maxLength && sanitized.length > options.maxLength) {
        sanitized = sanitized.substring(0, options.maxLength) + '...[TRUNCATED]';
      }

      return JSON.parse(sanitized);
    } catch {
      // If sanitization fails, return original but mark it
      console.warn('Output sanitization failed, returning original');
      return output;
    }
  }

  /**
   * Log execution details
   */
  private logExecution(context: ExecutionContext, sanitizedPath: string): void {
    if (this.config.logLevel === 'basic') {
      console.log(`[${context.id}] ${context.status} - ${path.basename(sanitizedPath)}`);
    } else if (this.config.logLevel === 'detailed') {
      const duration = context.endTime ? context.endTime - context.startTime : Date.now() - context.startTime;
      const logPath = this.config.sanitizeOutput ? path.basename(sanitizedPath) : sanitizedPath;
      
      console.log(`[${context.id}] ${context.status.toUpperCase()}`);
      console.log(`  Path: ${logPath}`);
      console.log(`  Duration: ${duration}ms`);
      
      if (context.error) {
        console.log(`  Error: ${context.error}`);
      }
      
      if (context.metadata) {
        console.log(`  Metadata: ${JSON.stringify(context.metadata)}`);
      }
    }
  }

  /**
   * Validate configuration
   */
  private validateConfig(): void {
    if (!this.config.allowedPaths || this.config.allowedPaths.length === 0) {
      throw new Error('No allowed paths configured');
    }

    if (this.config.maxConcurrency < 1) {
      throw new Error('Max concurrency must be at least 1');
    }

    if (this.config.defaultTimeout < 1000) {
      throw new Error('Default timeout must be at least 1000ms');
    }
  }

  /**
   * Get current execution statistics
   */
  getStats(): {
    active: number;
    totalExecuted: number;
    successRate: number;
    averageDuration: number;
  } {
    const executions = Array.from(this.activeExecutions.values());
    const completed = executions.filter(e => e.status === 'completed');
    const failed = executions.filter(e => e.status === 'failed' || e.status === 'timeout');

    const totalExecuted = completed.length + failed.length;
    const successRate = totalExecuted > 0 ? completed.length / totalExecuted : 0;
    
    const completedWithDuration = completed.filter(e => e.endTime !== undefined);
    const averageDuration = completedWithDuration.length > 0 ? 
      completedWithDuration.reduce((sum, e) => sum + (e.endTime! - e.startTime), 0) / completedWithDuration.length : 
      0;

    return {
      active: this.currentConcurrency,
      totalExecuted,
      successRate,
      averageDuration
    };
  }

  /**
   * Cleanup completed executions
   */
  cleanup(): void {
    // Remove completed executions older than 1 hour
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    
    for (const [id, context] of this.activeExecutions.entries()) {
      if (context.endTime && context.endTime < oneHourAgo) {
        this.activeExecutions.delete(id);
      }
    }
  }

  /**
   * Generate security report
   */
  generateSecurityReport(): string {
    const stats = this.getStats();
    const lines = [
      '═══════════════════════════════════════════════════════════════',
      '                 VibeSec Security Injection Report              ',
      '═══════════════════════════════════════════════════════════════',
      '',
      '🔒 CONFIGURATION:',
      `  Allowed Paths: ${this.config.allowedPaths.join(', ')}`,
      `  Max Concurrency: ${this.config.maxConcurrency}`,
      `  Default Timeout: ${this.config.defaultTimeout}ms`,
      `  Output Sanitization: ${this.config.sanitizeOutput ? 'Enabled' : 'Disabled'}`,
      '',
      '📊 STATISTICS:',
      `  Active Executions: ${stats.active}`,
      `  Total Executed: ${stats.totalExecuted}`,
      `  Success Rate: ${(stats.successRate * 100).toFixed(1)}%`,
      `  Average Duration: ${stats.averageDuration.toFixed(2)}ms`,
      '',
      '🛡️  SECURITY STATUS:',
      `  Path Validation: ✅ Active`,
      `  Concurrency Limits: ✅ Active`,
      `  Output Sanitization: ${this.config.sanitizeOutput ? '✅ Active' : '⚠️  Disabled'}`,
      `  Timeout Protection: ✅ Active`,
      ''
    ];

    return lines.join('\n');
  }
}

/**
 * Default security configurations for different test scenarios
 */
export const SECURITY_CONFIGS = {
  // Local development testing
  development: {
    allowedPaths: ['/Users/johnferguson/Github/vibesec'],
    maxConcurrency: 5,
    defaultTimeout: 120000, // 2 minutes
    maxPayloadSize: 10 * 1024 * 1024, // 10MB
    sanitizeOutput: true,
    logLevel: 'basic' as const
  },

  // Cross-project testing (more permissive)
  crossProject: {
    allowedPaths: ['/Users/johnferguson/Github'],
    maxConcurrency: 3,
    defaultTimeout: 300000, // 5 minutes
    maxPayloadSize: 50 * 1024 * 1024, // 50MB
    sanitizeOutput: true,
    logLevel: 'detailed' as const
  },

  // CI/CD testing (restrictive)
  ci: {
    allowedPaths: ['/tmp', './tests'],
    maxConcurrency: 2,
    defaultTimeout: 60000, // 1 minute
    maxPayloadSize: 5 * 1024 * 1024, // 5MB
    sanitizeOutput: true,
    logLevel: 'none' as const
  },

  // Performance testing (optimized for speed)
  performance: {
    allowedPaths: ['/Users/johnferguson/Github'],
    maxConcurrency: 10,
    defaultTimeout: 180000, // 3 minutes
    maxPayloadSize: 100 * 1024 * 1024, // 100MB
    sanitizeOutput: false, // Don't sanitize for performance testing
    logLevel: 'none' as const
  }
};

/**
 * Create a secure injector with the specified configuration
 */
export function createSecureInjector(configName: keyof typeof SECURITY_CONFIGS): SecureAgentInjector {
  const config = SECURITY_CONFIGS[configName];
  if (!config) {
    throw new Error(`Unknown security configuration: ${configName}`);
  }
  
  return new SecureAgentInjector(config);
}