<template>
  <MainLayout>
    <div class="max-w-4xl mx-auto">
      <div class="mb-6">
        <button @click="goBack" class="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white flex items-center gap-1">
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Retour aux tâches
        </button>
        <h2 class="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
          Exécution de la tâche
        </h2>
      </div>

      <Card>
        <div class="space-y-6">
          <div class="text-center py-12">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">Vue d'exécution en développement</h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Le suivi en temps réel sera disponible dans la Phase 4
            </p>
          </div>
        </div>
      </Card>
    </div>
  </MainLayout>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import MainLayout from '@/components/layout/MainLayout.vue';
import Card from '@/components/common/Card.vue';

export default defineComponent({
  name: 'TaskRunView',

  components: {
    MainLayout,
    Card
  },

  methods: {
    goBack(): void {
      this.$router.push('/');
    }
  }
});
</script>
