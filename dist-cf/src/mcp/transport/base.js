export class BaseTransport {
    constructor() {
        this.running = false;
    }
    async start() {
        this.running = true;
    }
    async stop() {
        this.running = false;
    }
    isRunning() {
        return this.running;
    }
}
export class TransportError extends Error {
    constructor(message, code, cause) {
        super(message);
        this.code = code;
        this.cause = cause;
        this.name = 'TransportError';
    }
}
