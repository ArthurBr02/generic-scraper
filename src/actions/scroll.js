/**
 * Scroll action
 * Performs incremental scrolls on the page or specific elements
 */

const { getLogger } = require('../utils/logger');

/**
 * Execute scroll action
 * @param {Page} page - Playwright page
 * @param {Object} config - Scroll configuration
 * @param {Object} context - Execution context
 * @returns {Promise<Object>} Scroll result
 */
async function execute(page, config, context) {
  const logger = context.logger || getLogger();
  const {
    type = 'page',
    selector = null,
    step = 500,
    iterations = 10,
    waitFor = 200,
    direction = 'down',
    smooth = false
  } = config;

  logger.debug('Scrolling', { type, iterations, step });

  try {
    let scrolled = 0;

    switch (type) {
      case 'page':
        // Scroll the entire page
        for (let i = 0; i < iterations; i++) {
          const scrollStep = direction === 'up' ? -step : step;
          
          await page.evaluate((options) => {
            window.scrollBy({
              top: options.step,
              behavior: options.smooth ? 'smooth' : 'auto'
            });
          }, { step: scrollStep, smooth });

          scrolled += Math.abs(scrollStep);
          await page.waitForTimeout(waitFor);
        }
        logger.info('Page scrolled', { iterations, totalDistance: scrolled });
        break;

      case 'element':
        // Scroll a specific element
        if (!selector) {
          throw new Error('Scroll type "element" requires a selector');
        }

        const element = await page.$(selector);
        if (!element) {
          throw new Error(`Element not found: ${selector}`);
        }

        for (let i = 0; i < iterations; i++) {
          const scrollStep = direction === 'up' ? -step : step;
          
          await element.evaluate((el, options) => {
            el.scrollBy({
              top: options.step,
              behavior: options.smooth ? 'smooth' : 'auto'
            });
          }, { step: scrollStep, smooth });

          scrolled += Math.abs(scrollStep);
          await page.waitForTimeout(waitFor);
        }
        logger.info('Element scrolled', { selector, iterations, totalDistance: scrolled });
        break;

      case 'bottom':
        // Scroll to bottom of page
        await page.evaluate(() => {
          window.scrollTo({
            top: document.body.scrollHeight,
            behavior: 'smooth'
          });
        });
        scrolled = await page.evaluate(() => document.body.scrollHeight);
        logger.info('Scrolled to bottom', { distance: scrolled });
        break;

      case 'top':
        // Scroll to top of page
        await page.evaluate(() => {
          window.scrollTo({
            top: 0,
            behavior: 'smooth'
          });
        });
        logger.info('Scrolled to top');
        break;

      case 'into-view':
        // Scroll element into view
        if (!selector) {
          throw new Error('Scroll type "into-view" requires a selector');
        }
        await page.locator(selector).scrollIntoViewIfNeeded();
        logger.info('Scrolled element into view', { selector });
        break;

      default:
        throw new Error(`Unknown scroll type: ${type}`);
    }

    return {
      success: true,
      type,
      iterations,
      scrolled
    };
  } catch (error) {
    logger.error('Scroll action failed', { type, error: error.message });
    throw error;
  }
}

// Legacy support for old format
async function run(context, params = {}) {
  const { page } = context;
  const config = {
    type: 'page',
    step: params.step || 500,
    iterations: params.iterations || 10,
    waitFor: params.waitFor || 200
  };
  
  return await execute(page, config, context);
}

module.exports = {
  name: 'scroll',
  description: 'Scroll page or elements',
  execute,
  run
};
