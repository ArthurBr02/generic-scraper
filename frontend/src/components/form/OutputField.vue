<template>
  <div class="form-field">
    <label :for="fieldId" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
      {{ field.label }}
      <span v-if="field.required" class="text-red-500">*</span>
    </label>
    
    <!-- Menu déroulant pour choisir le mode de sauvegarde -->
    <select
      :id="fieldId + '-mode'"
      :value="mode"
      @change="handleModeChange"
      class="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
      :class="[
        error 
          ? 'border-red-500 dark:border-red-500 bg-red-50 dark:bg-red-900/20' 
          : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
      ]"
    >
      <option value="">Rien (pas de sauvegarde)</option>
      <option value="saveAs">Sauvegarder (usage interne)</option>
      <option value="output">Exporter (dans le fichier final)</option>
    </select>
    
    <!-- Champ texte pour le nom de la variable (affiché si mode != '') -->
    <input
      v-if="mode !== ''"
      :id="fieldId + '-value'"
      type="text"
      :value="variableName"
      @input="handleVariableNameChange"
      :placeholder="getPlaceholder()"
      :required="mode !== ''"
      class="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      :class="[
        error 
          ? 'border-red-500 dark:border-red-500 bg-red-50 dark:bg-red-900/20' 
          : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
      ]"
    />
    
    <p v-if="field.description" class="mt-1 text-xs text-gray-500 dark:text-gray-400">
      {{ field.description }}
    </p>
    <p v-if="error" class="mt-1 text-xs text-red-600 dark:text-red-400">
      {{ error }}
    </p>
    
    <!-- Aide contextuelle -->
    <div v-if="mode !== ''" class="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded text-xs">
      <p class="text-blue-700 dark:text-blue-300">
        <strong v-if="mode === 'saveAs'">💾 Sauvegarde interne :</strong>
        <strong v-else>📤 Export :</strong>
        <span v-if="mode === 'saveAs'"> Les données seront stockées dans <code class="bg-blue-100 dark:bg-blue-800 px-1 rounded">workflow.data.{{ variableName || 'variableName' }}</code> pour réutilisation dans les étapes suivantes, mais ne seront PAS exportées dans le fichier final.</span>
        <span v-else> Les données seront stockées dans <code class="bg-blue-100 dark:bg-blue-800 px-1 rounded">workflow.data.{{ variableName || 'variableName' }}</code> ET exportées dans le fichier de sortie (JSON/CSV).</span>
      </p>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import type { ConfigField } from '@/types/blocks';

export default defineComponent({
  name: 'OutputField',

  props: {
    field: {
      type: Object as PropType<ConfigField>,
      required: true
    },
    modelValue: {
      type: Object as PropType<{ mode: string; value: string }>,
      default: () => ({ mode: '', value: '' })
    },
    error: {
      type: String,
      default: ''
    }
  },

  emits: ['update:modelValue'],

  computed: {
    fieldId(): string {
      return `field-${this.field.key}`;
    },

    mode(): string {
      if (typeof this.modelValue === 'string') {
        // Rétrocompatibilité: si c'est une string, détecter le mode depuis le field.key
        return '';
      }
      return this.modelValue?.mode || '';
    },

    variableName(): string {
      if (typeof this.modelValue === 'string') {
        return this.modelValue;
      }
      return this.modelValue?.value || '';
    }
  },

  methods: {
    handleModeChange(event: Event): void {
      const target = event.target as HTMLSelectElement;
      const newMode = target.value;
      
      this.$emit('update:modelValue', {
        mode: newMode,
        value: newMode === '' ? '' : this.variableName
      });
    },

    handleVariableNameChange(event: Event): void {
      const target = event.target as HTMLInputElement;
      
      this.$emit('update:modelValue', {
        mode: this.mode,
        value: target.value
      });
    },

    getPlaceholder(): string {
      if (this.mode === 'saveAs') {
        return 'urls, productIds, tokens...';
      } else if (this.mode === 'output') {
        return 'products, articles, results...';
      }
      return '';
    }
  }
});
</script>

<style scoped>
.form-field {
  margin-bottom: 0;
}

code {
  font-family: 'Courier New', monospace;
  font-size: 0.9em;
}
</style>
