/**
 * Sentry integration for production error monitoring
 *
 * Recommended setup for VibeSec:
 * - npm install @sentry/bun (or @sentry/node)
 * - Set SENTRY_DSN environment variable
 */

import * as Sentry from '@sentry/bun'; // or @sentry/node
import { errorReporter, ErrorCategory } from '../error-reporter';
import { metrics } from '../metrics';
import * as os from 'os';
import * as path from 'path';

/**
 * PII scrubbing configuration
 */
const SENSITIVE_KEYS = [
  'password', 'token', 'secret', 'api_key', 'apikey', 'auth',
  'credential', 'private_key', 'session', 'cookie', 'dsn',
  'SENTRY_DSN', 'API_KEY', 'SECRET', 'PASSWORD', 'TOKEN',
];

const PLACEHOLDER = '[REDACTED]';

/**
 * Scrub sensitive data from Sentry events (DATA-002 fix)
 * Removes PII, file paths, environment variables, and other sensitive information
 */
function scrubSensitiveData(event: Sentry.Event): Sentry.Event {
  // 1. Scrub file paths from exception stack traces
  if (event.exception?.values) {
    event.exception.values = event.exception.values.map(exception => {
      if (exception.stacktrace?.frames) {
        exception.stacktrace.frames = exception.stacktrace.frames.map(frame => ({
          ...frame,
          filename: scrubFilePath(frame.filename || ''),
          abs_path: frame.abs_path ? scrubFilePath(frame.abs_path) : undefined,
        }));
      }
      return exception;
    });
  }

  // 2. Scrub request data (if present)
  if (event.request) {
    // Scrub headers
    if (event.request.headers) {
      event.request.headers = scrubObject(event.request.headers);
    }
    // Scrub query string
    if (event.request.query_string) {
      event.request.query_string = scrubString(event.request.query_string);
    }
    // Scrub cookies
    if (event.request.cookies) {
      event.request.cookies = scrubObject(event.request.cookies);
    }
    // Scrub environment (may contain secrets)
    if (event.request.env) {
      event.request.env = scrubObject(event.request.env);
    }
  }

  // 3. Scrub user data (keep only non-sensitive identifiers)
  if (event.user) {
    event.user = {
      id: event.user.id,
      // Remove email, username, ip_address, etc.
    };
  }

  // 4. Scrub contexts (additional context data)
  if (event.contexts) {
    // Keep our scanMetrics context (non-sensitive)
    const { scanMetrics, ...otherContexts } = event.contexts;
    event.contexts = {
      ...(scanMetrics ? { scanMetrics } : {}),
      ...scrubObject(otherContexts as Record<string, unknown>),
    };
  }

  // 5. Scrub tags
  if (event.tags) {
    event.tags = scrubObject(event.tags);
  }

  // 6. Scrub extra data
  if (event.extra) {
    event.extra = scrubObject(event.extra);
  }

  // 7. Scrub breadcrumbs
  if (event.breadcrumbs) {
    event.breadcrumbs = event.breadcrumbs.map(breadcrumb => ({
      ...breadcrumb,
      message: scrubString(breadcrumb.message || ''),
      data: breadcrumb.data ? scrubObject(breadcrumb.data) : undefined,
    }));
  }

  return event;
}

/**
 * Scrub file paths to remove user-specific information
 * Keeps relative structure but removes absolute paths
 */
function scrubFilePath(filePath: string): string {
  if (!filePath) return filePath;

  // Get home directory and username
  const homeDir = os.homedir();
  const username = path.basename(homeDir);

  // Replace home directory with placeholder
  let scrubbed = filePath.replace(homeDir, '[HOME]');

  // Replace username if it appears in path
  scrubbed = scrubbed.replace(new RegExp(username, 'g'), '[USER]');

  // Replace common sensitive path segments
  scrubbed = scrubbed.replace(/\/Users\/[^/]+/, '/Users/[USER]');
  scrubbed = scrubbed.replace(/\/home\/[^/]+/, '/home/[USER]');
  scrubbed = scrubbed.replace(/C:\\Users\\[^\\]+/, 'C:\\Users\\[USER]');

  // Keep only relative paths for VibeSec project files
  if (scrubbed.includes('vibesec')) {
    const vibesecIndex = scrubbed.lastIndexOf('vibesec');
    scrubbed = scrubbed.substring(vibesecIndex);
  }

  return scrubbed;
}

/**
 * Scrub sensitive keys from an object
 */
function scrubObject<T extends Record<string, unknown>>(obj: T): T {
  if (!obj || typeof obj !== 'object') return obj;

  const scrubbed: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    // Check if key contains sensitive terms
    const isSensitive = SENSITIVE_KEYS.some(sensitiveKey =>
      key.toLowerCase().includes(sensitiveKey.toLowerCase())
    );

    if (isSensitive) {
      scrubbed[key] = PLACEHOLDER;
    } else if (typeof value === 'object' && value !== null) {
      // Recursively scrub nested objects
      scrubbed[key] = Array.isArray(value)
        ? value.map(item => typeof item === 'object' ? scrubObject(item as any) : scrubString(String(item)))
        : scrubObject(value as Record<string, unknown>);
    } else if (typeof value === 'string') {
      scrubbed[key] = scrubString(value);
    } else {
      scrubbed[key] = value;
    }
  }

  return scrubbed as T;
}

/**
 * Scrub sensitive patterns from strings
 */
function scrubString(str: string): string {
  if (!str || typeof str !== 'string') return str;

  let scrubbed = str;

  // Scrub common secret patterns
  const patterns = [
    // API keys, tokens
    /\b[A-Za-z0-9]{32,}\b/g,
    // JWT tokens
    /eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g,
    // Generic secret=value patterns
    /(secret|token|password|api_key)=["']?[^"'\s]+/gi,
    // Environment variable assignments
    /(SENTRY_DSN|API_KEY|SECRET|PASSWORD|TOKEN)=["']?[^"'\s]+/gi,
  ];

  for (const pattern of patterns) {
    scrubbed = scrubbed.replace(pattern, PLACEHOLDER);
  }

  // Scrub file paths
  scrubbed = scrubFilePath(scrubbed);

  return scrubbed;
}

export interface SentryConfig {
  dsn: string;
  environment: 'development' | 'staging' | 'production';
  tracesSampleRate?: number;
  profilesSampleRate?: number;
  release?: string;
  serverUrl?: string; // For self-hosted Sentry instances
}

export class SentryIntegration {
  private initialized = false;

  /**
   * Initialize Sentry
   */
  init(config: SentryConfig): void {
    if (this.initialized) {
      return;
    }

    Sentry.init({
      dsn: config.dsn,
      environment: config.environment,
      tracesSampleRate: config.tracesSampleRate || 0.1, // 10% performance traces
      // profilesSampleRate: config.profilesSampleRate || 0.1, // Not supported in @sentry/bun yet
      release: config.release,

      // Self-hosted Sentry support
      ...(config.serverUrl ? {
        tunnel: config.serverUrl,
        transportOptions: {
          url: config.serverUrl
        }
      } : {}),

      // DATA-002: PII scrubbing hook
      beforeSend(event, hint) {
        // Add scan metrics to error context (non-sensitive)
        const scanMetrics = metrics.getScanMetrics();
        event.contexts = {
          ...event.contexts,
          scanMetrics: {
            filesScanned: scanMetrics.filesScanned,
            totalFindings: scanMetrics.totalFindings,
            cacheHitRate: scanMetrics.cacheHits / (scanMetrics.cacheHits + scanMetrics.cacheMisses),
          },
        };

        // Scrub PII and sensitive data
        event = scrubSensitiveData(event);

        return event;
      },
    });

    this.initialized = true;
  }

  /**
   * Report error to Sentry
   */
  captureError(
    error: Error,
    category: ErrorCategory,
    context?: Record<string, unknown>
  ): string {
    if (!this.initialized) {
      console.warn('Sentry not initialized');
      return '';
    }

    // Set error context
    Sentry.setContext('errorCategory', { category });
    if (context) {
      Sentry.setContext('additionalContext', context);
    }

    // Add breadcrumb
    Sentry.addBreadcrumb({
      category: 'error',
      message: `${category} error occurred`,
      level: this.getSentryLevel(category),
      data: context,
    });

    // Capture exception
    const eventId = Sentry.captureException(error, {
      tags: {
        category,
        source: 'vibesec',
      },
      extra: context,
    });

    return eventId;
  }

  /**
   * Start span for performance monitoring (Sentry v8+ API)
   */
  async startSpan<T>(name: string, op: string, callback: () => Promise<T>): Promise<T> {
    return await Sentry.startSpan(
      {
        name,
        op,
      },
      callback
    );
  }

  /**
   * Add breadcrumb for tracking
   */
  addBreadcrumb(message: string, category: string, data?: Record<string, unknown>): void {
    Sentry.addBreadcrumb({
      message,
      category,
      data,
      timestamp: Date.now() / 1000,
    });
  }

  /**
   * Set user context
   */
  setUser(userId: string, email?: string, username?: string): void {
    Sentry.setUser({
      id: userId,
      email,
      username,
    });
  }

  /**
   * Get Sentry severity level from error category
   */
  private getSentryLevel(category: ErrorCategory): Sentry.SeverityLevel {
    switch (category) {
      case ErrorCategory.SYSTEM_ERROR:
        return 'fatal';
      case ErrorCategory.PARSE_ERROR:
      case ErrorCategory.DETECTION_ERROR:
        return 'error';
      case ErrorCategory.CONFIG_ERROR:
      case ErrorCategory.CACHE_ERROR:
        return 'warning';
      default:
        return 'info';
    }
  }

  /**
   * Flush events before exit
   */
  async close(timeout = 2000): Promise<void> {
    await Sentry.close(timeout);
  }
}

// Singleton instance
export const sentry = new SentryIntegration();

/**
 * Initialize Sentry from environment
 */
export function initSentryFromEnv(): void {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    console.log('Sentry DSN not configured, skipping initialization');
    return;
  }

  sentry.init({
    dsn,
    environment: (process.env.NODE_ENV as any) || 'development',
    release: process.env.VIBESEC_VERSION,
    tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
    profilesSampleRate: parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE || '0.1'),
  });

  console.log('✅ Sentry initialized for error monitoring');
}
