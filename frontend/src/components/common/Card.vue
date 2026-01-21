<template>
  <div :class="cardClasses">
    <div v-if="$slots.header || title" class="card-header">
      <slot name="header">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">{{ title }}</h3>
      </slot>
    </div>

    <div class="card-body">
      <slot></slot>
    </div>

    <div v-if="$slots.footer" class="card-footer">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from 'vue';

type CardVariant = 'default' | 'bordered' | 'elevated' | 'flat';

export default defineComponent({
  name: 'Card',

  props: {
    title: {
      type: String,
      default: '',
    },
    variant: {
      type: String as PropType<CardVariant>,
      default: 'default',
    },
    padding: {
      type: String as PropType<'none' | 'sm' | 'md' | 'lg'>,
      default: 'md',
    },
    hoverable: {
      type: Boolean,
      default: false,
    },
  },

  setup(props) {
    const cardClasses = computed(() => {
      const classes = ['card'];

      // Variant
      if (props.variant === 'bordered') {
        classes.push('border-2');
      } else if (props.variant === 'elevated') {
        classes.push('shadow-soft-lg');
      } else if (props.variant === 'flat') {
        classes.push('shadow-none border-0');
      }

      // Padding
      const paddingClasses = {
        none: 'p-0',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
      };
      classes.push(paddingClasses[props.padding]);

      // Hoverable
      if (props.hoverable) {
        classes.push('transition-all duration-200 hover:shadow-soft-lg hover:-translate-y-1');
      }

      return classes.join(' ');
    });

    return {
      cardClasses,
    };
  },
});
</script>

<style scoped>
.card-header {
  @apply mb-4 pb-4 border-b border-gray-200 dark:border-gray-800;
}

.card-body {
  @apply flex-1;
}

.card-footer {
  @apply mt-4 pt-4 border-t border-gray-200 dark:border-gray-800;
}
</style>
