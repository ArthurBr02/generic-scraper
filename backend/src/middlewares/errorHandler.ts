import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

export interface ApiError extends Error {
    statusCode?: number;
    details?: any;
}

export function errorHandler(
    err: ApiError,
    req: Request,
    res: Response,
    next: NextFunction
): void {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    logger.error(`Error handling ${req.method} ${req.originalUrl}`, err);

    res.status(statusCode).json({
        success: false,
        error: {
            message,
            ...(process.env.NODE_ENV === 'development' && {
                stack: err.stack,
                details: err.details,
            }),
        },
    });
}

export function notFoundHandler(req: Request, res: Response): void {
    res.status(404).json({
        success: false,
        error: {
            message: `Route ${req.method} ${req.originalUrl} not found`,
        },
    });
}
