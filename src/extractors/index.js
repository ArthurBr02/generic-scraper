/**
 * Registre des extracteurs
 * Pattern factory pour gérer les différents types d'extraction
 */

const textExtractor = require('./text');
const attributeExtractor = require('./attribute');
const htmlExtractor = require('./html');
const listExtractor = require('./list');

/**
 * Registre des extracteurs disponibles
 */
const extractors = {
  text: textExtractor,
  attribute: attributeExtractor,
  html: htmlExtractor,
  list: listExtractor
};

/**
 * Récupère un extracteur par son type
 * @param {string} type - Type d'extracteur
 * @returns {Object} Extracteur correspondant
 * @throws {Error} Si le type d'extracteur n'existe pas
 */
function getExtractor(type) {
  const extractor = extractors[type];
  if (!extractor) {
    throw new Error(`Unknown extractor type: ${type}`);
  }
  return extractor;
}

/**
 * Enregistre un nouvel extracteur
 * @param {string} name - Nom de l'extracteur
 * @param {Object} extractor - Objet extracteur avec une méthode extract
 */
function registerExtractor(name, extractor) {
  if (!extractor.extract || typeof extractor.extract !== 'function') {
    throw new Error(`Extractor must have an extract method: ${name}`);
  }
  extractors[name] = extractor;
}

/**
 * Extrait les données d'un élément selon la configuration
 * @param {Object} element - Élément Playwright (Page ou ElementHandle)
 * @param {Object} config - Configuration de l'extraction
 * @param {Object} context - Contexte d'exécution
 * @returns {Promise<any>} Données extraites
 */
async function extract(element, config, context) {
  const { type = 'text', ...extractConfig } = config;
  const extractor = getExtractor(type);
  
  try {
    return await extractor.extract(element, extractConfig, context);
  } catch (error) {
    context.logger.error(`Extraction failed for type ${type}:`, error.message);
    throw error;
  }
}

module.exports = {
  extractors,
  getExtractor,
  registerExtractor,
  extract
};
