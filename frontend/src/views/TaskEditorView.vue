<template>
  <MainVueFlowLayout>
    <div class="task-editor-container">
      <!-- En-tête -->
      <div class="editor-header">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <button @click="goBack" class="btn-back">
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Retour
            </button>
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ taskName || 'Nouvelle tâche' }}
            </h2>
          </div>
          
          <div class="flex items-center gap-2">
            <span v-if="isDirty" class="text-sm text-orange-600 dark:text-orange-400">
              Non sauvegardé
            </span>
            <button @click="saveWorkflow" class="btn-primary" :disabled="!isDirty">
              Enregistrer
            </button>
            <button @click="runWorkflow" class="btn-secondary">
              Exécuter
            </button>
          </div>
        </div>
      </div>

      <!-- Zone principale avec sidebar et canvas -->
      <div class="editor-content">
        <!-- Bibliothèque de blocs (sidebar gauche) -->
        <div class="blocks-library">
          <h3 class="library-title">Bibliothèque de blocs</h3>
          
          <div class="library-categories">
            <div v-for="category in blockCategories" :key="category.id" class="category">
              <h4 class="category-title">{{ category.name }}</h4>
              <div class="blocks-list">
                <div
                  v-for="block in getBlocksByCategory(category.id)"
                  :key="block.id"
                  class="block-item"
                  draggable="true"
                  @dragstart="onBlockDragStart($event, block)"
                >
                  <span class="block-icon">{{ block.icon }}</span>
                  <span class="block-name">{{ block.name }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Canvas de workflow -->
        <div class="workflow-canvas-wrapper">
          <WorkflowCanvas @configure-node="onConfigureNode" />
        </div>

        <!-- Panneau de configuration (sidebar droite) -->
        <div v-if="selectedNodeId" class="config-panel">
          <div class="config-header">
            <h3 class="config-title">Configuration</h3>
            <button @click="closeConfigPanel" class="btn-close">
              ×
            </button>
          </div>
          
          <div class="config-content">
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Le panneau de configuration sera implémenté dans le Sprint 6
            </p>
          </div>
        </div>
      </div>
    </div>
  </MainVueFlowLayout>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { mapState } from 'pinia';
import MainVueFlowLayout from '@/components/layout/MainVueFlowLayout.vue';
import WorkflowCanvas from '@/components/WorkflowCanvas.vue';
import { useWorkflowStore } from '@/stores/workflow';
import { useBlocksStore } from '@/stores/blocks';

export default defineComponent({
  name: 'TaskEditorView',

  components: {
    MainVueFlowLayout,
    WorkflowCanvas
  },

  data() {
    return {
      taskName: '',
      selectedNodeId: null as string | null,
      blockCategories: [
        { id: 'navigation', name: 'Navigation' },
        { id: 'action', name: 'Actions' },
        { id: 'extraction', name: 'Extraction' },
        { id: 'control', name: 'Contrôle' },
        { id: 'output', name: 'Sortie' }
      ]
    };
  },

  computed: {
    ...mapState(useWorkflowStore, ['isDirty']),

    isEditMode(): boolean {
      return this.$route.params.id !== undefined && this.$route.params.id !== 'new';
    }
  },

  methods: {
    goBack(): void {
      if (this.isDirty) {
        const confirm = window.confirm('Vous avez des modifications non sauvegardées. Voulez-vous vraiment quitter ?');
        if (!confirm) return;
      }
      this.$router.push('/');
    },

    saveWorkflow(): void {
      // Sera implémenté pour sauvegarder le workflow
      const workflowStore = useWorkflowStore();
      console.log('Sauvegarde du workflow:', {
        nodes: workflowStore.nodes,
        edges: workflowStore.edges
      });
      workflowStore.markAsSaved();
    },

    runWorkflow(): void {
      // Sera implémenté pour exécuter le workflow
      console.log('Exécution du workflow');
    },

    onBlockDragStart(event: DragEvent, block: any): void {
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('application/reactflow', block.type);
      }
    },

    getBlocksByCategory(categoryId: string): any[] {
      const blocksStore = useBlocksStore();
      return blocksStore.getBlocksByCategory(categoryId);
    },

    onConfigureNode(nodeId: string): void {
      this.selectedNodeId = nodeId;
    },

    closeConfigPanel(): void {
      this.selectedNodeId = null;
    }
  },

  mounted() {
    // Charge le workflow existant si en mode édition
    if (this.isEditMode) {
      const taskId = this.$route.params.id as string;
      this.taskName = `Tâche ${taskId}`;
      // Charger le workflow depuis l'API sera implémenté plus tard
    } else {
      this.taskName = 'Nouvelle tâche';
    }
  }
});
</script>

<style scoped>
.task-editor-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.editor-header {
  padding: 1rem 1.5rem;
  background: white;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
}

.dark .editor-header {
  background: #1f2937;
  border-bottom-color: #374151;
}

.btn-back {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  color: #6b7280;
  transition: all 0.2s;
}

.btn-back:hover {
  background: #f3f4f6;
  color: #111827;
}

.dark .btn-back:hover {
  background: #374151;
  color: #f9fafb;
}

.btn-primary {
  padding: 0.5rem 1rem;
  background: #3b82f6;
  color: white;
  border-radius: 0.5rem;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  padding: 0.5rem 1rem;
  background: #10b981;
  color: white;
  border-radius: 0.5rem;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: #059669;
}

.editor-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.blocks-library {
  width: 280px;
  flex-shrink: 0;
  background: white;
  border-right: 1px solid #e5e7eb;
  overflow-y: auto;
  padding: 1rem;
}

.dark .blocks-library {
  background: #1f2937;
  border-right-color: #374151;
}

.library-title {
  font-weight: 700;
  font-size: 1.125rem;
  color: #111827;
  margin-bottom: 1rem;
}

.dark .library-title {
  color: #f9fafb;
}

.category {
  margin-bottom: 1.5rem;
}

.category-title {
  font-weight: 600;
  font-size: 0.875rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
}

.blocks-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.block-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  cursor: grab;
  transition: all 0.2s;
}

.block-item:hover {
  background: #f3f4f6;
  border-color: #3b82f6;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.block-item:active {
  cursor: grabbing;
}

.dark .block-item {
  background: #374151;
  border-color: #4b5563;
}

.dark .block-item:hover {
  background: #4b5563;
  border-color: #60a5fa;
}

.block-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.block-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: #111827;
}

.dark .block-name {
  color: #f9fafb;
}

.workflow-canvas-wrapper {
  flex: 1;
  overflow: hidden;
  background: #f9fafb;
}

.dark .workflow-canvas-wrapper {
  background: #111827;
}

.config-panel {
  width: 320px;
  flex-shrink: 0;
  background: white;
  border-left: 1px solid #e5e7eb;
  overflow-y: auto;
}

.dark .config-panel {
  background: #1f2937;
  border-left-color: #374151;
}

.config-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.dark .config-header {
  border-bottom-color: #374151;
}

.config-title {
  font-weight: 700;
  font-size: 1.125rem;
  color: #111827;
}

.dark .config-title {
  color: #f9fafb;
}

.btn-close {
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  font-size: 1.5rem;
  border-radius: 0.375rem;
  transition: all 0.2s;
}

.btn-close:hover {
  background: #f3f4f6;
  color: #111827;
}

.dark .btn-close:hover {
  background: #374151;
  color: #f9fafb;
}

.config-content {
  padding: 1rem;
}
</style>
