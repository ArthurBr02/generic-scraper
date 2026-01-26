<template>
  <div class="workflow-canvas-container">
    <VueFlow
      :key="resetCounter"
      v-model:nodes="nodes"
      v-model:edges="edges"
      :class="['workflow-canvas', { dark: isDarkMode }]"
      :default-viewport="viewport"
      :snap-to-grid="snapToGrid"
      :snap-grid="[20, 20]"
      :min-zoom="0.2"
      :max-zoom="4"
      :default-edge-options="defaultEdgeOptions"
      @nodes-change="onNodesChange"
      @edges-change="onEdgesChange"
      @connect="onConnect"
      @node-click="onNodeClick"
      @pane-click="onPaneClick"
      @viewport-change="onViewportChange"
      @drop="onDrop"
      @dragover="onDragOver"
    >
      <!-- Contrôles (zoom, fit view) -->
      <Controls position="top-left" :show-fit-view="true" :show-zoom="true" />

      <!-- Grille de fond -->
      <Background
        :pattern-color="isDarkMode ? '#111827' : '#e5e7eb'"
        :gap="20"
        variant="lines"
      />

      <!-- Mini carte de navigation -->
      <MiniMap
        :node-color="getNodeColor"
        :node-stroke-color="getNodeStrokeColor"
        :node-class-name="getNodeClassName"
        :node-border-radius="4"
        position="bottom-right"
        :pannable="true"
        :zoomable="true"
      />

      <!-- Template pour les nœuds personnalisés -->
      <template #node-custom="{ data, id }">
        <!-- Nœud de type Loop -->
        <LoopNode
          v-if="data.type === 'loop'"
          :id="id"
          :data="data"
          :selected="isNodeSelected(id)"
          :color="getBlockColor(data.type)"
          :icon="getBlockIcon(data.type)"
          @context-menu="showNodeContextMenu($event, id)"
          @delete="deleteNode(id)"
        />

        <!-- Nœud de type Condition -->
        <ConditionNode
          v-else-if="data.type === 'condition'"
          :id="id"
          :data="data"
          :selected="isNodeSelected(id)"
          :color="getBlockColor(data.type)"
          :icon="getBlockIcon(data.type)"
          @context-menu="showNodeContextMenu($event, id)"
          @delete="deleteNode(id)"
        />

        <!-- Nœuds standards -->
        <div v-else class="custom-node-wrapper">
          
          <!-- Label personnalisé au-dessus du bloc -->
          <div v-if="data.label" class="node-label-above">
            {{ data.label }}
          </div>
          <div
            :class="[
              'custom-node',
              `node-type-${data.type}`,
              { 
                selected: isNodeSelected(id),
                'in-loop-body': data.parentLoopId
              }
            ]"
            @contextmenu.prevent="showNodeContextMenu($event, id)"
          >
            <div class="node-content">
              <div class="node-icon" :style="{ backgroundColor: getBlockColor(data.type) }">
                <svg class="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="getBlockIcon(data.type)" />
                </svg>
              </div>
              <div class="node-info">
                <div class="node-type">{{ data.type }}</div>
                <div v-if="data.description" class="node-description">{{ data.description }}</div>
              </div>
              <button
                v-if="data.canDelete !== false"
                class="node-delete"
                @click.stop="deleteNode(id)"
                title="Supprimer"
              >
                ×
              </button>
            </div>

            <!-- Ports d'entrée -->
            <Handle
              v-if="data.hasInput !== false"
              type="target"
              :position="Position.Left"
              class="node-handle node-handle-input"
            />

            <!-- Ports de sortie -->
            <Handle
              v-if="data.hasOutput !== false"
              type="source"
              :position="Position.Right"
              class="node-handle node-handle-output"
            />
          </div>
        </div>
      </template>

      <!-- Template pour les edges personnalisés -->
      <template #edge-custom="edgeProps">
        <CustomEdge 
          v-bind="edgeProps" 
          :is-dark-mode="isDarkMode"
          @delete-edge="onDeleteEdge" 
        />
      </template>
    </VueFlow>

    <!-- Menu contextuel pour les nœuds -->
    <div
      v-if="contextMenu.visible"
      class="context-menu"
      :style="{ top: contextMenu.y + 'px', left: contextMenu.x + 'px' }"
      @click="hideContextMenu"
    >
      <button @click="duplicateNode(contextMenu.nodeId)">Dupliquer</button>
      <button @click="deleteNode(contextMenu.nodeId)">Supprimer</button>
      <button @click="configureNode(contextMenu.nodeId)">Configurer</button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { VueFlow, Handle, Position } from '@vue-flow/core';
import { Background } from '@vue-flow/background';
import { Controls } from '@vue-flow/controls';
import { MiniMap } from '@vue-flow/minimap';
import { mapState, mapActions } from 'pinia';
import { useWorkflowStore } from '@/stores/workflow';
import { useBlocksStore } from '@/stores/blocks';
import { blockDefinitions } from '@/config/blocks.config';
import CustomEdge from './CustomEdge.vue';
import LoopNode from './workflow/nodes/LoopNode.vue';
import ConditionNode from './workflow/nodes/ConditionNode.vue';
import InitNode from './workflow/nodes/InitNode.vue';
import type { Node, Edge, Connection, NodeChange, EdgeChange } from '@vue-flow/core';

// Importation des styles Vue Flow
import '@vue-flow/core/dist/style.css';
import '@vue-flow/controls/dist/style.css';
import '@vue-flow/minimap/dist/style.css';

interface ContextMenu {
  visible: boolean;
  x: number;
  y: number;
  nodeId: string | null;
}

export default defineComponent({
  name: 'WorkflowCanvas',

  components: {
    VueFlow,
    Handle,
    Background,
    Controls,
    MiniMap,
    CustomEdge,
    LoopNode,
    ConditionNode,
    InitNode
  },

  data() {
    return {
      Position,
      snapToGrid: true,
      defaultEdgeOptions: {
        type: 'custom',
        animated: false,
        style: { stroke: '#b1b1b7', strokeWidth: 2 }
      },
      contextMenu: {
        visible: false,
        x: 0,
        y: 0,
        nodeId: null
      } as ContextMenu,
      isDarkMode: false
    };
  },

  computed: {
    ...mapState(useWorkflowStore, ['selectedNodes', 'viewport', 'resetCounter']),

    nodes: {
      get(): Node[] {
        return useWorkflowStore().nodes;
      },
      set(value: Node[]): void {
        // La mise à jour est gérée par Vue Flow
      }
    },

    edges: {
      get(): Edge[] {
        return useWorkflowStore().edges;
      },
      set(value: Edge[]): void {
        // La mise à jour est gérée par Vue Flow
      }
    }
  },

  methods: {
    ...mapActions(useWorkflowStore, [
      'addNode',
      'removeNode',
      'updateNodePosition',
      'updateNodeData',
      'addEdge',
      'removeEdge',
      'selectNode',
      'clearSelection',
      'updateViewport',
      'validateConnection'
    ]),

    /**
     * Gestion des changements de nœuds
     */
    onNodesChange(changes: NodeChange[]): void {
      changes.forEach((change) => {
        if (change.type === 'position' && change.position) {
          this.updateNodePosition(change.id, change.position);
        } else if (change.type === 'remove') {
          this.removeNode(change.id);
        }
      });
    },

    /**
     * Gestion des changements de connexions
     */
    onEdgesChange(changes: EdgeChange[]): void {
      changes.forEach((change) => {
        if (change.type === 'remove') {
          this.removeEdge(change.id);
        }
      });
    },

    /**
     * Gestion de la connexion entre deux nœuds
     */
    onConnect(connection: Connection): void {
      // Validation de la connexion
      if (!this.validateConnectionRules(connection)) {
        console.warn('Connexion non autorisée');
        return;
      }

      const sourceNode = this.nodes.find(n => n.id === connection.source);
      const targetNode = this.nodes.find(n => n.id === connection.target);

      if (!sourceNode || !targetNode) {
        console.warn('Nodes not found');
        return;
      }

      // Si la connexion vient d'un handle -loop, marquer le node target avec le parentLoopId
      if (connection.sourceHandle?.endsWith('-loop')) {
        if (!targetNode.data.parentLoopId) {
          this.updateNodeData(connection.target, {
            ...targetNode.data,
            parentLoopId: connection.source
          });
        }
      }
      // Si on connecte à un node qui a un parentLoopId, propager ce parentLoopId
      else if (targetNode.data.parentLoopId && !sourceNode.data.parentLoopId) {
        // Vérifier si le source a d'autres connexions au workflow principal
        const sourceHasMainWorkflowConnections = this.edges.some(e => {
          if (e.source === connection.source || e.target === connection.source) {
            const otherNode = this.nodes.find(n => 
              n.id === (e.source === connection.source ? e.target : e.source)
            );
            return otherNode && !otherNode.data.parentLoopId && otherNode.data.type !== 'loop';
          }
          return false;
        });

        if (!sourceHasMainWorkflowConnections) {
          // Le node source rejoint le loop body du target
          this.updateNodeData(connection.source, {
            ...sourceNode.data,
            parentLoopId: targetNode.data.parentLoopId
          });
        }
      }
      // Si on connecte depuis un node qui a un parentLoopId vers un node sans
      else if (sourceNode.data.parentLoopId && !targetNode.data.parentLoopId) {
        // Vérifier si le target a d'autres connexions au workflow principal
        const targetHasMainWorkflowConnections = this.edges.some(e => {
          if (e.source === connection.target || e.target === connection.target) {
            const otherNode = this.nodes.find(n => 
              n.id === (e.source === connection.target ? e.target : e.source)
            );
            return otherNode && !otherNode.data.parentLoopId && otherNode.data.type !== 'loop';
          }
          return false;
        });

        if (!targetHasMainWorkflowConnections) {
          // Le node target rejoint le loop body du source
          this.updateNodeData(connection.target, {
            ...targetNode.data,
            parentLoopId: sourceNode.data.parentLoopId
          });
        } else {
          // Le target reste dans le workflow principal, le source doit quitter le loop
          // Vérifier d'abord si le source est encore connecté au loop
          setTimeout(() => {
            if (!this.isNodeConnectedToLoop(connection.source, sourceNode.data.parentLoopId)) {
              this.updateNodeData(connection.source, {
                ...sourceNode.data,
                parentLoopId: undefined
              });
            }
          }, 0);
        }
      }

      const edge: Edge = {
        id: `edge-${connection.source}-${connection.target}-${Date.now()}`,
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle,
        targetHandle: connection.targetHandle,
        type: 'custom',
        animated: false,
        data: {
          type: 'flow',
          state: 'normal'
        }
      };

      this.addEdge(edge);
    },

    /**
     * Suppression d'une edge via le bouton
     */
    onDeleteEdge(edgeId: string): void {
      // Récupérer l'edge avant de la supprimer
      const edge = this.edges.find(e => e.id === edgeId);
      
      if (edge) {
        const sourceNode = this.nodes.find(n => n.id === edge.source);
        const targetNode = this.nodes.find(n => n.id === edge.target);

        // Si c'est une edge de loop (handle -loop), nettoyer le parentLoopId du node target
        if (edge.sourceHandle?.endsWith('-loop')) {
          if (targetNode && targetNode.data.parentLoopId === edge.source) {
            // Retirer le marquage parentLoopId
            this.updateNodeData(edge.target, {
              ...targetNode.data,
              parentLoopId: undefined
            });

            // Trouver tous les descendants de ce node et retirer leur parentLoopId aussi
            const removeParentLoopIdFromDescendants = (nodeId: string) => {
              const outgoingEdges = this.edges.filter(e => e.source === nodeId && e.id !== edgeId);
              outgoingEdges.forEach(outEdge => {
                const descendant = this.nodes.find(n => n.id === outEdge.target);
                if (descendant && descendant.data.parentLoopId === edge.source) {
                  this.updateNodeData(outEdge.target, {
                    ...descendant.data,
                    parentLoopId: undefined
                  });
                  removeParentLoopIdFromDescendants(outEdge.target);
                }
              });
            };

            removeParentLoopIdFromDescendants(edge.target);
          }
        }
        // Si on supprime une edge entre nodes de loop body, vérifier si le target doit perdre son parentLoopId
        else if (sourceNode?.data.parentLoopId && targetNode?.data.parentLoopId) {
          // Après suppression, vérifier si le target est encore connecté au loop
          setTimeout(() => {
            const isStillConnectedToLoop = this.isNodeConnectedToLoop(edge.target, targetNode.data.parentLoopId);
            if (!isStillConnectedToLoop) {
              this.updateNodeData(edge.target, {
                ...targetNode.data,
                parentLoopId: undefined
              });
            }
          }, 0);
        }
      }

      this.removeEdge(edgeId);
    },

    /**
     * Vérifie si un node est encore connecté à un loop (directement ou indirectement)
     */
    isNodeConnectedToLoop(nodeId: string, loopId: string): boolean {
      // Vérifier si le node est directement connecté au loop via le handle -loop
      const directLoopConnection = this.edges.find(
        e => e.source === loopId && e.sourceHandle === `${loopId}-loop` && e.target === nodeId
      );
      if (directLoopConnection) return true;

      // Vérifier si le node est connecté à un autre node du même loop body
      const incomingEdges = this.edges.filter(e => e.target === nodeId);
      for (const edge of incomingEdges) {
        const sourceNode = this.nodes.find(n => n.id === edge.source);
        if (sourceNode?.data.parentLoopId === loopId) {
          return true;
        }
      }

      return false;
    },

    /**
     * Validation des règles de connexion
     */
    validateConnectionRules(connection: Connection): boolean {
      const sourceNode = this.nodes.find(n => n.id === connection.source);
      const targetNode = this.nodes.find(n => n.id === connection.target);

      if (!sourceNode || !targetNode) {
        return false;
      }

      // Récupérer les parentLoopId
      const sourceParentLoopId = sourceNode.data?.parentLoopId;
      const targetParentLoopId = targetNode.data?.parentLoopId;

      // 1. Si le handle source est un handle de loop (-loop), le target doit être marqué comme enfant de ce loop
      if (connection.sourceHandle?.endsWith('-loop')) {
        // La connexion depuis un handle -loop est autorisée (elle créera le lien parent-enfant)
        return true;
      }

      // 2. Si les deux nodes sont dans des loop bodies différents, interdire la connexion
      if (sourceParentLoopId && targetParentLoopId && sourceParentLoopId !== targetParentLoopId) {
        console.warn('Cannot connect nodes from different loop bodies');
        return false;
      }

      // 3. Cas spécial : permettre d'ajouter un nouveau node (sans parentLoopId) à un loop body
      // Le node sera automatiquement marqué avec le parentLoopId lors de la connexion
      if (!sourceParentLoopId && targetParentLoopId) {
        // Source sans parent, target dans un loop -> autorisé (source sera ajouté au loop)
        return true;
      }
      
      if (sourceParentLoopId && !targetParentLoopId) {
        // Source dans un loop, target sans parent -> autorisé (target sera ajouté au loop)
        return true;
      }

      // 4. Toutes les autres connexions sont autorisées
      return true;
    },

    /**
     * Gestion du clic sur un nœud
     */
    onNodeClick(event: { event: MouseEvent; node: Node }): void {
      const exclusive = !event.event.ctrlKey && !event.event.metaKey;
      this.selectNode(event.node.id, exclusive);
    },

    /**
     * Gestion du clic sur le canvas vide
     */
    onPaneClick(): void {
      this.clearSelection();
      this.hideContextMenu();
    },

    /**
     * Gestion du changement de viewport
     */
    onViewportChange(viewport: any): void {
      this.updateViewport(viewport);
    },

    /**
     * Gestion du drop d'un bloc depuis la bibliothèque
     */
    onDrop(event: DragEvent): void {
      event.preventDefault();

      const blockType = event.dataTransfer?.getData('application/reactflow');
      if (!blockType) {
        console.warn('No block type found in dataTransfer');
        return;
      }

      // Récupère les informations du bloc
      const block = blockDefinitions.find(b => b.type === blockType);
      if (!block) {
        console.warn('Block not found:', blockType);
        return;
      }

      // Calcule la position sur le canvas en tenant compte du viewport
      const canvas = (this.$el as HTMLElement).querySelector('.vue-flow__viewport');
      if (!canvas) {
        console.warn('Canvas viewport not found');
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const workflowStore = useWorkflowStore();
      const viewport = workflowStore.viewport;
      
      // Position relative au viewport avec zoom
      const x = (event.clientX - rect.left - viewport.x) / viewport.zoom;
      const y = (event.clientY - rect.top - viewport.y) / viewport.zoom;

      // Crée le nœud
      const newNode: Node = {
        id: `node-${Date.now()}`,
        type: 'custom',
        position: { x, y },
        data: {
          type: blockType,
          label: block.name,
          description: block.description,
          category: block.category,
          config: { ...block.defaultConfig },
          hasInput: block.inputs && block.inputs.length > 0,
          hasOutput: block.outputs && block.outputs.length > 0
        }
      };

      console.log('Adding node:', newNode);
      this.addNode(newNode);
      
      // Sélectionne automatiquement le node pour ouvrir le panneau de configuration
      workflowStore.selectNode(newNode.id);
    },

    /**
     * Gestion du drag over pour permettre le drop
     */
    onDragOver(event: DragEvent): void {
      event.preventDefault();
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'move';
      }
    },

    /**
     * Vérifie si un nœud est sélectionné
     */
    isNodeSelected(nodeId: string): boolean {
      return this.selectedNodes.includes(nodeId);
    },

    /**
     * Supprime un nœud
     */
    deleteNode(nodeId: string): void {
      // Vérifier si le node peut être supprimé
      const workflowStore = useWorkflowStore();
      const node = workflowStore.getNodeById(nodeId);
      
      if (node?.data?.canDelete === false) {
        console.warn('Cannot delete this node');
        return;
      }
      
      this.removeNode(nodeId);
      this.hideContextMenu();
    },

    /**
     * Duplique un nœud
     */
    duplicateNode(nodeId: string | null): void {
      if (!nodeId) return;

      const workflowStore = useWorkflowStore();
      const node = workflowStore.getNodeById(nodeId);
      if (!node) return;

      const newNode: Node = {
        ...node,
        id: `node-${Date.now()}`,
        position: {
          x: node.position.x + 50,
          y: node.position.y + 50
        }
      };

      this.addNode(newNode);
      this.hideContextMenu();
    },

    /**
     * Ouvre la configuration d'un nœud
     */
    configureNode(nodeId: string | null): void {
      if (!nodeId) return;
      this.$emit('configure-node', nodeId);
      this.hideContextMenu();
    },

    /**
     * Affiche le menu contextuel
     */
    showNodeContextMenu(event: MouseEvent, nodeId: string): void {
      this.contextMenu = {
        visible: true,
        x: event.clientX,
        y: event.clientY,
        nodeId
      };
    },

    /**
     * Cache le menu contextuel
     */
    hideContextMenu(): void {
      this.contextMenu.visible = false;
      this.contextMenu.nodeId = null;
    },

    /**
     * Récupère la couleur d'un nœud pour la minimap
     */
    getNodeColor(node: Node): string {
      const type = node.data?.type;
      if (!type) return '#6B7280';
      return this.getBlockColor(type);
    },

    /**
     * Récupère la couleur de bordure d'un nœud pour la minimap
     */
    getNodeStrokeColor(node: Node): string {
      return this.isNodeSelected(node.id) ? '#3B82F6' : '#E5E7EB';
    },

    /**
     * Récupère la classe CSS d'un nœud pour la minimap
     */
    getNodeClassName(node: Node): string {
      return 'minimap-node';
    },

    /**
     * Récupère l'icône d'un type de bloc
     */
    getBlockIcon(type: string): string {
      const block = blockDefinitions.find(b => b.type === type);
      if (!block) {
        console.warn('Block not found for icon:', type);
        return 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4';
      }
      return block.icon;
    },

    getBlockColor(type: string): string {
      const block = blockDefinitions.find(b => b.type === type);
      if (!block) {
        console.warn('Block not found for color:', type);
        return '#6B7280';
      }
      return block.color || '#6B7280';
    }
  },

  mounted() {
    // Détecte le mode sombre
    this.isDarkMode = document.documentElement.classList.contains('dark');

    // Écoute les changements de thème
    const observer = new MutationObserver(() => {
      this.isDarkMode = document.documentElement.classList.contains('dark');
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
  }
});
</script>

<style scoped>
.workflow-canvas-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.workflow-canvas {
  width: 100%;
  height: 100%;
  background-color: #f9fafb;
}

.workflow-canvas.dark {
  background-color: #030712;
}

/* Nœuds personnalisés */
.custom-node-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.node-label-above {
  @apply text-xs font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 px-3 py-1 rounded-md shadow-sm mb-2 whitespace-nowrap border border-gray-200 dark:border-gray-700;
}

/* Custom Block Node */
.custom-node {
  @apply relative flex flex-col min-w-[200px] max-w-[280px] bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm transition-all duration-150;
}

.custom-node:hover {
  @apply border-gray-300 dark:border-gray-600 shadow-md;
}

.custom-node.selected {
  @apply border-blue-500 ring-2 ring-blue-500/10 shadow-lg !z-50;
}

/* Nodes dans un loop body - style distinctif */
.custom-node.in-loop-body {
  @apply border-purple-300 dark:border-purple-700 bg-purple-50/50 dark:bg-purple-950/30;
}

.custom-node.in-loop-body:hover {
  @apply border-purple-400 dark:border-purple-600 shadow-md;
}

.custom-node.in-loop-body.selected {
  @apply border-purple-500 ring-2 ring-purple-500/10;
}

.node-content {
  @apply flex items-center gap-3 p-3;
}

.node-icon {
  @apply flex-shrink-0 w-8 h-8 rounded flex items-center justify-center;
}

.node-info {
  @apply flex-1 min-w-0 flex flex-col justify-center;
}

.node-type {
  @apply text-sm font-bold text-gray-900 dark:text-gray-100 truncate leading-tight;
}

.node-description {
  @apply text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 whitespace-normal line-clamp-1 italic;
}

.node-delete {
  @apply flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer;
  @apply -mr-1 text-lg self-start;
}

/* Handles (ports de connexion) */
.node-handle {
  width: 8px;
  height: 8px;
  border: 2px solid #3b82f6;
  background: white;
  border-radius: 50%;
  transition: background 0.2s, border-color 0.2s;
  z-index: 20;
}

/* Positionnement précis sur les bords */
.node-handle-input {
  left: -5px !important; /* Sortie de 5px (moitié du handle + bordure) */
}

.node-handle-output {
  right: -5px !important;
}

/* Zone de détection élargie pour éviter le clignotement au hover */
.node-handle::after {
  content: "";
  position: absolute;
  top: -8px;
  left: -8px;
  right: -8px;
  bottom: -8px;
  border-radius: 50%;
}

.dark .node-handle {
  background: #0f172a;
  border-color: #3b82f6;
}

.node-handle:hover {
  background: #3b82f6;
  border-color: #3b82f6;
}

.dark .node-handle:hover {
  background: #60a5fa;
  border-color: #60a5fa;
}

/* Menu contextuel */
.context-menu {
  position: fixed;
  z-index: 1000;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 4px;
  min-width: 150px;
}

.dark .context-menu {
  background: #374151;
  border-color: #4b5563;
}

.context-menu button {
  width: 100%;
  padding: 8px 12px;
  text-align: left;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 4px;
  font-size: 14px;
  transition: background 0.2s;
}

.context-menu button:hover {
  background: #f3f4f6;
}

.dark .context-menu button:hover {
  background: #4b5563;
}

/* MiniMap styles */
:deep(.vue-flow__minimap) {
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

:deep(.dark .vue-flow__minimap) {
  background-color: #1f2937;
  border-color: #374151;
}

:deep(.vue-flow__minimap-mask) {
  fill: rgba(0, 0, 0, 0.05);
}

:deep(.dark .vue-flow__minimap-mask) {
  fill: rgba(255, 255, 255, 0.05);
}

:deep(.vue-flow__minimap-node) {
  stroke-width: 2;
  opacity: 0.8;
}

:deep(.vue-flow__minimap-node:hover) {
  opacity: 1;
}
</style>
