/**
 * Template engine for variable substitution
 * Permet de remplacer les variables {{variable}} dans les configurations
 */

/**
 * Get nested property value from object using dot notation
 * @param {Object} obj - Object to search in
 * @param {string} path - Dot-separated path (e.g., 'user.name')
 * @returns {any} Value at path or undefined
 */
function getNestedValue(obj, path) {
  if (!path || !obj) return undefined;
  
  const keys = path.split('.');
  let result = obj;
  
  for (const key of keys) {
    if (result === null || result === undefined) {
      return undefined;
    }
    result = result[key];
  }
  
  return result;
}

/**
 * Set nested property value in object using dot notation
 * @param {Object} obj - Object to modify
 * @param {string} path - Dot-separated path
 * @param {any} value - Value to set
 */
function setNestedValue(obj, path, value) {
  if (!path || !obj) return;
  
  const keys = path.split('.');
  const lastKey = keys.pop();
  let current = obj;
  
  for (const key of keys) {
    if (!(key in current)) {
      current[key] = {};
    }
    current = current[key];
  }
  
  current[lastKey] = value;
}

/**
 * Resolve template variables in a string
 * @param {string} template - String with {{variable}} placeholders
 * @param {Object} context - Context object with variables
 * @returns {string} Resolved string
 */
function resolveTemplateString(template, context) {
  if (typeof template !== 'string') {
    return template;
  }
  
  return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
    const trimmedPath = path.trim();
    const value = getNestedValue(context, trimmedPath);
    
    // Si la valeur n'existe pas, retourner la chaîne vide
    if (value === undefined || value === null) {
      return '';
    }
    
    return String(value);
  });
}

/**
 * Resolve template variables in an object (recursive)
 * @param {any} obj - Object, array, or primitive to resolve
 * @param {Object} context - Context object with variables
 * @returns {any} Resolved object/array/primitive
 */
function resolveTemplate(obj, context) {
  // Si c'est null ou undefined
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  // Si c'est une chaîne, résoudre les variables
  if (typeof obj === 'string') {
    return resolveTemplateString(obj, context);
  }
  
  // Si c'est un nombre, booléen, etc.
  if (typeof obj !== 'object') {
    return obj;
  }
  
  // Si c'est un tableau
  if (Array.isArray(obj)) {
    return obj.map(item => resolveTemplate(item, context));
  }
  
  // Si c'est un objet
  const resolved = {};
  for (const [key, value] of Object.entries(obj)) {
    resolved[key] = resolveTemplate(value, context);
  }
  
  return resolved;
}

/**
 * Check if a string contains template variables
 * @param {string} str - String to check
 * @returns {boolean} True if contains {{...}}
 */
function hasTemplateVariables(str) {
  if (typeof str !== 'string') return false;
  return /\{\{[^}]+\}\}/.test(str);
}

/**
 * Extract all variable names from a template string
 * @param {string} template - Template string
 * @returns {Array<string>} Array of variable names
 */
function extractVariableNames(template) {
  if (typeof template !== 'string') return [];
  
  const matches = template.matchAll(/\{\{([^}]+)\}\}/g);
  return Array.from(matches, match => match[1].trim());
}

module.exports = {
  getNestedValue,
  setNestedValue,
  resolveTemplateString,
  resolveTemplate,
  hasTemplateVariables,
  extractVariableNames
};
