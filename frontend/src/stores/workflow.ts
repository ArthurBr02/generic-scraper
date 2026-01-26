import { defineStore } from 'pinia';
import type { Node, Edge, Viewport, XYPosition } from '@vue-flow/core';

// Types de ports pour les connexions
export enum PortType {
  FLOW = 'flow',
  DATA = 'data'
}

// Configuration initiale du workflow
export interface InitialConfig {
  target: {
    url: string;
  };
  browser: {
    type: string;
    headless: boolean;
    timeout: number;
    viewport: {
      width: number;
      height: number;
    };
  };
  logging: {
    level: string;
    console: boolean;
  };
  errorHandling: {
    retries: number;
    retryDelay: number;
    screenshotOnError: boolean;
    continueOnError: boolean;
  };
  scheduling: {
    enabled: boolean;
    cron: string;
    timezone: string;
  };
  output: {
    format: string;
    path: string;
    append: boolean;
    createPath: boolean;
    json?: {
      pretty: boolean;
    };
    csv?: {
      delimiter: string;
      includeHeaders: boolean;
      encoding: string;
    };
  };
}

// État du workflow
export interface WorkflowState {
  nodes: Node[];
  edges: Edge[];
  selectedNodes: string[];
  viewport: Viewport;
  isDirty: boolean;
  currentTaskId: string | null;
  currentTaskName: string;
  showInitialConfigPanel: boolean;
  initialConfig: InitialConfig;
}

// Configuration pour la validation des connexions
export interface ConnectionRule {
  sourceType: PortType;
  targetType: PortType;
  allowed: boolean | 'type-match';
}

export const useWorkflowStore = defineStore('workflow', {
  state: (): WorkflowState => ({
    nodes: [],
    edges: [],
    selectedNodes: [],
    viewport: {
      x: 0,
      y: 0,
      zoom: 1
    },
    isDirty: false,
    currentTaskId: null,
    currentTaskName: 'Workflow sans nom',
    showInitialConfigPanel: false,
    initialConfig: {
      target: {
        url: ''
      },
      browser: {
        type: 'chromium',
        headless: true,
        timeout: 30000,
        viewport: {
          width: 1920,
          height: 1080
        }
      },
      logging: {
        level: 'info',
        console: true
      },
      errorHandling: {
        retries: 3,
        retryDelay: 1000,
        screenshotOnError: true,
        continueOnError: false
      },
      scheduling: {
        enabled: false,
        cron: '',
        timezone: 'Europe/Paris'
      },
      output: {
        format: 'json',
        path: './output',
        append: false,
        createPath: true,
        json: {
          pretty: true
        },
        csv: {
          delimiter: ',',
          includeHeaders: true,
          encoding: 'utf8'
        }
      }
    }
  }),

  getters: {
    /**
     * Récupère un nœud par son ID
     */
    getNodeById: (state) => (id: string): Node | undefined => {
      return state.nodes.find((node) => node.id === id);
    },

    /**
     * Récupère les nœuds sélectionnés
     */
    getSelectedNodes: (state): Node[] => {
      return state.nodes.filter((node) => state.selectedNodes.includes(node.id));
    },

    /**
     * Récupère les connexions d'un nœud
     */
    getNodeConnections: (state) => (nodeId: string): Edge[] => {
      return state.edges.filter(
        (edge) => edge.source === nodeId || edge.target === nodeId
      );
    },

    /**
     * Vérifie si le workflow a des modifications non sauvegardées
     */
    hasUnsavedChanges: (state): boolean => {
      return state.isDirty;
    }
  },

  actions: {
    /**
     * Ajoute un nœud au workflow
     */
    addNode(node: Node): void {
      this.nodes.push(node);
      this.isDirty = true;
    },

    /**
     * Supprime un nœud du workflow
     */
    removeNode(nodeId: string): void {
      // Supprime le nœud
      this.nodes = this.nodes.filter((node) => node.id !== nodeId);
      
      // Supprime les connexions liées
      this.edges = this.edges.filter(
        (edge) => edge.source !== nodeId && edge.target !== nodeId
      );
      
      // Supprime de la sélection
      this.selectedNodes = this.selectedNodes.filter((id) => id !== nodeId);
      
      this.isDirty = true;
    },

    /**
     * Met à jour la position d'un nœud
     */
    updateNodePosition(nodeId: string, position: XYPosition): void {
      const node = this.nodes.find((n) => n.id === nodeId);
      if (node) {
        node.position = position;
        this.isDirty = true;
      }
    },

    /**
     * Met à jour les données d'un nœud
     */
    updateNodeData(nodeId: string, data: any): void {
      console.log('updateNodeData called:', nodeId, data);
      const nodeIndex = this.nodes.findIndex((n) => n.id === nodeId);
      console.log('Node index:', nodeIndex, 'Total nodes:', this.nodes.length);
      
      if (nodeIndex !== -1) {
        const oldNode = this.nodes[nodeIndex];
        console.log('Old node data:', oldNode.data);
        
        // Créer un nouveau nœud pour forcer la réactivité
        const updatedNode = {
          ...this.nodes[nodeIndex],
          data: { ...this.nodes[nodeIndex].data, ...data }
        };
        
        // Créer un nouveau tableau pour forcer VueFlow à détecter le changement
        this.nodes = [
          ...this.nodes.slice(0, nodeIndex),
          updatedNode,
          ...this.nodes.slice(nodeIndex + 1)
        ];
        
        console.log('New node data:', updatedNode.data);
        this.isDirty = true;
      } else {
        console.error('Node not found:', nodeId);
      }
    },

    /**
     * Ajoute une connexion entre deux nœuds
     */
    addEdge(edge: Edge): void {
      this.edges.push(edge);
      this.isDirty = true;
    },

    /**
     * Supprime une connexion
     */
    removeEdge(edgeId: string): void {
      this.edges = this.edges.filter((edge) => edge.id !== edgeId);
      this.isDirty = true;
    },

    /**
     * Sélectionne un nœud
     */
    selectNode(nodeId: string, exclusive = true): void {
      if (exclusive) {
        this.selectedNodes = [nodeId];
      } else if (!this.selectedNodes.includes(nodeId)) {
        this.selectedNodes.push(nodeId);
      }
    },

    /**
     * Désélectionne un nœud
     */
    deselectNode(nodeId: string): void {
      this.selectedNodes = this.selectedNodes.filter((id) => id !== nodeId);
    },

    /**
     * Désélectionne tous les nœuds
     */
    clearSelection(): void {
      this.selectedNodes = [];
    },

    /**
     * Désélectionne tous les nœuds (alias pour clearSelection)
     */
    deselectAllNodes(): void {
      this.clearSelection();
    },

    /**
     * Met à jour la configuration d'un nœud
     */
    updateNodeConfig(payload: { nodeId: string; config: Record<string, any> }): void {
      console.log('updateNodeConfig called:', payload.nodeId, payload.config);
      const nodeIndex = this.nodes.findIndex((n) => n.id === payload.nodeId);
      
      if (nodeIndex !== -1) {
        const oldNode = this.nodes[nodeIndex];
        console.log('Old node config:', oldNode.data?.config);
        
        // Créer un nouveau nœud pour forcer la réactivité
        const updatedNode = {
          ...this.nodes[nodeIndex],
          data: {
            ...this.nodes[nodeIndex].data,
            config: payload.config
          }
        };
        
        // Créer un nouveau tableau pour forcer VueFlow à détecter le changement
        this.nodes = [
          ...this.nodes.slice(0, nodeIndex),
          updatedNode,
          ...this.nodes.slice(nodeIndex + 1)
        ];
        
        console.log('New node config:', updatedNode.data.config);
        this.isDirty = true;
      } else {
        console.error('Node not found for config update:', payload.nodeId);
      }
    },

    /**
     * Met à jour le viewport (position et zoom)
     */
    updateViewport(viewport: Viewport): void {
      this.viewport = viewport;
    },

    /**
     * Réinitialise le workflow
     */
    reset(): void {
      this.nodes = [];
      this.edges = [];
      this.selectedNodes = [];
      this.viewport = { x: 0, y: 0, zoom: 1 };
      this.isDirty = false;
      this.currentTaskId = null;
      this.currentTaskName = 'Workflow sans nom';
      
      // Réinitialiser la configuration initiale avec les valeurs par défaut
      this.initialConfig = {
        target: {
          url: ''
        },
        browser: {
          type: 'chromium',
          headless: true,
          timeout: 30000,
          viewport: {
            width: 1920,
            height: 1080
          }
        },
        logging: {
          level: 'info',
          console: true
        },
        errorHandling: {
          retries: 3,
          retryDelay: 1000,
          screenshotOnError: true,
          continueOnError: false
        },
        scheduling: {
          enabled: false,
          cron: '',
          timezone: 'Europe/Paris'
        },
        output: {
          format: 'json',
          path: './output/data.json',
          append: false,
          createPath: true,
          json: {
            pretty: true
          },
          csv: {
            delimiter: ',',
            includeHeaders: true,
            encoding: 'utf8'
          }
        }
      };
    },

    /**
     * Charge un workflow depuis un état
     */
    loadWorkflow(state: { nodes: Node[]; edges: Edge[]; config?: any }): void {
      this.nodes = state.nodes || [];
      this.edges = state.edges || [];
      this.selectedNodes = [];
      this.isDirty = false;
      
      // Charger la configuration initiale si elle est fournie
      if (state.config) {
        this.loadInitialConfig(state.config);
      }
    },

    /**
     * Marque le workflow comme sauvegardé
     */
    markAsSaved(): void {
      this.isDirty = false;
    },

    /**
     * Définit la tâche courante
     */
    setCurrentTask(taskId: string | null, taskName?: string): void {
      this.currentTaskId = taskId;
      if (taskName !== undefined) {
        this.currentTaskName = taskName;
      }
    },

    /**
     * Valide si une connexion est autorisée
     */
    validateConnection(
      sourceType: PortType,
      targetType: PortType
    ): boolean {
      const rules: ConnectionRule[] = [
        { sourceType: PortType.FLOW, targetType: PortType.FLOW, allowed: true },
        { sourceType: PortType.DATA, targetType: PortType.DATA, allowed: 'type-match' },
        { sourceType: PortType.FLOW, targetType: PortType.DATA, allowed: false },
        { sourceType: PortType.DATA, targetType: PortType.FLOW, allowed: false }
      ];

      const rule = rules.find(
        (r) => r.sourceType === sourceType && r.targetType === targetType
      );

      if (!rule) return false;
      if (typeof rule.allowed === 'boolean') return rule.allowed;
      
      // Pour 'type-match', il faudra vérifier les types de données
      // Cette logique sera implémentée plus tard
      return true;
    },

    /**
     * Ouvre le panneau de configuration initiale
     */
    openInitialConfigPanel(): void {
      this.showInitialConfigPanel = true;
    },

    /**
     * Ferme le panneau de configuration initiale
     */
    closeInitialConfigPanel(): void {
      this.showInitialConfigPanel = false;
    },

    /**
     * Met à jour la configuration initiale
     */
    updateInitialConfig(config: Partial<InitialConfig>): void {
      this.initialConfig = { ...this.initialConfig, ...config };
      this.isDirty = true;
    },

    /**
     * Charge la configuration initiale depuis un objet de configuration
     */
    loadInitialConfig(config: Partial<InitialConfig>): void {
      this.initialConfig = {
        ...this.initialConfig,
        ...config
      };
    }
  }
});
