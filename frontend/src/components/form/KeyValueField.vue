<template>
  <div class="form-field">
    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
      {{ field.label }}
      <span v-if="field.required" class="text-red-500">*</span>
    </label>
    <div class="space-y-2">
      <div
        v-for="(item, index) in pairs"
        :key="index"
        class="flex gap-2"
      >
        <input
          type="text"
          v-model="pairs[index].key"
          @input="updateValue"
          placeholder="Clé"
          class="flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          :class="[
            error 
              ? 'border-red-500 dark:border-red-500 bg-red-50 dark:bg-red-900/20' 
              : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
          ]"
        />
        <input
          type="text"
          v-model="pairs[index].value"
          @input="updateValue"
          placeholder="Valeur"
          class="flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          :class="[
            error 
              ? 'border-red-500 dark:border-red-500 bg-red-50 dark:bg-red-900/20' 
              : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
          ]"
        />
        <button
          type="button"
          @click="removePair(index)"
          class="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
      <button
        type="button"
        @click="addPair"
        class="w-full px-3 py-2 text-sm text-blue-600 dark:text-blue-400 border border-blue-600 dark:border-blue-400 border-dashed rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
      >
        + Ajouter une paire
      </button>
    </div>
    <p v-if="field.description" class="mt-1 text-xs text-gray-500 dark:text-gray-400">
      {{ field.description }}
    </p>
    <p v-if="error" class="mt-1 text-xs text-red-600 dark:text-red-400">
      {{ error }}
    </p>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import type { ConfigField } from '@/types/blocks';

interface KeyValuePair {
  key: string;
  value: string;
}

export default defineComponent({
  name: 'KeyValueField',

  props: {
    field: {
      type: Object as PropType<ConfigField>,
      required: true
    },
    modelValue: {
      type: Object as PropType<Record<string, string>>,
      default: () => ({})
    },
    error: {
      type: String,
      default: ''
    }
  },

  emits: ['update:modelValue'],

  data() {
    return {
      pairs: [] as KeyValuePair[]
    };
  },

  watch: {
    modelValue: {
      immediate: true,
      handler(newValue: Record<string, string>) {
        this.pairs = Object.entries(newValue || {}).map(([key, value]) => ({
          key,
          value
        }));
        if (this.pairs.length === 0) {
          this.pairs.push({ key: '', value: '' });
        }
      }
    }
  },

  methods: {
    addPair(): void {
      this.pairs.push({ key: '', value: '' });
    },

    removePair(index: number): void {
      this.pairs.splice(index, 1);
      if (this.pairs.length === 0) {
        this.pairs.push({ key: '', value: '' });
      }
      this.updateValue();
    },

    updateValue(): void {
      const obj: Record<string, string> = {};
      this.pairs.forEach(pair => {
        if (pair.key.trim()) {
          obj[pair.key] = pair.value;
        }
      });
      this.$emit('update:modelValue', obj);
    }
  }
});
</script>
