/**
 * Output manager - Handles data export to various formats
 * Manages file naming, formatting, and writing
 */

const fs = require('fs');
const path = require('path');
const { getLogger } = require('../utils/logger');

class OutputManager {
  /**
   * Create an output manager
   * @param {Object} config - Output configuration
   */
  constructor(config = {}) {
    this.config = {
      format: config.format || 'json',
      path: config.path || './output',
      filename: config.filename || 'data-{{date}}-{{time}}',
      append: config.append || false,
      pretty: config.pretty !== false,
      columns: config.columns || null,
      ...config
    };
    
    this.logger = getLogger();
    this.writer = this.getWriter(this.config.format);
  }

  /**
   * Get appropriate writer for format
   * @param {string} format - Output format (json, csv)
   * @returns {Object} Writer instance
   */
  getWriter(format) {
    switch (format.toLowerCase()) {
      case 'json':
        return new (require('./json-writer'))(this.config);
      case 'csv':
        return new (require('./csv-writer'))(this.config);
      default:
        throw new Error(`Unsupported output format: ${format}`);
    }
  }

  /**
   * Generate filename with template variables
   * @param {string} template - Filename template
   * @returns {string} Resolved filename
   */
  generateFilename(template) {
    const now = new Date();
    
    const replacements = {
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().split(' ')[0].replace(/:/g, '-'),
      timestamp: now.getTime(),
      year: now.getFullYear(),
      month: String(now.getMonth() + 1).padStart(2, '0'),
      day: String(now.getDate()).padStart(2, '0'),
      hour: String(now.getHours()).padStart(2, '0'),
      minute: String(now.getMinutes()).padStart(2, '0'),
      second: String(now.getSeconds()).padStart(2, '0')
    };
    
    // Log pour debug
    this.logger.debug('📅 Generating filename:', {
      now: now.toString(),
      date: replacements.date,
      time: replacements.time
    });

    let filename = template;
    for (const [key, value] of Object.entries(replacements)) {
      filename = filename.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    }

    return filename;
  }

  /**
   * Get full output file path
   * @returns {string} Full file path
   */
  getOutputPath() {
    const filename = this.generateFilename(this.config.filename);
    const extension = this.config.format.toLowerCase();
    const fullFilename = filename.endsWith(`.${extension}`) 
      ? filename 
      : `${filename}.${extension}`;
    
    return path.resolve(this.config.path, fullFilename);
  }

  /**
   * Select and reorder columns from data
   * @param {Array|Object} data - Data to filter
   * @returns {Array|Object} Filtered data
   */
  selectColumns(data) {
    if (!this.config.columns) return data;

    const columns = this.config.columns;

    // Si data est un tableau
    if (Array.isArray(data)) {
      return data.map(item => this.selectColumnsFromItem(item, columns));
    }

    // Si data est un objet
    return this.selectColumnsFromItem(data, columns);
  }

  /**
   * Select columns from a single item
   * @param {Object} item - Item to filter
   * @param {Array} columns - Column configuration
   * @returns {Object} Filtered item
   */
  selectColumnsFromItem(item, columns) {
    const result = {};

    for (const col of columns) {
      if (typeof col === 'string') {
        // Simple column name
        result[col] = item[col];
      } else if (typeof col === 'object') {
        // Column with rename: { source: 'oldName', target: 'newName' }
        const source = col.source || col.name;
        const target = col.target || col.name;
        result[target] = item[source];
      }
    }

    return result;
  }

  /**
   * Write data to output file
   * @param {any} data - Data to write
   * @returns {Promise<string>} Path to written file
   */
  async write(data) {
    try {
      // Ensure output directory exists
      if (!fs.existsSync(this.config.path)) {
        fs.mkdirSync(this.config.path, { recursive: true });
        this.logger.debug(`Created output directory: ${this.config.path}`);
      }

      // Select columns if configured
      const filteredData = this.selectColumns(data);

      // Get output path
      const outputPath = this.getOutputPath();

      // Write using appropriate writer
      await this.writer.write(filteredData, outputPath);

      this.logger.info(`Data written to: ${outputPath}`, {
        format: this.config.format,
        records: Array.isArray(filteredData) ? filteredData.length : 1
      });

      return outputPath;

    } catch (error) {
      this.logger.error(`Failed to write output: ${error.message}`);
      throw error;
    }
  }

  /**
   * Write data to a specific file path
   * @param {any} data - Data to write
   * @param {string} filePath - Custom file path
   * @returns {Promise<string>} Path to written file
   */
  async writeToFile(data, filePath) {
    const filteredData = this.selectColumns(data);
    await this.writer.write(filteredData, filePath);
    
    this.logger.info(`Data written to: ${filePath}`, {
      format: this.config.format,
      records: Array.isArray(filteredData) ? filteredData.length : 1
    });

    return filePath;
  }
}

module.exports = OutputManager;
