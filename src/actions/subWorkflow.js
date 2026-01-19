/**
 * SubWorkflow action - Execute a defined sub-workflow
 * Allows calling reusable workflow fragments
 */

/**
 * Execute subWorkflow action
 * @param {Object} page - Playwright page instance
 * @param {Object} config - SubWorkflow configuration
 * @param {string} config.name - Name of the sub-workflow to execute
 * @param {Object} config.params - Parameters to pass to the sub-workflow
 * @param {Object} context - Execution context
 * @returns {Promise<Object>} Sub-workflow results
 */
async function execute(page, config, context) {
  const {
    name,
    params = {}
  } = config;

  if (!name) {
    throw new Error('SubWorkflow action requires a "name" configuration');
  }

  context.logger.info(`Executing sub-workflow: ${name}`);

  // Vérifier si le workflow parent existe dans le contexte
  const workflow = context.workflow;
  if (!workflow) {
    throw new Error('No workflow in context, cannot execute sub-workflow');
  }

  // Vérifier si le sous-workflow existe
  if (!workflow.hasSubWorkflow(name)) {
    throw new Error(`Sub-workflow not found: ${name}. Available: ${workflow.getSubWorkflowNames().join(', ')}`);
  }

  try {
    // Résoudre les paramètres avec le contexte actuel
    const { resolveTemplate } = require('../utils/template');
    const resolvedParams = resolveTemplate(params, {
      ...context,
      workflow: workflow,
      data: workflow.data || {}
    });

    // Exécuter le sous-workflow
    const result = await workflow.executeSubWorkflow(name, resolvedParams, page);

    context.logger.info(`Sub-workflow completed: ${name}`, {
      success: result.success,
      duration: result.duration
    });

    return result;

  } catch (error) {
    context.logger.error(`Sub-workflow execution failed: ${name}`, {
      error: error.message
    });
    throw error;
  }
}

module.exports = {
  name: 'subWorkflow',
  execute
};
