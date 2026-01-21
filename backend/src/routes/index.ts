import { Router, Request, Response } from 'express';
import scraperRoutes from './scraper';

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
            version: '1.4.0',
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
            version: '1.4.0',
            description: 'Backend API pour Generic Scraper V2',
            endpoints: {
                health: 'GET /api/health',
                info: 'GET /api/info',
                scraper: 'POST /api/scraper/*',
            },
        },
    });
});

// Mount scraper routes
router.use('/scraper', scraperRoutes);

export default router;
