/**
 * Page URL extractor - Extract current page URL
 * Useful in loops to keep track of the page being scraped
 */

/**
 * Extract current page URL
 * @param {Object} element - Playwright Page or ElementHandle
 * @param {Object} config - Extractor configuration
 * @param {Object} context - Execution context
 * @returns {Promise<string>} Current page URL
 */
async function extract(element, config = {}, context) {
  try {
    // Si element est une Page, utiliser directement url()
    if (element && typeof element.url === 'function') {
      return element.url();
    }
    
    // Si element est un ElementHandle, remonter à la page
    if (element && element.constructor.name === 'ElementHandle') {
      const page = await element.evaluateHandle(() => window);
      return page.url();
    }
    
    context.logger.warn('pageUrl extractor: could not determine page URL');
    return null;
    
  } catch (error) {
    context.logger.error(`Failed to extract page URL: ${error.message}`);
    throw error;
  }
}

module.exports = {
  name: 'pageUrl',
  extract
};
