import { Router, Request, Response } from 'express';
import scraperRoutes from './scraper';
import databaseRoutes from './database';
import tasksRoutes from './tasks';

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
            version: '2.0.0',
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
            version: '2.0.0',
            description: 'Backend API pour Generic Scraper V2',
            endpoints: {
                health: 'GET /api/health',
                info: 'GET /api/info',
                tasks: 'GET/POST/PUT/DELETE /api/tasks/*',
                scraper: 'POST /api/scraper/*',
                database: 'GET /api/database/*',
            },
        },
    });
});

// Mount routes
router.use('/tasks', tasksRoutes);
router.use('/scraper', scraperRoutes);
router.use('/database', databaseRoutes);

export default router;
