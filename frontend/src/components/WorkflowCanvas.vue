<template>
  <div class="workflow-canvas-container">
    <VueFlow
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
        :node-stroke-width="3"
        position="bottom-right"
      />

      <!-- Template pour les nœuds personnalisés -->
      <template #node-custom="{ data, id }">
        <div
          :class="[
            'custom-node',
            `node-type-${data.type}`,
            { selected: isNodeSelected(id) }
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
              <div class="node-label">{{ data.label || data.type }}</div>
              <div v-if="data.description" class="node-description">{{ data.description }}</div>
            </div>
            <button
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
    CustomEdge
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
    ...mapState(useWorkflowStore, ['selectedNodes', 'viewport']),

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
      this.removeEdge(edgeId);
    },

    /**
     * Validation des règles de connexion
     */
    validateConnectionRules(connection: Connection): boolean {
      // Pour l'instant, autorise toutes les connexions
      // La validation complète sera implémentée plus tard
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
      const type = node.data?.type || 'default';
      const colors: Record<string, string> = {
        navigation: '#3b82f6',
        action: '#8b5cf6',
        extraction: '#10b981',
        condition: '#f59e0b',
        loop: '#ec4899',
        output: '#06b6d4',
        default: '#6b7280'
      };
      return colors[type] || colors.default;
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
/* Custom Block Node */
.custom-node {
  @apply flex flex-col min-w-[200px] max-w-[280px] bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm transition-all duration-150;
}

.custom-node:hover {
  @apply border-gray-300 dark:border-gray-600 shadow-md;
}

.custom-node.selected {
  @apply border-blue-500 ring-2 ring-blue-500/10 shadow-lg !z-50;
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

.node-label {
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
</style>
