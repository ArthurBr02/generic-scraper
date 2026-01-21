<template>
  <div class="block-config-panel h-full flex flex-col bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700">
    <!-- Header -->
    <div class="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700">
      <div v-if="selectedBlock">
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ blockDefinition?.name || 'Configuration' }}
          </h3>
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
        </div>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          {{ blockDefinition?.description || '' }}
        </p>
        <div class="mt-2 flex items-center gap-2">
          <span
            class="inline-flex items-center px-2 py-1 text-xs font-medium rounded"
            :style="{ 
              backgroundColor: blockDefinition?.color + '20', 
              color: blockDefinition?.color 
            }"
          >
            {{ blockDefinition?.category }}
          </span>
          <span class="text-xs text-gray-400">
            ID: {{ selectedBlock.id }}
          </span>
        </div>
      </div>
      <div v-else class="text-center text-gray-500 dark:text-gray-400">
        <p class="text-sm">Aucun bloc sélectionné</p>
        <p class="text-xs mt-1">Cliquez sur un bloc pour le configurer</p>
      </div>
    </div>

    <!-- Form -->
    <div v-if="selectedBlock && blockDefinition" class="flex-1 overflow-y-auto p-4">
      <!-- Nom du bloc (toujours affiché en premier) -->
      <div class="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Nom du bloc
        </label>
        <input
          v-model="blockLabel"
          type="text"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Nom du bloc"
          @input="updateBlockLabel"
        />
      </div>

      <!-- Debug info -->
      <div v-if="!blockDefinition.configSchema || !blockDefinition.configSchema.fields" class="text-red-500 text-sm mb-4">
        ⚠️ Aucun schéma de configuration disponible pour ce bloc
      </div>
      <div v-else-if="blockDefinition.configSchema.fields.length === 0" class="text-yellow-500 text-sm mb-4">
        ⚠️ Ce bloc n'a aucun champ de configuration
      </div>
      
      <form @submit.prevent="saveConfig">
        <div class="space-y-4">
          <component
            v-for="field in blockDefinition.configSchema.fields"
            :key="field.key"
            :is="getFieldComponent(field.type)"
            :field="field"
            :model-value="getFieldValue(field.key)"
            @update:model-value="updateFieldValue(field.key, $event)"
            :error="errors[field.key]"
          />
        </div>
      </form>
    </div>
    
    <!-- Message si pas de bloc sélectionné ou pas de définition trouvée -->
    <div v-else-if="selectedBlock && !blockDefinition" class="flex-1 p-4 text-center text-gray-500">
      <p class="text-sm">⚠️ Définition du bloc introuvable</p>
      <p class="text-xs mt-2">Type: {{ selectedBlock.data?.type || selectedBlock.type }}</p>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { mapState, mapActions } from 'pinia';
import { useWorkflowStore } from '@/stores/workflow';
import { useBlocksStore } from '@/stores/blocks';
import type { BlockInstance, BlockDefinition, ConfigField } from '@/types/blocks';

// Import des composants de champs
import TextField from '@/components/form/TextField.vue';
import TextareaField from '@/components/form/TextareaField.vue';
import NumberField from '@/components/form/NumberField.vue';
import SelectField from '@/components/form/SelectField.vue';
import CheckboxField from '@/components/form/CheckboxField.vue';
import CodeField from '@/components/form/CodeField.vue';
import KeyValueField from '@/components/form/KeyValueField.vue';
import ArrayField from '@/components/form/ArrayField.vue';

export default defineComponent({
  name: 'BlockConfigPanel',

  components: {
    TextField,
    TextareaField,
    NumberField,
    SelectField,
    CheckboxField,
    CodeField,
    KeyValueField,
    ArrayField
  },

  data() {
    return {
      localConfig: {} as Record<string, any>,
      errors: {} as Record<string, string>,
      blockLabel: ''
    };
  },

  computed: {
    ...mapState(useWorkflowStore, ['selectedNodes']),

    blockDefinitions() {
      const blocksStore = useBlocksStore();
      return blocksStore.blocks;
    },

    selectedBlock(): BlockInstance | null {
      const workflowStore = useWorkflowStore();
      if (!this.selectedNodes || this.selectedNodes.length === 0) {
        return null;
      }
      const selectedId = this.selectedNodes[0];
      const node = workflowStore.nodes.find(node => node.id === selectedId);
      
      console.log('Selected block:', {
        selectedId,
        node,
        allNodes: workflowStore.nodes
      });
      
      return node || null;
    },

    blockDefinition(): BlockDefinition | undefined {
      if (!this.selectedBlock) return undefined;
      
      const blockType = this.selectedBlock.data?.type || this.selectedBlock.type;
      console.log('Looking for block definition:', {
        blockType,
        selectedBlock: this.selectedBlock,
        availableTypes: this.blockDefinitions.map(d => d.type)
      });
      
      const definition = this.blockDefinitions.find(def => def.type === blockType);
      console.log('Found definition:', definition);
      
      return definition;
    },

    hasErrors(): boolean {
      return Object.keys(this.errors).length > 0;
    }
  },

  watch: {
    selectedBlock: {
      immediate: true,
      handler(newBlock: BlockInstance | null) {
        if (newBlock) {
          // Initialiser la configuration locale avec la config du bloc
          this.localConfig = { ...(newBlock.data?.config || {}) };
          this.blockLabel = newBlock.data?.label || '';
          this.errors = {};
          this.validateAllFields();
        } else {
          this.localConfig = {};
          this.blockLabel = '';
          this.errors = {};
        }
      }
    }
  },

  methods: {
    ...mapActions(useWorkflowStore, ['updateNodeConfig', 'deselectAllNodes']),

    getFieldComponent(type: string): string {
      const componentMap: Record<string, string> = {
        text: 'TextField',
        textarea: 'TextareaField',
        number: 'NumberField',
        select: 'SelectField',
        checkbox: 'CheckboxField',
        code: 'CodeField',
        keyvalue: 'KeyValueField',
        array: 'ArrayField'
      };
      return componentMap[type] || 'TextField';
    },

    getFieldValue(key: string): any {
      if (key in this.localConfig) {
        return this.localConfig[key];
      }
      // Retourner la valeur par défaut si définie
      const field = this.blockDefinition?.configSchema.fields.find(f => f.key === key);
      return field?.default ?? '';
    },

    updateFieldValue(key: string, value: any): void {
      this.localConfig[key] = value;
      this.validateField(key, value);
    },

    updateBlockLabel(): void {
      // Le label sera sauvegardé lors du saveConfig
    },

    validateField(key: string, value: any): void {
      const field = this.blockDefinition?.configSchema.fields.find(f => f.key === key);
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
      if (!this.blockDefinition) return;

      this.blockDefinition.configSchema.fields.forEach(field => {
        const value = this.getFieldValue(field.key);
        this.validateField(field.key, value);
      });
    },

    saveConfig(): void {
      this.validateAllFields();

      if (this.hasErrors) {
        return;
      }

      if (this.selectedBlock) {
        const workflowStore = useWorkflowStore();
        
        console.log('Saving block label:', this.blockLabel);
        console.log('Node ID:', this.selectedBlock.id);
        
        // Mettre à jour le label du bloc
        workflowStore.updateNodeData(this.selectedBlock.id, {
          label: this.blockLabel
        });

        // Mettre à jour la configuration
        this.updateNodeConfig({
          nodeId: this.selectedBlock.id,
          config: { ...this.localConfig }
        });
        
        console.log('Node after update:', workflowStore.nodes.find(n => n.id === this.selectedBlock.id));
      }
    },

    resetConfig(): void {
      if (this.selectedBlock && this.blockDefinition) {
        this.localConfig = { ...this.blockDefinition.defaultConfig };
        this.blockLabel = this.blockDefinition.name;
        this.errors = {};
        this.validateAllFields();
      }
    },

    closePanel(): void {
      this.deselectAllNodes();
    }
  }
});
</script>

<style scoped>
.block-config-panel {
  width: 320px;
  min-width: 320px;
  max-width: 400px;
}

@media (max-width: 768px) {
  .block-config-panel {
    width: 100%;
    max-width: 100%;
  }
}
</style>
