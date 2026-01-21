<template>
  <div class="select-wrapper">
    <label v-if="label" :for="id" class="block text-sm font-medium mb-1.5" :class="labelClasses">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>
    <div class="relative">
      <select
        :id="id"
        :value="modelValue"
        @input="handleInput"
        :disabled="disabled"
        :required="required"
        :class="selectClasses"
        class="w-full px-3 py-2 border rounded-lg shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed appearance-none bg-white dark:bg-gray-800"
      >
        <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
        <option
          v-for="option in options"
          :key="getOptionValue(option)"
          :value="getOptionValue(option)"
        >
          {{ getOptionLabel(option) }}
        </option>
      </select>
      <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
    <p v-if="error" class="mt-1.5 text-sm text-red-600 dark:text-red-400">{{ error }}</p>
    <p v-else-if="hint" class="mt-1.5 text-sm text-gray-500 dark:text-gray-400">{{ hint }}</p>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

type OptionType = string | number | { value: string | number; label: string };

export default defineComponent({
  name: 'Select',

  props: {
    modelValue: {
      type: [String, Number] as PropType<string | number>,
      default: ''
    },
    label: {
      type: String as PropType<string>,
      default: ''
    },
    placeholder: {
      type: String as PropType<string>,
      default: ''
    },
    options: {
      type: Array as PropType<OptionType[]>,
      required: true
    },
    error: {
      type: String as PropType<string>,
      default: ''
    },
    hint: {
      type: String as PropType<string>,
      default: ''
    },
    disabled: {
      type: Boolean as PropType<boolean>,
      default: false
    },
    required: {
      type: Boolean as PropType<boolean>,
      default: false
    },
    id: {
      type: String as PropType<string>,
      default: () => `select-${Math.random().toString(36).substr(2, 9)}`
    }
  },

  emits: ['update:modelValue', 'change'],

  computed: {
    selectClasses(): string {
      const classes: string[] = [];

      if (this.error) {
        classes.push('border-red-500 focus:border-red-500 focus:ring-red-500');
      } else {
        classes.push('border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500');
      }

      return classes.join(' ');
    },

    labelClasses(): string {
      if (this.error) {
        return 'text-red-700 dark:text-red-400';
      }
      return 'text-gray-700 dark:text-gray-300';
    }
  },

  methods: {
    handleInput(event: Event): void {
      const target = event.target as HTMLSelectElement;
      const value = target.value;
      this.$emit('update:modelValue', value);
      this.$emit('change', value);
    },

    getOptionValue(option: OptionType): string | number {
      if (typeof option === 'object' && option !== null) {
        return option.value;
      }
      return option;
    },

    getOptionLabel(option: OptionType): string {
      if (typeof option === 'object' && option !== null) {
        return option.label;
      }
      return String(option);
    }
  }
});
</script>

<style scoped>
select {
  background-image: none;
}
</style>
