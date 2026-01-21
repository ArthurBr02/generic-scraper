/**
 * Point d'entrée pour utiliser le Generic Scraper comme bibliothèque
 * 
 * Ce module expose une API propre pour utiliser le scraper depuis une application externe
 * sans impacter le fonctionnement CLI existant dans src/index.js
 * 
 * @module lib
 */

const Scraper = require('./core/scraper');
const Scheduler = require('./core/scheduler');
const { loadConfig, validateConfig } = require('./utils/configLoader');
const { getLogger, setLogLevel } = require('./utils/logger');
const { getActionNames, getAction } = require('./actions');

/**
 * Execute a scraping configuration
 * 
 * @param {Object} config - Configuration object or path to config file
 * @param {Object} options - Execution options
 * @param {boolean} options.headless - Run browser in headless mode (default: true)
 * @param {string} options.logLevel - Log level (debug, info, warn, error)
 * @param {Function} options.onProgress - Progress callback
 * @returns {Promise<Object>} Scraping results
 * 
 * @example
 * const { execute } = require('./src/lib');
 * 
 * const config = {
 *   name: 'My Scraper',
 *   target: { url: 'https://example.com' },
 *   workflow: { steps: [...] }
 * };
 * 
 * const results = await execute(config);
 */
async function execute(config, options = {}) {
  const logger = getLogger();
  
  // Set log level if specified
  if (options.logLevel) {
    setLogLevel(options.logLevel);
  }
  
  // Load config from file if string path is provided
  let loadedConfig = config;
  if (typeof config === 'string') {
    logger.info(`Loading configuration from file: ${config}`);
    loadedConfig = loadConfig({ configPath: config });
  }
  
  // Override browser headless mode if specified
  if (options.headless !== undefined) {
    loadedConfig.browser = loadedConfig.browser || {};
    loadedConfig.browser.headless = options.headless;
  }
  
  // Create scraper instance
  const scraper = new Scraper(loadedConfig);
  
  try {
    // Initialize browser and workflow
    await scraper.initialize();
    
    logger.info('Starting scraper execution');
    
    // Execute workflow
    const results = await scraper.run();
    
    // Save output if configured
    if (loadedConfig.output) {
      await scraper.saveOutput(results);
    }
    
    logger.info('Scraper execution completed successfully', {
      success: results.success,
      itemsExtracted: results.data ? Object.keys(results.data).length : 0
    });
    
    return results;
    
  } catch (error) {
    logger.error('Scraper execution failed', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  } finally {
    // Always cleanup browser
    await scraper.close();
  }
}

/**
 * Execute a configuration from a file path
 * 
 * @param {string} configPath - Path to configuration file
 * @param {Object} options - Execution options
 * @returns {Promise<Object>} Scraping results
 * 
 * @example
 * const { executeFromFile } = require('./src/lib');
 * const results = await executeFromFile('./configs/my-config.json');
 */
async function executeFromFile(configPath, options = {}) {
  return execute(configPath, options);
}

/**
 * Validate a configuration object
 * 
 * @param {Object} config - Configuration to validate
 * @param {string} schemaPath - Optional custom schema path
 * @returns {Object} Validation result with { valid: boolean, errors: Array }
 * 
 * @example
 * const { validateConfiguration } = require('./src/lib');
 * const result = validateConfiguration(myConfig);
 * if (!result.valid) {
 *   console.error('Config errors:', result.errors);
 * }
 */
function validateConfiguration(config, schemaPath) {
  return validateConfig(config, schemaPath);
}

/**
 * Get list of all available action types
 * 
 * @returns {Array<string>} Array of action type names
 * 
 * @example
 * const { getAvailableActions } = require('./src/lib');
 * const actions = getAvailableActions();
 * console.log('Available actions:', actions);
 */
function getAvailableActions() {
  return getActionNames();
}

/**
 * Get schema/metadata for a specific action type
 * 
 * @param {string} actionType - Type of action (e.g., 'navigate', 'click', 'extract')
 * @returns {Object|null} Action schema or null if not found
 * 
 * @example
 * const { getActionSchema } = require('./src/lib');
 * const schema = getActionSchema('navigate');
 * console.log('Navigate action schema:', schema);
 */
function getActionSchema(actionType) {
  const action = getAction(actionType);
  if (!action) {
    return null;
  }
  
  // Return action metadata if available
  return {
    type: actionType,
    description: action.description || '',
    schema: action.schema || {},
    examples: action.examples || []
  };
}

/**
 * Create a scheduler for running scraping tasks on a schedule
 * 
 * @param {Object} config - Configuration with scheduling settings
 * @param {Function} scraperFactory - Factory function to create scraper instances
 * @returns {Scheduler} Scheduler instance
 * 
 * @example
 * const { createScheduler, execute } = require('./src/lib');
 * 
 * const scheduler = createScheduler(config, () => execute(config));
 * scheduler.start();
 */
function createScheduler(config, scraperFactory) {
  return new Scheduler(config, scraperFactory);
}

/**
 * Get logger instance for custom logging
 * 
 * @returns {Object} Logger instance
 */
function getLoggerInstance() {
  return getLogger();
}

// Export main API
module.exports = {
  // Core execution
  execute,
  executeFromFile,
  
  // Validation
  validateConfiguration,
  loadConfig,
  
  // Action registry
  getAvailableActions,
  getActionSchema,
  
  // Scheduler
  createScheduler,
  Scheduler,
  
  // Core classes (for advanced usage)
  Scraper,
  
  // Utilities
  getLogger: getLoggerInstance,
  setLogLevel
};
