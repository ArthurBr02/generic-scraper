export enum LogLevel {
    DEBUG = 'debug',
    INFO = 'info',
    WARN = 'warn',
    ERROR = 'error',
}

export class Logger {
    private level: LogLevel;

    constructor(level: LogLevel = LogLevel.INFO) {
        this.level = level;
    }

    private shouldLog(level: LogLevel): boolean {
        const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
        return levels.indexOf(level) >= levels.indexOf(this.level);
    }

    private formatMessage(level: string, message: string, meta?: any): string {
        const timestamp = new Date().toISOString();
        const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
        return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
    }

    debug(message: string, meta?: any): void {
        if (this.shouldLog(LogLevel.DEBUG)) {
            console.log(this.formatMessage('debug', message, meta));
        }
    }

    info(message: string, meta?: any): void {
        if (this.shouldLog(LogLevel.INFO)) {
            console.log(this.formatMessage('info', message, meta));
        }
    }

    warn(message: string, meta?: any): void {
        if (this.shouldLog(LogLevel.WARN)) {
            console.warn(this.formatMessage('warn', message, meta));
        }
    }

    error(message: string, error?: Error | any): void {
        if (this.shouldLog(LogLevel.ERROR)) {
            const meta = error instanceof Error ? { message: error.message, stack: error.stack } : error;
            console.error(this.formatMessage('error', message, meta));
        }
    }
}

export const logger = new Logger(
    (process.env.LOG_LEVEL as LogLevel) || LogLevel.INFO
);
