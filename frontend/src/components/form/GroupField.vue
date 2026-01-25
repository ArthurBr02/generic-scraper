<template>
  <div class="group-field mb-4">
    <button
      type="button"
      @click="toggleExpanded"
      class="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
    >
      <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
        {{ field.label }}
        <span v-if="field.required" class="text-red-500">*</span>
      </span>
      <svg
        class="w-5 h-5 text-gray-500 transition-transform"
        :class="{ 'rotate-180': isExpanded }"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <div v-show="isExpanded" class="mt-2 pl-4 border-l-2 border-gray-200 dark:border-gray-600 space-y-3">
      <component
        v-for="subField in visibleSubFields"
        :key="subField.key"
        :is="getFieldComponent(subField.type)"
        :field="subField"
        :model-value="getNestedValue(subField.key)"
        @update:model-value="updateNestedValue(subField.key, $event)"
        :error="error?.[getFieldKey(subField.key)]"
        :full-config="fullConfigWithCurrentGroup"
      />
    </div>

    <p v-if="field.help && isExpanded" class="mt-1 text-xs text-gray-500 dark:text-gray-400">
      {{ field.help }}
    </p>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import type { ConfigField } from '@/types/blocks';

// Import des composants de champs (à éviter les références circulaires)
import TextField from './TextField.vue';
import TextareaField from './TextareaField.vue';
import NumberField from './NumberField.vue';
import SelectField from './SelectField.vue';
import CheckboxField from './CheckboxField.vue';
import CodeField from './CodeField.vue';
import KeyValueField from './KeyValueField.vue';
import ArrayField from './ArrayField.vue';
import FieldListField from './FieldListField.vue';

export default defineComponent({
  name: 'GroupField',

  components: {
    TextField,
    TextareaField,
    NumberField,
    SelectField,
    CheckboxField,
    CodeField,
    KeyValueField,
    ArrayField,
    FieldListField
  },

  props: {
    field: {
      type: Object as PropType<ConfigField>,
      required: true
    },
    modelValue: {
      type: Object as PropType<Record<string, any>>,
      default: () => ({})
    },
    error: {
      type: [String, Object] as PropType<string | Record<string, string>>,
      default: ''
    },
    // Config complète pour les conditions showIf
    fullConfig: {
      type: Object as PropType<Record<string, any>>,
      default: () => ({})
    }
  },

  emits: ['update:model-value'],

  data() {
    return {
      isExpanded: false // Par défaut, les groupes sont repliés
    };
  },

  computed: {
    /**
     * Filtre les sous-champs selon les conditions showIf
     */
    visibleSubFields(): any[] {
      if (!this.field.fields) return [];

      return this.field.fields.filter(subField => {
        if (!subField.showIf) return true;

        // Si showIf est une fonction, lui passer la config complète
        if (typeof subField.showIf === 'function') {
          // Construire une config complète incluant les valeurs du groupe
          const fullConfig = {
            ...this.fullConfig,
            [this.field.key]: this.modelValue
          };
          return subField.showIf(fullConfig);
        }

        // Si showIf est un objet { key, value }
        if (typeof subField.showIf === 'object' && 'key' in subField.showIf) {
          const fullConfig = {
            ...this.fullConfig,
            [this.field.key]: this.modelValue
          };
          
          // Résoudre la clé dans la config complète
          const keys = subField.showIf.key.split('.');
          let value: any = fullConfig;
          for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
              value = value[k];
            } else {
              return false;
            }
          }
          
          return value === subField.showIf.value;
        }

        return true;
      });
    },

    /**
     * Config complète incluant les valeurs du groupe actuel
     */
    fullConfigWithCurrentGroup(): Record<string, any> {
      return {
        ...this.fullConfig,
        [this.field.key]: this.modelValue
      };
    }
  },

  methods: {
    toggleExpanded() {
      this.isExpanded = !this.isExpanded;
    },

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
        group: 'GroupField' // Support des groupes imbriqués
      };
      return componentMap[type] || 'TextField';
    },

    /**
     * Récupère la valeur d'un champ
     * Ex: pour un groupe 'browser' avec un champ 'browser.type',
     *     on cherche la valeur dans modelValue['type'] (sans le préfixe)
     */
    getNestedValue(key: string): any {
      // Le groupKey est la clé du groupe (ex: 'browser')
      const groupKey = this.field.key;
      
      // Si la clé du sous-champ commence par le groupKey, on l'enlève
      let fieldKey = key;
      if (key.startsWith(groupKey + '.')) {
        fieldKey = key.substring(groupKey.length + 1);
      }
      
      // Si c'est un groupe imbriqué (ex: 'browser.viewport')
      if (fieldKey.includes('.')) {
        const parts = fieldKey.split('.');
        let value: any = this.modelValue;
        
        for (const part of parts) {
          if (value && typeof value === 'object' && part in value) {
            value = value[part];
          } else {
            // Retourner la valeur par défaut si disponible
            const field = this.field.fields?.find(f => f.key === key);
            return field?.default ?? '';
          }
        }
        
        return value;
      }
      
      // Cas simple: chercher directement dans modelValue
      if (this.modelValue && fieldKey in this.modelValue) {
        return this.modelValue[fieldKey];
      }
      
      // Retourner la valeur par défaut si disponible
      const field = this.field.fields?.find(f => f.key === key);
      return field?.default ?? '';
    },

    /**
     * Met à jour une valeur
     * Ex: pour un groupe 'browser' avec un champ 'browser.type',
     *     on met à jour modelValue['type'] = value
     */
    updateNestedValue(key: string, value: any): void {
      const groupKey = this.field.key;
      
      // Si la clé du sous-champ commence par le groupKey, on l'enlève
      let fieldKey = key;
      if (key.startsWith(groupKey + '.')) {
        fieldKey = key.substring(groupKey.length + 1);
      }
      
      const newModelValue = { ...this.modelValue };
      
      // Si c'est un groupe imbriqué (ex: 'viewport.width')
      if (fieldKey.includes('.')) {
        const parts = fieldKey.split('.');
        let current: any = newModelValue;
        
        // Créer les objets intermédiaires si nécessaire
        for (let i = 0; i < parts.length - 1; i++) {
          const part = parts[i];
          if (!current[part] || typeof current[part] !== 'object') {
            current[part] = {};
          } else {
            current[part] = { ...current[part] };
          }
          current = current[part];
        }
        
        // Mettre à jour la valeur finale
        current[parts[parts.length - 1]] = value;
      } else {
        // Cas simple: mettre à jour directement
        newModelValue[fieldKey] = value;
      }

      this.$emit('update:model-value', newModelValue);
    },

    /**
     * Obtient la clé de champ pour les erreurs
     */
    getFieldKey(key: string): string {
      return key;
    }
  }
});
</script>

<style scoped>
.rotate-180 {
  transform: rotate(180deg);
}
</style>
