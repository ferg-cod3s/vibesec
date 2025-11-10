import * as Sentry from '@sentry/bun';
import { ErrorCategory } from '../error-reporter';
import { metrics } from '../metrics';
export class SentryIntegration {
    constructor() {
        this.initialized = false;
    }
    init(config) {
        if (this.initialized) {
            return;
        }
        Sentry.init({
            dsn: config.dsn,
            environment: config.environment,
            tracesSampleRate: config.tracesSampleRate || 0.1,
            release: config.release,
            ...(config.serverUrl ? {
                tunnel: config.serverUrl,
                transportOptions: {
                    url: config.serverUrl
                }
            } : {}),
            beforeSend(event, hint) {
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
    captureError(error, category, context) {
        if (!this.initialized) {
            console.warn('Sentry not initialized');
            return '';
        }
        Sentry.setContext('errorCategory', { category });
        if (context) {
            Sentry.setContext('additionalContext', context);
        }
        Sentry.addBreadcrumb({
            category: 'error',
            message: `${category} error occurred`,
            level: this.getSentryLevel(category),
            data: context,
        });
        const eventId = Sentry.captureException(error, {
            tags: {
                category,
                source: 'vibesec',
            },
            extra: context,
        });
        return eventId;
    }
    async startSpan(name, op, callback) {
        return await Sentry.startSpan({
            name,
            op,
        }, callback);
    }
    addBreadcrumb(message, category, data) {
        Sentry.addBreadcrumb({
            message,
            category,
            data,
            timestamp: Date.now() / 1000,
        });
    }
    setUser(userId, email, username) {
        Sentry.setUser({
            id: userId,
            email,
            username,
        });
    }
    getSentryLevel(category) {
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
    async close(timeout = 2000) {
        await Sentry.close(timeout);
    }
}
export const sentry = new SentryIntegration();
export function initSentryFromEnv() {
    const dsn = process.env.SENTRY_DSN;
    if (!dsn) {
        console.log('Sentry DSN not configured, skipping initialization');
        return;
    }
    sentry.init({
        dsn,
        environment: process.env.NODE_ENV || 'development',
        release: process.env.VIBESEC_VERSION,
        tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
        profilesSampleRate: parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE || '0.1'),
    });
    console.log('✅ Sentry initialized for error monitoring');
}
