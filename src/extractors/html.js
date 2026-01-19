/**
 * Extracteur HTML
 * Extrait le code HTML d'un élément
 */

/**
 * Extrait le HTML d'un élément
 * @param {Object} element - ElementHandle ou Page de Playwright
 * @param {Object} config - Configuration de l'extraction
 * @param {string} config.selector - Sélecteur CSS de l'élément
 * @param {string} config.type - Type d'extraction ('inner' pour innerHTML, 'outer' pour outerHTML)
 * @param {Object} context - Contexte d'exécution
 * @returns {Promise<string>} Code HTML extrait
 */
async function extract(element, config, context) {
  const { 
    selector, 
    type = 'inner' 
  } = config;

  try {
    let targetElement;

    // Si un sélecteur est fourni, chercher l'élément
    if (selector) {
      targetElement = await element.$(selector);
      
      if (!targetElement) {
        context.logger.warn(`Element not found: ${selector}`);
        return null;
      }
    } else {
      targetElement = element;
    }

    let html;

    // Extraire le HTML selon le type demandé
    if (type === 'outer') {
      html = await targetElement.evaluate(el => el.outerHTML);
    } else {
      html = await targetElement.evaluate(el => el.innerHTML);
    }

    const preview = html?.substring(0, 100).replace(/\n/g, ' ');
    context.logger.debug(`Extracted ${type}HTML: ${preview}${html?.length > 100 ? '...' : ''}`);
    return html || '';
    
  } catch (error) {
    context.logger.error(`HTML extraction failed: ${error.message}`);
    throw error;
  }
}

module.exports = {
  name: 'html',
  extract
};
