/**
 * Extracteur de listes
 * Extrait plusieurs éléments et leurs sous-champs
 */

const { extract } = require('./index');

/**
 * Extrait une liste d'éléments avec leurs sous-champs
 * @param {Object} element - Page de Playwright
 * @param {Object} config - Configuration de l'extraction
 * @param {string} config.selector - Sélecteur CSS des éléments à lister
 * @param {Array} config.fields - Champs à extraire pour chaque élément
 * @param {number} config.limit - Nombre maximum d'éléments à extraire
 * @param {Object} context - Contexte d'exécution
 * @returns {Promise<Array>} Tableau d'objets extraits
 */
async function extractList(element, config, context) {
  const { 
    selector, 
    fields = [], 
    limit = null 
  } = config;

  if (!selector) {
    throw new Error('Selector is required for list extraction');
  }

  if (!fields || fields.length === 0) {
    throw new Error('Fields array is required for list extraction');
  }

  try {
    // Récupérer tous les éléments correspondants au sélecteur
    const elements = await element.$$(selector);
    
    if (!elements || elements.length === 0) {
      context.logger.warn(`No elements found for selector: ${selector}`);
      return [];
    }

    const elementsToProcess = limit ? elements.slice(0, limit) : elements;
    context.logger.debug(`Found ${elements.length} elements, processing ${elementsToProcess.length}`);

    const results = [];

    // Pour chaque élément, extraire tous les champs
    for (let i = 0; i < elementsToProcess.length; i++) {
      const el = elementsToProcess[i];
      const item = {};

      try {
        // Extraire chaque champ configuré
        for (const field of fields) {
          const { name, type = 'text', ...fieldConfig } = field;

          if (!name) {
            context.logger.warn(`Field without name at index ${i}, skipping`);
            continue;
          }

          // Utiliser le système d'extraction pour chaque champ
          try {
            const value = await extract(el, { type, ...fieldConfig }, context);
            item[name] = value;
          } catch (fieldError) {
            context.logger.error(`Failed to extract field '${name}' at index ${i}: ${fieldError.message}`);
            item[name] = null;
          }
        }

        results.push(item);
        
      } catch (itemError) {
        context.logger.error(`Failed to process element at index ${i}: ${itemError.message}`);
      }
    }

    context.logger.info(`Extracted ${results.length} items from list`);
    return results;
    
  } catch (error) {
    context.logger.error(`List extraction failed: ${error.message}`);
    throw error;
  }
}

module.exports = {
  name: 'list',
  extract: extractList
};
