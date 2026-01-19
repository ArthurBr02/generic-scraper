/**
 * CSV Writer - Export data to CSV format
 * Supports headers, delimiters, and append mode
 */

const fs = require('fs');
const path = require('path');

class CsvWriter {
  /**
   * Create a CSV writer
   * @param {Object} options - Writer options
   */
  constructor(options = {}) {
    this.options = {
      delimiter: options.delimiter || ',',
      quote: options.quote || '"',
      headers: options.headers !== false,
      append: options.append || false,
      columns: options.columns || null,
      encoding: options.encoding || 'utf8',
      ...options
    };
  }

  /**
   * Write data to CSV file
   * @param {Array|Object} data - Data to write
   * @param {string} filePath - Output file path
   * @returns {Promise<void>}
   */
  async write(data, filePath) {
    try {
      // Ensure directory exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Convert to array if single object
      const dataArray = Array.isArray(data) ? data : [data];

      if (dataArray.length === 0) {
        throw new Error('No data to write to CSV');
      }

      // Handle append mode
      if (this.options.append && fs.existsSync(filePath)) {
        await this.appendToFile(dataArray, filePath);
      } else {
        await this.writeToFile(dataArray, filePath);
      }

    } catch (error) {
      throw new Error(`Failed to write CSV file: ${error.message}`);
    }
  }

  /**
   * Write data to new file
   * @param {Array} data - Array of data to write
   * @param {string} filePath - Output file path
   * @returns {Promise<void>}
   */
  async writeToFile(data, filePath) {
    // Get column names
    const columns = this.getColumns(data);
    
    // Build CSV content
    const lines = [];

    // Add header row if enabled
    if (this.options.headers) {
      lines.push(this.formatRow(columns));
    }

    // Add data rows
    for (const row of data) {
      const values = columns.map(col => this.getCellValue(row, col));
      lines.push(this.formatRow(values));
    }

    // Write to file
    const content = lines.join('\n');
    fs.writeFileSync(filePath, content, this.options.encoding);
  }

  /**
   * Append data to existing file
   * @param {Array} data - Array of data to append
   * @param {string} filePath - Output file path
   * @returns {Promise<void>}
   */
  async appendToFile(data, filePath) {
    // Get column names from new data
    const columns = this.getColumns(data);

    // Build rows to append
    const lines = [];
    for (const row of data) {
      const values = columns.map(col => this.getCellValue(row, col));
      lines.push(this.formatRow(values));
    }

    // Append to file
    const content = '\n' + lines.join('\n');
    fs.appendFileSync(filePath, content, this.options.encoding);
  }

  /**
   * Get column names from data
   * @param {Array} data - Array of data objects
   * @returns {Array<string>} Column names
   */
  getColumns(data) {
    // If columns are specified in options, use those
    if (this.options.columns && Array.isArray(this.options.columns)) {
      return this.options.columns;
    }

    // Otherwise, get all unique keys from data
    const columnsSet = new Set();
    for (const row of data) {
      if (typeof row === 'object' && row !== null) {
        Object.keys(row).forEach(key => columnsSet.add(key));
      }
    }

    return Array.from(columnsSet);
  }

  /**
   * Get cell value from row
   * @param {Object} row - Data row
   * @param {string} column - Column name
   * @returns {any} Cell value
   */
  getCellValue(row, column) {
    if (typeof row !== 'object' || row === null) {
      return row;
    }

    const value = row[column];
    
    // Handle undefined/null
    if (value === undefined || value === null) {
      return '';
    }

    // Handle arrays and objects
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }

    return value;
  }

  /**
   * Format a row for CSV
   * @param {Array} values - Row values
   * @returns {string} Formatted CSV row
   */
  formatRow(values) {
    return values.map(value => this.escapeValue(value)).join(this.options.delimiter);
  }

  /**
   * Escape a value for CSV
   * @param {any} value - Value to escape
   * @returns {string} Escaped value
   */
  escapeValue(value) {
    // Convert to string
    let str = String(value);

    // Check if value needs quoting
    const needsQuoting = 
      str.includes(this.options.delimiter) ||
      str.includes(this.options.quote) ||
      str.includes('\n') ||
      str.includes('\r');

    if (!needsQuoting) {
      return str;
    }

    // Escape quotes by doubling them
    str = str.replace(new RegExp(this.options.quote, 'g'), this.options.quote + this.options.quote);

    // Wrap in quotes
    return this.options.quote + str + this.options.quote;
  }
}

module.exports = CsvWriter;
