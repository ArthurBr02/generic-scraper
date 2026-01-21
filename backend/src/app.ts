import express, { Application } from 'express';
import cors from 'cors';
import { config } from './config.js';
import { logger } from './utils/logger.js';
import { loggingMiddleware } from './middlewares/logging.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';
import apiRoutes from './routes/index.js';

export function createApp(): Application {
    const app = express();

    // Middlewares de base
    app.use(cors({
        origin: config.corsOrigin,
        credentials: true,
    }));

    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Logging middleware
    app.use(loggingMiddleware);

    // Routes
    app.use('/api', apiRoutes);

    // Error handling
    app.use(notFoundHandler);
    app.use(errorHandler);

    return app;
}

export function startServer(app: Application): void {
    const server = app.listen(config.port, config.host, () => {
        logger.info(`🚀 Server started on http://${config.host}:${config.port}`);
        logger.info(`📊 Environment: ${config.nodeEnv}`);
        logger.info(`🔗 CORS enabled for: ${config.corsOrigin}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
        logger.info('SIGTERM signal received: closing HTTP server');
        server.close(() => {
            logger.info('HTTP server closed');
            process.exit(0);
        });
    });

    process.on('SIGINT', () => {
        logger.info('SIGINT signal received: closing HTTP server');
        server.close(() => {
            logger.info('HTTP server closed');
            process.exit(0);
        });
    });
}
