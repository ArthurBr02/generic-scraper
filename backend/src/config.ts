export interface Config {
    nodeEnv: string;
    port: number;
    host: string;
    databasePath: string;
    corsOrigin: string;
    logLevel: string;
}

export const config: Config = {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '4000', 10),
    host: process.env.HOST || '0.0.0.0',
    databasePath: process.env.DATABASE_PATH || '../data/scraper.db',
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    logLevel: process.env.LOG_LEVEL || 'info',
};
