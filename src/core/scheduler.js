/**
 * Scheduler - Execution planifiée des scrapings
 * Supporte les expressions cron, fuseaux horaires et mode daemon
 */

const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const { getLogger } = require('../utils/logger');

class Scheduler {
  /**
   * Create a scheduler instance
   * @param {Object} config - Scheduler configuration
   * @param {Function} scraperFactory - Function to create scraper instances
   */
  constructor(config, scraperFactory) {
    this.config = config;
    this.scraperFactory = scraperFactory;
    this.logger = getLogger();
    this.job = null;
    this.isRunning = false;
    this.executionHistory = [];
    this.stateFile = config.scheduling?.stateFile || './scheduler-state.json';
  }

  /**
   * Validate cron expression
   * @param {string} cronExpression - Cron expression to validate
   * @returns {boolean} True if valid
   */
  validateCronExpression(cronExpression) {
    try {
      return cron.validate(cronExpression);
    } catch (error) {
      this.logger.error('Invalid cron expression', {
        expression: cronExpression,
        error: error.message
      });
      return false;
    }
  }

  /**
   * Start the scheduler
   * @returns {boolean} True if started successfully
   */
  start() {
    if (!this.config.scheduling?.enabled) {
      this.logger.info('Scheduling is disabled');
      return false;
    }

    const { cron: cronExpr, timezone } = this.config.scheduling;

    // Validate cron expression
    if (!this.validateCronExpression(cronExpr)) {
      throw new Error(`Invalid cron expression: ${cronExpr}`);
    }

    this.logger.info('Starting scheduler', {
      cron: cronExpr,
      timezone: timezone || 'system default'
    });

    // Load previous state if exists
    this.loadState();

    // Schedule the job
    const options = timezone ? { timezone } : {};
    
    this.job = cron.schedule(cronExpr, async () => {
      await this.executeScheduledJob();
    }, options);

    this.isRunning = true;
    
    this.logger.info('Scheduler started successfully', {
      cron: cronExpr,
      timezone: timezone || 'system default',
      nextExecution: this.getNextExecutionTime()
    });

    return true;
  }

  /**
   * Execute the scheduled job
   */
  async executeScheduledJob() {
    const executionId = `exec_${Date.now()}`;
    const startTime = Date.now();

    this.logger.info('Scheduled execution started', {
      executionId,
      timestamp: new Date().toISOString()
    });

    const execution = {
      id: executionId,
      startTime: new Date(startTime).toISOString(),
      status: 'running',
      error: null,
      duration: null
    };

    this.executionHistory.push(execution);

    try {
      // Create a new scraper instance
      const scraper = this.scraperFactory();
      
      // Execute the scraping
      const result = await scraper.execute();
      
      const duration = Date.now() - startTime;
      execution.status = 'success';
      execution.duration = duration;
      execution.endTime = new Date().toISOString();

      this.logger.info('Scheduled execution completed', {
        executionId,
        duration,
        success: true
      });

      // Save state after successful execution
      this.saveState();

      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      execution.status = 'failed';
      execution.error = error.message;
      execution.duration = duration;
      execution.endTime = new Date().toISOString();

      this.logger.error('Scheduled execution failed', {
        executionId,
        duration,
        error: error.message,
        stack: error.stack
      });

      // Save state even on failure
      this.saveState();

      throw error;
    }
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (this.job) {
      this.job.stop();
      this.isRunning = false;
      
      this.logger.info('Scheduler stopped');
      
      // Save final state
      this.saveState();
    }
  }

  /**
   * Get next execution time
   * @returns {string|null} Next execution time or null
   */
  getNextExecutionTime() {
    // node-cron doesn't provide this directly, so we return null
    // A more advanced implementation could use a library like cron-parser
    return null;
  }

  /**
   * Get execution history
   * @param {number} limit - Maximum number of entries to return
   * @returns {Array} Execution history
   */
  getHistory(limit = 10) {
    return this.executionHistory.slice(-limit);
  }

  /**
   * Save scheduler state to file
   */
  saveState() {
    if (!this.config.scheduling?.persistState) {
      return;
    }

    try {
      const state = {
        lastUpdate: new Date().toISOString(),
        isRunning: this.isRunning,
        config: {
          cron: this.config.scheduling.cron,
          timezone: this.config.scheduling.timezone
        },
        executionHistory: this.executionHistory.slice(-50) // Keep last 50 executions
      };

      const stateDir = path.dirname(this.stateFile);
      if (!fs.existsSync(stateDir)) {
        fs.mkdirSync(stateDir, { recursive: true });
      }

      fs.writeFileSync(this.stateFile, JSON.stringify(state, null, 2));
      
      this.logger.debug('Scheduler state saved', {
        file: this.stateFile
      });

    } catch (error) {
      this.logger.warn('Failed to save scheduler state', {
        error: error.message
      });
    }
  }

  /**
   * Load scheduler state from file
   */
  loadState() {
    if (!this.config.scheduling?.persistState) {
      return;
    }

    try {
      if (fs.existsSync(this.stateFile)) {
        const state = JSON.parse(fs.readFileSync(this.stateFile, 'utf8'));
        
        this.executionHistory = state.executionHistory || [];
        
        this.logger.info('Scheduler state loaded', {
          file: this.stateFile,
          lastUpdate: state.lastUpdate,
          historyEntries: this.executionHistory.length
        });
      }
    } catch (error) {
      this.logger.warn('Failed to load scheduler state', {
        error: error.message
      });
    }
  }

  /**
   * Run in daemon mode (keeps process alive)
   */
  runDaemon() {
    if (!this.start()) {
      return;
    }

    this.logger.info('Running in daemon mode - Press Ctrl+C to stop');

    // Keep process alive
    process.on('SIGINT', () => {
      this.logger.info('Received SIGINT, stopping scheduler...');
      this.stop();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      this.logger.info('Received SIGTERM, stopping scheduler...');
      this.stop();
      process.exit(0);
    });

    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
      this.logger.error('Uncaught exception in daemon mode', {
        error: error.message,
        stack: error.stack
      });
      
      // Save state before exit
      this.saveState();
      
      // Optionally restart after delay
      if (this.config.scheduling?.restartOnCrash) {
        this.logger.info('Restarting after crash...');
        setTimeout(() => {
          this.start();
        }, 5000);
      } else {
        process.exit(1);
      }
    });
  }

  /**
   * Get scheduler status
   * @returns {Object} Status information
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      config: {
        enabled: this.config.scheduling?.enabled || false,
        cron: this.config.scheduling?.cron || null,
        timezone: this.config.scheduling?.timezone || null
      },
      executionCount: this.executionHistory.length,
      lastExecution: this.executionHistory.length > 0 
        ? this.executionHistory[this.executionHistory.length - 1] 
        : null,
      nextExecution: this.getNextExecutionTime()
    };
  }
}

module.exports = Scheduler;
