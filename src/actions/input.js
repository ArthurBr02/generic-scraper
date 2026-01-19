/**
 * Input action
 * Handles text input, form filling, and keyboard interactions
 */

const { getLogger } = require('../utils/logger');

/**
 * Execute input action
 * @param {Page} page - Playwright page
 * @param {Object} config - Input configuration
 * @param {Object} context - Execution context
 * @returns {Promise<Object>} Input result
 */
async function execute(page, config, context) {
  const logger = context.logger || getLogger();
  const {
    selector,
    value,
    type = 'fill',
    timeout = 5000,
    delay = 0,
    clear = false,
    press = null
  } = config;

  if (!selector) {
    throw new Error('Input action requires a selector');
  }

  if (value === undefined && !press) {
    throw new Error('Input action requires a value or press key');
  }

  logger.debug('Input action', { selector, type, valueLength: value?.length });

  try {
    // Wait for element to be available
    await page.waitForSelector(selector, { timeout, state: 'visible' });

    // Clear field if requested
    if (clear) {
      await page.fill(selector, '');
      logger.debug('Cleared input field', { selector });
    }

    let result;

    switch (type) {
      case 'fill':
        // Fast fill (replaces content)
        await page.fill(selector, value);
        result = { filled: true, value };
        logger.info('Filled input', { selector });
        break;

      case 'type':
        // Type character by character (simulates human typing)
        await page.type(selector, value, { delay });
        result = { typed: true, value };
        logger.info('Typed into input', { selector, delay });
        break;

      case 'press':
        // Press a specific key or key combination
        const key = press || value;
        await page.press(selector, key);
        result = { pressed: true, key };
        logger.info('Pressed key', { selector, key });
        break;

      case 'select':
        // Select option(s) in a <select> element
        const selected = await page.selectOption(selector, value);
        result = { selected, values: value };
        logger.info('Selected option', { selector, selected });
        break;

      case 'check':
        // Check a checkbox
        await page.check(selector);
        result = { checked: true };
        logger.info('Checked checkbox', { selector });
        break;

      case 'uncheck':
        // Uncheck a checkbox
        await page.uncheck(selector);
        result = { unchecked: true };
        logger.info('Unchecked checkbox', { selector });
        break;

      case 'upload':
        // Upload file(s)
        const files = Array.isArray(value) ? value : [value];
        await page.setInputFiles(selector, files);
        result = { uploaded: true, files };
        logger.info('Uploaded files', { selector, count: files.length });
        break;

      default:
        throw new Error(`Unknown input type: ${type}`);
    }

    return {
      success: true,
      selector,
      type,
      ...result
    };
  } catch (error) {
    logger.error('Input action failed', { selector, type, error: error.message });
    throw error;
  }
}

module.exports = {
  name: 'input',
  description: 'Input text or interact with form elements',
  execute
};
