<template>
  <div class="workflow-toolbar flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
    <!-- Informations du workflow -->
    <div class="flex items-center gap-3">
      <input
        v-model="workflowName"
        type="text"
        placeholder="Workflow sans nom"
        class="text-lg font-semibold text-gray-900 dark:text-white bg-transparent border-b-2 border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none px-2 py-1 transition-colors"
        @focus="$event.target.select()"
      />
      <span v-if="isDirty" class="text-xs text-orange-500" title="Modifications non sauvegardées">
        • Non sauvegardé
      </span>
    </div>

    <!-- Actions -->
    <div class="flex items-center gap-2">
      <!-- Nouveau workflow -->
      <button
        @click="newWorkflow"
        class="btn btn-secondary"
        title="Nouveau workflow"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        <span>Nouveau</span>
      </button>

      <!-- Importer JSON -->
      <button
        @click="triggerImport"
        class="btn btn-secondary"
        title="Importer une configuration JSON"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <span>Importer</span>
      </button>
      <input
        ref="fileInput"
        type="file"
        accept=".json"
        class="hidden"
        @change="handleFileImport"
      />

      <!-- Exporter JSON -->
      <button
        @click="exportWorkflow"
        class="btn btn-secondary"
        :disabled="nodes.length === 0"
        title="Exporter en JSON"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
        </svg>
        <span>Exporter</span>
      </button>

      <!-- Valider -->
      <button
        @click="validateWorkflow"
        class="btn btn-secondary"
        :disabled="nodes.length === 0"
        title="Valider la configuration"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Valider</span>
      </button>

      <!-- Sauvegarder -->
      <button
        @click="saveWorkflow"
        class="btn btn-primary"
        :disabled="nodes.length === 0 || !isDirty"
        title="Sauvegarder le workflow"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
        </svg>
        <span>Sauvegarder</span>
      </button>
    </div>

    <!-- Modal d'édition des métadonnées -->
    <div
      v-if="showMetadataModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      @click.self="showMetadataModal = false"
    >
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Métadonnées du workflow
        </h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nom du workflow *
            </label>
            <input
              v-model="metadata.name"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Mon workflow"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              v-model="metadata.description"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Description du workflow..."
            ></textarea>
          </div>
        </div>
        <div class="flex gap-2 mt-6">
          <button
            @click="showMetadataModal = false"
            class="flex-1 btn btn-secondary"
          >
            Annuler
          </button>
          <button
            @click="confirmExport"
            class="flex-1 btn btn-primary"
            :disabled="!metadata.name"
          >
            Exporter
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de validation -->
    <div
      v-if="showValidationModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      @click.self="showValidationModal = false"
    >
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Résultat de la validation
        </h3>
        <div v-if="validationErrors.length === 0" class="text-green-600 dark:text-green-400">
          <div class="flex items-center gap-2 mb-2">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span class="font-medium">Configuration valide !</span>
          </div>
          <p class="text-sm">Le workflow ne contient aucune erreur.</p>
        </div>
        <div v-else class="text-red-600 dark:text-red-400">
          <div class="flex items-center gap-2 mb-3">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span class="font-medium">{{ validationErrors.length }} erreur(s) détectée(s)</span>
          </div>
          <ul class="text-sm space-y-1 max-h-64 overflow-y-auto">
            <li v-for="(error, index) in validationErrors" :key="index" class="flex gap-2">
              <span>•</span>
              <span>{{ error }}</span>
            </li>
          </ul>
        </div>
        <button
          @click="showValidationModal = false"
          class="w-full btn btn-secondary mt-4"
        >
          Fermer
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { mapState, mapActions } from 'pinia';
import { useWorkflowStore } from '@/stores/workflow';
import { useTasksStore } from '@/stores/tasks';
import { useNotificationStore } from '@/stores/notification';
import WorkflowConverter from '@/services/WorkflowConverter';
import type { WorkflowConfig } from '@/services/WorkflowConverter';

export default defineComponent({
  name: 'WorkflowToolbar',

  data() {
    return {
      showMetadataModal: false,
      showValidationModal: false,
      validationErrors: [] as string[],
      metadata: {
        name: '',
        description: ''
      }
    };
  },

  computed: {
    ...mapState(useWorkflowStore, ['nodes', 'edges', 'isDirty', 'currentTaskId', 'currentTaskName']),
    
    workflowName: {
      get(): string {
        return this.currentTaskName;
      },
      set(value: string): void {
        this.setCurrentTask(this.currentTaskId, value);
      }
    }
  },

  methods: {
    ...mapActions(useWorkflowStore, ['reset', 'loadWorkflow', 'markAsSaved', 'setCurrentTask']),
    ...mapActions(useNotificationStore, ['success', 'error']),

    newWorkflow(): void {
      if (this.isDirty) {
        const confirmed = confirm('Vous avez des modifications non sauvegardées. Voulez-vous vraiment créer un nouveau workflow ?');
        if (!confirmed) return;
      }

      this.reset();
      this.success('Nouveau workflow créé');
    },

    triggerImport(): void {
      const input = this.$refs.fileInput as HTMLInputElement;
      input.click();
    },

    async handleFileImport(event: Event): Promise<void> {
      const input = event.target as HTMLInputElement;
      const file = input.files?.[0];
      
      if (!file) return;

      try {
        const text = await file.text();
        const config = WorkflowConverter.importFromJson(text);
        
        console.log('Config imported from JSON:', config);
        console.log('Config.target:', config.target);

        // Valider la configuration
        const errors = WorkflowConverter.validate(config);
        if (errors.length > 0) {
          this.validationErrors = errors;
          this.showValidationModal = true;
          return;
        }

        // Convertir en graphe
        const { nodes, edges } = WorkflowConverter.fromConfig(config);
        
        // Extraire uniquement les champs de configuration globale
        const globalConfig: any = {};
        if (config.target) globalConfig.target = config.target;
        if (config.browser) globalConfig.browser = config.browser;
        if (config.logging) globalConfig.logging = config.logging;
        if (config.errorHandling) globalConfig.errorHandling = config.errorHandling;
        if (config.scheduling) globalConfig.scheduling = config.scheduling;
        if (config.output) globalConfig.output = config.output;
        
        console.log('Global config extracted:', globalConfig);
        console.log('globalConfig.target:', globalConfig.target);
        
        // Charger dans le store (nouveau workflow non sauvegardé) avec la config globale
        this.loadWorkflow({ nodes, edges, config: globalConfig });
        this.setCurrentTask(null, config.name);
        
        this.success(`Workflow "${config.name}" importé avec succès`);

        // Réinitialiser l'input
        input.value = '';
      } catch (error) {
        this.error(`Erreur lors de l'import: ${(error as Error).message}`);
      }
    },

    exportWorkflow(): void {
      // Demander les métadonnées
      this.metadata.name = this.workflowName || 'workflow-' + Date.now();
      this.metadata.description = '';
      this.showMetadataModal = true;
    },

    confirmExport(): void {
      try {
        // Convertir en config JSON
        const config = WorkflowConverter.toConfig(
          this.nodes,
          this.edges,
          this.metadata
        );

        // Valider
        const errors = WorkflowConverter.validate(config);
        if (errors.length > 0) {
          this.showMetadataModal = false;
          this.validationErrors = errors;
          this.showValidationModal = true;
          return;
        }

        // Exporter en JSON
        const json = WorkflowConverter.exportToJson(config, true);
        
        // Télécharger le fichier
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.metadata.name}.json`;
        a.click();
        URL.revokeObjectURL(url);

        this.workflowName = this.metadata.name;
        this.showMetadataModal = false;
        
        this.success('Workflow exporté avec succès');
      } catch (error) {
        this.error(`Erreur lors de l'export: ${(error as Error).message}`);
      }
    },

    validateWorkflow(): void {
      try {
        const config = WorkflowConverter.toConfig(
          this.nodes,
          this.edges,
          { name: this.workflowName || 'workflow' }
        );

        this.validationErrors = WorkflowConverter.validate(config);
        this.showValidationModal = true;
      } catch (error) {
        this.error(`Erreur lors de la validation: ${(error as Error).message}`);
      }
    },

    async saveWorkflow(): Promise<void> {
      try {
        const config = WorkflowConverter.toConfig(
          this.nodes,
          this.edges,
          { name: this.workflowName || 'workflow', description: '' }
        );

        const tasksStore = useTasksStore();
        
        // Créer ou mettre à jour la tâche
        if (this.currentTaskId) {
          // Mise à jour d'une tâche existante
          await tasksStore.updateTask(this.currentTaskId, {
            name: this.workflowName || 'workflow',
            description: '',
            config
          });
          this.success('Workflow sauvegardé');
        } else {
          // Création d'une nouvelle tâche
          const newTask = await tasksStore.createTask({
            name: this.workflowName || 'workflow',
            description: '',
            config
          });
          this.setCurrentTask(newTask.id, newTask.name);
          this.success(`Workflow "${newTask.name}" créé et sauvegardé`);
        }
        
        this.markAsSaved();
      } catch (error) {
        this.error(`Erreur lors de la sauvegarde: ${(error as Error).message}`);
      }
    }
  }
});
</script>

<style scoped>
.btn {
  @apply inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2;
}

.btn-primary {
  @apply text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed;
}

.btn-secondary {
  @apply text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed;
}
</style>
