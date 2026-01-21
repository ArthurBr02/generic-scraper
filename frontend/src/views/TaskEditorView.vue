<template>
  <MainVueFlowLayout>
    <div class="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
      <!-- Toolbar avec import/export -->
      <WorkflowToolbar />

      <!-- Zone de travail -->
      <div class="flex flex-1 overflow-hidden relative">
        <!-- Sidebar Gauche : Bibliothèque -->
        <aside class="flex-shrink-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col z-10 shadow-sm">          
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
      </div>
    </div>
  </MainVueFlowLayout>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { mapState } from 'pinia';
import MainVueFlowLayout from '@/components/layout/MainVueFlowLayout.vue';
import WorkflowCanvas from '@/components/WorkflowCanvas.vue';
import WorkflowToolbar from '@/components/workflow/WorkflowToolbar.vue';
import BlockConfigPanel from '@/components/workflow/BlockConfigPanel.vue';
import BlockLibrary from '@/components/workflow/BlockLibrary.vue';
import { useWorkflowStore } from '@/stores/workflow';

export default defineComponent({
  name: 'TaskEditorView',

  components: {
    MainVueFlowLayout,
    WorkflowCanvas,
    WorkflowToolbar,
    BlockConfigPanel,
    BlockLibrary
  },

  computed: {
    ...mapState(useWorkflowStore, ['isDirty', 'selectedNodes']),

    hasSelectedNode(): boolean {
      return this.selectedNodes && this.selectedNodes.length > 0;
    },

    isEditMode(): boolean {
      return this.$route.params.id !== undefined && this.$route.params.id !== 'new';
    }
  },

  mounted() {
    // Charge le workflow existant si en mode édition
    if (this.isEditMode) {
      const taskId = this.$route.params.id as string;
      // Charger le workflow depuis l'API sera implémenté plus tard
      console.log('Chargement du workflow:', taskId);
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

