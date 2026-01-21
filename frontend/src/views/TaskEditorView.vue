<template>
  <MainVueFlowLayout>
    <div class="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
      <!-- En-tête secondaire (Actions du workflow) -->
      <div class="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-2 flex items-center justify-between flex-shrink-0 z-10 shadow-sm relative">
        <div class="flex items-center gap-4">
          <Button variant="ghost" size="sm" @click="goBack" class="!px-2 group">
            <template #default>
              <div class="flex items-center gap-2">
                <svg class="h-4 w-4 text-gray-400 group-hover:text-primary-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span class="text-xs font-semibold text-gray-500 dark:text-gray-400">Retour</span>
              </div>
            </template>
          </Button>
          
          <div class="h-4 w-px bg-gray-200 dark:bg-gray-700"></div>
          
          <div class="flex items-center gap-2">
            <h2 class="text-sm font-bold text-gray-900 dark:text-white">
              {{ taskName || 'Nouvelle tâche' }}
            </h2>
            <div v-if="isDirty" class="flex items-center gap-1.5 ml-2">
              <span class="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>
              <span class="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">
                Modifications non sauvegardées
              </span>
            </div>
          </div>
        </div>
        
        <div class="flex items-center gap-3">
          <Button variant="outline" size="sm" @click="saveWorkflow" :disabled="!isDirty" class="!text-xs">
            Enregistrer
          </Button>
          <Button variant="primary" size="sm" @click="runWorkflow" class="!text-xs">
            <template #default>
              <div class="flex items-center gap-1.5">
                <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                </svg>
                <span>Exécuter</span>
              </div>
            </template>
          </Button>
        </div>
      </div>

      <!-- Zone de travail -->
      <div class="flex flex-1 overflow-hidden relative">
        <!-- Sidebar Gauche : Bibliothèque -->
        <aside class="w-64 flex-shrink-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col z-10 shadow-sm">
          <div class="p-3 border-b border-gray-50 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-800/20">
            <h3 class="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Composants</h3>
          </div>
          
          <div class="flex-1 overflow-y-auto p-3 space-y-6 scrollbar-thin">
            <div v-for="category in blockCategories" :key="category.id" class="space-y-2">
              <h4 class="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest pl-1">{{ category.name }}</h4>
              <div class="grid gap-1.5">
                <div
                  v-for="block in getBlocksByCategory(category.id)"
                  :key="block.id"
                  class="flex items-center gap-3 p-2.5 bg-white dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/50 rounded-lg cursor-grab hover:border-primary-400/50 hover:bg-primary-50/10 dark:hover:bg-primary-900/10 transition-all active:cursor-grabbing group shadow-sm"
                  draggable="true"
                  @dragstart="onBlockDragStart($event, block)"
                >
                  <span class="text-lg group-hover:scale-110 transition-transform duration-200">{{ block.icon }}</span>
                  <span class="text-xs font-semibold text-gray-600 dark:text-gray-300">{{ block.name }}</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <!-- Editeur Vue Flow -->
        <div class="flex-1 relative overflow-hidden">
          <WorkflowCanvas @configure-node="onConfigureNode" />
        </div>

        <!-- Sidebar Droite : Configuration -->
        <transition 
          enter-active-class="transform transition ease-out duration-300"
          enter-from-class="translate-x-full"
          enter-to-class="translate-x-0"
          leave-active-class="transform transition ease-in duration-200"
          leave-from-class="translate-x-0"
          leave-to-class="translate-x-full"
        >
          <aside v-if="selectedNodeId" class="w-72 flex-shrink-0 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 flex flex-col z-10 shadow-xl">
            <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-gray-50/30 dark:bg-gray-800/20">
              <h3 class="text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Configuration</h3>
              <IconButton variant="ghost" size="sm" @click="closeConfigPanel" class="!p-1 hover:!bg-red-50 dark:hover:!bg-red-900/20 group">
                <svg class="h-4 w-4 text-gray-400 group-hover:text-red-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </IconButton>
            </div>
            
            <div class="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center text-center">
              <div class="bg-primary-50 dark:bg-primary-900/10 p-5 rounded-2xl mb-4 border border-primary-100/50 dark:border-primary-800/20">
                <svg class="h-8 w-8 text-primary-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <p class="text-xs font-bold text-gray-800 dark:text-white mb-2 uppercase tracking-wide">
                Options du bloc
              </p>
              <p class="text-[10px] text-gray-500 dark:text-gray-400 leading-relaxed max-w-[180px] mx-auto">
                L'interface de configuration détaillée sera disponible dans le <span class="text-primary-500 font-bold">Sprint 6</span>.
              </p>
            </div>
          </aside>
        </transition>
      </div>
    </div>
  </MainVueFlowLayout>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { mapState } from 'pinia';
import MainVueFlowLayout from '@/components/layout/MainVueFlowLayout.vue';
import WorkflowCanvas from '@/components/WorkflowCanvas.vue';
import Button from '@/components/common/Button.vue';
import IconButton from '@/components/common/IconButton.vue';
import { useWorkflowStore } from '@/stores/workflow';
import { useBlocksStore } from '@/stores/blocks';

export default defineComponent({
  name: 'TaskEditorView',

  components: {
    MainVueFlowLayout,
    WorkflowCanvas,
    Button,
    IconButton
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
/* Scrollbar custom pour un look minimaliste */
.scrollbar-thin::-webkit-scrollbar {
  width: 4px;
}

.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}

.scrollbar-thin::-webkit-scrollbar-thumb {
  @apply bg-gray-200 dark:bg-gray-800 rounded-full;
}

.scrollbar-thin::-webkit-scrollbar-thumb:hover {
  @apply bg-gray-300 dark:bg-gray-700;
}
</style>

