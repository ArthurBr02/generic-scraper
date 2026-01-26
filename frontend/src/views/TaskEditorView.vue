<template>
  <MainVueFlowLayout>
    <div class="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
      <!-- Toolbar avec import/export -->
      <WorkflowToolbar />

      <!-- Zone de travail -->
      <div class="flex flex-1 overflow-hidden relative">
        <!-- Sidebar Gauche : Bibliothèque -->
        <aside class="flex-shrink-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col z-10 shadow-sm">
          <!-- Bouton Configuration Initiale -->
          <div class="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/20">
            <button
              @click="openInitialConfigPanel"
              class="btn w-full bg-cyan-600 hover:bg-cyan-700 text-white focus:ring-cyan-500 shadow-sm gap-2"
              title="Configuration initiale du workflow"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.546-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Configuration initiale
            </button>
          </div>
          <BlockLibrary />
        </aside>

        <!-- Editeur Vue Flow -->
        <div class="flex-1 relative overflow-hidden">
            <WorkflowCanvas />
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
          <BlockConfigPanel v-if="hasSelectedNode" />
        </transition>

        <!-- Sidebar Droite : Configuration Initiale -->
        <transition 
          enter-active-class="transform transition ease-out duration-300"
          enter-from-class="translate-x-full"
          enter-to-class="translate-x-0"
          leave-active-class="transform transition ease-in duration-200"
          leave-from-class="translate-x-0"
          leave-to-class="translate-x-full"
        >
          <InitialConfigPanel v-if="showInitialConfigPanel" />
        </transition>
      </div>
    </div>
  </MainVueFlowLayout>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { mapState, mapActions } from 'pinia';
import MainVueFlowLayout from '@/components/layout/MainVueFlowLayout.vue';
import WorkflowCanvas from '@/components/WorkflowCanvas.vue';
import WorkflowToolbar from '@/components/workflow/WorkflowToolbar.vue';
import BlockConfigPanel from '@/components/workflow/BlockConfigPanel.vue';
import BlockLibrary from '@/components/workflow/BlockLibrary.vue';
import InitialConfigPanel from '@/components/workflow/InitialConfigPanel.vue';
import { useWorkflowStore } from '@/stores/workflow';
import { useTasksStore } from '@/stores/tasks';
import { useNotificationStore } from '@/stores/notification';
import WorkflowConverter from '@/services/WorkflowConverter';

export default defineComponent({
  name: 'TaskEditorView',

  components: {
    MainVueFlowLayout,
    WorkflowCanvas,
    WorkflowToolbar,
    BlockConfigPanel,
    BlockLibrary,
    InitialConfigPanel
  },

  computed: {
    ...mapState(useWorkflowStore, ['isDirty', 'selectedNodes', 'showInitialConfigPanel']),

    hasSelectedNode(): boolean {
      return this.selectedNodes && this.selectedNodes.length > 0;
    },

    isEditMode(): boolean {
      return this.$route.params.id !== undefined && this.$route.params.id !== 'new';
    }
  },

  watch: {
    // Surveiller les changements de route pour réinitialiser le workflow
    '$route.params.id': {
      async handler(newId, oldId) {
        // Uniquement si l'ID a réellement changé (évite les déclenchements inutiles)
        if (newId !== oldId) {
          await this.loadTaskWorkflow();
        }
      }
    }
  },

  methods: {
    ...mapActions(useWorkflowStore, ['loadWorkflow', 'setCurrentTask', 'reset', 'openInitialConfigPanel']),
    ...mapActions(useNotificationStore, ['error']),

    async loadTaskWorkflow() {
      // TOUJOURS réinitialiser le store à chaque chargement
      this.reset();
      
      // Charge le workflow existant si en mode édition
      if (this.isEditMode) {
        const taskId = this.$route.params.id as string;
        try {
          const tasksStore = useTasksStore();
          const task = await tasksStore.fetchTask(taskId);
          
          if (task && task.config) {
            // Convertir la config en nodes et edges
            const { nodes, edges } = WorkflowConverter.fromConfig(task.config);
            // Passer aussi la config pour créer le bloc d'initialisation et le bloc output
            this.loadWorkflow({ 
              nodes, 
              edges,
              config: {
                target: task.config.target,
                browser: task.config.browser,
                logging: task.config.logging,
                errorHandling: task.config.errorHandling,
                scheduling: task.config.scheduling,
                output: task.config.output
              }
            });
            this.setCurrentTask(task.id, task.name);
          }
        } catch (err) {
          this.error(`Erreur lors du chargement du workflow: ${(err as Error).message}`);
          console.error('Erreur lors du chargement du workflow:', err);
        }
      }
    }
  },

  async mounted() {
    await this.loadTaskWorkflow();
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

