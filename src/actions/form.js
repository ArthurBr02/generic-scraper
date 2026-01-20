/**
 * Action form - Remplissage automatique de formulaires
 * 
 * Permet de remplir des formulaires complexes avec :
 * - Mapping automatique champs/valeurs
 * - Support de tous les types de champs (input, select, checkbox, radio, textarea)
 * - Upload de fichiers
 * - Validation automatique
 * - Submit du formulaire
 * 
 * @module actions/form
 */

const logger = require('../utils/logger');

/**
 * Exécute l'action de remplissage de formulaire
 * 
 * @param {Page} page - Page Playwright
 * @param {Object} config - Configuration de l'action
 * @param {string} config.formSelector - Sélecteur du formulaire (optionnel)
 * @param {Object} config.fields - Map des champs à remplir
 * @param {boolean} config.submit - Soumettre le formulaire après remplissage
 * @param {Object} context - Contexte d'exécution
 * @returns {Promise<Object>} Résultat
 */
async function execute(page, config, context) {
  const { 
    formSelector = null,
    fields = {},
    submit = false,
    submitSelector = 'button[type="submit"]',
    waitAfterSubmit = 1000,
    validateBefore = true
  } = config;
  
  logger.info('Executing form action');
  
  try {
    const result = {
      filled: [],
      errors: [],
      submitted: false
    };
    
    // Attendre que le formulaire soit visible si un sélecteur est fourni
    if (formSelector) {
      await page.waitForSelector(formSelector, { timeout: 5000 });
      logger.debug(`Form found: ${formSelector}`);
    }
    
    // Remplir chaque champ
    for (const [fieldName, fieldConfig] of Object.entries(fields)) {
      try {
        await fillField(page, fieldName, fieldConfig, formSelector);
        result.filled.push(fieldName);
        logger.debug(`Field filled: ${fieldName}`);
      } catch (error) {
        logger.warn(`Failed to fill field: ${fieldName}`, error);
        result.errors.push({ field: fieldName, error: error.message });
      }
    }
    
    // Valider le formulaire avant submit si demandé
    if (validateBefore && submit) {
      const validation = await validateForm(page, formSelector);
      if (!validation.valid) {
        logger.warn('Form validation failed', validation.errors);
        result.validationErrors = validation.errors;
      }
    }
    
    // Soumettre le formulaire
    if (submit) {
      const submitBtn = formSelector 
        ? await page.$(`${formSelector} ${submitSelector}`)
        : await page.$(submitSelector);
      
      if (submitBtn) {
        await submitBtn.click();
        result.submitted = true;
        logger.info('Form submitted');
        
        if (waitAfterSubmit > 0) {
          await page.waitForTimeout(waitAfterSubmit);
        }
      } else {
        logger.warn('Submit button not found');
      }
    }
    
    logger.info(`Form action completed: ${result.filled.length} fields filled, ${result.errors.length} errors`);
    return result;
    
  } catch (error) {
    logger.error('Form action failed:', error);
    throw error;
  }
}

/**
 * Remplit un champ du formulaire
 * 
 * @param {Page} page - Page Playwright
 * @param {string} fieldName - Nom du champ
 * @param {Object|string|number|boolean} fieldConfig - Configuration ou valeur du champ
 * @param {string} formSelector - Sélecteur du formulaire parent
 */
async function fillField(page, fieldName, fieldConfig, formSelector) {
  // Si fieldConfig est une valeur simple, le convertir en config
  if (typeof fieldConfig !== 'object' || fieldConfig === null) {
    fieldConfig = { value: fieldConfig };
  }
  
  const {
    selector = `[name="${fieldName}"]`,
    value,
    type = 'auto',
    wait = true,
    timeout = 5000
  } = fieldConfig;
  
  // Construire le sélecteur complet
  const fullSelector = formSelector ? `${formSelector} ${selector}` : selector;
  
  // Attendre que le champ soit visible
  if (wait) {
    await page.waitForSelector(fullSelector, { timeout, state: 'visible' });
  }
  
  // Détecter le type de champ si auto
  let fieldType = type;
  if (type === 'auto') {
    fieldType = await detectFieldType(page, fullSelector);
  }
  
  // Remplir selon le type
  switch (fieldType) {
    case 'text':
    case 'email':
    case 'password':
    case 'number':
    case 'tel':
    case 'url':
    case 'search':
    case 'textarea':
      await page.fill(fullSelector, String(value));
      break;
      
    case 'select':
      await fillSelect(page, fullSelector, value);
      break;
      
    case 'checkbox':
      await fillCheckbox(page, fullSelector, value);
      break;
      
    case 'radio':
      await fillRadio(page, fullSelector, value);
      break;
      
    case 'file':
      await fillFile(page, fullSelector, value);
      break;
      
    case 'date':
    case 'datetime-local':
    case 'time':
      await page.fill(fullSelector, String(value));
      break;
      
    default:
      // Par défaut, essayer fill
      await page.fill(fullSelector, String(value));
  }
}

/**
 * Détecte automatiquement le type d'un champ
 * 
 * @param {Page} page - Page Playwright
 * @param {string} selector - Sélecteur du champ
 * @returns {Promise<string>} Type du champ
 */
async function detectFieldType(page, selector) {
  return await page.evaluate((sel) => {
    const element = document.querySelector(sel);
    if (!element) return 'text';
    
    const tagName = element.tagName.toLowerCase();
    
    if (tagName === 'select') return 'select';
    if (tagName === 'textarea') return 'textarea';
    if (tagName === 'input') {
      const inputType = element.getAttribute('type') || 'text';
      return inputType.toLowerCase();
    }
    
    return 'text';
  }, selector);
}

/**
 * Remplit un select
 * 
 * @param {Page} page - Page Playwright
 * @param {string} selector - Sélecteur
 * @param {string|string[]} value - Valeur(s) à sélectionner
 */
async function fillSelect(page, selector, value) {
  const values = Array.isArray(value) ? value : [value];
  await page.selectOption(selector, values);
}

/**
 * Remplit une checkbox
 * 
 * @param {Page} page - Page Playwright
 * @param {string} selector - Sélecteur
 * @param {boolean} value - Cocher ou décocher
 */
async function fillCheckbox(page, selector, value) {
  const isChecked = await page.isChecked(selector);
  
  if (value && !isChecked) {
    await page.check(selector);
  } else if (!value && isChecked) {
    await page.uncheck(selector);
  }
}

/**
 * Remplit un radio button
 * 
 * @param {Page} page - Page Playwright
 * @param {string} selector - Sélecteur du groupe radio
 * @param {string} value - Valeur à sélectionner
 */
async function fillRadio(page, selector, value) {
  // Si le sélecteur est un groupe (name), trouver le bon input
  const radioSelector = selector.includes('[value=') 
    ? selector 
    : `${selector}[value="${value}"]`;
  
  await page.check(radioSelector);
}

/**
 * Upload de fichier(s)
 * 
 * @param {Page} page - Page Playwright
 * @param {string} selector - Sélecteur de l'input file
 * @param {string|string[]} value - Chemin(s) du/des fichier(s)
 */
async function fillFile(page, selector, value) {
  const files = Array.isArray(value) ? value : [value];
  await page.setInputFiles(selector, files);
}

/**
 * Valide le formulaire avant soumission
 * 
 * @param {Page} page - Page Playwright
 * @param {string} formSelector - Sélecteur du formulaire
 * @returns {Promise<Object>} Résultat de validation
 */
async function validateForm(page, formSelector) {
  return await page.evaluate((selector) => {
    const form = selector ? document.querySelector(selector) : document.querySelector('form');
    
    if (!form) {
      return { valid: false, errors: ['Form not found'] };
    }
    
    // Utiliser l'API HTML5 de validation
    const isValid = form.checkValidity();
    const errors = [];
    
    if (!isValid) {
      const inputs = form.querySelectorAll('input, select, textarea');
      inputs.forEach(input => {
        if (!input.checkValidity()) {
          errors.push({
            name: input.name || input.id,
            message: input.validationMessage
          });
        }
      });
    }
    
    return { valid: isValid, errors };
  }, formSelector);
}

/**
 * Récupère les valeurs actuelles du formulaire
 * 
 * @param {Page} page - Page Playwright
 * @param {string} formSelector - Sélecteur du formulaire
 * @returns {Promise<Object>} Valeurs du formulaire
 */
async function getFormValues(page, formSelector) {
  return await page.evaluate((selector) => {
    const form = selector ? document.querySelector(selector) : document.querySelector('form');
    
    if (!form) return {};
    
    const formData = new FormData(form);
    const values = {};
    
    for (const [key, value] of formData.entries()) {
      if (values[key]) {
        // Si la clé existe déjà, créer un tableau
        if (!Array.isArray(values[key])) {
          values[key] = [values[key]];
        }
        values[key].push(value);
      } else {
        values[key] = value;
      }
    }
    
    return values;
  }, formSelector);
}

module.exports = {
  name: 'form',
  execute,
  fillField,
  getFormValues,
  validateForm
};
