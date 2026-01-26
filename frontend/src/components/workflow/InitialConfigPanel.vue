<template>
  <div class="initial-config-panel h-full flex flex-col bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700">
    <!-- Header -->
    <div class="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700">
      <div class="flex items-center justify-between mb-2">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          Configuration Initiale
        </h3>
        <div class="flex gap-2">
          <button
            @click="saveConfig"
            class="p-1.5 text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
            :disabled="hasErrors"
            title="Sauvegarder"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
          </button>
          <button
            @click="closePanel"
            class="p-1.5 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 rounded transition-colors"
            title="Fermer"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      <p class="text-sm text-gray-500 dark:text-gray-400">
        Configuration globale du scraper
      </p>
      <div class="mt-2">
        <span
          class="inline-flex items-center px-2 py-1 text-xs font-medium rounded"
          style="background-color: #06B6D420; color: #06B6D4"
        >
          config
        </span>
      </div>
    </div>

    <!-- Form -->
    <div class="flex-1 overflow-y-auto p-4">
      <form @submit.prevent="saveConfig">
        <div class="space-y-4">
          <component
            v-for="field in visibleFields"
            :key="field.key"
            :is="getFieldComponent(field.type)"
            :field="field"
            :model-value="getFieldValue(field.key)"
            @update:model-value="updateFieldValue(field.key, $event)"
            :error="errors[field.key]"
            :full-config="localConfig"
          />
        </div>
      </form>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { mapState, mapActions } from 'pinia';
import { useWorkflowStore } from '@/stores/workflow';
import { blockDefinitions } from '@/config/blocks.config';
import type { BlockDefinition, ConfigField } from '@/types/blocks';

// Import des composants de champs
import TextField from '@/components/form/TextField.vue';
import TextareaField from '@/components/form/TextareaField.vue';
import NumberField from '@/components/form/NumberField.vue';
import SelectField from '@/components/form/SelectField.vue';
import CheckboxField from '@/components/form/CheckboxField.vue';
import CodeField from '@/components/form/CodeField.vue';
import KeyValueField from '@/components/form/KeyValueField.vue';
import ArrayField from '@/components/form/ArrayField.vue';
import FieldListField from '@/components/form/FieldListField.vue';
import GroupField from '@/components/form/GroupField.vue';

export default defineComponent({
  name: 'InitialConfigPanel',

  components: {
    TextField,
    TextareaField,
    NumberField,
    SelectField,
    CheckboxField,
    CodeField,
    KeyValueField,
    ArrayField,
    FieldListField,
    GroupField
  },

  data() {
    return {
      localConfig: {} as Record<string, any>,
      errors: {} as Record<string, string>
    };
  },

  computed: {
    ...mapState(useWorkflowStore, ['initialConfig']),

    // Récupérer la définition du bloc Init directement depuis la config
    initBlockDefinition(): BlockDefinition | undefined {
      return blockDefinitions.find(def => def.type === 'init');
    },

    /**
     * Champs visibles selon les conditions showIf
     */
    visibleFields(): ConfigField[] {
      if (!this.initBlockDefinition?.configSchema?.fields) return [];

      return this.initBlockDefinition.configSchema.fields.filter(field => {
        if (!field.showIf) return true;

        // Si showIf est une fonction
        if (typeof field.showIf === 'function') {
          return field.showIf(this.localConfig);
        }

        // Si showIf est un objet { key, value }
        if (typeof field.showIf === 'object' && 'key' in field.showIf) {
          return this.localConfig[field.showIf.key] === field.showIf.value;
        }

        return true;
      });
    },

    hasErrors(): boolean {
      return Object.keys(this.errors).length > 0;
    }
  },

  watch: {
    initialConfig: {
      immediate: true,
      deep: true,
      handler(newConfig) {
        // Initialiser la configuration locale avec la config du store
        this.localConfig = JSON.parse(JSON.stringify(newConfig || {}));
        this.errors = {};
        this.validateAllFields();
      }
    },

    // Surveiller les changements de config pour mettre à jour les champs visibles
    localConfig: {
      deep: true,
      handler() {
        // Force le recalcul de visibleFields
        this.$forceUpdate();
      }
    }
  },

  methods: {
    ...mapActions(useWorkflowStore, ['updateInitialConfig', 'closeInitialConfigPanel']),

    getFieldComponent(type: string): string {
      const componentMap: Record<string, string> = {
        text: 'TextField',
        textarea: 'TextareaField',
        number: 'NumberField',
        select: 'SelectField',
        checkbox: 'CheckboxField',
        code: 'CodeField',
        keyvalue: 'KeyValueField',
        array: 'ArrayField',
        fieldList: 'FieldListField',
        group: 'GroupField'
      };
      return componentMap[type] || 'TextField';
    },

    getFieldValue(key: string): any {
      // Pour les groupes, retourner l'objet complet
      const field = this.initBlockDefinition?.configSchema.fields.find(f => f.key === key);
      if (field?.type === 'group') {
        return this.localConfig[key] || {};
      }

      // Pour les champs normaux avec clé imbriquée (ex: 'browser.type')
      if (key.includes('.')) {
        const parts = key.split('.');
        let value: any = this.localConfig;
        
        for (const part of parts) {
          if (value && typeof value === 'object' && part in value) {
            value = value[part];
          } else {
            // Retourner la valeur par défaut si définie
            return field?.default ?? '';
          }
        }
        
        return value;
      }

      // Pour les champs simples
      if (key in this.localConfig) {
        return this.localConfig[key];
      }
      
      // Retourner la valeur par défaut si définie
      return field?.default ?? '';
    },

    updateFieldValue(key: string, value: any): void {
      const field = this.initBlockDefinition?.configSchema.fields.find(f => f.key === key);
      
      // Pour les groupes, mettre à jour l'objet complet
      if (field?.type === 'group') {
        this.localConfig[key] = value;
      } else if (key.includes('.')) {
        // Pour les champs imbriqués
        const parts = key.split('.');
        let current: any = this.localConfig;

        // Créer les objets intermédiaires si nécessaire
        for (let i = 0; i < parts.length - 1; i++) {
          const part = parts[i];
          if (!current[part] || typeof current[part] !== 'object') {
            current[part] = {};
          }
          current = current[part];
        }

        // Mettre à jour la valeur finale
        current[parts[parts.length - 1]] = value;
      } else {
        // Pour les champs simples
        this.localConfig[key] = value;
      }
      
      this.validateField(key, value);
    },

    validateField(key: string, value: any): void {
      const field = this.initBlockDefinition?.configSchema.fields.find(f => f.key === key);
      if (!field) return;

      // Effacer l'erreur existante
      delete this.errors[key];

      // Validation required
      if (field.required && (value === '' || value === null || value === undefined)) {
        this.errors[key] = 'Ce champ est requis';
        return;
      }

      // Validation de règles spécifiques
      if (field.validation) {
        const validation = field.validation;

        // Pattern (regex)
        if (validation.pattern && typeof value === 'string') {
          const regex = new RegExp(validation.pattern);
          if (!regex.test(value)) {
            this.errors[key] = 'Format invalide';
            return;
          }
        }

        // Min/Max pour les nombres
        if (typeof value === 'number') {
          if (validation.min !== undefined && value < validation.min) {
            this.errors[key] = `La valeur doit être supérieure ou égale à ${validation.min}`;
            return;
          }
          if (validation.max !== undefined && value > validation.max) {
            this.errors[key] = `La valeur doit être inférieure ou égale à ${validation.max}`;
            return;
          }
        }

        // MinLength/MaxLength pour les chaînes
        if (typeof value === 'string') {
          if (validation.minLength !== undefined && value.length < validation.minLength) {
            this.errors[key] = `La longueur minimale est ${validation.minLength}`;
            return;
          }
          if (validation.maxLength !== undefined && value.length > validation.maxLength) {
            this.errors[key] = `La longueur maximale est ${validation.maxLength}`;
            return;
          }
        }

        // Validation personnalisée
        if (validation.custom) {
          const result = validation.custom(value);
          if (result !== true) {
            this.errors[key] = typeof result === 'string' ? result : 'Valeur invalide';
            return;
          }
        }
      }

      // Forcer la réactivité
      this.errors = { ...this.errors };
    },

    validateAllFields(): void {
      if (!this.initBlockDefinition) return;

      this.initBlockDefinition.configSchema.fields.forEach(field => {
        const value = this.getFieldValue(field.key);
        this.validateField(field.key, value);
      });
    },

    saveConfig(): void {
      this.validateAllFields();

      if (this.hasErrors) {
        return;
      }

      // Mettre à jour la configuration initiale dans le store
      this.updateInitialConfig(this.localConfig);
      
      // Fermer le panneau après sauvegarde
      this.closeInitialConfigPanel();
    },

    resetConfig(): void {
      if (this.initBlockDefinition) {
        this.localConfig = { ...this.initBlockDefinition.defaultConfig };
        this.errors = {};
        this.validateAllFields();
      }
    },

    closePanel(): void {
      this.closeInitialConfigPanel();
    }
  }
});
</script>

<style scoped>
.initial-config-panel {
  width: 320px;
  min-width: 320px;
  max-width: 400px;
}

@media (max-width: 768px) {
  .initial-config-panel {
    width: 100%;
    max-width: 100%;
  }
}
</style>
