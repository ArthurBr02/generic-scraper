import express, { Application } from 'express';
import cors from 'cors';
import { config } from './config.js';
import { logger } from './utils/logger.js';
import { loggingMiddleware } from './middlewares/logging.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';
import apiRoutes from './routes/index.js';
import { databaseService } from './services/DatabaseService.js';

export async function createApp(): Promise<Application> {
    const app = express();

    // Initialize database
    try {
        logger.info('Initializing database...');
        await databaseService.init();
        logger.info('✅ Database initialized successfully');
    } catch (error: any) {
        logger.error('Failed to initialize database', { error: error.message });
        throw error;
    }

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
    const gracefulShutdown = async (signal: string) => {
        logger.info(`${signal} signal received: closing server`);
        
        // Close HTTP server
        server.close(async () => {
            logger.info('HTTP server closed');
            
            // Close database connection
            try {
                await databaseService.close();
                logger.info('Database connection closed');
            } catch (error: any) {
                logger.error('Error closing database', { error: error.message });
            }
            
            process.exit(0);
        });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}
