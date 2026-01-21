<template>
  <button
    :type="type"
    :disabled="disabled"
    @click="handleClick"
    :class="itemClasses"
    class="w-full text-left px-4 py-2 text-sm transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
  >
    <span v-if="icon" class="flex-shrink-0">
      <slot name="icon" />
    </span>
    <span class="flex-1">
      <slot />
    </span>
  </button>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

type DropdownItemVariant = 'default' | 'danger';

export default defineComponent({
  name: 'DropdownItem',

  props: {
    variant: {
      type: String as PropType<DropdownItemVariant>,
      default: 'default'
    },
    disabled: {
      type: Boolean as PropType<boolean>,
      default: false
    },
    icon: {
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
    itemClasses(): string {
      const classes: string[] = [];

      if (this.variant === 'danger') {
        classes.push('text-danger-600 hover:bg-danger-50 dark:text-danger-400 dark:hover:bg-danger-900/20');
      } else {
        classes.push('text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700');
      }

      return classes.join(' ');
    }
  },

  methods: {
    handleClick(event: MouseEvent): void {
      if (!this.disabled) {
        this.$emit('click', event);
      }
    }
  }
});
</script>
