/**
 * Audit Logging for Security Events (LOG-001 fix)
 *
 * Provides structured audit logging for security-relevant events:
 * - Path traversal attempts
 * - Scan operations
 * - Rule loading
 * - MCP tool invocations
 * - Critical security findings
 */

import { Logger, LogLevel } from './logger';
import { PathValidationError } from '../../lib/errors/types';

/**
 * Security event types
 */
export enum AuditEventType {
  // Path security events
  PATH_TRAVERSAL_ATTEMPT = 'path_traversal_attempt',
  PATH_VALIDATION_FAILED = 'path_validation_failed',

  // Scan lifecycle events
  SCAN_STARTED = 'scan_started',
  SCAN_COMPLETED = 'scan_completed',
  SCAN_FAILED = 'scan_failed',

  // Rule events
  RULES_LOADED = 'rules_loaded',
  RULE_LOAD_FAILED = 'rule_load_failed',

  // MCP events
  MCP_SERVER_STARTED = 'mcp_server_started',
  MCP_SERVER_STOPPED = 'mcp_server_stopped',
  MCP_TOOL_INVOKED = 'mcp_tool_invoked',
  MCP_TOOL_FAILED = 'mcp_tool_failed',

  // Security findings
  CRITICAL_FINDING = 'critical_finding',
  HIGH_SEVERITY_FINDING = 'high_severity_finding',

  // Configuration events
  CONFIG_LOADED = 'config_loaded',
  CONFIG_CHANGED = 'config_changed',

  // Authentication/Authorization (future)
  AUTH_ATTEMPT = 'auth_attempt',
  AUTH_FAILED = 'auth_failed',
  PERMISSION_DENIED = 'permission_denied',
}

/**
 * Audit event severity
 */
export enum AuditSeverity {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical',
}

/**
 * Audit log entry structure
 */
export interface AuditLogEntry {
  /** Event timestamp */
  timestamp: string;

  /** Event type */
  eventType: AuditEventType;

  /** Event severity */
  severity: AuditSeverity;

  /** User/actor (e.g., 'cli', 'mcp', 'api') */
  actor: string;

  /** Resource being accessed (path, rule ID, etc.) */
  resource?: string;

  /** Action attempted (read, scan, invoke, etc.) */
  action?: string;

  /** Result (success, failure, blocked) */
  result: 'success' | 'failure' | 'blocked';

  /** Additional context */
  context?: Record<string, unknown>;

  /** Error message if failed */
  errorMessage?: string;
}

/**
 * Audit Logger
 * Specialized logger for security-relevant events
 */
export class AuditLogger {
  private logger: Logger;
  private auditLogs: AuditLogEntry[] = [];
  private maxAuditLogs = 10000;

  constructor(context: string = 'audit') {
    this.logger = Logger.getInstance(context);
  }

  /**
   * Log a security event
   */
  logEvent(entry: Omit<AuditLogEntry, 'timestamp'>): void {
    const fullEntry: AuditLogEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
    };

    // Store in memory
    this.auditLogs.push(fullEntry);
    if (this.auditLogs.length > this.maxAuditLogs) {
      this.auditLogs.shift();
    }

    // Log to console/file based on severity
    const logLevel = this.getLogLevel(entry.severity);
    this.logger.log(
      logLevel,
      `[AUDIT] ${entry.eventType}: ${entry.result}`,
      {
        actor: entry.actor,
        resource: entry.resource,
        action: entry.action,
        ...entry.context,
      },
      entry.errorMessage ? new Error(entry.errorMessage) : undefined
    );
  }

  /**
   * Log path traversal attempt (INJ-001 related)
   */
  logPathTraversalAttempt(attemptedPath: string, actor: string, error: PathValidationError): void {
    this.logEvent({
      eventType: AuditEventType.PATH_TRAVERSAL_ATTEMPT,
      severity: AuditSeverity.CRITICAL,
      actor,
      resource: attemptedPath,
      action: 'validate_path',
      result: 'blocked',
      errorMessage: error.message,
      context: {
        errorCode: error.code,
        detectionTime: new Date().toISOString(),
      },
    });
  }

  /**
   * Log scan operation start
   */
  logScanStarted(path: string, actor: string, options?: Record<string, unknown>): void {
    this.logEvent({
      eventType: AuditEventType.SCAN_STARTED,
      severity: AuditSeverity.INFO,
      actor,
      resource: path,
      action: 'scan',
      result: 'success',
      context: options,
    });
  }

  /**
   * Log scan operation completion
   */
  logScanCompleted(
    path: string,
    actor: string,
    stats: {
      filesScanned: number;
      findingsCount: number;
      criticalCount: number;
      highCount: number;
      duration: number;
    }
  ): void {
    const severity =
      stats.criticalCount > 0
        ? AuditSeverity.CRITICAL
        : stats.highCount > 0
          ? AuditSeverity.WARNING
          : AuditSeverity.INFO;

    this.logEvent({
      eventType: AuditEventType.SCAN_COMPLETED,
      severity,
      actor,
      resource: path,
      action: 'scan',
      result: 'success',
      context: stats,
    });
  }

  /**
   * Log scan failure
   */
  logScanFailed(path: string, actor: string, error: Error): void {
    this.logEvent({
      eventType: AuditEventType.SCAN_FAILED,
      severity: AuditSeverity.WARNING,
      actor,
      resource: path,
      action: 'scan',
      result: 'failure',
      errorMessage: error.message,
    });
  }

  /**
   * Log critical security finding
   */
  logCriticalFinding(
    file: string,
    ruleId: string,
    finding: {
      line?: number;
      description: string;
    }
  ): void {
    this.logEvent({
      eventType: AuditEventType.CRITICAL_FINDING,
      severity: AuditSeverity.CRITICAL,
      actor: 'scanner',
      resource: file,
      action: 'detect',
      result: 'success',
      context: {
        ruleId,
        line: finding.line,
        description: finding.description,
      },
    });
  }

  /**
   * Log MCP tool invocation
   */
  logMCPToolInvoked(toolName: string, params: Record<string, unknown>): void {
    this.logEvent({
      eventType: AuditEventType.MCP_TOOL_INVOKED,
      severity: AuditSeverity.INFO,
      actor: 'mcp',
      resource: toolName,
      action: 'invoke',
      result: 'success',
      context: {
        params: this.sanitizeParams(params),
      },
    });
  }

  /**
   * Log MCP tool failure
   */
  logMCPToolFailed(toolName: string, error: Error, params?: Record<string, unknown>): void {
    this.logEvent({
      eventType: AuditEventType.MCP_TOOL_FAILED,
      severity: AuditSeverity.WARNING,
      actor: 'mcp',
      resource: toolName,
      action: 'invoke',
      result: 'failure',
      errorMessage: error.message,
      context: params ? { params: this.sanitizeParams(params) } : undefined,
    });
  }

  /**
   * Log rules loaded
   */
  logRulesLoaded(count: number, rulesPath?: string): void {
    this.logEvent({
      eventType: AuditEventType.RULES_LOADED,
      severity: AuditSeverity.INFO,
      actor: 'scanner',
      resource: rulesPath || 'default',
      action: 'load_rules',
      result: 'success',
      context: { count },
    });
  }

  /**
   * Get recent audit logs
   */
  getRecentLogs(count: number = 100): AuditLogEntry[] {
    return this.auditLogs.slice(-count);
  }

  /**
   * Get audit logs by event type
   */
  getLogsByType(eventType: AuditEventType): AuditLogEntry[] {
    return this.auditLogs.filter((log) => log.eventType === eventType);
  }

  /**
   * Get security incidents (critical and warning events)
   */
  getSecurityIncidents(): AuditLogEntry[] {
    return this.auditLogs.filter(
      (log) =>
        log.severity === AuditSeverity.CRITICAL ||
        log.severity === AuditSeverity.WARNING
    );
  }

  /**
   * Export audit logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.auditLogs, null, 2);
  }

  /**
   * Clear audit logs (use with caution)
   */
  clear(): void {
    this.auditLogs = [];
    this.logger.warn('Audit logs cleared');
  }

  /**
   * Get log level from audit severity
   */
  private getLogLevel(severity: AuditSeverity): LogLevel {
    switch (severity) {
      case AuditSeverity.CRITICAL:
        return LogLevel.ERROR;
      case AuditSeverity.WARNING:
        return LogLevel.WARN;
      case AuditSeverity.INFO:
        return LogLevel.INFO;
    }
  }

  /**
   * Sanitize parameters to remove sensitive data
   */
  private sanitizeParams(params: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};
    const sensitiveKeys = ['password', 'token', 'secret', 'api_key', 'dsn'];

    for (const [key, value] of Object.entries(params)) {
      if (sensitiveKeys.some((sk) => key.toLowerCase().includes(sk))) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }
}

// Singleton instance
export const auditLogger = new AuditLogger();
