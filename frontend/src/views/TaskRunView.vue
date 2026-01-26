<template>
  <MainLayout>
    <div class="max-w-7xl mx-auto">
      <div class="mb-6">
        <button @click="goBack" class="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white flex items-center gap-1">
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Retour aux tâches
        </button>
        <div class="mt-2 flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ taskName || 'Exécution de la tâche' }}
            </h2>
            <p v-if="currentExecution" class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              ID d'exécution: {{ currentExecution.id }}
            </p>
          </div>
          <div class="flex items-center gap-3">
            <!-- Bouton Démarrer -->
            <button
              v-if="!currentExecution || currentExecution.status === 'completed' || currentExecution.status === 'failed' || currentExecution.status === 'cancelled'"
              @click="startExecution"
              :disabled="isStarting"
              class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <svg v-if="!isStarting" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <svg v-else class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ isStarting ? 'Démarrage...' : 'Démarrer' }}
            </button>

            <!-- Bouton Arrêter -->
            <button
              v-if="currentExecution && (currentExecution.status === 'running' || currentExecution.status === 'pending')"
              @click="stopExecution"
              :disabled="isStopping"
              class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
              </svg>
              {{ isStopping ? 'Arrêt...' : 'Arrêter' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Statut et progression -->
      <Card v-if="currentExecution" class="mb-6">
        <div class="space-y-4">
          <!-- Statut -->
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Statut:</span>
              <span :class="getStatusClass(currentExecution.status)" class="px-3 py-1 rounded-full text-xs font-medium">
                {{ getStatusText(currentExecution.status) }}
              </span>
            </div>
            <div class="text-sm text-gray-500 dark:text-gray-400">
              Démarré: {{ formatDate(currentExecution.startedAt) }}
            </div>
          </div>

          <!-- Étape courante -->
          <div v-if="currentExecution.currentStep">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Étape actuelle:</span>
            <span class="ml-2 text-sm text-gray-600 dark:text-gray-400">{{ currentExecution.currentStep }}</span>
          </div>

          <!-- Barre de progression -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Progression</span>
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ currentExecution.progress }}%</span>
            </div>
            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                class="bg-blue-600 h-2 rounded-full transition-all duration-300"
                :style="{ width: `${currentExecution.progress}%` }"
              ></div>
            </div>
          </div>
        </div>
      </Card>

      <!-- Tabs pour logs et données -->
      <Card>
        <div class="border-b border-gray-200 dark:border-gray-700">
          <nav class="flex -mb-px">
            <button
              @click="activeTab = 'logs'"
              :class="[
                'py-4 px-6 text-sm font-medium border-b-2 transition-colors',
                activeTab === 'logs'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              ]"
            >
              Logs
              <span v-if="currentLogs.length > 0" class="ml-2 px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded-full text-xs">
                {{ currentLogs.length }}
              </span>
            </button>
            <button
              @click="activeTab = 'data'"
              :class="[
                'py-4 px-6 text-sm font-medium border-b-2 transition-colors',
                activeTab === 'data'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              ]"
            >
              Données extraites
              <span v-if="currentExecution && Object.keys(currentExecution.data).length > 0" class="ml-2 px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded-full text-xs">
                {{ Object.keys(currentExecution.data).length }}
              </span>
            </button>
          </nav>
        </div>

        <!-- Panneau Logs -->
        <div v-show="activeTab === 'logs'" class="p-6">
          <LogsPanel :logs="currentLogs" />
        </div>

        <!-- Panneau Données -->
        <div v-show="activeTab === 'data'" class="p-6">
          <DataPreview :data="currentExecution ? currentExecution.data : {}" />
        </div>
      </Card>

      <!-- Message si pas d'exécution -->
      <Card v-if="!currentExecution && !isStarting" class="mt-6">
        <div class="text-center py-12">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">Aucune exécution en cours</h3>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Cliquez sur "Démarrer" pour lancer l'exécution de cette tâche
          </p>
        </div>
      </Card>
    </div>
  </MainLayout>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { mapState, mapActions } from 'pinia';
import MainLayout from '@/components/layout/MainLayout.vue';
import Card from '@/components/common/Card.vue';
import LogsPanel from '@/components/execution/LogsPanel.vue';
import DataPreview from '@/components/execution/DataPreview.vue';
import { useExecutionStore } from '@/stores/execution';
import { useTasksStore } from '@/stores/tasks';
import { useNotificationStore } from '@/stores/notification';
import type { ExecutionStatus } from '@/types/websocket';

export default defineComponent({
  name: 'TaskRunView',

  components: {
    MainLayout,
    Card,
    LogsPanel,
    DataPreview
  },

  data() {
    return {
      taskId: this.$route.params.id as string,
      taskName: '',
      activeTab: 'logs' as 'logs' | 'data',
      isStarting: false,
      isStopping: false
    };
  },

  computed: {
    ...mapState(useExecutionStore, ['currentExecution', 'currentLogs', 'connected'])
  },

  async mounted() {
    // Initialiser WebSocket
    const executionStore = useExecutionStore();
    if (!executionStore.connected) {
      executionStore.initWebSocket();
    }

    // Charger les informations de la tâche
    await this.loadTask();

    // Essayer de charger la dernière exécution de cette tâche depuis la DB
    await this.loadLastExecution();
  },

  beforeUnmount() {
    // On ne ferme pas le WebSocket car d'autres vues pourraient l'utiliser
  },

  methods: {
    ...mapActions(useExecutionStore, ['startTask', 'stopTask', 'loadExecution']),

    async loadTask(): Promise<void> {
      try {
        const tasksStore = useTasksStore();
        await tasksStore.fetchTasks();
        const task = tasksStore.tasks.find(t => t.id === this.taskId);
        if (task) {
          this.taskName = task.name;
        }
      } catch (error: any) {
        console.error('Error loading task:', error);
      }
    },

    async loadLastExecution(): Promise<void> {
      try {
        // Charger la dernière exécution pour cette tâche
        const response = await fetch(`http://localhost:4000/api/executions?taskId=${this.taskId}&limit=1`);
        const result = await response.json();

        if (result.success && result.data && result.data.length > 0) {
          const lastExecution = result.data[0];
          // Charger les détails complets de cette exécution
          await this.loadExecution(lastExecution.id);
        }
      } catch (error: any) {
        console.error('Error loading last execution:', error);
        // Ne pas afficher d'erreur à l'utilisateur, c'est juste un chargement optionnel
      }
    },

    async startExecution(): Promise<void> {
      this.isStarting = true;
      const notificationStore = useNotificationStore();

      try {
        if (!this.connected) {
          throw new Error('WebSocket non connecté. Veuillez rafraîchir la page.');
        }

        await this.startTask(this.taskId);
        
        notificationStore.success('Exécution démarrée');
      } catch (error: any) {
        console.error('Error starting execution:', error);
        notificationStore.error(`Erreur: ${error.message}`);
      } finally {
        this.isStarting = false;
      }
    },

    async stopExecution(): Promise<void> {
      if (!this.currentExecution) return;

      this.isStopping = true;
      const notificationStore = useNotificationStore();

      try {
        await this.stopTask(this.currentExecution.id);
        
        notificationStore.warning('Exécution arrêtée');
      } catch (error: any) {
        console.error('Error stopping execution:', error);
        notificationStore.error(`Erreur: ${error.message}`);
      } finally {
        this.isStopping = false;
      }
    },

    goBack(): void {
      this.$router.push('/');
    },

    getStatusClass(status: ExecutionStatus): string {
      const classes: Record<ExecutionStatus, string> = {
        pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        running: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
        completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
        cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
      };
      return classes[status] || classes.pending;
    },

    getStatusText(status: ExecutionStatus): string {
      const texts: Record<ExecutionStatus, string> = {
        pending: 'En attente',
        running: 'En cours',
        completed: 'Terminé',
        failed: 'Échoué',
        cancelled: 'Annulé'
      };
      return texts[status] || status;
    },

    formatDate(dateString: string): string {
      const date = new Date(dateString);
      return date.toLocaleString('fr-FR');
    }
  }
});
</script>
