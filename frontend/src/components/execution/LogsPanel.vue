<template>
  <div class="logs-panel">
    <!-- Contrôles -->
    <div class="mb-4 flex items-center justify-between gap-4">
      <!-- Filtres de niveau -->
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Filtrer:</span>
        <button
          v-for="level in logLevels"
          :key="level"
          @click="toggleLogLevel(level)"
          :class="[
            'px-3 py-1 rounded-md text-xs font-medium transition-colors',
            selectedLevels.includes(level)
              ? getLogLevelClass(level, true)
              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
          ]"
        >
          {{ level.toUpperCase() }}
        </button>
      </div>

      <!-- Recherche -->
      <div class="flex items-center gap-2 flex-1 max-w-md">
        <div class="relative flex-1">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Rechercher dans les logs..."
            class="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <svg class="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-2">
        <button
          @click="autoScroll = !autoScroll"
          :class="[
            'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
            autoScroll
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
          ]"
          title="Défilement automatique"
        >
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>
        <button
          @click="exportLogs"
          class="px-3 py-2 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-sm font-medium transition-colors"
          title="Exporter les logs"
        >
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </button>
        <button
          @click="clearLogs"
          class="px-3 py-2 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-sm font-medium transition-colors"
          title="Effacer les logs"
        >
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Zone de logs -->
    <div
      ref="logsContainer"
      class="logs-container bg-gray-50 dark:bg-gray-900 rounded-lg p-4 h-96 overflow-y-auto font-mono text-sm"
    >
      <div v-if="filteredLogs.length === 0" class="text-center text-gray-500 dark:text-gray-400 py-8">
        {{ logs.length === 0 ? 'Aucun log disponible' : 'Aucun log ne correspond aux filtres' }}
      </div>
      
      <div v-for="(log, index) in filteredLogs" :key="index" class="log-entry mb-2 flex items-start gap-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded p-2 transition-colors">
        <span class="text-gray-500 dark:text-gray-500 text-xs whitespace-nowrap">
          {{ formatTime(log.timestamp) }}
        </span>
        <span :class="getLogLevelClass(log.level)" class="px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap">
          {{ log.level.toUpperCase() }}
        </span>
        <span class="text-gray-900 dark:text-gray-100 flex-1">
          {{ log.message }}
        </span>
      </div>
    </div>

    <!-- Statistiques -->
    <div class="mt-4 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
      <div class="flex items-center gap-4">
        <span>Total: {{ logs.length }} logs</span>
        <span>Affichés: {{ filteredLogs.length }} logs</span>
      </div>
      <div v-if="searchQuery" class="text-blue-600 dark:text-blue-400">
        Recherche active: "{{ searchQuery }}"
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import type { LogEntry, LogLevel } from '@/types/websocket';

export default defineComponent({
  name: 'LogsPanel',

  props: {
    logs: {
      type: Array as PropType<LogEntry[]>,
      default: () => []
    }
  },

  data() {
    return {
      logLevels: ['info', 'warn', 'error', 'debug'] as LogLevel[],
      selectedLevels: ['info', 'warn', 'error', 'debug'] as LogLevel[],
      searchQuery: '',
      autoScroll: true
    };
  },

  computed: {
    filteredLogs(): LogEntry[] {
      let filtered = this.logs.filter(log => 
        this.selectedLevels.includes(log.level)
      );

      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        filtered = filtered.filter(log =>
          log.message.toLowerCase().includes(query)
        );
      }

      return filtered;
    }
  },

  watch: {
    logs: {
      handler() {
        if (this.autoScroll) {
          this.$nextTick(() => {
            this.scrollToBottom();
          });
        }
      },
      deep: true
    }
  },

  methods: {
    toggleLogLevel(level: LogLevel): void {
      const index = this.selectedLevels.indexOf(level);
      if (index > -1) {
        this.selectedLevels.splice(index, 1);
      } else {
        this.selectedLevels.push(level);
      }
    },

    getLogLevelClass(level: LogLevel, active: boolean = false): string {
      const classes: Record<LogLevel, string> = {
        info: active ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' : 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
        warn: active ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' : 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400',
        error: active ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400',
        debug: active ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' : 'bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
      };
      return classes[level] || classes.info;
    },

    formatTime(timestamp: string): string {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('fr-FR', { hour12: false });
    },

    scrollToBottom(): void {
      const container = this.$refs.logsContainer as HTMLElement;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    },

    exportLogs(): void {
      const content = this.filteredLogs
        .map(log => `[${log.timestamp}] [${log.level.toUpperCase()}] ${log.message}`)
        .join('\n');

      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `logs-${new Date().toISOString()}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },

    clearLogs(): void {
      if (confirm('Êtes-vous sûr de vouloir effacer tous les logs affichés ?')) {
        this.$emit('clear');
      }
    }
  }
});
</script>

<style scoped>
.logs-container::-webkit-scrollbar {
  width: 8px;
}

.logs-container::-webkit-scrollbar-track {
  @apply bg-gray-200 dark:bg-gray-800 rounded;
}

.logs-container::-webkit-scrollbar-thumb {
  @apply bg-gray-400 dark:bg-gray-600 rounded;
}

.logs-container::-webkit-scrollbar-thumb:hover {
  @apply bg-gray-500 dark:bg-gray-500;
}
</style>
