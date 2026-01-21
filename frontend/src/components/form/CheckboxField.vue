<template>
  <div class="form-field">
    <div class="flex items-start">
      <div class="flex items-center h-5">
        <input
          :id="fieldId"
          type="checkbox"
          :checked="modelValue"
          @change="handleChange"
          class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
        />
      </div>
      <div class="ml-3 text-sm">
        <label :for="fieldId" class="font-medium text-gray-700 dark:text-gray-300">
          {{ field.label }}
          <span v-if="field.required" class="text-red-500">*</span>
        </label>
        <p v-if="field.description" class="text-xs text-gray-500 dark:text-gray-400">
          {{ field.description }}
        </p>
      </div>
    </div>
    <p v-if="error" class="mt-1 text-xs text-red-600 dark:text-red-400">
      {{ error }}
    </p>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import type { ConfigField } from '@/types/blocks';

export default defineComponent({
  name: 'CheckboxField',

  props: {
    field: {
      type: Object as PropType<ConfigField>,
      required: true
    },
    modelValue: {
      type: Boolean,
      default: false
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
      const target = event.target as HTMLInputElement;
      this.$emit('update:modelValue', target.checked);
    }
  }
});
</script>
