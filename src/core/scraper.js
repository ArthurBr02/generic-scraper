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
   * @param {Function} onProgress - Progress callback function
   */
  constructor(config, onProgress) {
    this.config = config;
    this.logger = getLogger();
    this.browser = null;
    this.workflow = null;
    this.onProgress = onProgress || null;
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
      // Support both 'workflow' (single) and 'workflows' (array) formats
      let workflowConfig;
      if (this.config.workflows && Array.isArray(this.config.workflows) && this.config.workflows.length > 0) {
        workflowConfig = this.config.workflows[0]; // Use first workflow
        this.logger.info(`Using workflow: ${workflowConfig.name || 'default'}`);
      } else if (this.config.workflow) {
        workflowConfig = this.config.workflow;
      } else {
        workflowConfig = { 
          name: 'default', 
          steps: [] 
        };
      }

      // Create workflow context
      const context = {
        logger: this.logger,
        config: this.config,
        browser: this.browser,
        target: this.config.target || {},
        onProgress: this.onProgress
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
      
      // Log pour debug
      const dataKeys = Object.keys(results.data || {});
      this.logger.info(`📦 Workflow results.data has ${dataKeys.length} keys: ${dataKeys.join(', ')}`);
      
      // Export results if output is configured
      if (this.config.output && results.data) {
        // Préparer les données pour l'export
        const exportData = this.prepareExportData(results.data);
        const exportType = Array.isArray(exportData) ? `array[${exportData.length}]` : typeof exportData;
        const exportInfo = Array.isArray(exportData) ? `array with ${exportData.length} items` : `object with keys: ${Object.keys(exportData).join(', ')}`;
        this.logger.info(`📦 Export data is ${exportType}: ${exportInfo}`);
        await this.exportResults(exportData);
      }
      
      return results;
    } finally {
      await this.close();
    }
  }

  /**
   * Prepare data for export
   * Flattens the results.data structure to get actual data values
   * Filters out numeric keys (pagination results) to avoid duplicates
   * @param {Object} data - Raw workflow data
   * @returns {Array|Object} Data ready for export
   */
  prepareExportData(data) {
    // Si data est vide, retourner objet vide
    if (!data || Object.keys(data).length === 0) {
      return {};
    }

    // Filtrer les clés numériques (résultats de pagination) pour éviter les doublons
    const filteredData = {};
    for (const [key, value] of Object.entries(data)) {
      // Ignorer les clés numériques (0, 1, 2, etc.)
      if (!/^\d+$/.test(key)) {
        filteredData[key] = value;
      }
    }

    // Si aucune donnée après filtrage, retourner les données brutes (fallback)
    const finalData = Object.keys(filteredData).length > 0 ? filteredData : data;
    const values = Object.values(finalData);
    
    // Si une seule valeur et c'est un tableau, le retourner tel quel
    if (values.length === 1 && Array.isArray(values[0])) {
      return values[0];
    }
    
    // Si une seule valeur et c'est un objet, le retourner tel quel
    if (values.length === 1 && typeof values[0] === 'object' && values[0] !== null) {
      return values[0];
    }
    
    // Si plusieurs valeurs, fusionner les objets ou créer un tableau
    if (values.length > 1) {
      // Si tous sont des objets, fusionner
      if (values.every(v => typeof v === 'object' && !Array.isArray(v) && v !== null)) {
        return Object.assign({}, ...values);
      }
      
      // Si au moins un est un tableau, tout mettre dans un tableau
      const flatValues = values.flat();
      return flatValues.length === 1 ? flatValues[0] : flatValues;
    }
    
    // Cas par défaut : retourner la première valeur
    return values[0] || {};
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
