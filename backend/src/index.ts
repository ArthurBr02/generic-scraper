import 'dotenv/config';
import { createApp, startServer } from './app.js';
import { logger } from './utils/logger.js';

async function main() {
    try {
        logger.info('🔧 Initializing Generic Scraper Backend...');

        const app = createApp();
        startServer(app);

    } catch (error) {
        logger.error('Failed to start server', error);
        process.exit(1);
    }
}

main();
