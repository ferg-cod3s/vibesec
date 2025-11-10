export class MetricsCollector {
    constructor() {
        this.metrics = [];
        this.scanMetrics = {};
    }
    static getInstance() {
        if (!MetricsCollector.instance) {
            MetricsCollector.instance = new MetricsCollector();
        }
        return MetricsCollector.instance;
    }
    record(name, value, unit, tags) {
        this.metrics.push({
            name,
            value,
            unit,
            tags,
            timestamp: Date.now(),
        });
    }
    increment(name, value = 1, tags) {
        this.record(name, value, 'count', tags);
    }
    timing(name, durationMs, tags) {
        this.record(name, durationMs, 'ms', tags);
    }
    histogram(name, value, tags) {
        this.timing(name, value, tags);
    }
    memory(name, bytes, tags) {
        this.record(name, bytes, 'bytes', tags);
    }
    updateScanMetrics(updates) {
        this.scanMetrics = { ...this.scanMetrics, ...updates };
    }
    getScanMetrics() {
        return {
            totalFiles: this.scanMetrics.totalFiles || 0,
            filesScanned: this.scanMetrics.filesScanned || 0,
            filesSkipped: this.scanMetrics.filesSkipped || 0,
            cacheHits: this.scanMetrics.cacheHits || 0,
            cacheMisses: this.scanMetrics.cacheMisses || 0,
            totalFindings: this.scanMetrics.totalFindings || 0,
            findingsBySeverity: this.scanMetrics.findingsBySeverity || {},
            scanDuration: this.scanMetrics.scanDuration || 0,
            avgFileParseTime: this.scanMetrics.avgFileParseTime || 0,
            peakMemoryUsage: this.scanMetrics.peakMemoryUsage || 0,
            errors: this.scanMetrics.errors || 0,
        };
    }
    getSummary() {
        const metricsByType = {};
        for (const metric of this.metrics) {
            metricsByType[metric.name] = (metricsByType[metric.name] || 0) + 1;
        }
        return {
            totalMetrics: this.metrics.length,
            metricsByType,
            recentMetrics: this.metrics.slice(-10),
        };
    }
    export() {
        return JSON.stringify({
            scanMetrics: this.getScanMetrics(),
            allMetrics: this.metrics,
            summary: this.getSummary(),
        }, null, 2);
    }
    exportPrometheus() {
        const lines = [];
        const scanMetrics = this.getScanMetrics();
        lines.push(`# HELP vibesec_files_total Total files discovered`);
        lines.push(`# TYPE vibesec_files_total gauge`);
        lines.push(`vibesec_files_total ${scanMetrics.totalFiles}`);
        lines.push(`# HELP vibesec_files_scanned Files scanned`);
        lines.push(`# TYPE vibesec_files_scanned counter`);
        lines.push(`vibesec_files_scanned ${scanMetrics.filesScanned}`);
        lines.push(`# HELP vibesec_cache_hits Cache hits`);
        lines.push(`# TYPE vibesec_cache_hits counter`);
        lines.push(`vibesec_cache_hits ${scanMetrics.cacheHits}`);
        lines.push(`# HELP vibesec_findings_total Total security findings`);
        lines.push(`# TYPE vibesec_findings_total gauge`);
        lines.push(`vibesec_findings_total ${scanMetrics.totalFindings}`);
        lines.push(`# HELP vibesec_scan_duration_seconds Scan duration in seconds`);
        lines.push(`# TYPE vibesec_scan_duration_seconds gauge`);
        lines.push(`vibesec_scan_duration_seconds ${scanMetrics.scanDuration / 1000}`);
        lines.push(`# HELP vibesec_memory_bytes Peak memory usage in bytes`);
        lines.push(`# TYPE vibesec_memory_bytes gauge`);
        lines.push(`vibesec_memory_bytes ${scanMetrics.peakMemoryUsage}`);
        for (const [severity, count] of Object.entries(scanMetrics.findingsBySeverity)) {
            lines.push(`vibesec_findings{severity="${severity}"} ${count}`);
        }
        return lines.join('\n');
    }
    reset() {
        this.metrics = [];
        this.scanMetrics = {};
    }
    async flush() {
        this.reset();
    }
    async close() {
        await this.flush();
    }
}
export const metrics = MetricsCollector.getInstance();
