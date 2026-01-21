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
          {{ isEditMode ? 'Éditer la tâche' : 'Nouvelle tâche' }}
        </h2>
      </div>

      <Card>
        <div class="space-y-6">
          <div class="text-center py-12">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">Éditeur en développement</h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              L'éditeur de workflow visuel sera disponible dans la Phase 3
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
  name: 'TaskEditorView',

  components: {
    MainLayout,
    Card
  },

  computed: {
    isEditMode(): boolean {
      return this.$route.params.id !== undefined && this.$route.params.id !== 'new';
    }
  },

  methods: {
    goBack(): void {
      this.$router.push('/');
    }
  }
});
</script>
