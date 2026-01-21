<template>
  <div class="input-wrapper" :class="{ 'input-error': error }">
    <label v-if="label" :for="inputId" class="input-label">
      {{ label }}
      <span v-if="required" class="text-danger-500">*</span>
    </label>

    <div class="relative">
      <div v-if="prefixIcon" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
        <component :is="prefixIcon" class="h-5 w-5" />
      </div>

      <input
        :id="inputId"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        :class="inputClasses"
        @input="handleInput"
        @blur="handleBlur"
        @focus="handleFocus"
      />

      <div v-if="suffixIcon" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
        <component :is="suffixIcon" class="h-5 w-5" />
      </div>
    </div>

    <p v-if="error" class="input-error-message">
      {{ error }}
    </p>

    <p v-else-if="hint" class="input-hint">
      {{ hint }}
    </p>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from 'vue';

let inputIdCounter = 0;

export default defineComponent({
  name: 'Input',

  props: {
    modelValue: {
      type: [String, Number],
      default: '',
    },
    type: {
      type: String as PropType<'text' | 'email' | 'password' | 'number' | 'url' | 'tel'>,
      default: 'text',
    },
    label: {
      type: String,
      default: '',
    },
    placeholder: {
      type: String,
      default: '',
    },
    error: {
      type: String,
      default: '',
    },
    hint: {
      type: String,
      default: '',
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    readonly: {
      type: Boolean,
      default: false,
    },
    required: {
      type: Boolean,
      default: false,
    },
    prefixIcon: {
      type: Object,
      default: null,
    },
    suffixIcon: {
      type: Object,
      default: null,
    },
  },

  emits: ['update:modelValue', 'blur', 'focus'],

  setup(props, { emit }) {
    const inputId = `input-${++inputIdCounter}`;

    const inputClasses = computed(() => {
      const classes = ['input'];

      if (props.prefixIcon) {
        classes.push('pl-10');
      }

      if (props.suffixIcon) {
        classes.push('pr-10');
      }

      if (props.error) {
        classes.push('border-danger-500 focus:ring-danger-500');
      }

      if (props.disabled) {
        classes.push('opacity-50 cursor-not-allowed');
      }

      return classes.join(' ');
    });

    const handleInput = (event: Event) => {
      const target = event.target as HTMLInputElement;
      emit('update:modelValue', target.value);
    };

    const handleBlur = (event: FocusEvent) => {
      emit('blur', event);
    };

    const handleFocus = (event: FocusEvent) => {
      emit('focus', event);
    };

    return {
      inputId,
      inputClasses,
      handleInput,
      handleBlur,
      handleFocus,
    };
  },
});
</script>

<style scoped>
.input-wrapper {
  @apply w-full;
}

.input-label {
  @apply block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5;
}

.input-error-message {
  @apply mt-1.5 text-sm text-danger-600 dark:text-danger-400;
}

.input-hint {
  @apply mt-1.5 text-sm text-gray-500 dark:text-gray-400;
}
</style>
