export var LogLevel;
(function (LogLevel) {
    LogLevel["DEBUG"] = "debug";
    LogLevel["INFO"] = "info";
    LogLevel["WARN"] = "warn";
    LogLevel["ERROR"] = "error";
    LogLevel["FATAL"] = "fatal";
})(LogLevel || (LogLevel = {}));
export class Logger {
    constructor(context = 'default') {
        this.logLevel = LogLevel.INFO;
        this.logs = [];
        this.maxLogs = 1000;
        this.context = context;
    }
    static getInstance(context = 'default') {
        if (!Logger.instances.has(context)) {
            Logger.instances.set(context, new Logger(context));
        }
        return Logger.instances.get(context);
    }
    setLevel(level) {
        this.logLevel = level;
    }
    shouldLog(level) {
        const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.FATAL];
        return levels.indexOf(level) >= levels.indexOf(this.logLevel);
    }
    log(level, message, context, error) {
        if (!this.shouldLog(level)) {
            return;
        }
        const entry = {
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
    debug(message, context) {
        this.log(LogLevel.DEBUG, message, context);
    }
    info(message, context) {
        this.log(LogLevel.INFO, message, context);
    }
    warn(message, context) {
        this.log(LogLevel.WARN, message, context);
    }
    error(message, context, error) {
        this.log(LogLevel.ERROR, message, context, error);
    }
    fatal(message, context, error) {
        this.log(LogLevel.FATAL, message, context, error);
    }
    async measure(operation, fn, context) {
        const start = performance.now();
        this.debug(`Starting: ${operation}`, context);
        try {
            const result = await fn();
            const duration = performance.now() - start;
            this.info(`Completed: ${operation}`, { ...context, duration: `${duration.toFixed(2)}ms` });
            return result;
        }
        catch (error) {
            const duration = performance.now() - start;
            this.error(`Failed: ${operation}`, { ...context, duration: `${duration.toFixed(2)}ms` }, error);
            throw error;
        }
    }
    getRecentLogs(count = 100) {
        return this.logs.slice(-count);
    }
    getLogsByLevel(level) {
        return this.logs.filter((log) => log.level === level);
    }
    exportLogs() {
        return JSON.stringify(this.logs, null, 2);
    }
    clear() {
        this.logs = [];
    }
    async close() {
        if (this.logs.length > 0) {
            this.info('Logger closing', { totalLogs: this.logs.length });
        }
    }
}
Logger.instances = new Map();
export const logger = Logger.getInstance();
