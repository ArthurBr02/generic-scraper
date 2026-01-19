/**
 * Extracteur de texte
 * Extrait le texte brut d'un élément
 */

/**
 * Extrait le texte d'un élément
 * @param {Object} element - ElementHandle ou Page de Playwright
 * @param {Object} config - Configuration de l'extraction
 * @param {string} config.selector - Sélecteur CSS de l'élément
 * @param {string} config.method - Méthode d'extraction ('innerText' ou 'textContent')
 * @param {boolean} config.trim - Supprime les espaces avant/après (défaut: true)
 * @param {Object} context - Contexte d'exécution
 * @returns {Promise<string>} Texte extrait
 */
async function extract(element, config, context) {
  const { 
    selector, 
    method = 'innerText', 
    trim = true 
  } = config;

  try {
    let text;

    // Si un sélecteur est fourni, chercher l'élément
    if (selector) {
      const targetElement = await element.$(selector);
      
      if (!targetElement) {
        context.logger.warn(`Element not found: ${selector}`);
        return null;
      }

      if (method === 'textContent') {
        text = await targetElement.textContent();
      } else {
        text = await targetElement.innerText();
      }
    } else {
      // Extraire directement de l'élément fourni
      if (method === 'textContent') {
        text = await element.textContent();
      } else {
        text = await element.innerText();
      }
    }

    // Nettoyer le texte si demandé
    if (trim && text) {
      text = text.trim();
    }

    context.logger.debug(`Extracted text: ${text?.substring(0, 50)}${text?.length > 50 ? '...' : ''}`);
    return text || '';
    
  } catch (error) {
    context.logger.error(`Text extraction failed: ${error.message}`);
    throw error;
  }
}

module.exports = {
  name: 'text',
  extract
};
