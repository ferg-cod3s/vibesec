import { BaseTransport, TransportError } from './base';
import { createInterface } from 'readline';
export class StdioTransport extends BaseTransport {
    constructor() {
        super(...arguments);
        this.lineReader = null;
        this.buffer = '';
        this.pendingRequests = [];
        this.resolveNext = null;
    }
    async start() {
        await super.start();
        if (typeof process !== 'undefined' && process.stdin) {
            this.lineReader = createInterface({
                input: process.stdin,
                output: process.stdout,
                terminal: false,
            });
            this.lineReader.on('line', (line) => {
                if (line.trim()) {
                    try {
                        const request = JSON.parse(line);
                        if (this.resolveNext) {
                            this.resolveNext(request);
                            this.resolveNext = null;
                        }
                        else {
                            this.pendingRequests.push(request);
                        }
                    }
                    catch (error) {
                    }
                }
            });
            this.lineReader.on('close', () => {
                this.running = false;
            });
        }
        else {
            throw new TransportError('stdin not available', 'STDIN_UNAVAILABLE');
        }
    }
    async send(message) {
        if (!this.running) {
            throw new TransportError('Transport not started', 'NOT_STARTED');
        }
        try {
            const json = JSON.stringify(message);
            process.stdout.write(json + '\n');
        }
        catch (error) {
            throw new TransportError('Failed to send message', 'SEND_ERROR', error);
        }
    }
    async receive() {
        if (!this.running) {
            throw new TransportError('Transport not started', 'NOT_STARTED');
        }
        if (this.pendingRequests.length > 0) {
            return this.pendingRequests.shift();
        }
        return new Promise((resolve, reject) => {
            if (!this.running) {
                reject(new TransportError('stdin closed', 'STDIN_CLOSED'));
                return;
            }
            this.resolveNext = resolve;
        });
    }
    async close() {
        this.running = false;
        if (this.lineReader) {
            this.lineReader.close();
            this.lineReader = null;
        }
        this.buffer = '';
        this.pendingRequests = [];
        this.resolveNext = null;
    }
    hasBufferedData() {
        return this.pendingRequests.length > 0;
    }
    clearBuffer() {
        this.buffer = '';
        this.pendingRequests = [];
    }
}
