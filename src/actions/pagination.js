/**
 * Pagination action - Handles different pagination strategies
 * Supports click-based, URL-based, and infinite scroll pagination
 */

const { executeAction } = require('./index');

/**
 * Execute pagination action
 * @param {Object} page - Playwright page instance
 * @param {Object} config - Pagination configuration
 * @param {string} config.type - Pagination type: 'click', 'url', 'scroll'
 * @param {number} config.maxPages - Maximum number of pages to paginate
 * @param {number} config.maxItems - Maximum number of items to collect
 * @param {Array} config.repeatSteps - Step IDs to repeat for each page
 * @param {Object} context - Execution context
 * @returns {Promise<Object>} Pagination results
 */
async function execute(page, config, context) {
  const {
    type = 'click',
    maxPages = 10,
    maxItems = null,
    repeatSteps = [],
    ...typeConfig
  } = config;

  context.logger.info(`Starting pagination: ${type}`, { maxPages, maxItems });

  let results = {
    type,
    pagesVisited: 0,
    itemsCollected: 0,
    data: []
  };

  try {
    switch (type) {
      case 'click':
        results = await paginateByClick(page, { maxPages, maxItems, repeatSteps, ...typeConfig }, context);
        break;
      
      case 'url':
        results = await paginateByUrl(page, { maxPages, maxItems, repeatSteps, ...typeConfig }, context);
        break;
      
      case 'scroll':
        results = await paginateByScroll(page, { maxPages, maxItems, repeatSteps, ...typeConfig }, context);
        break;
      
      default:
        throw new Error(`Unknown pagination type: ${type}`);
    }

    context.logger.info(`Pagination completed`, {
      type,
      pagesVisited: results.pagesVisited,
      itemsCollected: results.itemsCollected
    });

    // Flatten pagination results for easier consumption
    // If data contains objects with same key (from repeat steps), merge them
    const flattenedData = flattenPaginationData(results.data, context);
    
    return flattenedData || results;

  } catch (error) {
    context.logger.error(`Pagination failed: ${error.message}`);
    throw error;
  }
}

/**
 * Flatten pagination data structure
 * Converts array of objects with same keys into merged arrays
 * @param {Array} data - Pagination data array
 * @param {Object} context - Execution context
 * @returns {Object|Array} Flattened data
 */
function flattenPaginationData(data, context) {
  context.logger.info('📄 Flattening pagination data:', {
    dataType: Array.isArray(data) ? 'array' : typeof data,
    length: Array.isArray(data) ? data.length : 'N/A',
    sample: Array.isArray(data) ? data[0] : data
  });
  
  if (!Array.isArray(data) || data.length === 0) {
    return data;
  }

  // Check if all items are arrays (results without output)
  const allArrays = data.every(item => Array.isArray(item));
  
  if (allArrays) {
    // Flatten array of arrays into single array
    const flattened = data.flat();
    context.logger.debug(`Flattened pagination data: ${data.length} pages into ${flattened.length} total items`);
    return flattened;
  }

  // Check if all items are objects with the same structure
  const allObjects = data.every(item => item && typeof item === 'object' && !Array.isArray(item));
  
  if (!allObjects) {
    return data;
  }

  // Get all unique keys across all objects
  const allKeys = [...new Set(data.flatMap(obj => Object.keys(obj)))];
  
  // If only one key, and all values are arrays, flatten them
  if (allKeys.length === 1) {
    const key = allKeys[0];
    const allArrays = data.every(item => Array.isArray(item[key]));
    
    if (allArrays) {
      // Flatten into single array
      const flattened = data.flatMap(item => item[key]);
      context.logger.debug(`Flattened pagination data: ${key} with ${flattened.length} total items`);
      return flattened;
    }
  }
  
  // Multiple keys: merge by key
  const merged = {};
  for (const key of allKeys) {
    const values = data.map(item => item[key]).filter(v => v !== undefined);
    
    // If all values for this key are arrays, concatenate them
    if (values.every(v => Array.isArray(v))) {
      merged[key] = values.flat();
    } else {
      // Otherwise, keep as is
      merged[key] = values.length === 1 ? values[0] : values;
    }
  }
  
  context.logger.debug(`Merged pagination data by keys:`, Object.keys(merged));
  return merged;
}

/**
 * Pagination by clicking next button
 * @param {Object} page - Playwright page
 * @param {Object} config - Configuration
 * @param {Object} context - Context
 * @returns {Promise<Object>} Results
 */
async function paginateByClick(page, config, context) {
  const {
    nextSelector,
    waitAfterClick = 2000,
    maxPages = 10,
    maxItems = null,
    repeatSteps = [],
    disabledClass = null,
    waitForSelector = null
  } = config;

  if (!nextSelector) {
    throw new Error('nextSelector is required for click-based pagination');
  }

  const results = {
    type: 'click',
    pagesVisited: 1, // Start at page 1
    itemsCollected: 0,
    data: []
  };

  context.logger.debug(`Click pagination started`, { nextSelector, maxPages });

  while (results.pagesVisited < maxPages) {
    // Check if max items reached
    if (maxItems && results.itemsCollected >= maxItems) {
      context.logger.info(`Max items reached: ${maxItems}`);
      break;
    }

    // Execute repeat steps for current page
    if (repeatSteps.length > 0) {
      const pageData = await executeRepeatSteps(page, repeatSteps, context);
      if (pageData) {
        results.data.push(pageData);
        if (Array.isArray(pageData)) {
          results.itemsCollected += pageData.length;
        } else {
          results.itemsCollected++;
        }
      }
    }

    // Check if next button exists
    const nextButton = await page.$(nextSelector);
    if (!nextButton) {
      context.logger.info('Next button not found, ending pagination');
      break;
    }

    // Check if next button is disabled
    if (disabledClass) {
      const isDisabled = await nextButton.evaluate((el, cls) => {
        return el.classList.contains(cls) || el.hasAttribute('disabled');
      }, disabledClass);

      if (isDisabled) {
        context.logger.info('Next button is disabled, ending pagination');
        break;
      }
    }

    // Click next button
    try {
      await nextButton.click();
      results.pagesVisited++;
      
      context.logger.debug(`Clicked next button, page ${results.pagesVisited}`);

      // Wait after click
      if (waitAfterClick) {
        await page.waitForTimeout(waitAfterClick);
      }

      // Wait for specific selector if provided
      if (waitForSelector) {
        await page.waitForSelector(waitForSelector, { timeout: 10000 });
      }

    } catch (error) {
      context.logger.warn(`Failed to click next button: ${error.message}`);
      break;
    }
  }

  return results;
}

/**
 * Pagination by URL pattern
 * @param {Object} page - Playwright page
 * @param {Object} config - Configuration
 * @param {Object} context - Context
 * @returns {Promise<Object>} Results
 */
async function paginateByUrl(page, config, context) {
  const {
    urlPattern,
    startPage = 1,
    maxPages = 10,
    maxItems = null,
    repeatSteps = [],
    waitForNavigation = true
  } = config;

  if (!urlPattern) {
    throw new Error('urlPattern is required for URL-based pagination');
  }

  const results = {
    type: 'url',
    pagesVisited: 0,
    itemsCollected: 0,
    data: []
  };

  context.logger.debug(`URL pagination started`, { urlPattern, startPage, maxPages });

  for (let pageNum = startPage; pageNum < startPage + maxPages; pageNum++) {
    // Check if max items reached
    if (maxItems && results.itemsCollected >= maxItems) {
      context.logger.info(`Max items reached: ${maxItems}`);
      break;
    }

    // Generate URL for current page
    const url = urlPattern.replace(/\{page\}/g, pageNum);
    
    try {
      context.logger.debug(`Navigating to page ${pageNum}: ${url}`);
      
      if (waitForNavigation) {
        await page.goto(url, { waitUntil: 'networkidle' });
      } else {
        await page.goto(url);
      }

      results.pagesVisited++;

      // Execute repeat steps for current page
      if (repeatSteps.length > 0) {
        const pageData = await executeRepeatSteps(page, repeatSteps, context);
        if (pageData) {
          results.data.push(pageData);
          if (Array.isArray(pageData)) {
            results.itemsCollected += pageData.length;
          } else {
            results.itemsCollected++;
          }
        }
      }

    } catch (error) {
      context.logger.warn(`Failed to navigate to page ${pageNum}: ${error.message}`);
      break;
    }
  }

  return results;
}

/**
 * Pagination by infinite scroll
 * @param {Object} page - Playwright page
 * @param {Object} config - Configuration
 * @param {Object} context - Context
 * @returns {Promise<Object>} Results
 */
async function paginateByScroll(page, config, context) {
  const {
    maxScrolls = 10,
    maxItems = null,
    scrollDelay = 1000,
    repeatSteps = [],
    endSelector = null,
    scrollDistance = null
  } = config;

  const results = {
    type: 'scroll',
    pagesVisited: 1,
    scrolls: 0,
    itemsCollected: 0,
    data: []
  };

  context.logger.debug(`Scroll pagination started`, { maxScrolls });

  let previousHeight = await page.evaluate(() => document.body.scrollHeight);

  while (results.scrolls < maxScrolls) {
    // Check if max items reached
    if (maxItems && results.itemsCollected >= maxItems) {
      context.logger.info(`Max items reached: ${maxItems}`);
      break;
    }

    // Execute repeat steps before scroll
    if (repeatSteps.length > 0) {
      const pageData = await executeRepeatSteps(page, repeatSteps, context);
      if (pageData) {
        results.data.push(pageData);
        if (Array.isArray(pageData)) {
          results.itemsCollected += pageData.length;
        } else {
          results.itemsCollected++;
        }
      }
    }

    // Check for end marker
    if (endSelector) {
      const endMarker = await page.$(endSelector);
      if (endMarker) {
        context.logger.info('End marker detected, stopping scroll');
        break;
      }
    }

    // Scroll down
    if (scrollDistance) {
      await page.evaluate((distance) => {
        window.scrollBy(0, distance);
      }, scrollDistance);
    } else {
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
    }

    results.scrolls++;
    context.logger.debug(`Scrolled ${results.scrolls} times`);

    // Wait for new content to load
    await page.waitForTimeout(scrollDelay);

    // Check if height changed (new content loaded)
    const newHeight = await page.evaluate(() => document.body.scrollHeight);
    if (newHeight === previousHeight) {
      context.logger.info('No new content loaded, ending scroll pagination');
      break;
    }
    previousHeight = newHeight;
  }

  return results;
}

/**
 * Execute repeat steps for pagination
 * @param {Object} page - Playwright page
 * @param {Array} stepIds - Array of step IDs to execute
 * @param {Object} context - Execution context
 * @returns {Promise<any>} Combined results
 */
async function executeRepeatSteps(page, stepIds, context) {
  if (!stepIds || stepIds.length === 0) return null;

  const workflow = context.workflow;
  if (!workflow) {
    context.logger.warn('No workflow in context, cannot execute repeat steps');
    return null;
  }

  const results = {};
  const allResults = [];

  for (const stepId of stepIds) {
    const step = workflow.config.steps.find(s => s.id === stepId);
    if (!step) {
      context.logger.warn(`Step not found: ${stepId}`);
      continue;
    }

    try {
      const result = await workflow.executeStep(step, page);
      
      // Collect result with output name if specified
      if (step.output) {
        results[step.output] = result;
      } else {
        // Collect result even without output for pagination
        allResults.push(result);
      }
    } catch (error) {
      context.logger.error(`Failed to execute repeat step ${stepId}: ${error.message}`);
      if (!step.continueOnError) {
        throw error;
      }
    }
  }

  // Return results with outputs if any, otherwise return raw results
  if (Object.keys(results).length > 0) {
    return results;
  } else if (allResults.length === 1) {
    // Single step without output: return its result directly
    return allResults[0];
  } else if (allResults.length > 0) {
    // Multiple steps without output: return as array
    return allResults;
  }
  
  return null;
}

module.exports = {
  name: 'pagination',
  execute
};

