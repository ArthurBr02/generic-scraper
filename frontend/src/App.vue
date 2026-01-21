<template>
  <div id="app" class="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
    <div class="container mx-auto px-4 py-8">
      <div class="flex items-center justify-between mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
          Generic Scraper V2
        </h1>
        
        <Button @click="toggleTheme" variant="ghost">
          <svg
            v-if="isDark"
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"
            />
          </svg>
          <svg
            v-else
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
              clip-rule="evenodd"
            />
          </svg>
        </Button>
      </div>

      <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card title="Composants Premium" hoverable>
          <p class="text-slate-600 dark:text-slate-400 mb-6 text-sm leading-relaxed">
            Un système de design robuste avec une palette de couleurs sophistiquée inspirée des outils modernes comme Linear.
          </p>
          <div class="flex flex-wrap gap-3">
            <Button variant="primary" size="sm">Primary</Button>
            <Button variant="secondary" size="sm">Secondary</Button>
            <Button variant="outline" size="sm">Outline</Button>
          </div>
        </Card>

        <Card title="Thème Dynamique" hoverable>
          <p class="text-slate-600 dark:text-slate-400 mb-6 text-sm leading-relaxed">
            Support complet du mode sombre et clair avec des transitions fluides et une harmonie visuelle parfaite.
          </p>
          <div class="flex flex-wrap gap-2">
            <span class="badge badge-primary">Intelligence</span>
            <span class="badge badge-success">Optimisé</span>
            <span class="badge badge-warning">Attention</span>
          </div>
        </Card>

        <Card title="Sprint 1 : Setup" hoverable>
          <p class="text-slate-600 dark:text-slate-400 mb-6 text-sm leading-relaxed">
            Infrastructure de base complétée avec Vue 3, TypeScript, Tailwind CSS et Pinia.
          </p>
          <div class="flex flex-wrap gap-2">
            <span class="badge badge-gray">Vue 3.4+</span>
            <span class="badge badge-gray">TS 5.x</span>
            <span class="badge badge-gray">Tailwind 3.4</span>
          </div>
        </Card>
      </div>

      <div class="mt-12">
        <Card title="Démonstration Interactive" variant="elevated">
          <div class="max-w-2xl space-y-6">
            <div class="space-y-4">
              <Input
                v-model="testInput"
                label="Nom de votre Workflow"
                placeholder="Ex: Extraction de prix Amazon"
                hint="Choisissez un nom descriptif pour votre tâche de scraping."
              />
            </div>
            
            <div class="flex gap-4">
              <Button @click="showModal = true" variant="primary" icon="svg-plus">
                Créer un Workflow
              </Button>
              <Button variant="ghost">En savoir plus</Button>
            </div>
          </div>
        </Card>
      </div>
    </div>

    <Modal v-model="showModal" title="Nouveau Workflow" size="lg">
      <div class="py-2">
        <p class="text-slate-600 dark:text-slate-400 leading-relaxed">
          Commencez par configurer les paramètres de base de votre workflow. Vous pourrez ensuite ajouter des blocs d'actions par drag & drop dans l'éditeur visuel.
        </p>
        
        <div class="mt-8 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
          <p class="text-xs font-mono text-slate-500 dark:text-slate-500 italic">
            // Astuce : Utilisez le bloc "Navigation" pour démarrer sur une URL spécifique.
          </p>
        </div>
      </div>
      
      <template #footer>
        <Button @click="showModal = false" variant="ghost">Annuler</Button>
        <Button @click="showModal = false" variant="primary">Initier le Workflow</Button>
      </template>
    </Modal>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { mapState, mapActions } from 'pinia';
import { useThemeStore } from './stores/theme';
import Button from './components/common/Button.vue';
import Card from './components/common/Card.vue';
import Input from './components/common/Input.vue';
import Modal from './components/common/Modal.vue';

export default defineComponent({
  name: 'App',

  components: {
    Button,
    Card,
    Input,
    Modal,
  },

  data() {
    return {
      testInput: '',
      showModal: false,
    };
  },

  computed: {
    ...mapState(useThemeStore, ['isDark']),
  },

  methods: {
    ...mapActions(useThemeStore, ['toggleTheme']),
  },
});
</script>
