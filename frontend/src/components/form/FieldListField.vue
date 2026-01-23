<template>
  <div class="field-list-wrapper">
    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
      {{ field.label }}
      <span v-if="field.required" class="text-red-500">*</span>
    </label>
    
    <p v-if="field.description" class="text-xs text-gray-500 dark:text-gray-400 mb-3">
      {{ field.description }}
    </p>

    <!-- Liste des champs -->
    <div v-if="fields.length > 0" class="space-y-3 mb-3">
      <div
        v-for="(fieldItem, index) in fields"
        :key="index"
        class="field-item p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700"
      >
        <div class="flex items-center justify-between mb-3">
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
            Champ {{ index + 1 }}
          </span>
          <button
            type="button"
            @click="removeField(index)"
            class="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            title="Supprimer ce champ"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Champs du sous-schéma -->
        <div class="space-y-2">
          <component
            v-for="subField in getVisibleFields(fieldItem)"
            :key="subField.key"
            :is="getFieldComponent(subField.type)"
            :field="subField"
            :model-value="fieldItem[subField.key]"
            @update:model-value="updateFieldItem(index, subField.key, $event)"
          />
        </div>
      </div>
    </div>

    <!-- Message si aucun champ -->
    <div v-else class="text-sm text-gray-500 dark:text-gray-400 text-center py-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
      Aucun champ configuré
    </div>

    <!-- Bouton d'ajout -->
    <button
      type="button"
      @click="addField"
      class="w-full px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 border border-blue-300 dark:border-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
    >
      <svg class="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
      Ajouter un champ
    </button>

    <!-- Message d'erreur -->
    <p v-if="error" class="mt-2 text-sm text-red-600 dark:text-red-400">
      {{ error }}
    </p>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import type { ConfigField } from '@/types/blocks';

// Import des composants de champs
import TextField from './TextField.vue';
import TextareaField from './TextareaField.vue';
import NumberField from './NumberField.vue';
import SelectField from './SelectField.vue';
import CheckboxField from './CheckboxField.vue';

export default defineComponent({
  name: 'FieldListField',

  components: {
    TextField,
    TextareaField,
    NumberField,
    SelectField,
    CheckboxField
  },

  props: {
    field: {
      type: Object as PropType<ConfigField>,
      required: true
    },
    modelValue: {
      type: Array as PropType<Record<string, any>[]>,
      default: () => []
    },
    error: {
      type: String,
      default: ''
    }
  },

  emits: ['update:modelValue'],

  data() {
    return {
      fields: [] as Record<string, any>[]
    };
  },

  watch: {
    modelValue: {
      immediate: true,
      handler(newValue: Record<string, any>[]) {
        this.fields = Array.isArray(newValue) ? [...newValue] : [];
      }
    }
  },

  methods: {
    getFieldComponent(type: string): string {
      const componentMap: Record<string, string> = {
        text: 'TextField',
        textarea: 'TextareaField',
        number: 'NumberField',
        select: 'SelectField',
        checkbox: 'CheckboxField'
      };
      return componentMap[type] || 'TextField';
    },

    /**
     * Filtre les champs visibles selon les conditions showIf
     */
    getVisibleFields(fieldItem: Record<string, any>): ConfigField[] {
      if (!this.field.itemSchema) return [];

      return this.field.itemSchema.filter(subField => {
        if (!subField.showIf) return true;

        const { key, value } = subField.showIf;
        return fieldItem[key] === value;
      });
    },

    /**
     * Ajoute un nouveau champ avec les valeurs par défaut
     */
    addField(): void {
      if (!this.field.itemSchema) return;

      const newField: Record<string, any> = {};
      
      // Initialiser avec les valeurs par défaut du schéma
      this.field.itemSchema.forEach(subField => {
        newField[subField.key] = subField.default ?? '';
      });

      this.fields.push(newField);
      this.$emit('update:modelValue', this.fields);
    },

    /**
     * Supprime un champ
     */
    removeField(index: number): void {
      this.fields.splice(index, 1);
      this.$emit('update:modelValue', this.fields);
    },

    /**
     * Met à jour une propriété d'un champ
     */
    updateFieldItem(index: number, key: string, value: any): void {
      this.fields[index][key] = value;
      this.$emit('update:modelValue', this.fields);
    }
  }
});
</script>

<style scoped>
.field-list-wrapper {
  @apply space-y-2;
}

.field-item {
  @apply transition-all;
}

.field-item:hover {
  @apply border-gray-400 dark:border-gray-500;
}
</style>
