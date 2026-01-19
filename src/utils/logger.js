/**
 * Logger utility using Winston
 * Handles logging with multiple transports, formatting, and log rotation
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');

/**
 * Creates a logger instance based on configuration
 * @param {Object} config - Logging configuration
 * @returns {winston.Logger} Configured logger instance
 */
function createLogger(config = {}) {
  // Default configuration
  const defaults = {
    level: 'info',
    console: true,
    file: {
      enabled: true,
      path: './logs/scraper.log',
      maxSize: '10m',
      maxFiles: 5
    }
  };

  // Merge with provided config
  const logConfig = { ...defaults, ...config };

  // Ensure logs directory exists
  if (logConfig.file.enabled) {
    const logDir = path.dirname(logConfig.file.path);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  // Define custom formats
  const customFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp', 'label'] })
  );

  // Console format with colors
  const consoleFormat = winston.format.combine(
    customFormat,
    winston.format.colorize({ all: true }),
    winston.format.printf(({ level, message, timestamp, metadata }) => {
      let log = `${timestamp} [${level}]: ${message}`;
      
      // Add metadata if present
      if (metadata && Object.keys(metadata).length > 0) {
        log += `\n${JSON.stringify(metadata, null, 2)}`;
      }
      
      return log;
    })
  );

  // File format (JSON for easy parsing)
  const fileFormat = winston.format.combine(
    customFormat,
    winston.format.json()
  );

  // Configure transports
  const transports = [];

  // Console transport (T1.3.3)
  if (logConfig.console) {
    transports.push(
      new winston.transports.Console({
        format: consoleFormat,
        handleExceptions: true,
        handleRejections: true
      })
    );
  }

  // File transport with rotation (T1.3.2)
  if (logConfig.file.enabled) {
    // Main log file
    transports.push(
      new winston.transports.File({
        filename: logConfig.file.path,
        format: fileFormat,
        maxsize: parseSize(logConfig.file.maxSize),
        maxFiles: logConfig.file.maxFiles,
        tailable: true,
        handleExceptions: true,
        handleRejections: true
      })
    );

    // Separate error log file
    const errorLogPath = logConfig.file.path.replace(/\.log$/, '-error.log');
    transports.push(
      new winston.transports.File({
        filename: errorLogPath,
        level: 'error',
        format: fileFormat,
        maxsize: parseSize(logConfig.file.maxSize),
        maxFiles: logConfig.file.maxFiles,
        tailable: true,
        handleExceptions: true,
        handleRejections: true
      })
    );
  }

  // Create Winston logger instance (T1.3.1)
  const logger = winston.createLogger({
    level: logConfig.level,
    levels: winston.config.npm.levels,
    transports,
    exitOnError: false
  });

  // Add utility methods for context/metadata (T1.3.4)
  logger.withContext = function(context) {
    return {
      error: (message, meta = {}) => logger.error(message, { ...context, ...meta }),
      warn: (message, meta = {}) => logger.warn(message, { ...context, ...meta }),
      info: (message, meta = {}) => logger.info(message, { ...context, ...meta }),
      http: (message, meta = {}) => logger.http(message, { ...context, ...meta }),
      verbose: (message, meta = {}) => logger.verbose(message, { ...context, ...meta }),
      debug: (message, meta = {}) => logger.debug(message, { ...context, ...meta }),
      silly: (message, meta = {}) => logger.silly(message, { ...context, ...meta })
    };
  };

  // Add child logger method for scoped logging
  logger.child = function(defaultMeta = {}) {
    return logger.withContext(defaultMeta);
  };

  // Add step tracking utility
  logger.step = function(stepId, stepName, message, meta = {}) {
    return logger.info(message, { 
      step: { id: stepId, name: stepName },
      ...meta 
    });
  };

  // Add action tracking utility
  logger.action = function(actionType, details, meta = {}) {
    return logger.info(`Action: ${actionType}`, { 
      action: { type: actionType, ...details },
      ...meta 
    });
  };

  // Add performance tracking utility
  logger.perf = function(operation, duration, meta = {}) {
    return logger.info(`Performance: ${operation}`, { 
      performance: { operation, duration, unit: 'ms' },
      ...meta 
    });
  };

  return logger;
}

/**
 * Parse size string to bytes
 * @param {string} size - Size string (e.g., "10m", "1g", "500k")
 * @returns {number} Size in bytes
 */
function parseSize(size) {
  if (typeof size === 'number') return size;
  
  const units = {
    b: 1,
    k: 1024,
    m: 1024 * 1024,
    g: 1024 * 1024 * 1024
  };

  const match = size.toLowerCase().match(/^(\d+)([bkmg])?$/);
  if (!match) return 10 * 1024 * 1024; // Default 10MB

  const value = parseInt(match[1], 10);
  const unit = match[2] || 'b';

  return value * units[unit];
}

// Default logger instance (can be configured later)
let defaultLogger = null;

/**
 * Get or create default logger instance
 * @param {Object} config - Optional configuration
 * @returns {winston.Logger} Logger instance
 */
function getLogger(config) {
  if (!defaultLogger || config) {
    defaultLogger = createLogger(config);
  }
  return defaultLogger;
}

/**
 * Initialize logger with configuration
 * @param {Object} config - Logging configuration
 * @returns {winston.Logger} Configured logger instance
 */
function initLogger(config) {
  defaultLogger = createLogger(config);
  return defaultLogger;
}

module.exports = {
  createLogger,
  getLogger,
  initLogger
};
