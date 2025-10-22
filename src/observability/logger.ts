/**
 * Structured logging for observability
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  error?: Error;
  duration?: number;
}

export class Logger {
  private static instances: Map<string, Logger> = new Map();
  private logLevel: LogLevel;
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private context: string;

  constructor(context: string = 'default') {
    this.context = context;

    // CONFIG-001: Secure logging defaults for production
    this.logLevel = this.getDefaultLogLevel();
  }

  /**
   * Get secure default log level based on environment (CONFIG-001)
   * Production defaults to WARN to minimize sensitive data exposure
   * Development/staging defaults to INFO for debugging
   */
  private getDefaultLogLevel(): LogLevel {
    // 1. Check LOG_LEVEL environment variable
    const envLogLevel = process.env.LOG_LEVEL?.toLowerCase();
    if (envLogLevel) {
      const levelMap: Record<string, LogLevel> = {
        debug: LogLevel.DEBUG,
        info: LogLevel.INFO,
        warn: LogLevel.WARN,
        error: LogLevel.ERROR,
        fatal: LogLevel.FATAL,
      };
      if (levelMap[envLogLevel]) {
        return levelMap[envLogLevel];
      }
    }

    // 2. Check NODE_ENV for environment-specific defaults
    const nodeEnv = process.env.NODE_ENV?.toLowerCase();

    // Production: Default to WARN (minimize information disclosure)
    if (nodeEnv === 'production') {
      return LogLevel.WARN;
    }

    // Staging: Default to INFO (balance between debugging and security)
    if (nodeEnv === 'staging') {
      return LogLevel.INFO;
    }

    // Development/test/unknown: Default to INFO (helpful for debugging)
    return LogLevel.INFO;
  }

  static getInstance(context: string = 'default'): Logger {
    if (!Logger.instances.has(context)) {
      Logger.instances.set(context, new Logger(context));
    }
    return Logger.instances.get(context)!;
  }

  setLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.FATAL];
    return levels.indexOf(level) >= levels.indexOf(this.logLevel);
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      error,
    };

    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console output with formatting
    const prefix = `[${entry.timestamp}] [${level.toUpperCase()}] [${this.context}]`;
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    const errorStr = error ? `\n  Error: ${error.message}\n  Stack: ${error.stack}` : '';

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(`${prefix} ${message}${contextStr}${errorStr}`);
        break;
      case LogLevel.INFO:
        console.log(`${prefix} ${message}${contextStr}${errorStr}`);
        break;
      case LogLevel.WARN:
        console.warn(`${prefix} ${message}${contextStr}${errorStr}`);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(`${prefix} ${message}${contextStr}${errorStr}`);
        break;
    }
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, context?: Record<string, unknown>, error?: Error): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  fatal(message: string, context?: Record<string, unknown>, error?: Error): void {
    this.log(LogLevel.FATAL, message, context, error);
  }

  /**
   * Measure execution time of async operation
   */
  async measure<T>(
    operation: string,
    fn: () => Promise<T>,
    context?: Record<string, unknown>
  ): Promise<T> {
    const start = performance.now();
    this.debug(`Starting: ${operation}`, context);

    try {
      const result = await fn();
      const duration = performance.now() - start;
      this.info(`Completed: ${operation}`, { ...context, duration: `${duration.toFixed(2)}ms` });
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.error(`Failed: ${operation}`, { ...context, duration: `${duration.toFixed(2)}ms` }, error as Error);
      throw error;
    }
  }

  /**
   * Get recent logs for debugging
   */
  getRecentLogs(count = 100): LogEntry[] {
    return this.logs.slice(-count);
  }

  /**
   * Get logs by level
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter((log) => log.level === level);
  }

  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Clear all logs
   */
  clear(): void {
    this.logs = [];
  }

  /**
   * Close logger (flush remaining logs)
   */
  async close(): Promise<void> {
    // In production, this would flush logs to a backend
    // For now, we just ensure logs are available
    if (this.logs.length > 0) {
      this.info('Logger closing', { totalLogs: this.logs.length });
    }
  }
}

// Singleton instance
export const logger = Logger.getInstance();
