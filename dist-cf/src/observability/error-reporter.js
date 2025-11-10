import { logger } from './logger';
import { metrics } from './metrics';
export var ErrorCategory;
(function (ErrorCategory) {
    ErrorCategory["PARSE_ERROR"] = "parse_error";
    ErrorCategory["CONFIG_ERROR"] = "config_error";
    ErrorCategory["FILE_SYSTEM_ERROR"] = "file_system_error";
    ErrorCategory["CACHE_ERROR"] = "cache_error";
    ErrorCategory["DETECTION_ERROR"] = "detection_error";
    ErrorCategory["VALIDATION_ERROR"] = "validation_error";
    ErrorCategory["SYSTEM_ERROR"] = "system_error";
})(ErrorCategory || (ErrorCategory = {}));
export class ErrorReporter {
    constructor() {
        this.errors = [];
        this.maxErrors = 500;
        this.errorCount = {
            [ErrorCategory.PARSE_ERROR]: 0,
            [ErrorCategory.CONFIG_ERROR]: 0,
            [ErrorCategory.FILE_SYSTEM_ERROR]: 0,
            [ErrorCategory.CACHE_ERROR]: 0,
            [ErrorCategory.DETECTION_ERROR]: 0,
            [ErrorCategory.VALIDATION_ERROR]: 0,
            [ErrorCategory.SYSTEM_ERROR]: 0,
        };
    }
    static getInstance() {
        if (!ErrorReporter.instance) {
            ErrorReporter.instance = new ErrorReporter();
        }
        return ErrorReporter.instance;
    }
    report(category, message, error, context) {
        const errorReport = {
            id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            category,
            message,
            error,
            context,
            timestamp: new Date().toISOString(),
            stackTrace: error.stack,
            resolved: false,
        };
        this.errors.push(errorReport);
        if (this.errors.length > this.maxErrors) {
            this.errors.shift();
        }
        this.errorCount[category]++;
        logger.error(message, { category, errorId: errorReport.id, ...context }, error);
        metrics.increment('errors_total', 1, { category });
        return errorReport;
    }
    reportParseError(file, error, context) {
        return this.report(ErrorCategory.PARSE_ERROR, `Failed to parse file: ${file}`, error, { file, ...context });
    }
    reportConfigError(configPath, error, context) {
        return this.report(ErrorCategory.CONFIG_ERROR, `Failed to load config: ${configPath}`, error, { configPath, ...context });
    }
    reportFileSystemError(operation, path, error) {
        return this.report(ErrorCategory.FILE_SYSTEM_ERROR, `File system error during ${operation}: ${path}`, error, { operation, path });
    }
    reportCacheError(operation, error, context) {
        return this.report(ErrorCategory.CACHE_ERROR, `Cache ${operation} failed`, error, { operation, ...context });
    }
    reportDetectionError(ruleId, file, error, context) {
        return this.report(ErrorCategory.DETECTION_ERROR, `Detection failed for rule ${ruleId} in ${file}`, error, { ruleId, file, ...context });
    }
    resolve(errorId) {
        const error = this.errors.find((e) => e.id === errorId);
        if (error) {
            error.resolved = true;
            logger.info(`Error resolved`, { errorId });
            return true;
        }
        return false;
    }
    getUnresolvedErrors() {
        return this.errors.filter((e) => !e.resolved);
    }
    getErrorsByCategory(category) {
        return this.errors.filter((e) => e.category === category);
    }
    getStats() {
        return {
            total: this.errors.length,
            unresolved: this.getUnresolvedErrors().length,
            byCategory: { ...this.errorCount },
            recentErrors: this.errors.slice(-10),
        };
    }
    export() {
        return JSON.stringify({
            stats: this.getStats(),
            errors: this.errors,
        }, null, 2);
    }
    getSummary() {
        const stats = this.getStats();
        const lines = [];
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
    clear() {
        this.errors = [];
        for (const key in this.errorCount) {
            this.errorCount[key] = 0;
        }
    }
}
export const errorReporter = ErrorReporter.getInstance();
