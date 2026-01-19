/**
 * Extracteur d'attributs HTML
 * Extrait la valeur d'un attribut HTML d'un élément
 */

/**
 * Extrait la valeur d'un attribut HTML
 * @param {Object} element - ElementHandle ou Page de Playwright
 * @param {Object} config - Configuration de l'extraction
 * @param {string} config.selector - Sélecteur CSS de l'élément
 * @param {string} config.attribute - Nom de l'attribut à extraire (ex: 'href', 'src', 'data-id')
 * @param {string} config.default - Valeur par défaut si l'attribut n'existe pas
 * @param {Object} context - Contexte d'exécution
 * @returns {Promise<string|null>} Valeur de l'attribut ou null
 */
async function extract(element, config, context) {
  const { 
    selector, 
    attribute, 
    default: defaultValue = null 
  } = config;

  if (!attribute) {
    throw new Error('Attribute name is required for attribute extraction');
  }

  try {
    let targetElement;

    // Si un sélecteur est fourni, chercher l'élément
    if (selector) {
      targetElement = await element.$(selector);
      
      if (!targetElement) {
        context.logger.warn(`Element not found: ${selector}`);
        return defaultValue;
      }
    } else {
      targetElement = element;
    }

    // Extraire l'attribut
    const value = await targetElement.getAttribute(attribute);

    if (value === null || value === undefined) {
      context.logger.debug(`Attribute '${attribute}' not found, using default: ${defaultValue}`);
      return defaultValue;
    }

    context.logger.debug(`Extracted attribute '${attribute}': ${value?.substring(0, 50)}${value?.length > 50 ? '...' : ''}`);
    return value;
    
  } catch (error) {
    context.logger.error(`Attribute extraction failed: ${error.message}`);
    throw error;
  }
}

module.exports = {
  name: 'attribute',
  extract
};
