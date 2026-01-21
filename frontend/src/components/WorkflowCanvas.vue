<template>
  <div class="workflow-canvas-container">
    <VueFlow
      v-model:nodes="nodes"
      v-model:edges="edges"
      :class="['workflow-canvas', { dark: isDarkMode }]"
      :default-viewport="viewport"
      :snap-to-grid="snapToGrid"
      :snap-grid="[15, 15]"
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
        :pattern-color="isDarkMode ? '#2a2a2a' : '#e5e5e5'"
        :gap="15"
        variant="dots"
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
          <div class="node-header">
            <div class="node-icon">{{ getBlockIcon(data.type) }}</div>
            <div class="node-label">{{ data.label || data.type }}</div>
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
        <CustomEdge v-bind="edgeProps" @delete-edge="onDeleteEdge" />
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
      if (!blockType) return;

      // Récupère les informations du bloc
      const blocksStore = useBlocksStore();
      const block = blocksStore.getBlockByType(blockType);
      if (!block) return;

      // Calcule la position sur le canvas
      const canvas = (this.$el as HTMLElement).querySelector('.vue-flow');
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      // Crée le nœud
      const newNode: Node = {
        id: `node-${Date.now()}`,
        type: 'custom',
        position: { x, y },
        data: {
          type: blockType,
          label: block.name,
          config: {},
          hasInput: block.inputs && block.inputs.length > 0,
          hasOutput: block.outputs && block.outputs.length > 0
        }
      };

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
      const icons: Record<string, string> = {
        navigate: '🌐',
        click: '👆',
        type: '⌨️',
        wait: '⏱️',
        scroll: '📜',
        screenshot: '📸',
        extract: '📝',
        condition: '🔀',
        loop: '🔁',
        output: '💾',
        default: '📦'
      };
      return icons[type] || icons.default;
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
  background-color: #1f2937;
}

/* Nœuds personnalisés */
.custom-node {
  min-width: 180px;
  padding: 12px;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.custom-node:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-color: #3b82f6;
}

.custom-node.selected {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}

.dark .custom-node {
  background: #374151;
  border-color: #4b5563;
  color: #f9fafb;
}

.dark .custom-node:hover {
  border-color: #60a5fa;
}

.dark .custom-node.selected {
  border-color: #60a5fa;
  box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.2);
}

.node-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.node-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.node-label {
  flex: 1;
  font-weight: 600;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.node-delete {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: #9ca3af;
  font-size: 20px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
  flex-shrink: 0;
}

.node-delete:hover {
  background: #fee2e2;
  color: #dc2626;
}

.dark .node-delete:hover {
  background: #7f1d1d;
  color: #fca5a5;
}

/* Handles (ports de connexion) */
.node-handle {
  width: 12px;
  height: 12px;
  border: 2px solid #3b82f6;
  background: white;
  border-radius: 50%;
}

.dark .node-handle {
  background: #374151;
  border-color: #60a5fa;
}

.node-handle:hover {
  width: 16px;
  height: 16px;
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
