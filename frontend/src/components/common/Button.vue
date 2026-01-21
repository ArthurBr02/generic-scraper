<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="buttonClasses"
    @click="handleClick"
  >
    <span v-if="loading" class="mr-2">
      <svg
        class="animate-spin h-4 w-4"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          class="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="4"
        ></circle>
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
    </span>
    <span v-if="icon && !loading" :class="{ 'mr-2': $slots.default }">
      <component :is="icon" class="h-4 w-4" />
    </span>
    <slot></slot>
  </button>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import type { PropType } from 'vue';

type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'ghost' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

export default defineComponent({
  name: 'Button',

  props: {
    variant: {
      type: String as PropType<ButtonVariant>,
      default: 'primary',
    },
    size: {
      type: String as PropType<ButtonSize>,
      default: 'md',
    },
    type: {
      type: String as PropType<'button' | 'submit' | 'reset'>,
      default: 'button',
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    loading: {
      type: Boolean,
      default: false,
    },
    icon: {
      type: [Object, String] as PropType<any>,
      default: null,
    },
    fullWidth: {
      type: Boolean,
      default: false,
    },
  },

  emits: ['click'],

  setup(props, { emit }) {
    const buttonClasses = computed(() => {
      const baseClasses = [
        'inline-flex',
        'items-center',
        'justify-center',
        'rounded-lg',
        'font-medium',
        'transition-all',
        'duration-200',
        'focus:outline-none',
        'focus:ring-2',
        'focus:ring-offset-2',
        'disabled:opacity-50',
        'disabled:cursor-not-allowed',
      ];

      // Variant styles
      const variantClasses = {
        primary: [
          'bg-primary-600',
          'text-white',
          'hover:bg-primary-700',
          'focus:ring-primary-500',
        ],
        secondary: [
          'bg-secondary-600',
          'text-white',
          'hover:bg-secondary-700',
          'focus:ring-secondary-500',
        ],
        success: [
          'bg-success-600',
          'text-white',
          'hover:bg-success-700',
          'focus:ring-success-500',
        ],
        danger: [
          'bg-danger-600',
          'text-white',
          'hover:bg-danger-700',
          'focus:ring-danger-500',
        ],
        ghost: [
          'bg-transparent',
          'text-gray-700',
          'dark:text-gray-300',
          'hover:bg-gray-100',
          'dark:hover:bg-gray-800',
          'focus:ring-gray-500',
        ],
        outline: [
          'bg-transparent',
          'border-2',
          'border-gray-300',
          'dark:border-gray-700',
          'text-gray-700',
          'dark:text-gray-300',
          'hover:bg-gray-50',
          'dark:hover:bg-gray-800',
          'focus:ring-gray-500',
        ],
      };

      // Size classes
      const sizeClasses = {
        sm: ['px-3', 'py-1.5', 'text-xs'],
        md: ['px-4', 'py-2', 'text-sm'],
        lg: ['px-6', 'py-3', 'text-base'],
      };

      const classes = [
        ...baseClasses,
        ...variantClasses[props.variant],
        ...sizeClasses[props.size],
      ];

      // Full width
      if (props.fullWidth) {
        classes.push('w-full');
      }

      return classes.join(' ');
    });

    const handleClick = (event: MouseEvent) => {
      if (!props.disabled && !props.loading) {
        emit('click', event);
      }
    };

    return {
      buttonClasses,
      handleClick,
    };
  },
});
</script>
