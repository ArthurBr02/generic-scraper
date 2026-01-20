/**
 * Action registry - Factory pattern for all actions
 * Manages registration and execution of workflow actions
 */

const { getLogger } = require('../utils/logger');
const { ErrorHandler } = require('../utils/error-handler');

// Action registry map
const actions = new Map();

/**
 * Register an action
 * @param {string} name - Action name
 * @param {Object} action - Action module with execute method
 */
function registerAction(name, action) {
  if (!action.execute || typeof action.execute !== 'function') {
    throw new Error(`Action ${name} must have an execute method`);
  }
  actions.set(name, action);
  getLogger().debug(`Action registered: ${name}`);
}

/**
 * Get a registered action
 * @param {string} name - Action name
 * @returns {Object|null} Action module
 */
function getAction(name) {
  return actions.get(name) || null;
}

/**
 * Check if an action is registered
 * @param {string} name - Action name
 * @returns {boolean}
 */
function hasAction(name) {
  return actions.has(name);
}

/**
 * Get all registered action names
 * @returns {Array<string>}
 */
function getActionNames() {
  return Array.from(actions.keys());
}

/**
 * Execute an action
 * @param {Page} page - Playwright page
 * @param {Object} step - Step configuration
 * @param {Object} context - Execution context
 * @returns {Promise<any>} Action result
 */
async function executeAction(page, step, context) {
  const logger = context.logger || getLogger();
  const { type, config = {}, name, id, retry, timeout } = step;

  if (!type) {
    throw new Error('Action type is required');
  }

  const action = getAction(type);
  
  if (!action) {
    throw new Error(`Unknown action type: ${type}`);
  }

  const stepLabel = name || id || type;
  logger.info(`Executing action: ${stepLabel}`, { type, config });

  const startTime = Date.now();

  // Get retry configuration from step or global config
  const globalErrorHandling = context.config?.errorHandling || {};
  const retryOptions = {
    retries: retry?.retries ?? globalErrorHandling.retries ?? 3,
    retryDelay: retry?.delay ?? globalErrorHandling.retryDelay ?? 1000,
    backoffMultiplier: retry?.backoffMultiplier ?? 2,
    maxRetryDelay: retry?.maxRetryDelay ?? 30000,
    continueOnError: step.continueOnError ?? globalErrorHandling.continueOnError ?? false,
    screenshotOnError: retry?.screenshotOnError ?? globalErrorHandling.screenshotOnError ?? true,
    screenshotPath: globalErrorHandling.screenshotPath || './screenshots'
  };

  // Create error handler
  const errorHandler = new ErrorHandler(retryOptions);

  try {
    // Execute with retry mechanism
    const result = await errorHandler.execute(
      async (attempt) => {
        // Apply timeout if specified
        if (timeout || config.timeout) {
          const timeoutMs = timeout || config.timeout;
          return await Promise.race([
            action.execute(page, config, context),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error(`Action timeout after ${timeoutMs}ms`)), timeoutMs)
            )
          ]);
        }
        
        return await action.execute(page, config, context);
      },
      {
        context: stepLabel,
        page,
        logger
      }
    );

    const duration = Date.now() - startTime;
    
    logger.info(`Action completed: ${stepLabel}`, { 
      type, 
      duration,
      success: true 
    });

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error(`Action failed: ${stepLabel}`, { 
      type,
      duration,
      error: error.message,
      stack: error.stack
    });

    throw error;
  }
}

/**
 * Auto-register built-in actions
 */
function registerBuiltInActions() {
  const logger = getLogger();
  
  try {
    // Register navigate action
    registerAction('navigate', require('./navigate'));
    
    // Register click action
    registerAction('click', require('./click'));
    
    // Register wait action
    registerAction('wait', require('./wait'));
    
    // Register scroll action
    registerAction('scroll', require('./scroll'));
    
    // Register input action
    registerAction('input', require('./input'));
    
    // Register API action
    registerAction('api', require('./api'));
    
    // Register pagination action
    registerAction('pagination', require('./pagination'));
    
    // Register extract action
    registerAction('extract', require('./extract'));
    
    // Register loop action
    registerAction('loop', require('./loop'));
    
    // Register condition action
    registerAction('condition', require('./condition'));
    
    // Register subWorkflow action
    registerAction('subWorkflow', require('./subWorkflow'));
    
    logger.info(`Registered ${actions.size} built-in actions`);
  } catch (error) {
    logger.warn('Some built-in actions failed to register', { error: error.message });
  }
}

// Auto-register on module load
registerBuiltInActions();

module.exports = {
  registerAction,
  getAction,
  hasAction,
  getActionNames,
  executeAction,
  registerBuiltInActions
};
