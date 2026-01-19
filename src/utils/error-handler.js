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
    this.continueOnError = options.continueOnError ?? false;
    this.onError = options.onError || null;
    this.onRetry = options.onRetry || null;
  }

  /**
   * Exécute une fonction avec gestion des retries
   */
  async execute(fn, context = '') {
    let lastError;
    
    for (let attempt = 0; attempt <= this.retries; attempt++) {
      try {
        return await fn(attempt);
      } catch (error) {
        lastError = error;
        
        // Callback d'erreur
        if (this.onError) {
          this.onError(error, attempt, context);
        }
        
        // Si on est au dernier essai
        if (attempt === this.retries) {
          if (this.continueOnError) {
            console.warn(`⚠️  Erreur ignorée (continueOnError=true): ${error.message}`);
            return null;
          }
          throw error;
        }
        
        // Callback de retry
        if (this.onRetry) {
          this.onRetry(error, attempt + 1, context);
        }
        
        // Attendre avant de réessayer
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
      }
    }
    
    throw lastError;
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
      'TimeoutError'
    ];

    return retryableErrors.some(code => 
      error.code === code || 
      error.name === code ||
      error.message.includes(code)
    );
  }
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
  ErrorHandler
};
