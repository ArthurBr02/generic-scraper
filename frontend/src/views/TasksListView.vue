<template>
  <MainLayout>
    <div class="space-y-6">
      <!-- En-tête -->
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Tâches de scraping</h2>
          <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Gérez vos workflows de scraping
          </p>
        </div>
        <Button variant="primary" @click="createTask">
          <svg class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Nouvelle tâche
        </Button>
      </div>

      <!-- Barre de recherche et filtres -->
      <div class="flex items-center gap-4">
        <div class="flex-1">
          <Input
            v-model="searchQuery"
            placeholder="Rechercher une tâche..."
            icon-left
          >
            <template #icon-left>
              <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </template>
          </Input>
        </div>
        <Select
          v-model="filterStatus"
          :options="statusOptions"
          placeholder="Tous les statuts"
          class="w-48"
        />
      </div>

      <!-- Liste des tâches -->
      <div v-if="loading" class="flex items-center justify-center py-12">
        <Spinner size="lg">Chargement des tâches...</Spinner>
      </div>

      <div v-else-if="error" class="text-center py-12">
        <p class="text-red-600 dark:text-red-400">{{ error }}</p>
        <Button variant="secondary" @click="loadTasks" class="mt-4">
          Réessayer
        </Button>
      </div>

      <div v-else-if="filteredTasks.length === 0" class="text-center py-12">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">Aucune tâche</h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Commencez par créer une nouvelle tâche de scraping.
        </p>
        <div class="mt-6">
          <Button variant="primary" @click="createTask">
            <svg class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Nouvelle tâche
          </Button>
        </div>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card
          v-for="task in filteredTasks"
          :key="task.id"
          class="hover:shadow-lg transition-shadow duration-200 cursor-pointer"
          @click="editTask(task.id)"
        >
          <div class="space-y-3">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <h3 class="font-semibold text-gray-900 dark:text-white">{{ task.name }}</h3>
                <p v-if="task.description" class="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {{ task.description }}
                </p>
              </div>
              <Badge v-if="task.lastRunStatus" :variant="getStatusVariant(task.lastRunStatus)" :dot="true">
                {{ getStatusLabel(task.lastRunStatus) }}
              </Badge>
            </div>

            <div class="flex items-center text-xs text-gray-500 dark:text-gray-400">
              <svg class="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span v-if="task.lastRunAt">
                Dernière exécution : {{ formatDate(task.lastRunAt) }}
              </span>
              <span v-else>Jamais exécutée</span>
            </div>

            <div class="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="primary"
                size="sm"
                @click.stop="runTask(task.id)"
                :loading="runningTasks.includes(task.id)"
              >
                <svg class="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Lancer
              </Button>
              <IconButton
                variant="ghost"
                size="sm"
                @click.stop="duplicateTask(task.id)"
              >
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </IconButton>
              <IconButton
                variant="ghost"
                size="sm"
                @click.stop="deleteTask(task.id)"
              >
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </IconButton>
            </div>
          </div>
        </Card>
      </div>
    </div>
  </MainLayout>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { mapState, mapActions } from 'pinia';
import { useTasksStore } from '@/stores/tasks';
import { useNotificationStore } from '@/stores/notification';
import MainLayout from '@/components/layout/MainLayout.vue';
import Button from '@/components/common/Button.vue';
import Input from '@/components/common/Input.vue';
import Select from '@/components/common/Select.vue';
import Card from '@/components/common/Card.vue';
import Badge from '@/components/common/Badge.vue';
import Spinner from '@/components/common/Spinner.vue';
import IconButton from '@/components/common/IconButton.vue';

export default defineComponent({
  name: 'TasksListView',

  components: {
    MainLayout,
    Button,
    Input,
    Select,
    Card,
    Badge,
    Spinner,
    IconButton
  },

  data() {
    return {
      searchQuery: '',
      filterStatus: '',
      runningTasks: [] as string[],
      statusOptions: [
        { value: '', label: 'Tous les statuts' },
        { value: 'success', label: 'Succès' },
        { value: 'error', label: 'Erreur' },
        { value: 'running', label: 'En cours' }
      ]
    };
  },

  computed: {
    ...mapState(useTasksStore, ['tasks', 'loading', 'error']),

    filteredTasks(): any[] {
      let filtered = [...this.tasks];

      // Filtre par recherche
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        filtered = filtered.filter(task =>
          task.name.toLowerCase().includes(query) ||
          (task.description && task.description.toLowerCase().includes(query))
        );
      }

      // Filtre par statut
      if (this.filterStatus) {
        filtered = filtered.filter(task => task.lastRunStatus === this.filterStatus);
      }

      return filtered;
    }
  },

  methods: {
    ...mapActions(useTasksStore, ['fetchTasks', 'deleteTask as deleteTaskAction']),
    ...mapActions(useNotificationStore, ['success', 'error']),

    async loadTasks(): Promise<void> {
      await this.fetchTasks();
    },

    createTask(): void {
      this.$router.push('/task/new');
    },

    editTask(id: string): void {
      this.$router.push(`/task/${id}`);
    },

    async runTask(id: string): Promise<void> {
      this.runningTasks.push(id);
      try {
        // TODO: Implémenter l'exécution de la tâche
        this.success('Tâche lancée avec succès');
      } catch (err: any) {
        this.error(err.message || 'Erreur lors du lancement de la tâche');
      } finally {
        this.runningTasks = this.runningTasks.filter(tid => tid !== id);
      }
    },

    async duplicateTask(id: string): Promise<void> {
      try {
        // TODO: Implémenter la duplication
        this.success('Tâche dupliquée avec succès');
        await this.loadTasks();
      } catch (err: any) {
        this.error(err.message || 'Erreur lors de la duplication');
      }
    },

    async deleteTask(id: string): Promise<void> {
      if (confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
        try {
          await this.deleteTaskAction(id);
          this.success('Tâche supprimée avec succès');
        } catch (err: any) {
          this.error(err.message || 'Erreur lors de la suppression');
        }
      }
    },

    getStatusVariant(status: string): 'success' | 'danger' | 'warning' | 'default' {
      switch (status) {
        case 'success':
          return 'success';
        case 'error':
          return 'danger';
        case 'running':
          return 'warning';
        default:
          return 'default';
      }
    },

    getStatusLabel(status: string): string {
      switch (status) {
        case 'success':
          return 'Succès';
        case 'error':
          return 'Erreur';
        case 'running':
          return 'En cours';
        default:
          return status;
      }
    },

    formatDate(date: string): string {
      return new Date(date).toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  },

  mounted() {
    this.loadTasks();
  }
});
</script>
