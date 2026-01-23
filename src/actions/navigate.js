/**
 * Navigate action
 * Handles page navigation with various options and wait conditions
 */

const { getLogger } = require('../utils/logger');

/**
 * Execute navigate action
 * @param {Page} page - Playwright page
 * @param {Object} config - Navigation configuration
 * @param {Object} context - Execution context
 * @returns {Promise<Object>} Navigation result
 */
async function execute(page, config, context) {
  const logger = context.logger || getLogger();
  const {
    url,
    waitUntil = 'load',
    timeout = 30000,
    referer = null
  } = config;

  if (!url) {
    throw new Error('Navigate action requires a URL');
  }

  logger.info(`🌐 Navigating to: ${url}`);
  logger.debug('Navigating to URL', { url, waitUntil });

  try {
    const options = {
      waitUntil,
      timeout
    };

    if (referer) {
      options.referer = referer;
    }

    const response = await page.goto(url, options);

    if (!response) {
      throw new Error('Navigation failed - no response received');
    }

    const status = response.status();
    const success = status >= 200 && status < 400;

    if (!success) {
      logger.warn('Navigation returned non-success status', { url, status });
    }

    logger.info('Navigation successful', { 
      url, 
      status,
      finalUrl: page.url()
    });

    return {
      success,
      status,
      url: page.url(),
      title: await page.title()
    };
  } catch (error) {
    logger.error('Navigation failed', { url, error: error.message });
    throw error;
  }
}

module.exports = {
  name: 'navigate',
  description: 'Navigate to a URL',
  execute
};
