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
   * @param initialConfig - Configuration initiale du workflow
   * @returns Configuration JSON du workflow
   */
  static toConfig(
    nodes: Node[],
    edges: Edge[],
    metadata?: { name?: string; description?: string },
    initialConfig?: any
  ): WorkflowConfig {
    // Vérifications de sécurité
    if (!nodes || !Array.isArray(nodes)) {
      console.error('toConfig: nodes is not an array', nodes);
      nodes = [];
    }
    if (!edges || !Array.isArray(edges)) {
      console.error('toConfig: edges is not an array', edges);
      edges = [];
    }

    // Trier les nœuds dans l'ordre du workflow (topological sort)
    const sortedNodes = this.topologicalSort(nodes, edges);

    // Utiliser la configuration initiale passée en paramètre
    const globalConfig: any = {};
    
    if (initialConfig) {
      if (initialConfig.target) {
        globalConfig.target = initialConfig.target;
      }
      if (initialConfig.browser) {
        globalConfig.browser = initialConfig.browser;
      }
      if (initialConfig.logging) {
        globalConfig.logging = initialConfig.logging;
      }
      if (initialConfig.errorHandling) {
        globalConfig.errorHandling = initialConfig.errorHandling;
      }
      if (initialConfig.scheduling) {
        globalConfig.scheduling = initialConfig.scheduling;
      }
      if (initialConfig.output) {
        globalConfig.output = initialConfig.output;
      }
    }

    // Identifier les nœuds qui font partie d'un corps de boucle
    const loopBodyNodes = new Set<string>();
    edges.forEach(edge => {
      if (edge.sourceHandle?.endsWith('-loop')) {
        const descendants = this.findDescendants(edge.target, edges, loopBodyNodes);
        descendants.forEach(id => loopBodyNodes.add(id));
      }
    });

    // Identifier les nœuds qui doivent avoir un ID (référencés dans repeatSteps)
    const nodesNeedingIds = new Map<string, string>();
    sortedNodes.forEach((node, index) => {
      // Vérifier si ce nœud est référencé par une pagination
      const isPaginationTarget = sortedNodes.some(n => {
        if (n.data?.type === 'pagination' && n.data?.config?.repeatSteps) {
          const repeatSteps = n.data.config.repeatSteps;
          return Array.isArray(repeatSteps) && repeatSteps.length > 0;
        }
        return false;
      });

      // Si c'est une étape d'extraction qui précède une pagination, lui donner un ID
      if (node.data?.type === 'extract') {
        const nextNode = sortedNodes[index + 1];
        if (nextNode?.data?.type === 'pagination') {
          nodesNeedingIds.set(node.id, 'extract-data');
        }
      }
    });

    // Convertir chaque nœud en étape (format simple sans id/name/next)
    // IMPORTANT: Filtrer les nœuds qui font partie d'un corps de boucle
    // pour ne pas les dupliquer
    const steps: any[] = sortedNodes
      .filter(node => !loopBodyNodes.has(node.id))
      .map((node) => {
        const step: any = {
          type: node.data?.type || node.type || 'unknown',
          config: { ...node.data?.config || {} },
          position: { x: node.position.x, y: node.position.y }
        };

        // Ajouter l'ID si nécessaire
        if (nodesNeedingIds.has(node.id)) {
          step.id = nodesNeedingIds.get(node.id);
        }

        // Gérer le nouveau format dataOutput { mode, value }
        const dataOutput = node.data?.config?.dataOutput;
        if (dataOutput && typeof dataOutput === 'object' && dataOutput.mode && dataOutput.value) {
          if (dataOutput.mode === 'output') {
            step.output = dataOutput.value;
          } else if (dataOutput.mode === 'saveAs') {
            step.saveAs = dataOutput.value;
          }
          delete step.config.dataOutput;
        } else {
          // Rétrocompatibilité: gérer l'ancien format avec output et saveAs séparés
          const outputValue = node.data?.output || node.data?.config?.output;
          if (outputValue && outputValue.trim() !== '') {
            step.output = outputValue;
            delete step.config.output;
            delete step.config.saveAs;
          }
        }

        // Pour les blocs loop, construire le tableau steps à partir des edges
        if (step.type === 'loop') {
          const loopEdges = edges.filter(e => e.source === node.id && e.sourceHandle?.endsWith('-loop'));
          if (loopEdges.length > 0) {
            const loopSteps = this.buildLoopSteps(loopEdges[0].target, nodes, edges, loopBodyNodes);
            step.config.steps = loopSteps;
          }
        }

        return step;
      });

    return {
      name: metadata?.name || 'Workflow sans nom',
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
  private static extractCsvColumns(steps: any[]): string[] {
    if (!steps || !Array.isArray(steps)) {
      return [];
    }
    
    const columns = new Set<string>();

    const extractColumnsFromSteps = (stepsToProcess: any[]) => {
      if (!stepsToProcess || !Array.isArray(stepsToProcess)) {
        return;
      }
      
      stepsToProcess.forEach(step => {
        if (step.type === 'extract') {
          if (step.config.fields && Array.isArray(step.config.fields)) {
            step.config.fields.forEach((field: any) => {
              if (field.name) {
                columns.add(field.name);
              }
            });
          } else if (step.output) {
            columns.add(step.output);
          }
        } else if (step.type === 'loop' && step.config?.steps) {
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
        config: { ...node.data?.config || {} },
        position: { x: node.position.x, y: node.position.y }
      };

      // Gérer le nouveau format dataOutput { mode, value }
      const dataOutput = node.data?.config?.dataOutput;
      if (dataOutput && typeof dataOutput === 'object' && dataOutput.mode && dataOutput.value) {
        if (dataOutput.mode === 'output') {
          step.output = dataOutput.value;
        } else if (dataOutput.mode === 'saveAs') {
          step.saveAs = dataOutput.value;
        }
        delete step.config.dataOutput;
      } else {
        // Rétrocompatibilité: gérer l'ancien format avec output et saveAs séparés
        const outputValue = node.data?.output || node.data?.config?.output;
        if (outputValue && outputValue.trim() !== '') {
          step.output = outputValue;
          delete step.config.output;
          delete step.config.saveAs;
        }
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
  static fromConfig(config: any): { nodes: Node[]; edges: Edge[] } {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    if (!config || typeof config !== 'object') {
      return { nodes, edges };
    }

    let steps: any[] = [];
    if (config.workflows && Array.isArray(config.workflows) && config.workflows.length > 0) {
      steps = config.workflows[0].steps || [];
    }

    if (!steps || steps.length === 0) {
      return { nodes, edges };
    }

    const HORIZONTAL_SPACING = 250;
    const VERTICAL_SPACING = 150;
    let currentX = 100;
    let currentY = 100;
    let maxNodesPerRow = 3;
    let currentRow = 0;
    let currentCol = 0;
    let idCounter = 0;

    const createNodesFromSteps = (
      stepsToProcess: any[],
      parentLoopId?: string,
      startX?: number,
      startY?: number
    ): string[] => {
      const createdNodeIds: string[] = [];

      stepsToProcess.forEach((step, index) => {
        const nodeId = `step-${idCounter++}`;
        createdNodeIds.push(nodeId);
        
        // Utiliser la position sauvegardée si elle existe, sinon calculer automatiquement
        let posX, posY;
        if (step.position) {
          posX = step.position.x;
          posY = step.position.y;
        } else {
          posX = startX !== undefined ? startX : currentX + currentCol * HORIZONTAL_SPACING;
          posY = startY !== undefined ? startY + index * VERTICAL_SPACING : currentY + currentRow * VERTICAL_SPACING;
        }

        // Convertir output/saveAs en dataOutput pour le nouveau format
        const nodeConfig = { ...step.config };
        let dataOutput = { mode: '', value: '' };
        
        if (step.output) {
          dataOutput = { mode: 'output', value: step.output };
        } else if (step.saveAs) {
          dataOutput = { mode: 'saveAs', value: step.saveAs };
        }
        
        // Ajouter dataOutput à la config si un mode est défini
        if (dataOutput.mode) {
          nodeConfig.dataOutput = dataOutput;
        }

        nodes.push({
          id: nodeId,
          type: 'custom',
          position: { x: posX, y: posY },
          data: {
            label: step.type,
            name: step.type,
            config: nodeConfig,
            output: step.output,
            type: step.type,
            parentLoopId: parentLoopId
          }
        });

        // Connecter le premier node d'un loop body au node loop parent
        if (parentLoopId && index === 0) {
          edges.push({
            id: `${parentLoopId}-${nodeId}-loop`,
            source: parentLoopId,
            sourceHandle: `${parentLoopId}-loop`,
            target: nodeId,
            type: 'smoothstep'
          });
        }

        if (!parentLoopId && !step.position) {
          currentCol++;
          if (currentCol >= maxNodesPerRow) {
            currentCol = 0;
            currentRow++;
          }
        }

        // Traiter les steps du loop récursivement
        if (step.type === 'loop' && step.config?.steps && Array.isArray(step.config.steps)) {
          createNodesFromSteps(step.config.steps, nodeId, posX, posY + VERTICAL_SPACING);
        }
      });

      // Connecter séquentiellement les nodes créés (seulement ceux de ce niveau)
      for (let i = 0; i < createdNodeIds.length - 1; i++) {
        const sourceNodeIndex = nodes.findIndex(n => n.id === createdNodeIds[i]);
        const sourceNode = nodes[sourceNodeIndex];
        
        // Pour les loops, utiliser le handle de sortie normal (pas le handle -loop)
        const sourceHandle = sourceNode?.data?.type === 'loop' ? `${createdNodeIds[i]}-out` : null;
        
        edges.push({
          id: `${createdNodeIds[i]}-${createdNodeIds[i + 1]}`,
          source: createdNodeIds[i],
          sourceHandle: sourceHandle,
          target: createdNodeIds[i + 1],
          targetHandle: null,
          type: 'smoothstep'
        });
      }

      return createdNodeIds;
    };

    createNodesFromSteps(steps);
    return { nodes, edges };
  }

  /**
   * Valide la configuration générée
   * @param config - Configuration à valider
   * @returns Liste des erreurs de validation
   */
  static validate(config: any): string[] {
    const errors: string[] = [];

    if (!config.name || config.name.trim() === '') {
      errors.push('Le workflow doit avoir un nom');
    }

    let steps: any[] = [];
    if (config.workflows && Array.isArray(config.workflows) && config.workflows.length > 0) {
      steps = config.workflows[0].steps || [];
    }

    if (!steps || steps.length === 0) {
      errors.push('Le workflow doit contenir au moins une étape');
    }

    return errors;
  }

  /**
   * Tri topologique des nœuds pour déterminer l'ordre d'exécution
   * @param nodes - Les nœuds à trier
   * @param edges - Les connexions
   * @returns Nœuds triés dans l'ordre d'exécution
   */
  private static topologicalSort(nodes: Node[], edges: Edge[]): Node[] {
    // Vérifications de sécurité
    if (!nodes || !Array.isArray(nodes)) {
      console.warn('topologicalSort: nodes is not an array', nodes);
      return [];
    }
    if (!edges || !Array.isArray(edges)) {
      console.warn('topologicalSort: edges is not an array', edges);
      edges = [];
    }

    // Créer un graphe d'adjacence
    const graph = new Map<string, string[]>();
    const inDegree = new Map<string, number>();

    // Initialiser (en excluant le bloc init)
    nodes.forEach((node) => {
      graph.set(node.id, []);
      inDegree.set(node.id, 0);
    });

    // Construire le graphe (en excluant les edges depuis le bloc init)
    edges.forEach((edge) => {
      // Trouver le node source pour vérifier s'il est de type init
      const sourceNode = nodes.find(n => n.id === edge.source);
      
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
    const expectedLength = nodes.length;
    if (sorted.length !== expectedLength) {
      console.warn('Cycle détecté dans le workflow, tri partiel');
      // Ajouter les nœuds restants (sauf le bloc init)
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
  static exportToJson(config: any, prettify = true): string {
    return prettify ? JSON.stringify(config, null, 2) : JSON.stringify(config);
  }

  /**
   * Importe une configuration depuis JSON
   * @param json - JSON string à parser
   * @returns Configuration parsée
   */
  static importFromJson(json: string): any {
    try {
      const config = JSON.parse(json);
      return config;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error('JSON invalide: ' + error.message);
      }
      throw error;
    }
  }
}

export default WorkflowConverter;
