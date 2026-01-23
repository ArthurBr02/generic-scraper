/**
 * Workflow orchestrator
 * Gère l'exécution séquentielle des steps et le contexte partagé
 */

const { executeAction } = require('../actions');
const { resolveTemplate } = require('../utils/template');
const { getLogger } = require('../utils/logger');

class Workflow {
  /**
   * Create a workflow instance
   * @param {Object} config - Workflow configuration
   * @param {Object} globalContext - Global context (browser config, etc.)
   */
  constructor(config, globalContext = {}) {
    this.config = config;
    this.globalContext = globalContext;
    this.data = {}; // Données collectées pendant l'exécution
    this.logger = globalContext.logger || getLogger();
    
    if (!config.steps || !Array.isArray(config.steps)) {
      throw new Error('Workflow must have a steps array');
    }
  }

  /**
   * Execute the workflow
   * @param {Object} page - Playwright page instance
   * @returns {Promise<Object>} Workflow execution results
   */
  async execute(page) {
    this.logger.info(`Starting workflow: ${this.config.name || 'unnamed'}`);
    
    const startTime = Date.now();
    const results = {};
    
    try {
      for (let i = 0; i < this.config.steps.length; i++) {
        const step = this.config.steps[i];
        const stepResult = await this.executeStep(step, page, i);
        
        // Stocker le résultat si un nom de sortie est spécifié
        if (step.output) {
          this.logger.info(`💾 Saving step result to workflow.data.${step.output}`, {
            resultType: Array.isArray(stepResult) ? 'array' : typeof stepResult,
            length: Array.isArray(stepResult) ? stepResult.length : 'N/A',
            sample: Array.isArray(stepResult) ? stepResult[0] : stepResult
          });
          this.data[step.output] = stepResult;
          results[step.output] = stepResult;
        }
      }
      
      const duration = Date.now() - startTime;
      this.logger.info(`Workflow completed in ${duration}ms`, {
        workflow: this.config.name,
        duration,
        steps: this.config.steps.length
      });
      
      return {
        success: true,
        data: results,
        duration
      };
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`Workflow failed after ${duration}ms: ${error.message}`, {
        workflow: this.config.name,
        error: error.message,
        stack: error.stack
      });
      
      throw error;
    }
  }

  /**
   * Execute a single step
   * @param {Object} step - Step configuration
   * @param {Object} page - Playwright page instance
   * @param {number} index - Step index
   * @returns {Promise<any>} Step execution result
   */
  async executeStep(step, page, index = 0) {
    const stepName = step.name || step.id || `step-${index + 1}`;
    const stepType = step.type;
    
    this.logger.info(`Executing step [${index + 1}/${this.config.steps.length}]: ${stepName}`, {
      type: stepType,
      id: step.id
    });
    
    try {
      // Créer le contexte pour cette step
      const stepContext = this.createStepContext(step);
      
      // Pour certaines actions (loop, condition), ne pas résoudre les templates
      // car elles gèrent leur propre contexte avec des variables dynamiques
      const skipTemplateResolution = ['loop', 'condition'].includes(stepType);
      
      // Résoudre les templates dans la configuration
      const resolvedConfig = skipTemplateResolution 
        ? step.config 
        : this.resolveStepConfig(step.config, stepContext);
      
      // Exécuter l'action
      const result = await executeAction(page, {
        type: stepType,
        config: resolvedConfig
      }, stepContext);
      
      this.logger.debug(`Step completed: ${stepName}`, {
        type: stepType,
        hasResult: result !== undefined && result !== null
      });
      
      return result;
      
    } catch (error) {
      this.logger.error(`Step failed: ${stepName}`, {
        type: stepType,
        error: error.message
      });
      
      // Si continueOnError est activé, logger l'erreur mais continuer
      if (step.continueOnError || this.config.continueOnError) {
        this.logger.warn(`Continuing despite error in step: ${stepName}`);
        return null;
      }
      
      throw error;
    }
  }

  /**
   * Create execution context for a step
   * @param {Object} step - Step configuration
   * @returns {Object} Step context
   */
  createStepContext(step) {
    return {
      ...this.globalContext,
      logger: this.logger,
      workflow: this,
      step: {
        id: step.id,
        name: step.name,
        type: step.type
      }
    };
  }

  /**
   * Resolve template variables in step configuration
   * @param {Object} config - Step configuration
   * @param {Object} context - Execution context
   * @returns {Object} Resolved configuration
   */
  resolveStepConfig(config, context) {
    if (!config) return config;
    
    // Créer un objet de contexte pour le templating
    const templateContext = {
      ...this.globalContext,
      data: this.data,
      workflow: {
        name: this.config.name,
        data: this.data
      }
    };
    
    // Résoudre toutes les variables dans la config
    return resolveTemplate(config, templateContext);
  }

  /**
   * Get a step by its ID
   * @param {string} stepId - Step ID
   * @returns {Object|null} Step configuration or null
   */
  getStepById(stepId) {
    return this.config.steps.find(step => step.id === stepId) || null;
  }

  /**
   * Get current workflow data
   * @returns {Object} Current data
   */
  getData() {
    return { ...this.data };
  }

  /**
   * Set workflow data
   * @param {string} key - Data key
   * @param {any} value - Data value
   */
  setData(key, value) {
    this.data[key] = value;
  }

  /**
   * Execute a sub-workflow
   * @param {string} name - Sub-workflow name
   * @param {Object} params - Parameters to pass to sub-workflow
   * @param {Object} page - Playwright page instance
   * @returns {Promise<Object>} Sub-workflow results
   */
  async executeSubWorkflow(name, params, page) {
    if (!this.config.subWorkflows || !this.config.subWorkflows[name]) {
      throw new Error(`Sub-workflow not found: ${name}`);
    }

    this.logger.info(`Executing sub-workflow: ${name}`);

    const subWorkflowConfig = this.config.subWorkflows[name];

    // Créer un nouveau contexte pour le sous-workflow avec les paramètres
    const subContext = {
      ...this.globalContext,
      logger: this.logger,
      parent: {
        workflow: this.config.name,
        data: this.data
      },
      params: params || {}
    };

    // Créer et exécuter le sous-workflow
    const subWorkflow = new Workflow(
      {
        name: `${this.config.name}:${name}`,
        steps: subWorkflowConfig.steps,
        continueOnError: subWorkflowConfig.continueOnError || this.config.continueOnError
      },
      subContext
    );

    const result = await subWorkflow.execute(page);
    
    this.logger.info(`Sub-workflow completed: ${name}`, {
      duration: result.duration
    });

    return result;
  }

  /**
   * Check if a sub-workflow exists
   * @param {string} name - Sub-workflow name
   * @returns {boolean}
   */
  hasSubWorkflow(name) {
    return !!(this.config.subWorkflows && this.config.subWorkflows[name]);
  }

  /**
   * Get all sub-workflow names
   * @returns {Array<string>}
   */
  getSubWorkflowNames() {
    return this.config.subWorkflows ? Object.keys(this.config.subWorkflows) : [];
  }
}

module.exports = Workflow;
