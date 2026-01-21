<template>
  <div class="form-field">
    <label :for="fieldId" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
      {{ field.label }}
      <span v-if="field.required" class="text-red-500">*</span>
    </label>
    <select
      :id="fieldId"
      :value="modelValue"
      @change="handleChange"
      :required="field.required"
      class="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      :class="[
        error 
          ? 'border-red-500 dark:border-red-500 bg-red-50 dark:bg-red-900/20' 
          : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
      ]"
    >
      <option value="" disabled>Sélectionner...</option>
      <option
        v-for="option in field.options"
        :key="option.value"
        :value="option.value"
      >
        {{ option.label }}
      </option>
    </select>
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

export default defineComponent({
  name: 'SelectField',

  props: {
    field: {
      type: Object as PropType<ConfigField>,
      required: true
    },
    modelValue: {
      type: [String, Number],
      default: ''
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
    }
  },

  methods: {
    handleChange(event: Event): void {
      const target = event.target as HTMLSelectElement;
      this.$emit('update:modelValue', target.value);
    }
  }
});
</script>
