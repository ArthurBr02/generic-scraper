/**
 * JSON Writer - Export data to JSON format
 * Supports pretty printing and append mode
 */

const fs = require('fs');
const path = require('path');

class JsonWriter {
  /**
   * Create a JSON writer
   * @param {Object} options - Writer options
   */
  constructor(options = {}) {
    this.options = {
      pretty: options.pretty !== false,
      indent: options.indent || 2,
      append: options.append || false,
      ...options
    };
  }

  /**
   * Write data to JSON file
   * @param {any} data - Data to write
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

      // Handle append mode
      if (this.options.append && fs.existsSync(filePath)) {
        await this.appendToFile(data, filePath);
      } else {
        await this.writeToFile(data, filePath);
      }

    } catch (error) {
      throw new Error(`Failed to write JSON file: ${error.message}`);
    }
  }

  /**
   * Write data to new file
   * @param {any} data - Data to write
   * @param {string} filePath - Output file path
   * @returns {Promise<void>}
   */
  async writeToFile(data, filePath) {
    const content = this.options.pretty
      ? JSON.stringify(data, null, this.options.indent)
      : JSON.stringify(data);

    fs.writeFileSync(filePath, content, 'utf8');
  }

  /**
   * Append data to existing file
   * @param {any} data - Data to append
   * @param {string} filePath - Output file path
   * @returns {Promise<void>}
   */
  async appendToFile(data, filePath) {
    // Read existing data
    const existingContent = fs.readFileSync(filePath, 'utf8');
    let existing;

    try {
      existing = JSON.parse(existingContent);
    } catch (error) {
      throw new Error(`Failed to parse existing JSON file: ${error.message}`);
    }

    // Merge data
    let merged;
    if (Array.isArray(existing)) {
      // If existing is array, append new data
      if (Array.isArray(data)) {
        merged = [...existing, ...data];
      } else {
        merged = [...existing, data];
      }
    } else if (typeof existing === 'object' && existing !== null) {
      // If existing is object, merge properties
      if (Array.isArray(data)) {
        // Convert to array format
        merged = [existing, ...data];
      } else if (typeof data === 'object' && data !== null) {
        merged = { ...existing, ...data };
      } else {
        merged = [existing, data];
      }
    } else {
      // Convert primitives to array
      merged = [existing, ...(Array.isArray(data) ? data : [data])];
    }

    // Write merged data
    await this.writeToFile(merged, filePath);
  }

  /**
   * Stream write for large datasets (future enhancement)
   * @param {Array} data - Array of data to write
   * @param {string} filePath - Output file path
   * @returns {Promise<void>}
   */
  async streamWrite(data, filePath) {
    if (!Array.isArray(data)) {
      return this.write(data, filePath);
    }

    // For now, use standard write
    // TODO: Implement actual streaming for very large datasets
    return this.write(data, filePath);
  }
}

module.exports = JsonWriter;
