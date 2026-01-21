import { defineStore } from 'pinia';
import type { Node, Edge, Viewport, XYPosition } from '@vue-flow/core';

// Types de ports pour les connexions
export enum PortType {
  FLOW = 'flow',
  DATA = 'data'
}

// État du workflow
export interface WorkflowState {
  nodes: Node[];
  edges: Edge[];
  selectedNodes: string[];
  viewport: Viewport;
  isDirty: boolean;
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
    isDirty: false
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
      const node = this.nodes.find((n) => n.id === nodeId);
      if (node) {
        node.data = { ...node.data, ...data };
        this.isDirty = true;
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
    },

    /**
     * Charge un workflow depuis un état
     */
    loadWorkflow(state: { nodes: Node[]; edges: Edge[] }): void {
      this.nodes = state.nodes || [];
      this.edges = state.edges || [];
      this.selectedNodes = [];
      this.isDirty = false;
    },

    /**
     * Marque le workflow comme sauvegardé
     */
    markAsSaved(): void {
      this.isDirty = false;
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
    }
  }
});
