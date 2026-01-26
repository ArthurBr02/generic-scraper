<template>
  <MainLayout>
    <div class="max-w-7xl mx-auto">
      <div class="mb-6">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
          Historique des exécutions
        </h2>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Consultez l'historique de toutes les exécutions de vos tâches
        </p>
      </div>

      <!-- Filtres -->
      <Card class="mb-6">
        <div class="flex items-center gap-4">
          <div class="flex-1">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Filtrer par tâche
            </label>
            <select
              v-model="selectedTaskId"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Toutes les tâches</option>
              <option v-for="task in tasks" :key="task.id" :value="task.id">
                {{ task.name }}
              </option>
            </select>
          </div>

          <div class="flex-1">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Filtrer par statut
            </label>
            <select
              v-model="selectedStatus"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Tous les statuts</option>
              <option value="completed">Terminé</option>
              <option value="failed">Échoué</option>
              <option value="cancelled">Annulé</option>
              <option value="running">En cours</option>
            </select>
          </div>

          <div class="pt-7">
            <button
              @click="loadExecutions"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Actualiser
            </button>
          </div>
        </div>
      </Card>

      <!-- Liste des exécutions -->
      <Card>
        <div v-if="loading" class="text-center py-12">
          <svg class="animate-spin h-8 w-8 mx-auto text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">Chargement...</p>
        </div>

        <div v-else-if="executions.length === 0" class="text-center py-12">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">Aucune exécution</h3>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Aucune exécution ne correspond aux filtres sélectionnés
          </p>
        </div>

        <div v-else>
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tâche
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Statut
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Début
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Durée
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Éléments extraits
                </th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-for="execution in executions" :key="execution.id" class="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ getTaskName(execution.task_id) }}
                  </div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">
                    {{ execution.id.substring(0, 8) }}...
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span :class="getStatusClass(execution.status)" class="px-3 py-1 rounded-full text-xs font-medium">
                    {{ getStatusText(execution.status) }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {{ formatDate(execution.started_at) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {{ formatDuration(execution.duration_ms) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {{ execution.items_extracted || 0 }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    @click="viewDetails(execution.id)"
                    class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                  >
                    Voir
                  </button>
                  <button
                    @click="deleteExecution(execution.id)"
                    class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      <!-- Modal de détails -->
      <div
        v-if="selectedExecution"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        @click.self="closeModal"
      >
        <Card class="max-w-4xl w-full max-h-[80vh] overflow-y-auto">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-xl font-bold text-gray-900 dark:text-white">
              Détails de l'exécution
            </h3>
            <button @click="closeModal" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="space-y-6">
            <!-- Informations générales -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">ID:</span>
                <p class="text-sm text-gray-900 dark:text-white">{{ selectedExecution.id }}</p>
              </div>
              <div>
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Tâche:</span>
                <p class="text-sm text-gray-900 dark:text-white">{{ getTaskName(selectedExecution.task_id) }}</p>
              </div>
              <div>
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Statut:</span>
                <span :class="getStatusClass(selectedExecution.status)" class="inline-block px-3 py-1 rounded-full text-xs font-medium">
                  {{ getStatusText(selectedExecution.status) }}
                </span>
              </div>
              <div>
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Durée:</span>
                <p class="text-sm text-gray-900 dark:text-white">{{ formatDuration(selectedExecution.duration_ms) }}</p>
              </div>
            </div>

            <!-- Erreur si présente -->
            <div v-if="selectedExecution.error_message" class="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-4">
              <h4 class="text-sm font-medium text-red-800 dark:text-red-200 mb-2">Erreur</h4>
              <p class="text-sm text-red-700 dark:text-red-300">{{ selectedExecution.error_message }}</p>
            </div>

            <!-- Logs -->
            <div v-if="selectedExecution.logs && selectedExecution.logs.length > 0">
              <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-2">Logs</h4>
              <div class="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 max-h-64 overflow-y-auto">
                <div v-for="(log, index) in selectedExecution.logs" :key="index" class="mb-2 text-sm">
                  <span class="text-gray-500 dark:text-gray-500">{{ formatTime(log.timestamp) }}</span>
                  <span :class="getLogLevelClass(log.level)" class="mx-2 px-2 py-0.5 rounded text-xs">
                    {{ log.level }}
                  </span>
                  <span class="text-gray-900 dark:text-gray-100">{{ log.message }}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  </MainLayout>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { mapState } from 'pinia';
import axios from 'axios';
import MainLayout from '@/components/layout/MainLayout.vue';
import Card from '@/components/common/Card.vue';
import { useTasksStore } from '@/stores/tasks';
import { useNotificationStore } from '@/stores/notification';

interface Execution {
  id: string;
  task_id: string;
  task_name?: string;
  status: string;
  started_at: string;
  completed_at?: string;
  duration_ms?: number;
  items_extracted?: number;
  error_message?: string;
  logs?: any[];
}

export default defineComponent({
  name: 'ExecutionHistoryView',

  components: {
    MainLayout,
    Card
  },

  data() {
    return {
      executions: [] as Execution[],
      selectedExecution: null as Execution | null,
      selectedTaskId: '',
      selectedStatus: '',
      loading: false
    };
  },

  computed: {
    ...mapState(useTasksStore, ['tasks'])
  },

  async mounted() {
    await this.loadTasks();
    await this.loadExecutions();
  },

  methods: {
    async loadTasks(): Promise<void> {
      const tasksStore = useTasksStore();
      await tasksStore.fetchTasks();
    },

    async loadExecutions(): Promise<void> {
      this.loading = true;
      try {
        const params: any = {};
        if (this.selectedTaskId) params.taskId = this.selectedTaskId;
        if (this.selectedStatus) params.status = this.selectedStatus;

        console.log('Loading executions with params:', params);
        const response = await axios.get('/api/executions', { params });
        console.log('Executions response:', response.data);
        console.log('Executions data type:', Array.isArray(response.data.data) ? 'array' : typeof response.data.data);
        console.log('Executions data content:', response.data.data);
        
        // S'assurer que c'est un tableau
        this.executions = Array.isArray(response.data.data) ? response.data.data : [];
        console.log('Loaded executions:', this.executions.length);
      } catch (error: any) {
        console.error('Error loading executions:', error);
        const notificationStore = useNotificationStore();
        notificationStore.showNotification('Erreur lors du chargement de l\'historique', 'error');
      } finally {
        this.loading = false;
      }
    },

    async viewDetails(executionId: string): Promise<void> {
      try {
        const response = await axios.get(`/api/executions/${executionId}`);
        this.selectedExecution = response.data.data;
      } catch (error: any) {
        console.error('Error loading execution details:', error);
        const notificationStore = useNotificationStore();
        notificationStore.showNotification('Erreur lors du chargement des détails', 'error');
      }
    },

    async deleteExecution(executionId: string): Promise<void> {
      if (!confirm('Êtes-vous sûr de vouloir supprimer cette exécution ?')) {
        return;
      }

      try {
        await axios.delete(`/api/executions/${executionId}`);
        await this.loadExecutions();
        
        const notificationStore = useNotificationStore();
        notificationStore.showNotification('Exécution supprimée', 'success');
      } catch (error: any) {
        console.error('Error deleting execution:', error);
        const notificationStore = useNotificationStore();
        notificationStore.showNotification('Erreur lors de la suppression', 'error');
      }
    },

    closeModal(): void {
      this.selectedExecution = null;
    },

    getTaskName(taskId: string): string {
      const task = this.tasks.find(t => t.id === taskId);
      return task?.name || taskId;
    },

    getStatusClass(status: string): string {
      const classes: Record<string, string> = {
        pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        running: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
        completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
        cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
      };
      return classes[status] || classes.pending;
    },

    getStatusText(status: string): string {
      const texts: Record<string, string> = {
        pending: 'En attente',
        running: 'En cours',
        completed: 'Terminé',
        failed: 'Échoué',
        cancelled: 'Annulé'
      };
      return texts[status] || status;
    },

    getLogLevelClass(level: string): string {
      const classes: Record<string, string> = {
        info: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
        warn: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        error: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
        debug: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
      };
      return classes[level] || classes.info;
    },

    formatDate(dateString: string): string {
      const date = new Date(dateString);
      return date.toLocaleString('fr-FR');
    },

    formatTime(dateString: string): string {
      const date = new Date(dateString);
      return date.toLocaleTimeString('fr-FR', { hour12: false });
    },

    formatDuration(ms?: number): string {
      if (!ms) return '-';
      
      const seconds = Math.floor(ms / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);

      if (hours > 0) {
        return `${hours}h ${minutes % 60}m`;
      } else if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`;
      } else {
        return `${seconds}s`;
      }
    }
  }
});
</script>
