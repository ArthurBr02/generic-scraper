<template>
  <div class="data-preview">
    <div v-if="Object.keys(data).length === 0" class="text-center text-gray-500 dark:text-gray-400 py-8">
      <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
      <p class="mt-2">Aucune donnée extraite pour le moment</p>
    </div>

    <div v-else class="space-y-4">
      <!-- Contrôles -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <button
            @click="viewMode = 'json'"
            :class="[
              'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              viewMode === 'json'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            ]"
          >
            JSON
          </button>
          <button
            @click="viewMode = 'table'"
            :class="[
              'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              viewMode === 'table'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            ]"
          >
            Tableau
          </button>
        </div>

        <div class="flex items-center gap-2">
          <button
            @click="copyToClipboard"
            class="px-3 py-2 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-sm font-medium transition-colors flex items-center gap-2"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copier
          </button>
          <button
            @click="viewMode === 'table' ? downloadCSV() : downloadJSON()"
            class="px-3 py-2 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-sm font-medium transition-colors flex items-center gap-2"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Télécharger {{ viewMode === 'table' ? 'CSV' : 'JSON' }}
          </button>
        </div>
      </div>

      <!-- Vue JSON -->
      <div v-if="viewMode === 'json'" class="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 max-h-96 overflow-auto">
        <pre class="text-sm text-gray-900 dark:text-gray-100">{{ formattedJSON }}</pre>
      </div>

      <!-- Vue Tableau -->
      <div v-else-if="viewMode === 'table' && Array.isArray(dataArray)" class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th
                v-for="header in tableHeaders"
                :key="header"
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                {{ header }}
              </th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="(row, index) in dataArray.slice(0, 50)" :key="index">
              <td
                v-for="header in tableHeaders"
                :key="header"
                class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100"
              >
                {{ getCellValue(row, header) }}
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="dataArray.length > 50" class="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
          Affichage des 50 premiers éléments sur {{ dataArray.length }}
        </div>
      </div>

      <!-- Vue Tableau pour objet non-array -->
      <div v-else-if="viewMode === 'table'" class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Clé
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Valeur
              </th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="(value, key) in data" :key="key">
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                {{ key }}
              </td>
              <td class="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                {{ formatValue(value) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Statistiques -->
      <div class="mt-4 text-xs text-gray-500 dark:text-gray-400">
        {{ dataStats }}
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

export default defineComponent({
  name: 'DataPreview',

  props: {
    data: {
      type: Object as PropType<Record<string, any>>,
      default: () => ({})
    }
  },

  data() {
    return {
      viewMode: 'json' as 'json' | 'table'
    };
  },

  computed: {
    /**
     * Aplatit les données en enlevant la couche workflowId ("main", etc.)
     */
    flattenedData(): any {
      if (!this.data || Object.keys(this.data).length === 0) {
        return {};
      }

      // Si data contient des workflows (main, etc.), les aplatir
      const result: any = {};
      for (const [workflowKey, workflowValue] of Object.entries(this.data)) {
        if (typeof workflowValue === 'object' && !Array.isArray(workflowValue) && workflowValue !== null) {
          // C'est probablement un workflow, fusionner son contenu
          Object.assign(result, workflowValue);
        } else {
          // C'est une valeur directe, la garder
          result[workflowKey] = workflowValue;
        }
      }

      // Si le résultat n'a qu'une seule clé avec un tableau, retourner le tableau directement
      const keys = Object.keys(result);
      if (keys.length === 1 && Array.isArray(result[keys[0]])) {
        return result[keys[0]];
      }

      return result;
    },

    formattedJSON(): string {
      return JSON.stringify(this.flattenedData, null, 2);
    },

    dataArray(): any[] {
      // Si flattenedData est déjà un tableau
      if (Array.isArray(this.flattenedData)) {
        return this.flattenedData;
      }

      // Sinon, chercher un tableau dans flattenedData
      for (const key in this.flattenedData) {
        if (Array.isArray(this.flattenedData[key])) {
          return this.flattenedData[key];
        }
      }

      // Aucun tableau trouvé
      return [];
    },

    tableHeaders(): string[] {
      if (this.dataArray.length === 0) return [];
      
      // Collecter toutes les clés uniques
      const headers = new Set<string>();
      this.dataArray.forEach(item => {
        if (typeof item === 'object' && item !== null) {
          Object.keys(item).forEach(key => headers.add(key));
        }
      });
      
      return Array.from(headers);
    },

    dataStats(): string {
      if (Array.isArray(this.dataArray)) {
        return `${this.dataArray.length} éléments`;
      }
      const keys = Object.keys(this.data).length;
      return `${keys} propriété${keys > 1 ? 's' : ''}`;
    }
  },

  methods: {
    getCellValue(row: any, header: string): string {
      const value = row[header];
      return this.formatValue(value);
    },

    formatValue(value: any): string {
      if (value === null || value === undefined) {
        return '-';
      }
      if (typeof value === 'object') {
        return JSON.stringify(value);
      }
      return String(value);
    },

    async copyToClipboard(): Promise<void> {
      try {
        await navigator.clipboard.writeText(this.formattedJSON);
        this.$emit('copied');
        // TODO: Afficher une notification
      } catch (error) {
        console.error('Error copying to clipboard:', error);
      }
    },

    downloadJSON(): void {
      // Utiliser flattenedData pour l'export (sans la couche workflowId)
      const content = JSON.stringify(this.flattenedData, null, 2);
      const blob = new Blob([content], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `data-${new Date().toISOString()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },

    downloadCSV(): void {
      if (this.dataArray.length === 0) {
        console.warn('No data to export');
        return;
      }

      // Créer le header CSV
      const headers = this.tableHeaders;
      const csvRows: string[] = [];
      
      // Ajouter la ligne d'en-tête
      csvRows.push(headers.map(h => `"${h}"`).join(','));
      
      // Ajouter les lignes de données
      this.dataArray.forEach(row => {
        const values = headers.map(header => {
          const value = row[header];
          if (value === null || value === undefined) return '';
          if (typeof value === 'object') return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
          return `"${String(value).replace(/"/g, '""')}"`;
        });
        csvRows.push(values.join(','));
      });
      
      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `data-${new Date().toISOString()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }
});
</script>

<style scoped>
pre {
  @apply font-mono;
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>
