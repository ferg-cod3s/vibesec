/**
 * Centralized error reporting and tracking
 */

import { logger } from './logger';
import { metrics } from './metrics';

export enum ErrorCategory {
  PARSE_ERROR = 'parse_error',
  CONFIG_ERROR = 'config_error',
  FILE_SYSTEM_ERROR = 'file_system_error',
  CACHE_ERROR = 'cache_error',
  DETECTION_ERROR = 'detection_error',
  VALIDATION_ERROR = 'validation_error',
  SYSTEM_ERROR = 'system_error',
}

export interface ErrorReport {
  id: string;
  category: ErrorCategory;
  message: string;
  error: Error;
  context?: Record<string, unknown>;
  timestamp: string;
  stackTrace?: string;
  resolved: boolean;
}

export class ErrorReporter {
  private static instance: ErrorReporter;
  private errors: ErrorReport[] = [];
  private maxErrors = 500;
  private errorCount: Record<ErrorCategory, number> = {
    [ErrorCategory.PARSE_ERROR]: 0,
    [ErrorCategory.CONFIG_ERROR]: 0,
    [ErrorCategory.FILE_SYSTEM_ERROR]: 0,
    [ErrorCategory.CACHE_ERROR]: 0,
    [ErrorCategory.DETECTION_ERROR]: 0,
    [ErrorCategory.VALIDATION_ERROR]: 0,
    [ErrorCategory.SYSTEM_ERROR]: 0,
  };

  private constructor() {}

  static getInstance(): ErrorReporter {
    if (!ErrorReporter.instance) {
      ErrorReporter.instance = new ErrorReporter();
    }
    return ErrorReporter.instance;
  }

  /**
   * Report an error
   */
  report(
    category: ErrorCategory,
    message: string,
    error: Error,
    context?: Record<string, unknown>
  ): ErrorReport {
    const errorReport: ErrorReport = {
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      category,
      message,
      error,
      context,
      timestamp: new Date().toISOString(),
      stackTrace: error.stack,
      resolved: false,
    };

    // Store error
    this.errors.push(errorReport);
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    // Update counts
    this.errorCount[category]++;

    // Log error
    logger.error(message, { category, errorId: errorReport.id, ...context }, error);

    // Record metric
    metrics.increment('errors_total', 1, { category });

    return errorReport;
  }

  /**
   * Report parse error
   */
  reportParseError(file: string, error: Error, context?: Record<string, unknown>): ErrorReport {
    return this.report(
      ErrorCategory.PARSE_ERROR,
      `Failed to parse file: ${file}`,
      error,
      { file, ...context }
    );
  }

  /**
   * Report config error
   */
  reportConfigError(configPath: string, error: Error, context?: Record<string, unknown>): ErrorReport {
    return this.report(
      ErrorCategory.CONFIG_ERROR,
      `Failed to load config: ${configPath}`,
      error,
      { configPath, ...context }
    );
  }

  /**
   * Report file system error
   */
  reportFileSystemError(operation: string, path: string, error: Error): ErrorReport {
    return this.report(
      ErrorCategory.FILE_SYSTEM_ERROR,
      `File system error during ${operation}: ${path}`,
      error,
      { operation, path }
    );
  }

  /**
   * Report cache error
   */
  reportCacheError(operation: string, error: Error, context?: Record<string, unknown>): ErrorReport {
    return this.report(
      ErrorCategory.CACHE_ERROR,
      `Cache ${operation} failed`,
      error,
      { operation, ...context }
    );
  }

  /**
   * Report detection error
   */
  reportDetectionError(
    ruleId: string,
    file: string,
    error: Error,
    context?: Record<string, unknown>
  ): ErrorReport {
    return this.report(
      ErrorCategory.DETECTION_ERROR,
      `Detection failed for rule ${ruleId} in ${file}`,
      error,
      { ruleId, file, ...context }
    );
  }

  /**
   * Mark error as resolved
   */
  resolve(errorId: string): boolean {
    const error = this.errors.find((e) => e.id === errorId);
    if (error) {
      error.resolved = true;
      logger.info(`Error resolved`, { errorId });
      return true;
    }
    return false;
  }

  /**
   * Get unresolved errors
   */
  getUnresolvedErrors(): ErrorReport[] {
    return this.errors.filter((e) => !e.resolved);
  }

  /**
   * Get errors by category
   */
  getErrorsByCategory(category: ErrorCategory): ErrorReport[] {
    return this.errors.filter((e) => e.category === category);
  }

  /**
   * Get error statistics
   */
  getStats(): {
    total: number;
    unresolved: number;
    byCategory: Record<ErrorCategory, number>;
    recentErrors: ErrorReport[];
  } {
    return {
      total: this.errors.length,
      unresolved: this.getUnresolvedErrors().length,
      byCategory: { ...this.errorCount },
      recentErrors: this.errors.slice(-10),
    };
  }

  /**
   * Export errors as JSON
   */
  export(): string {
    return JSON.stringify(
      {
        stats: this.getStats(),
        errors: this.errors,
      },
      null,
      2
    );
  }

  /**
   * Get error summary for reporting
   */
  getSummary(): string {
    const stats = this.getStats();
    const lines: string[] = [];

    lines.push('=== Error Summary ===');
    lines.push(`Total errors: ${stats.total}`);
    lines.push(`Unresolved: ${stats.unresolved}`);
    lines.push('');
    lines.push('By Category:');
    for (const [category, count] of Object.entries(stats.byCategory)) {
      if (count > 0) {
        lines.push(`  ${category}: ${count}`);
      }
    }

    if (stats.recentErrors.length > 0) {
      lines.push('');
      lines.push('Recent Errors:');
      for (const error of stats.recentErrors.slice(-5)) {
        lines.push(`  [${error.category}] ${error.message}`);
      }
    }

    return lines.join('\n');
  }

  /**
   * Clear all errors
   */
  clear(): void {
    this.errors = [];
    for (const key in this.errorCount) {
      this.errorCount[key as ErrorCategory] = 0;
    }
  }
}

// Singleton instance
export const errorReporter = ErrorReporter.getInstance();
