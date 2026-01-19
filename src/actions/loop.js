/**
 * Loop action - Iterate over items and execute steps
 * Allows iteration over arrays or data from previous steps
 */

/**
 * Execute loop action
 * @param {Object} page - Playwright page instance
 * @param {Object} config - Loop configuration
 * @param {Array|string} config.items - Array of items or path to data (e.g., 'data.products')
 * @param {Array} config.steps - Steps to execute for each item
 * @param {string} config.itemVar - Variable name for current item (default: 'item')
 * @param {string} config.indexVar - Variable name for current index (default: 'index')
 * @param {number} config.limit - Maximum number of iterations
 * @param {Object} context - Execution context
 * @returns {Promise<Array>} Array of results from each iteration
 */
async function execute(page, config, context) {
  const {
    items,
    steps = [],
    itemVar = 'item',
    indexVar = 'index',
    limit = null
  } = config;

  if (!items) {
    throw new Error('Loop action requires "items" configuration');
  }

  if (!steps || steps.length === 0) {
    throw new Error('Loop action requires "steps" array');
  }

  context.logger.info('Starting loop action', {
    itemsType: typeof items,
    stepsCount: steps.length
  });

  // Récupérer le tableau d'items
  let itemsArray;
  
  if (Array.isArray(items)) {
    // Items fourni directement comme tableau
    itemsArray = items;
  } else if (typeof items === 'string') {
    // Items est un chemin vers les données (e.g., 'data.products')
    const { getNestedValue } = require('../utils/template');
    
    // Chercher dans le contexte workflow
    const workflowData = context.workflow?.data || {};
    itemsArray = getNestedValue(workflowData, items);
    
    if (!itemsArray) {
      context.logger.warn(`No data found at path: ${items}`);
      return [];
    }
  } else {
    throw new Error('Items must be an array or a string path to data');
  }

  if (!Array.isArray(itemsArray)) {
    throw new Error('Items must resolve to an array');
  }

  // Appliquer la limite si spécifiée
  const limitedItems = limit ? itemsArray.slice(0, limit) : itemsArray;
  
  context.logger.info(`Looping over ${limitedItems.length} items`, {
    total: itemsArray.length,
    limited: limitedItems.length
  });

  const results = [];

  // Itérer sur chaque item
  for (let i = 0; i < limitedItems.length; i++) {
    const item = limitedItems[i];
    
    context.logger.debug(`Loop iteration ${i + 1}/${limitedItems.length}`);

    try {
      // Créer un contexte pour cette itération avec les variables
      const iterationContext = {
        ...context,
        [itemVar]: item,
        [indexVar]: i,
        loopIteration: {
          current: i + 1,
          total: limitedItems.length,
          item: item,
          index: i
        }
      };

      // Exécuter les steps pour cet item
      const iterationResult = await executeLoopSteps(page, steps, iterationContext);
      results.push(iterationResult);

    } catch (error) {
      context.logger.error(`Loop iteration ${i + 1} failed: ${error.message}`);
      
      // Si continueOnError, continuer avec l'item suivant
      if (config.continueOnError) {
        results.push({ error: error.message, index: i });
        continue;
      }
      
      throw error;
    }
  }

  context.logger.info(`Loop completed with ${results.length} results`);
  return results;
}

/**
 * Execute steps within a loop iteration
 * @param {Object} page - Playwright page
 * @param {Array} steps - Steps to execute
 * @param {Object} context - Iteration context
 * @returns {Promise<Object>} Iteration results
 */
async function executeLoopSteps(page, steps, context) {
  const { executeAction } = require('./index');
  const { resolveTemplate } = require('../utils/template');
  
  const results = {};

  for (const step of steps) {
    // Résoudre les templates dans la config avec le contexte d'itération
    const resolvedConfig = resolveTemplate(step.config, context);

    // Exécuter l'action
    const result = await executeAction(page, {
      type: step.type,
      config: resolvedConfig
    }, context);

    // Stocker le résultat si un nom de sortie est spécifié
    if (step.output) {
      results[step.output] = result;
    }
  }

  return results;
}

module.exports = {
  name: 'loop',
  execute
};
