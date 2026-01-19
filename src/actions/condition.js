/**
 * Condition action - Conditional branching (if/then/else)
 * Executes different steps based on conditions
 */

/**
 * Execute condition action
 * @param {Object} page - Playwright page instance
 * @param {Object} config - Condition configuration
 * @param {Object} config.if - Condition to evaluate
 * @param {Array} config.then - Steps to execute if condition is true
 * @param {Array} config.else - Steps to execute if condition is false (optional)
 * @param {Object} context - Execution context
 * @returns {Promise<Object>} Results from executed branch
 */
async function execute(page, config, context) {
  const {
    if: condition,
    then: thenSteps = [],
    else: elseSteps = []
  } = config;

  if (!condition) {
    throw new Error('Condition action requires "if" configuration');
  }

  if (!thenSteps || thenSteps.length === 0) {
    throw new Error('Condition action requires "then" steps array');
  }

  context.logger.info('Evaluating condition', { condition });

  try {
    // Évaluer la condition
    const conditionResult = await evaluateCondition(page, condition, context);
    
    context.logger.info(`Condition evaluated to: ${conditionResult}`);

    // Exécuter la branche appropriée
    if (conditionResult) {
      context.logger.debug(`Executing 'then' branch (${thenSteps.length} steps)`);
      return await executeConditionalSteps(page, thenSteps, context, 'then');
    } else if (elseSteps.length > 0) {
      context.logger.debug(`Executing 'else' branch (${elseSteps.length} steps)`);
      return await executeConditionalSteps(page, elseSteps, context, 'else');
    } else {
      context.logger.debug('Condition false and no else branch, skipping');
      return { branch: 'none', result: null };
    }

  } catch (error) {
    context.logger.error(`Condition evaluation failed: ${error.message}`);
    throw error;
  }
}

/**
 * Evaluate a condition
 * @param {Object} page - Playwright page
 * @param {Object} condition - Condition configuration
 * @param {Object} context - Execution context
 * @returns {Promise<boolean>} Condition result
 */
async function evaluateCondition(page, condition, context) {
  const { resolveTemplate } = require('../utils/template');

  // Résoudre les templates dans la condition
  const resolvedCondition = resolveTemplate(condition, {
    ...context,
    workflow: context.workflow,
    data: context.workflow?.data || {}
  });

  // Type de condition
  const type = resolvedCondition.type || 'exists';

  switch (type) {
    case 'exists':
      // Vérifier si un sélecteur existe
      return await evaluateExists(page, resolvedCondition, context);
    
    case 'equals':
      // Vérifier si deux valeurs sont égales
      return evaluateEquals(resolvedCondition, context);
    
    case 'contains':
      // Vérifier si une valeur contient une autre
      return evaluateContains(resolvedCondition, context);
    
    case 'greaterThan':
    case 'lessThan':
    case 'greaterOrEqual':
    case 'lessOrEqual':
      // Comparaisons numériques
      return evaluateComparison(type, resolvedCondition, context);
    
    case 'expression':
      // Évaluer une expression JavaScript
      return evaluateExpression(page, resolvedCondition, context);
    
    default:
      throw new Error(`Unknown condition type: ${type}`);
  }
}

/**
 * Evaluate 'exists' condition
 */
async function evaluateExists(page, condition, context) {
  const { selector, timeout = 1000 } = condition;
  
  if (!selector) {
    throw new Error('exists condition requires a selector');
  }

  try {
    await page.waitForSelector(selector, { timeout });
    context.logger.debug(`Selector exists: ${selector}`);
    return true;
  } catch {
    context.logger.debug(`Selector does not exist: ${selector}`);
    return false;
  }
}

/**
 * Evaluate 'equals' condition
 */
function evaluateEquals(condition, context) {
  const { value, expected } = condition;
  
  if (value === undefined || expected === undefined) {
    throw new Error('equals condition requires "value" and "expected"');
  }

  return value === expected;
}

/**
 * Evaluate 'contains' condition
 */
function evaluateContains(condition, context) {
  const { value, substring } = condition;
  
  if (!value || !substring) {
    throw new Error('contains condition requires "value" and "substring"');
  }

  return String(value).includes(String(substring));
}

/**
 * Evaluate numeric comparison conditions
 */
function evaluateComparison(type, condition, context) {
  const { value, compare } = condition;
  
  if (value === undefined || compare === undefined) {
    throw new Error(`${type} condition requires "value" and "compare"`);
  }

  const numValue = Number(value);
  const numCompare = Number(compare);

  if (isNaN(numValue) || isNaN(numCompare)) {
    throw new Error('Comparison values must be numeric');
  }

  switch (type) {
    case 'greaterThan':
      return numValue > numCompare;
    case 'lessThan':
      return numValue < numCompare;
    case 'greaterOrEqual':
      return numValue >= numCompare;
    case 'lessOrEqual':
      return numValue <= numCompare;
    default:
      return false;
  }
}

/**
 * Evaluate JavaScript expression
 */
async function evaluateExpression(page, condition, context) {
  const { expression } = condition;
  
  if (!expression) {
    throw new Error('expression condition requires an "expression" string');
  }

  // Évaluer dans le contexte de la page
  return await page.evaluate((expr) => {
    try {
      return eval(expr);
    } catch (error) {
      throw new Error(`Expression evaluation failed: ${error.message}`);
    }
  }, expression);
}

/**
 * Execute conditional steps
 */
async function executeConditionalSteps(page, steps, context, branch) {
  const { executeAction } = require('./index');
  const { resolveTemplate } = require('../utils/template');
  
  const results = {};

  for (const step of steps) {
    // Résoudre les templates dans la config
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

  return {
    branch,
    results
  };
}

module.exports = {
  name: 'condition',
  execute
};
