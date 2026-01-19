/**
 * Click action
 * Handles clicking on elements with various options and error handling
 */

const { getLogger } = require('../utils/logger');

/**
 * Execute click action
 * @param {Page} page - Playwright page
 * @param {Object} config - Click configuration
 * @param {Object} context - Execution context
 * @returns {Promise<Object>} Click result
 */
async function execute(page, config, context) {
  const logger = context.logger || getLogger();
  const {
    selector,
    button = 'left',
    clickCount = 1,
    delay = 0,
    timeout = 5000,
    optional = false,
    force = false,
    position = null,
    modifiers = []
  } = config;

  if (!selector) {
    throw new Error('Click action requires a selector');
  }

  logger.debug('Attempting to click element', { selector, button, clickCount });

  try {
    // Wait for selector to be visible
    await page.waitForSelector(selector, { 
      timeout,
      state: 'visible'
    });

    // Build click options
    const clickOptions = {
      button,
      clickCount,
      delay,
      force
    };

    if (position) {
      clickOptions.position = position;
    }

    if (modifiers.length > 0) {
      clickOptions.modifiers = modifiers;
    }

    // Perform click
    await page.click(selector, clickOptions);

    logger.info('Click successful', { selector });

    return {
      success: true,
      selector,
      clicked: true
    };
  } catch (error) {
    if (optional) {
      logger.warn('Optional click failed', { selector, error: error.message });
      return {
        success: false,
        selector,
        clicked: false,
        optional: true
      };
    }

    logger.error('Click failed', { selector, error: error.message });
    throw error;
  }
}

module.exports = {
  name: 'click',
  description: 'Click on an element',
  execute
};
