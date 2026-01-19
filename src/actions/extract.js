/**
 * Action d'extraction de données
 * Extrait des données de la page selon la configuration
 */

const { extract } = require('../extractors');

/**
 * Extrait des données de la page
 * @param {Object} page - Page Playwright
 * @param {Object} config - Configuration de l'extraction
 * @param {string} config.container - Sélecteur du conteneur (optionnel)
 * @param {Array} config.fields - Champs à extraire
 * @param {boolean} config.multiple - Si true, extrait plusieurs éléments (défaut: false)
 * @param {number} config.limit - Limite du nombre d'éléments (pour multiple: true)
 * @param {Object} context - Contexte d'exécution
 * @returns {Promise<Object|Array>} Données extraites
 */
async function executeExtract(page, config, context) {
  const { 
    container = null,
    fields = [],
    multiple = false,
    limit = null
  } = config;

  if (!fields || fields.length === 0) {
    throw new Error('At least one field must be configured for extraction');
  }

  context.logger.debug(`Starting extraction: ${multiple ? 'multiple items' : 'single item'}${container ? ` from container ${container}` : ''}`);

  try {
    let element = page;

    // Si un conteneur est spécifié et qu'on veut un seul élément
    if (container && !multiple) {
      element = await page.$(container);
      if (!element) {
        throw new Error(`Container not found: ${container}`);
      }
    }

    // Extraction multiple (liste d'éléments)
    if (multiple) {
      if (!container) {
        throw new Error('Container selector is required for multiple extraction');
      }

      // Utiliser l'extracteur de liste
      const result = await extract(page, {
        type: 'list',
        selector: container,
        fields,
        limit
      }, context);

      return result;
    }

    // Extraction simple (un seul élément)
    const result = {};
    
    for (const field of fields) {
      const { name, type = 'text', ...fieldConfig } = field;

      if (!name) {
        context.logger.warn('Field without name, skipping');
        continue;
      }

      try {
        const value = await extract(element, { type, ...fieldConfig }, context);
        result[name] = value;
      } catch (fieldError) {
        context.logger.error(`Failed to extract field '${name}': ${fieldError.message}`);
        result[name] = null;
      }
    }

    return result;
    
  } catch (error) {
    context.logger.error(`Extraction action failed: ${error.message}`);
    throw error;
  }
}

module.exports = {
  name: 'extract',
  execute: executeExtract
};
