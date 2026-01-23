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

    // Convertir chaque nœud en étape
    const steps: WorkflowStep[] = sortedNodes.map((node) => {
      const step: WorkflowStep = {
        id: node.id,
        name: node.data?.label || node.data?.name || `${node.data?.type || node.type} - ${node.id}`,
        type: node.data?.type || node.type || 'unknown',
        config: node.data?.config || {}
      };

      // Ajouter l'output si défini
      if (node.data?.output) {
        step.output = node.data.output;
      }

      // Déterminer les étapes suivantes
      const outgoingEdges = edges.filter((e) => e.source === node.id);

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

    return {
      $schema: '../../src/schemas/workflow.schema.json',
      name: metadata?.name || 'Workflow sans nom',
      description: metadata?.description || '',
      version: '1.0.0',
      steps
    };
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

    steps.forEach((step, index) => {
      // Générer un ID unique si manquant
      const nodeId = step.id || `step-${index}`;
      
      // Créer le nœud
      const node: Node = {
        id: nodeId,
        type: 'custom', // Utiliser 'custom' pour tous les nœuds
        position: {
          x: currentX + currentCol * HORIZONTAL_SPACING,
          y: currentY + currentRow * VERTICAL_SPACING
        },
        data: {
          label: step.name || step.id || `${step.type} - ${index}`,
          name: step.name,
          config: step.config,
          output: step.output,
          type: step.type // Le vrai type de l'action est dans data.type
        }
      };

      nodes.push(node);

      // Gérer la position pour le prochain nœud
      currentCol++;
      if (currentCol >= maxNodesPerRow) {
        currentCol = 0;
        currentRow++;
      }

      // Créer les connexions
      if (step.next) {
        // Format v2 avec propriété 'next'
        if (typeof step.next === 'string') {
          // Une seule connexion
          edges.push({
            id: `${nodeId}-${step.next}`,
            source: nodeId,
            target: step.next,
            type: 'smoothstep'
          });
        } else if (Array.isArray(step.next)) {
          // Plusieurs connexions
          step.next.forEach((nextId) => {
            edges.push({
              id: `${nodeId}-${nextId}`,
              source: nodeId,
              target: nextId,
              type: 'smoothstep'
            });
          });
        }
      } else if (index < steps.length - 1) {
        // Format v1 : connexion automatique au step suivant
        const nextStep = steps[index + 1];
        if (nextStep) {
          const nextNodeId = nextStep.id || `step-${index + 1}`;
          edges.push({
            id: `${nodeId}-${nextNodeId}`,
            source: nodeId,
            target: nextNodeId,
            type: 'smoothstep'
          });
        }
      }

      // Gérer les conditions (format v2)
      if (step.condition) {
        // Connexion "if"
        edges.push({
          id: `${nodeId}-${step.condition.then}-true`,
          source: nodeId,
          target: step.condition.then,
          type: 'smoothstep',
          data: { condition: 'true' },
          label: 'Vrai'
        });

        // Connexion "else"
        edges.push({
          id: `${nodeId}-${step.condition.else}-false`,
          source: nodeId,
          target: step.condition.else,
          type: 'smoothstep',
          data: { condition: 'false' },
          label: 'Faux'
        });

        // Stocker l'expression de condition dans le nœud
        node.data.conditionExpression = step.condition.if;
      }
    });

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
      
      // Validation basique
      if (!config.steps || !Array.isArray(config.steps)) {
        throw new Error('Format de configuration invalide: propriété "steps" manquante ou invalide');
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
