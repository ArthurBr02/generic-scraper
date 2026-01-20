/**
 * Gestion centralisée des erreurs du Generic Scraper
 * Fournit des classes d'erreurs custom pour différents types d'erreurs
 */

/**
 * Classe de base pour toutes les erreurs du scraper
 */
class ScraperError extends Error {
  constructor(message, details = null) {
    super(message);
    this.name = 'ScraperError';
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Erreur de configuration
 */
class ConfigError extends ScraperError {
  constructor(message, details = null) {
    super(message, details);
    this.name = 'ConfigError';
  }
}

/**
 * Erreur de validation
 */
class ValidationError extends ScraperError {
  constructor(message, errors = []) {
    super(message, { errors });
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

/**
 * Erreur de navigation/browser
 */
class BrowserError extends ScraperError {
  constructor(message, details = null) {
    super(message, details);
    this.name = 'BrowserError';
  }
}

/**
 * Erreur de sélecteur
 */
class SelectorError extends ScraperError {
  constructor(selector, message = 'Selector not found', details = null) {
    super(`${message}: ${selector}`, details);
    this.name = 'SelectorError';
    this.selector = selector;
  }
}

/**
 * Erreur d'extraction de données
 */
class ExtractionError extends ScraperError {
  constructor(message, details = null) {
    super(message, details);
    this.name = 'ExtractionError';
  }
}

/**
 * Erreur de timeout
 */
class TimeoutError extends ScraperError {
  constructor(action, timeout, details = null) {
    super(`Timeout de ${timeout}ms dépassé pour l'action: ${action}`, details);
    this.name = 'TimeoutError';
    this.timeout = timeout;
    this.action = action;
  }
}

/**
 * Erreur de workflow
 */
class WorkflowError extends ScraperError {
  constructor(step, message, details = null) {
    super(`Erreur à l'étape '${step}': ${message}`, details);
    this.name = 'WorkflowError';
    this.step = step;
  }
}

/**
 * Erreur d'export de données
 */
class OutputError extends ScraperError {
  constructor(message, details = null) {
    super(message, details);
    this.name = 'OutputError';
  }
}

/**
 * Gestionnaire d'erreurs avec retry
 * Wrapper autour de la fonction retry pour une utilisation plus simple
 */
class ErrorHandler {
  constructor(options = {}) {
    this.retries = options.retries ?? 3;
    this.retryDelay = options.retryDelay ?? 1000;
    this.backoffMultiplier = options.backoffMultiplier ?? 2;
    this.maxRetryDelay = options.maxRetryDelay ?? 30000;
    this.continueOnError = options.continueOnError ?? false;
    this.screenshotOnError = options.screenshotOnError ?? true;
    this.screenshotPath = options.screenshotPath ?? './screenshots';
    this.onError = options.onError || null;
    this.onRetry = options.onRetry || null;
  }

  /**
   * Exécute une fonction avec gestion des retries et exponential backoff
   * @param {Function} fn - Function to execute
   * @param {Object} options - Execution options
   * @param {string} options.context - Context description
   * @param {Object} options.page - Playwright page for screenshots
   * @param {Object} options.logger - Logger instance
   * @returns {Promise<any>} Function result
   */
  async execute(fn, options = {}) {
    const { context = '', page = null, logger = console } = options;
    let lastError;
    
    for (let attempt = 0; attempt <= this.retries; attempt++) {
      try {
        return await fn(attempt);
      } catch (error) {
        lastError = error;
        
        // Log error
        logger.error(`Attempt ${attempt + 1}/${this.retries + 1} failed`, {
          context,
          error: error.message,
          attempt: attempt + 1,
          maxAttempts: this.retries + 1
        });
        
        // Take screenshot on error if enabled and page available
        if (this.screenshotOnError && page && attempt === this.retries) {
          await this.captureScreenshot(page, error, context, logger);
        }
        
        // Callback d'erreur
        if (this.onError) {
          this.onError(error, attempt, context);
        }
        
        // Si on est au dernier essai
        if (attempt === this.retries) {
          if (this.continueOnError) {
            logger.warn(`Error ignored (continueOnError=true)`, {
              context,
              error: error.message
            });
            return null;
          }
          throw error;
        }
        
        // Calculate delay with exponential backoff
        const delay = Math.min(
          this.retryDelay * Math.pow(this.backoffMultiplier, attempt),
          this.maxRetryDelay
        );
        
        logger.info(`Retrying in ${delay}ms`, {
          context,
          attempt: attempt + 2,
          maxAttempts: this.retries + 1,
          delay
        });
        
        // Callback de retry
        if (this.onRetry) {
          this.onRetry(error, attempt + 1, context);
        }
        
        // Attendre avant de réessayer
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }

  /**
   * Capture screenshot on error
   * @param {Object} page - Playwright page
   * @param {Error} error - Error that occurred
   * @param {string} context - Error context
   * @param {Object} logger - Logger instance
   */
  async captureScreenshot(page, error, context, logger) {
    try {
      const fs = require('fs');
      const path = require('path');
      
      // Create screenshots directory if it doesn't exist
      if (!fs.existsSync(this.screenshotPath)) {
        fs.mkdirSync(this.screenshotPath, { recursive: true });
      }
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const sanitizedContext = context.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
      const filename = `error_${sanitizedContext}_${timestamp}.png`;
      const filepath = path.join(this.screenshotPath, filename);
      
      // Take screenshot
      await page.screenshot({ path: filepath, fullPage: true });
      
      logger.info(`Screenshot captured`, {
        path: filepath,
        context,
        error: error.message
      });
      
      return filepath;
    } catch (screenshotError) {
      logger.warn(`Failed to capture screenshot`, {
        error: screenshotError.message
      });
      return null;
    }
  }

  /**
   * Wrap une erreur dans une classe ScraperError appropriée
   */
  static wrap(error, type = 'ScraperError', details = null) {
    if (error instanceof ScraperError) {
      return error;
    }

    const errorTypes = {
      'ConfigError': ConfigError,
      'ValidationError': ValidationError,
      'BrowserError': BrowserError,
      'SelectorError': SelectorError,
      'ExtractionError': ExtractionError,
      'TimeoutError': TimeoutError,
      'WorkflowError': WorkflowError,
      'OutputError': OutputError
    };

    const ErrorClass = errorTypes[type] || ScraperError;
    const wrappedError = new ErrorClass(error.message, details);
    wrappedError.originalError = error;
    wrappedError.stack = error.stack;
    
    return wrappedError;
  }

  /**
   * Vérifie si une erreur est récupérable (peut être retry)
   */
  static isRetryable(error) {
    // Erreurs réseau, timeout, etc. sont récupérables
    const retryableErrors = [
      'ECONNRESET',
      'ETIMEDOUT',
      'ENOTFOUND',
      'ECONNREFUSED',
      'NetworkError',
      'TimeoutError',
      'Target closed',
      'Navigation timeout'
    ];

    return retryableErrors.some(code => 
      error.code === code || 
      error.name === code ||
      error.message.includes(code)
    );
  }
}

/**
 * Helper function for retry with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {Object} options - Retry options
 * @returns {Promise<any>} Function result
 */
async function withRetry(fn, options = {}) {
  const handler = new ErrorHandler(options);
  return handler.execute(fn, options);
}

module.exports = {
  ScraperError,
  ConfigError,
  ValidationError,
  BrowserError,
  SelectorError,
  ExtractionError,
  TimeoutError,
  WorkflowError,
  OutputError,
  ErrorHandler,
  withRetry
};
