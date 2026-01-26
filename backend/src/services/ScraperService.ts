/**
 * ScraperService - Service layer for interacting with the Generic Scraper
 * 
 * This service wraps the scraper library (src/lib.js) and provides
 * an async API for the backend to execute scraping tasks.
 */

import * as path from 'path';
import { EventEmitter } from 'events';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import type {
  ScraperConfig,
  ScraperResult,
  ExecutionOptions,
  ActionSchema,
  ValidationResult
} from '../types/scraper.types';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Service for managing and executing scraping tasks
 */
export class ScraperService extends EventEmitter {
  private configsPath: string;
  private outputPath: string;
  private scraperLib: any = null;

  constructor() {
    super();
    // In Docker: __dirname = /app/src/services, so we need ../../configs
    // In local dev: __dirname = backend/src/services, so we also need ../../configs (from backend root)
    this.configsPath = path.resolve(__dirname, '../../configs');
    this.outputPath = path.resolve(__dirname, '../../output');
  }

  /**
   * Lazy-load the scraper library to avoid circular dependencies
   */
  private getScraperLib(): any {
    if (!this.scraperLib) {
      // In Docker, the scraper engine is at /app/scraper-engine/src (SCRAPER_ENGINE_PATH env var)
      // In local dev, it's at ../../../src
      const require = createRequire(import.meta.url);
      const scraperEnginePath = process.env.SCRAPER_ENGINE_PATH 
        ? path.join(process.env.SCRAPER_ENGINE_PATH, 'src')
        : path.resolve(__dirname, '../../../src');
      const scraperLibPath = path.join(scraperEnginePath, 'lib.js');
      console.log(`[ScraperService] Loading scraper lib from: ${scraperLibPath}`);
      this.scraperLib = require(scraperLibPath);
    }
    return this.scraperLib;
  }

  /**
   * Execute a scraping configuration
   * 
   * @param config - Configuration object or path to config file
   * @param options - Execution options
   * @returns Promise resolving to scraping results
   */
  async execute(
    config: ScraperConfig | string,
    options: ExecutionOptions = {}
  ): Promise<ScraperResult> {
    try {
      // If config is a string, resolve it as a path
      let configToExecute = config;
      if (typeof config === 'string') {
        configToExecute = this.resolveConfigPath(config);
      }

      // Emit start event
      this.emit('execution:start', { config: configToExecute });

      // Execute the scraper
      const result = await this.getScraperLib().execute(configToExecute, {
        headless: options.headless ?? true,
        logLevel: options.logLevel ?? 'info',
        onProgress: (event: any) => {
          // Forward progress events
          this.emit('execution:progress', event);
          if (options.onProgress) {
            options.onProgress(event);
          }
        }
      });

      // Emit completion event
      this.emit('execution:complete', { result });

      return result;

    } catch (error: any) {
      // Emit error event
      this.emit('execution:error', { error });

      throw new Error(`Scraper execution failed: ${error.message}`);
    }
  }

  /**
   * Execute a configuration from a file in the configs/ folder
   * 
   * @param configName - Name of the config file (with or without .json)
   * @param options - Execution options
   * @returns Promise resolving to scraping results
   */
  async executeFromFile(
    configName: string,
    options: ExecutionOptions = {}
  ): Promise<ScraperResult> {
    const configPath = this.resolveConfigPath(configName);
    return this.execute(configPath, options);
  }

  /**
   * Validate a configuration object
   * 
   * @param config - Configuration to validate
   * @returns Validation result
   */
  validateConfig(config: ScraperConfig): ValidationResult {
    try {
      return this.getScraperLib().validateConfiguration(config);
    } catch (error: any) {
      return {
        valid: false,
        errors: [{
          instancePath: '',
          message: error.message
        }]
      };
    }
  }

  /**
   * Get all available action types
   * 
   * @returns Array of action type names
   */
  getAvailableActions(): string[] {
    return this.getScraperLib().getAvailableActions();
  }

  /**
   * Get schema for a specific action type
   * 
   * @param actionType - Type of action
   * @returns Action schema or null if not found
   */
  getActionSchema(actionType: string): ActionSchema | null {
    return this.getScraperLib().getActionSchema(actionType);
  }

  /**
   * Get all action schemas
   * 
   * @returns Array of all action schemas
   */
  getAllActionSchemas(): ActionSchema[] {
    const actions = this.getAvailableActions();
    return actions
      .map(type => this.getActionSchema(type))
      .filter((schema): schema is ActionSchema => schema !== null);
  }

  /**
   * Load a configuration from file
   * 
   * @param configName - Name of the config file
   * @returns Loaded configuration object
   */
  loadConfig(configName: string): ScraperConfig {
    console.log(`[ScraperService.loadConfig] Called with: ${configName}`);
    const configPath = this.resolveConfigPath(configName);
    console.log(`[ScraperService.loadConfig] Loading from path: ${configPath}`);
    
    try {
      const scraperLib = this.getScraperLib();
      console.log(`[ScraperService.loadConfig] Scraper lib loaded, calling loadConfig...`);
      
      const config = scraperLib.loadConfig({ configPath });
      
      console.log(`[ScraperService.loadConfig] Config loaded successfully:`, config?.name || 'unknown');
      return config;
    } catch (error: any) {
      console.error(`[ScraperService.loadConfig] Error loading config:`, error);
      throw error;
    }
  }

  /**
   * Resolve a config name to an absolute path
   * 
   * @param configName - Config name or path
   * @returns Absolute path to config file
   */
  resolveConfigPath(configName: string): string {
    // If already an absolute path, use it
    if (path.isAbsolute(configName)) {
      console.log(`[ScraperService] Config path is already absolute: ${configName}`);
      return configName;
    }

    // Add .json extension if not present
    const fileName = configName.endsWith('.json') ? configName : `${configName}.json`;

    // Check if it's in the examples folder
    if (configName.includes('/') || configName.includes('\\')) {
      const resolved = path.join(this.configsPath, fileName);
      console.log(`[ScraperService] Resolved config path (subfolder): ${resolved}`);
      return resolved;
    }

    // Otherwise, look in configs root
    const resolved = path.join(this.configsPath, fileName);
    console.log(`[ScraperService] Resolved config path (root): ${resolved}`);
    console.log(`[ScraperService] configsPath base: ${this.configsPath}`);
    return resolved;
  }
}

// Export singleton instance
export const scraperService = new ScraperService();
