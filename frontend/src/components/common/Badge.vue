<template>
  <span :class="badgeClasses" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
    <span v-if="dot" :class="dotClasses" class="w-1.5 h-1.5 rounded-full mr-1.5"></span>
    <slot />
  </span>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
type BadgeSize = 'sm' | 'md' | 'lg';

export default defineComponent({
  name: 'Badge',

  props: {
    variant: {
      type: String as PropType<BadgeVariant>,
      default: 'default'
    },
    size: {
      type: String as PropType<BadgeSize>,
      default: 'md'
    },
    dot: {
      type: Boolean as PropType<boolean>,
      default: false
    }
  },

  computed: {
    badgeClasses(): string {
      const classes: string[] = [];

      // Variantes
      switch (this.variant) {
        case 'primary':
          classes.push('bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200');
          break;
        case 'success':
          classes.push('bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-200');
          break;
        case 'warning':
          classes.push('bg-warning-100 text-warning-800 dark:bg-warning-900 dark:text-warning-200');
          break;
        case 'danger':
          classes.push('bg-danger-100 text-danger-800 dark:bg-danger-900 dark:text-danger-200');
          break;
        case 'info':
          classes.push('bg-info-100 text-info-800 dark:bg-info-900 dark:text-info-200');
          break;
        default:
          classes.push('bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300');
      }

      // Tailles
      switch (this.size) {
        case 'sm':
          classes.push('px-2 py-0.5 text-xs');
          break;
        case 'lg':
          classes.push('px-3 py-1 text-sm');
          break;
        default:
          classes.push('px-2.5 py-0.5 text-xs');
      }

      return classes.join(' ');
    },

    dotClasses(): string {
      switch (this.variant) {
        case 'primary':
          return 'bg-primary-600';
        case 'success':
          return 'bg-success-600';
        case 'warning':
          return 'bg-warning-600';
        case 'danger':
          return 'bg-danger-600';
        case 'info':
          return 'bg-info-600';
        default:
          return 'bg-gray-600';
      }
    }
  }
});
</script>
