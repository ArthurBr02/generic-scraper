/**
 * Wait action
 * Handles various types of waits (timeout, selector, function, etc.)
 */

const { getLogger } = require('../utils/logger');

/**
 * Execute wait action
 * @param {Page} page - Playwright page
 * @param {Object} config - Wait configuration
 * @param {Object} context - Execution context
 * @returns {Promise<Object>} Wait result
 */
async function execute(page, config, context) {
  const logger = context.logger || getLogger();
  const {
    type = 'timeout',
    value,
    selector,
    duration,
    timeout = 30000,
    state = 'visible'
  } = config;

  logger.debug('Waiting', { type, value: value || duration || selector });

  try {
    let result;

    switch (type) {
      case 'timeout':
      case 'delay':
        // Wait for a fixed duration
        const waitDuration = value || duration || 1000;
        await page.waitForTimeout(waitDuration);
        result = { waited: waitDuration };
        logger.info('Waited for timeout', { duration: waitDuration });
        break;

      case 'selector':
        // Wait for a selector to be in a certain state
        if (!selector && !value) {
          throw new Error('Wait action with type "selector" requires a selector');
        }
        const sel = selector || value;
        await page.waitForSelector(sel, { timeout, state });
        result = { selector: sel, state };
        logger.info('Waited for selector', { selector: sel, state });
        break;

      case 'navigation':
        // Wait for navigation to complete
        const waitUntil = value || 'load';
        await page.waitForLoadState(waitUntil, { timeout });
        result = { waitUntil };
        logger.info('Waited for navigation', { waitUntil });
        break;

      case 'networkidle':
        // Wait for network to be idle
        await page.waitForLoadState('networkidle', { timeout });
        result = { networkidle: true };
        logger.info('Waited for network idle');
        break;

      case 'function':
        // Wait for a custom function to return true
        if (!value) {
          throw new Error('Wait action with type "function" requires a value (function body)');
        }
        await page.waitForFunction(value, { timeout });
        result = { function: true };
        logger.info('Waited for function');
        break;

      case 'url':
        // Wait for URL to match pattern
        if (!value) {
          throw new Error('Wait action with type "url" requires a value (URL pattern)');
        }
        await page.waitForURL(value, { timeout });
        result = { url: value };
        logger.info('Waited for URL', { pattern: value });
        break;

      default:
        throw new Error(`Unknown wait type: ${type}`);
    }

    return {
      success: true,
      type,
      ...result
    };
  } catch (error) {
    logger.error('Wait failed', { type, error: error.message });
    throw error;
  }
}

module.exports = {
  name: 'wait',
  description: 'Wait for various conditions',
  execute
};
