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

      // Attach context
      beforeSend(event, hint) {
        // Add scan metrics to error context
        const scanMetrics = metrics.getScanMetrics();
        event.contexts = {
          ...event.contexts,
          scanMetrics: {
            filesScanned: scanMetrics.filesScanned,
            totalFindings: scanMetrics.totalFindings,
            cacheHitRate: scanMetrics.cacheHits / (scanMetrics.cacheHits + scanMetrics.cacheMisses),
          },
        };

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
