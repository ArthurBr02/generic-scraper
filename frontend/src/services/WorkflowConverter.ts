/**
 * Service de conversion entre le workflow visuel (VueFlow) et la configuration JSON
 */

import type { Node, Edge } from '@vue-flow/core';

/**
 * Interface pour une étape de workflow JSON
 */
export interface WorkflowStep {
  id: string;
  name?: string;
  type: string;
  config: Record<string, any>;
  output?: string;
  next?: string | string[];
  condition?: {
    if: string;
    then: string;
    else: string;
  };
}

/**
 * Interface pour une configuration complète de workflow
 */
export interface WorkflowConfig {
  $schema?: string;
  name: string;
  description?: string;
  version?: string;
  steps: WorkflowStep[];
}

/**
 * Service de conversion de workflow
 */
export class WorkflowConverter {
  /**
   * Convertit le graphe visuel en configuration JSON
   * @param nodes - Les nœuds VueFlow
   * @param edges - Les connexions VueFlow
   * @param metadata - Métadonnées du workflow (nom, description)
   * @returns Configuration JSON du workflow
   */
  static toConfig(
    nodes: Node[],
    edges: Edge[],
    metadata?: { name?: string; description?: string }
  ): WorkflowConfig {
    // Trier les nœuds dans l'ordre du workflow (topological sort)
    const sortedNodes = this.topologicalSort(nodes, edges);

    // Extraire la configuration du bloc init
    const initNode = nodes.find(node => node.data?.type === 'init');
    const globalConfig: any = {};
    
    if (initNode?.data?.config) {
      if (initNode.data.config.target) {
        globalConfig.target = initNode.data.config.target;
      }
      if (initNode.data.config.browser) {
        globalConfig.browser = initNode.data.config.browser;
      }
      if (initNode.data.config.logging) {
        globalConfig.logging = initNode.data.config.logging;
      }
      if (initNode.data.config.errorHandling) {
        globalConfig.errorHandling = initNode.data.config.errorHandling;
      }
      if (initNode.data.config.scheduling) {
        globalConfig.scheduling = initNode.data.config.scheduling;
      }
      if (initNode.data.config.output) {
        globalConfig.output = initNode.data.config.output;
      }
    }

    // Identifier les nœuds qui font partie d'un corps de boucle
    const loopBodyNodes = new Set<string>();
    edges.forEach(edge => {
      if (edge.sourceHandle?.endsWith('-loop')) {
        // Marquer le nœud cible et tous ses descendants comme faisant partie du corps de boucle
        const descendants = this.findDescendants(edge.target, edges, loopBodyNodes);
        descendants.forEach(id => loopBodyNodes.add(id));
      }
    });

    // Convertir chaque nœud en étape (sauf ceux dans le corps de boucle et le bloc init)
    const steps: WorkflowStep[] = sortedNodes
      .filter(node => !loopBodyNodes.has(node.id) && node.data?.type !== 'init')
      .map((node) => {
        const step: WorkflowStep = {
          id: node.id,
          name: node.data?.label || node.data?.name || `${node.data?.type || node.type} - ${node.id}`,
          type: node.data?.type || node.type || 'unknown',
          config: { ...node.data?.config || {} }
        };

        // Ajouter l'output si défini (d'abord depuis node.data.output, sinon depuis node.data.config.output)
        const outputValue = node.data?.output || node.data?.config?.output;
        if (outputValue && outputValue.trim() !== '') {
          step.output = outputValue;
          // Retirer output et saveAs de config car ils ne doivent pas y être
          delete step.config.output;
          delete step.config.saveAs;
        }

        // Pour les blocs loop, construire le tableau steps à partir des edges
        if (step.type === 'loop') {
          const loopEdges = edges.filter(e => e.source === node.id && e.sourceHandle?.endsWith('-loop'));
          if (loopEdges.length > 0) {
            // Construire récursivement les steps du corps de boucle
            const loopSteps = this.buildLoopSteps(loopEdges[0].target, nodes, edges, loopBodyNodes);
            step.config.steps = loopSteps;
          }
        }

        // Déterminer les étapes suivantes
        const outgoingEdges = edges.filter((e) => 
          e.source === node.id && 
          !e.sourceHandle?.endsWith('-loop') &&
          !e.sourceHandle?.endsWith('-true') &&
          !e.sourceHandle?.endsWith('-false')
        );

        if (outgoingEdges.length === 1) {
          // Une seule sortie
          step.next = outgoingEdges[0].target;
        } else if (outgoingEdges.length > 1) {
          // Plusieurs sorties (branches conditionnelles)
          const conditionalEdges = outgoingEdges.filter((e) => e.data?.condition);
          
          if (conditionalEdges.length > 0) {
            // Gestion des conditions
            const ifEdge = conditionalEdges.find((e) => e.data?.condition === 'true');
            const elseEdge = conditionalEdges.find((e) => e.data?.condition === 'false');
            
            if (ifEdge && elseEdge) {
              step.condition = {
                if: node.data?.conditionExpression || 'true',
                then: ifEdge.target,
                else: elseEdge.target
              };
            }
          } else {
            // Plusieurs sorties normales (exécution parallèle)
            step.next = outgoingEdges.map((e) => e.target);
          }
        }

        return step;
      });

    // Auto-génération des colonnes CSV si le format est CSV
    if (globalConfig.output && globalConfig.output.format === 'csv') {
      const csvColumns = this.extractCsvColumns(steps);
      if (csvColumns.length > 0) {
        globalConfig.output.columns = csvColumns;
      }
    }

    return {
      $schema: '../../src/schemas/workflow.schema.json',
      name: metadata?.name || 'Workflow sans nom',
      description: metadata?.description || '',
      version: '1.0.0',
      ...globalConfig,
      workflows: [
        {
          name: 'main',
          steps
        }
      ]
    };
  }

  /**
   * Extrait les noms de colonnes CSV depuis les steps d'extraction
   * @param steps - Liste des steps du workflow
   * @returns Tableau des noms de colonnes
   */
  private static extractCsvColumns(steps: WorkflowStep[]): string[] {
    const columns = new Set<string>();

    const extractColumnsFromSteps = (stepsToProcess: WorkflowStep[]) => {
      stepsToProcess.forEach(step => {
        // Vérifier si c'est un step d'extraction
        if (step.type === 'extract') {
          // Cas 1: extraction avec plusieurs champs (config.fields)
          if (step.config.fields && Array.isArray(step.config.fields)) {
            step.config.fields.forEach((field: any) => {
              if (field.name) {
                columns.add(field.name);
              }
            });
          }
          // Cas 2: extraction simple avec un seul champ (config.saveAs ou step.output)
          else if (step.output) {
            columns.add(step.output);
          }
        }
        // Récursion pour les loops
        else if (step.type === 'loop' && step.config?.steps) {
          extractColumnsFromSteps(step.config.steps);
        }
      });
    };

    extractColumnsFromSteps(steps);
    return Array.from(columns);
  }

  /**
   * Construit récursivement les steps d'un corps de boucle
   */
  private static buildLoopSteps(
    startNodeId: string,
    nodes: Node[],
    edges: Edge[],
    loopBodyNodes: Set<string>
  ): any[] {
    const steps: any[] = [];
    const visited = new Set<string>();
    const queue = [startNodeId];

    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      if (visited.has(nodeId) || !loopBodyNodes.has(nodeId)) continue;
      visited.add(nodeId);

      const node = nodes.find(n => n.id === nodeId);
      if (!node) continue;

      const step: any = {
        type: node.data?.type || 'unknown',
        config: { ...node.data?.config || {} }
      };

      // Ajouter l'output si défini (d'abord depuis node.data.output, sinon depuis node.data.config.output)
      const outputValue = node.data?.output || node.data?.config?.output;
      if (outputValue && outputValue.trim() !== '') {
        step.output = outputValue;
        // Retirer output et saveAs de config car ils ne doivent pas y être
        delete step.config.output;
        delete step.config.saveAs;
      }

      steps.push(step);

      // Trouver les nœuds suivants dans le corps de boucle
      const nextEdges = edges.filter(e => 
        e.source === nodeId && 
        loopBodyNodes.has(e.target) &&
        !e.sourceHandle?.endsWith('-loop')
      );
      
      nextEdges.forEach(edge => queue.push(edge.target));
    }

    return steps;
  }

  /**
   * Trouve tous les descendants d'un nœud
   */
  private static findDescendants(
    nodeId: string,
    edges: Edge[],
    existingSet?: Set<string>
  ): Set<string> {
    const descendants = existingSet || new Set<string>();
    descendants.add(nodeId);

    const childEdges = edges.filter(e => e.source === nodeId);
    childEdges.forEach(edge => {
      if (!descendants.has(edge.target)) {
        this.findDescendants(edge.target, edges, descendants);
      }
    });

    return descendants;
  }

  /**
   * Convertit une configuration JSON en graphe visuel
   * @param config - Configuration JSON du workflow
   * @returns Nœuds et connexions VueFlow
   */
  static fromConfig(config: WorkflowConfig | any): { nodes: Node[]; edges: Edge[] } {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Support de l'ancien format v1 (avec workflows[])
    let steps: WorkflowStep[] = [];
    if (config.steps) {
      // Nouveau format v2
      steps = config.steps;
    } else if (config.workflows && config.workflows.length > 0) {
      // Ancien format v1 - prendre le premier workflow
      steps = config.workflows[0].steps || [];
    } else {
      console.warn('Configuration sans steps ou workflows trouvée', config);
      return { nodes, edges };
    }

    // Calculer la position automatique (layout en grille)
    const HORIZONTAL_SPACING = 250;
    const VERTICAL_SPACING = 150;
    let currentX = 100;
    let currentY = 100;
    let maxNodesPerRow = 3;
    let currentRow = 0;
    let currentCol = 0;

    // Map pour garantir la cohérence des IDs générés
    const stepIdMap = new Map<WorkflowStep, string>();
    let idCounter = 0;

    // Fonction pour obtenir un ID cohérent pour un step
    const getStepId = (step: WorkflowStep, fallbackIndex: number): string => {
      if (step.id) return step.id;
      if (!stepIdMap.has(step)) {
        stepIdMap.set(step, `step-${idCounter++}`);
      }
      return stepIdMap.get(step)!;
    };

    // Fonction récursive pour créer les nœuds et leurs connexions
    const createNodesFromSteps = (
      stepsToProcess: WorkflowStep[],
      parentLoopId?: string,
      startX?: number,
      startY?: number
    ) => {
      stepsToProcess.forEach((step, index) => {
        // Générer un ID unique si manquant
        const nodeId = getStepId(step, index);
        
        // Position du nœud
        const posX = startX !== undefined ? startX : currentX + currentCol * HORIZONTAL_SPACING;
        const posY = startY !== undefined ? startY + index * VERTICAL_SPACING : currentY + currentRow * VERTICAL_SPACING;

        // Créer le nœud
        const node: Node = {
          id: nodeId,
          type: 'custom',
          position: { x: posX, y: posY },
          data: {
            label: step.name || step.id || `${step.type} - ${index}`,
            name: step.name,
            config: { ...step.config },
            output: step.output,
            type: step.type,
            parentLoopId: parentLoopId // Marquer les nodes qui sont dans un loop body
          }
        };

        nodes.push(node);

        // Si c'est le premier nœud d'un corps de loop, créer une edge depuis le loop
        if (parentLoopId && index === 0) {
          edges.push({
            id: `${parentLoopId}-${nodeId}-loop`,
            source: parentLoopId,
            sourceHandle: `${parentLoopId}-loop`,
            target: nodeId,
            type: 'smoothstep'
          });
        }

        // Gérer la position pour le prochain nœud (si pas dans un loop)
        if (!parentLoopId) {
          currentCol++;
          if (currentCol >= maxNodesPerRow) {
            currentCol = 0;
            currentRow++;
          }
        }

        // Si c'est un bloc loop, créer les nœuds pour son corps (placés verticalement sous le loop)
        if (step.type === 'loop' && step.config?.steps && Array.isArray(step.config.steps)) {
          createNodesFromSteps(
            step.config.steps,
            nodeId,
            posX,
            posY + VERTICAL_SPACING
          );
        }

        // Créer les connexions
        if (step.next) {
          if (typeof step.next === 'string') {
            edges.push({
              id: `${nodeId}-${step.next}`,
              source: nodeId,
              target: step.next,
              type: 'smoothstep'
            });
          } else if (Array.isArray(step.next)) {
            step.next.forEach((nextId) => {
              edges.push({
                id: `${nodeId}-${nextId}`,
                source: nodeId,
                target: nextId,
                type: 'smoothstep'
              });
            });
          }
        } else if (!parentLoopId && index < stepsToProcess.length - 1) {
          // Format v1 : connexion automatique au step suivant (sauf dans un loop body)
          const nextStep = stepsToProcess[index + 1];
          if (nextStep) {
            const nextNodeId = getStepId(nextStep, index + 1);
            edges.push({
              id: `${nodeId}-${nextNodeId}`,
              source: nodeId,
              target: nextNodeId,
              type: 'smoothstep'
            });
          }
        } else if (parentLoopId && index < stepsToProcess.length - 1) {
          // Dans un loop body, connecter séquentiellement les steps
          const nextStep = stepsToProcess[index + 1];
          const nextNodeId = getStepId(nextStep, index + 1);
          edges.push({
            id: `${nodeId}-${nextNodeId}`,
            source: nodeId,
            target: nextNodeId,
            type: 'smoothstep'
          });
        }

        // Gérer les conditions (format v2)
        if (step.condition) {
          edges.push({
            id: `${nodeId}-${step.condition.then}-true`,
            source: nodeId,
            sourceHandle: `${nodeId}-true`,
            target: step.condition.then,
            type: 'smoothstep',
            data: { condition: 'true' },
            label: 'Vrai'
          });

          edges.push({
            id: `${nodeId}-${step.condition.else}-false`,
            source: nodeId,
            sourceHandle: `${nodeId}-false`,
            target: step.condition.else,
            type: 'smoothstep',
            data: { condition: 'false' },
            label: 'Faux'
          });

          node.data.conditionExpression = step.condition.if;
        }
      });
    };

    // Créer tous les nœuds et connexions
    createNodesFromSteps(steps);

    return { nodes, edges };
  }

  /**
   * Valide la configuration générée
   * @param config - Configuration à valider
   * @returns Liste des erreurs de validation
   */
  static validate(config: WorkflowConfig): string[] {
    const errors: string[] = [];

    // Vérifier le nom
    if (!config.name || config.name.trim() === '') {
      errors.push('Le workflow doit avoir un nom');
    }

    // Vérifier qu'il y a des étapes
    if (!config.steps || config.steps.length === 0) {
      errors.push('Le workflow doit contenir au moins une étape');
    }

    // Vérifier les étapes
    const stepIds = new Set<string>();
    config.steps.forEach((step, index) => {
      // ID unique
      if (stepIds.has(step.id)) {
        errors.push(`L'étape ${index + 1} a un ID en double: ${step.id}`);
      }
      stepIds.add(step.id);

      // Type défini
      if (!step.type || step.type.trim() === '') {
        errors.push(`L'étape ${step.id} doit avoir un type`);
      }

      // Configuration présente
      if (!step.config || typeof step.config !== 'object') {
        errors.push(`L'étape ${step.id} doit avoir une configuration`);
      }

      // Vérifier les références next
      if (step.next) {
        const nextIds = Array.isArray(step.next) ? step.next : [step.next];
        nextIds.forEach((nextId) => {
          if (!config.steps.find((s) => s.id === nextId)) {
            errors.push(`L'étape ${step.id} référence une étape inexistante: ${nextId}`);
          }
        });
      }

      // Vérifier les références de condition
      if (step.condition) {
        if (!config.steps.find((s) => s.id === step.condition!.then)) {
          errors.push(
            `La condition de ${step.id} référence une étape "then" inexistante: ${step.condition.then}`
          );
        }
        if (!config.steps.find((s) => s.id === step.condition!.else)) {
          errors.push(
            `La condition de ${step.id} référence une étape "else" inexistante: ${step.condition.else}`
          );
        }
      }
    });

    return errors;
  }

  /**
   * Tri topologique des nœuds pour déterminer l'ordre d'exécution
   * @param nodes - Les nœuds à trier
   * @param edges - Les connexions
   * @returns Nœuds triés dans l'ordre d'exécution
   */
  private static topologicalSort(nodes: Node[], edges: Edge[]): Node[] {
    // Créer un graphe d'adjacence
    const graph = new Map<string, string[]>();
    const inDegree = new Map<string, number>();

    // Initialiser
    nodes.forEach((node) => {
      graph.set(node.id, []);
      inDegree.set(node.id, 0);
    });

    // Construire le graphe
    edges.forEach((edge) => {
      graph.get(edge.source)?.push(edge.target);
      inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
    });

    // Trouver les nœuds sans prédécesseurs (entrées)
    const queue: Node[] = [];
    nodes.forEach((node) => {
      if (inDegree.get(node.id) === 0) {
        queue.push(node);
      }
    });

    const sorted: Node[] = [];

    while (queue.length > 0) {
      const node = queue.shift()!;
      sorted.push(node);

      // Réduire le degré d'entrée des voisins
      const neighbors = graph.get(node.id) || [];
      neighbors.forEach((neighborId) => {
        const degree = (inDegree.get(neighborId) || 0) - 1;
        inDegree.set(neighborId, degree);

        if (degree === 0) {
          const neighborNode = nodes.find((n) => n.id === neighborId);
          if (neighborNode) {
            queue.push(neighborNode);
          }
        }
      });
    }

    // Si tous les nœuds ne sont pas triés, il y a un cycle
    if (sorted.length !== nodes.length) {
      console.warn('Cycle détecté dans le workflow, tri partiel');
      // Ajouter les nœuds restants
      nodes.forEach((node) => {
        if (!sorted.find((n) => n.id === node.id)) {
          sorted.push(node);
        }
      });
    }

    return sorted;
  }

  /**
   * Exporte la configuration en JSON formaté
   * @param config - Configuration à exporter
   * @param prettify - Si true, formate le JSON avec indentation
   * @returns JSON string
   */
  static exportToJson(config: WorkflowConfig, prettify = true): string {
    return prettify ? JSON.stringify(config, null, 2) : JSON.stringify(config);
  }

  /**
   * Importe une configuration depuis JSON
   * @param json - JSON string à parser
   * @returns Configuration parsée
   */
  static importFromJson(json: string): WorkflowConfig {
    try {
      const config = JSON.parse(json);
      
      // Support de l'ancien format v1 (avec workflows[])
      if (!config.steps && config.workflows && config.workflows.length > 0) {
        // Ancien format v1 - convertir en format v2
        console.log('Converting v1 format to v2');
        return {
          ...config,
          steps: config.workflows[0].steps || []
        } as WorkflowConfig;
      }
      
      // Validation basique pour le nouveau format
      if (!config.steps || !Array.isArray(config.steps)) {
        throw new Error('Format de configuration invalide: propriété "steps" ou "workflows" manquante ou invalide');
      }

      return config as WorkflowConfig;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error('JSON invalide: ' + error.message);
      }
      throw error;
    }
  }
}

export default WorkflowConverter;
