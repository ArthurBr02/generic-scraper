/**
 * Main scraper orchestrator
 * Coordinates browser, workflow execution, and output
 */

const Browser = require('./browser');
const Workflow = require('./workflow');
const OutputManager = require('../output');
const { getLogger } = require('../utils/logger');

class Scraper {
  /**
   * Create a scraper instance
   * @param {Object} config - Full scraper configuration
   */
  constructor(config) {
    this.config = config;
    this.logger = getLogger();
    this.browser = null;
    this.workflow = null;
  }

  /**
   * Initialize scraper (browser, workflow)
   * @returns {Promise<void>}
   */
  async initialize() {
    this.logger.info('Initializing scraper', { name: this.config.name });

    // Initialize browser
    this.browser = new Browser(this.config.browser);
    await this.browser.launch(this.config.browser);

    this.logger.info('Scraper initialized successfully');
  }

  /**
   * Execute the scraping workflow
   * @returns {Promise<Object>} Scraping results
   */
  async run() {
    if (!this.browser || !this.browser.isLaunched) {
      throw new Error('Scraper not initialized. Call initialize() first.');
    }

    this.logger.info('Starting scraper execution');

    try {
      // Get a page from the browser
      const page = await this.browser.newPage();

      // Load workflow configuration
      const workflowConfig = this.config.workflow || { 
        name: 'default', 
        steps: [] 
      };

      // Create workflow context
      const context = {
        logger: this.logger,
        config: this.config,
        browser: this.browser
      };

      // Create and execute workflow
      this.workflow = new Workflow(workflowConfig, context);
      const results = await this.workflow.execute(page);

      this.logger.info('Scraper execution completed', {
        success: results.success,
        duration: results.duration
      });

      return results;

    } catch (error) {
      this.logger.error('Scraper execution failed', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Cleanup and close browser
   * @returns {Promise<void>}
   */
  async close() {
    this.logger.info('Closing scraper');

    if (this.browser) {
      await this.browser.close();
    }

    this.logger.info('Scraper closed');
  }

  /**
   * Run the complete scraping process (initialize, run, close)
   * @returns {Promise<Object>} Scraping results
   */
  async execute() {
    try {
      await this.initialize();
      const results = await this.run();
      
      // Export results if output is configured
      if (this.config.output && results.data) {
        await this.exportResults(results.data);
      }
      
      return results;
    } finally {
      await this.close();
    }
  }

  /**
   * Export results to configured output format
   * @param {Object} data - Data to export
   * @returns {Promise<string>} Path to output file
   */
  async exportResults(data) {
    if (!this.config.output) {
      this.logger.warn('No output configuration, skipping export');
      return null;
    }

    try {
      this.logger.info('Exporting results', { 
        format: this.config.output.format 
      });

      const outputManager = new OutputManager(this.config.output);
      const outputPath = await outputManager.write(data);

      this.logger.info('Results exported successfully', { 
        path: outputPath 
      });

      return outputPath;

    } catch (error) {
      this.logger.error('Failed to export results', {
        error: error.message
      });
      
      // Don't throw - export failure shouldn't fail the whole scrape
      return null;
    }
  }
}

module.exports = Scraper;
