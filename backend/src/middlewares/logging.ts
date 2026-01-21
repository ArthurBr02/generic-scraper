import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

export function loggingMiddleware(req: Request, res: Response, next: NextFunction): void {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        const { method, originalUrl } = req;
        const { statusCode } = res;

        logger.info(`${method} ${originalUrl}`, {
            statusCode,
            duration: `${duration}ms`,
        });
    });

    next();
}
