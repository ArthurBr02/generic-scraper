import { Router, Request, Response } from 'express';
import scraperRoutes from './scraper';
import databaseRoutes from './database';

const router = Router();

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/health', (req: Request, res: Response) => {
    res.json({
        success: true,
        data: {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'development',
            version: '1.5.0',
        },
    });
});

/**
 * GET /api/info
 * API information
 */
router.get('/info', (req: Request, res: Response) => {
    res.json({
        success: true,
        data: {
            name: 'Generic Scraper API',
            version: '1.5.0',
            description: 'Backend API pour Generic Scraper V2',
            endpoints: {
                health: 'GET /api/health',
                info: 'GET /api/info',
                scraper: 'POST /api/scraper/*',
                database: 'GET /api/database/*',
            },
        },
    });
});

// Mount routes
router.use('/scraper', scraperRoutes);
router.use('/database', databaseRoutes);

export default router;
