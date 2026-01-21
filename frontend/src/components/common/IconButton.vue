<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="buttonClasses"
    @click="handleClick"
    class="inline-flex items-center justify-center rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
  >
    <Spinner v-if="loading" :size="spinnerSize" variant="white" />
    <slot v-else />
  </button>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import Spinner from './Spinner.vue';

type IconButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
type IconButtonSize = 'xs' | 'sm' | 'md' | 'lg';

export default defineComponent({
  name: 'IconButton',

  components: {
    Spinner
  },

  props: {
    variant: {
      type: String as PropType<IconButtonVariant>,
      default: 'secondary'
    },
    size: {
      type: String as PropType<IconButtonSize>,
      default: 'md'
    },
    disabled: {
      type: Boolean as PropType<boolean>,
      default: false
    },
    loading: {
      type: Boolean as PropType<boolean>,
      default: false
    },
    type: {
      type: String as PropType<'button' | 'submit' | 'reset'>,
      default: 'button'
    }
  },

  emits: ['click'],

  computed: {
    buttonClasses(): string {
      const classes: string[] = [];

      // Tailles
      switch (this.size) {
        case 'xs':
          classes.push('p-1 text-xs');
          break;
        case 'sm':
          classes.push('p-1.5 text-sm');
          break;
        case 'md':
          classes.push('p-2 text-base');
          break;
        case 'lg':
          classes.push('p-3 text-lg');
          break;
      }

      // Variantes
      switch (this.variant) {
        case 'primary':
          classes.push(
            'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
            'dark:bg-primary-500 dark:hover:bg-primary-600'
          );
          break;
        case 'secondary':
          classes.push(
            'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500',
            'dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
          );
          break;
        case 'danger':
          classes.push(
            'bg-danger-600 text-white hover:bg-danger-700 focus:ring-danger-500',
            'dark:bg-danger-500 dark:hover:bg-danger-600'
          );
          break;
        case 'ghost':
          classes.push(
            'text-gray-600 hover:bg-gray-100 focus:ring-gray-500',
            'dark:text-gray-400 dark:hover:bg-gray-800'
          );
          break;
        case 'outline':
          classes.push(
            'border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500',
            'dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800'
          );
          break;
      }

      return classes.join(' ');
    },

    spinnerSize(): 'xs' | 'sm' | 'md' | 'lg' {
      switch (this.size) {
        case 'xs':
          return 'xs';
        case 'sm':
          return 'sm';
        case 'lg':
          return 'lg';
        default:
          return 'sm';
      }
    }
  },

  methods: {
    handleClick(event: MouseEvent): void {
      if (!this.disabled && !this.loading) {
        this.$emit('click', event);
      }
    }
  }
});
</script>
