<template>
  <div class="relative inline-block" @mouseenter="show" @mouseleave="hide">
    <slot />
    <Transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="isVisible"
        :class="tooltipClasses"
        class="absolute z-50 px-3 py-2 text-xs font-medium text-white bg-gray-900 rounded-lg shadow-sm dark:bg-gray-700 whitespace-nowrap"
      >
        {{ text }}
        <div :class="arrowClasses" class="absolute w-2 h-2 bg-gray-900 dark:bg-gray-700 transform rotate-45"></div>
      </div>
    </Transition>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

export default defineComponent({
  name: 'Tooltip',

  props: {
    text: {
      type: String as PropType<string>,
      required: true
    },
    position: {
      type: String as PropType<TooltipPosition>,
      default: 'top'
    },
    delay: {
      type: Number as PropType<number>,
      default: 200
    }
  },

  data() {
    return {
      isVisible: false,
      timeout: null as number | null
    };
  },

  computed: {
    tooltipClasses(): string {
      switch (this.position) {
        case 'top':
          return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
        case 'bottom':
          return 'top-full left-1/2 -translate-x-1/2 mt-2';
        case 'left':
          return 'right-full top-1/2 -translate-y-1/2 mr-2';
        case 'right':
          return 'left-full top-1/2 -translate-y-1/2 ml-2';
        default:
          return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
      }
    },

    arrowClasses(): string {
      switch (this.position) {
        case 'top':
          return 'top-full left-1/2 -translate-x-1/2 -mt-1';
        case 'bottom':
          return 'bottom-full left-1/2 -translate-x-1/2 -mb-1';
        case 'left':
          return 'left-full top-1/2 -translate-y-1/2 -ml-1';
        case 'right':
          return 'right-full top-1/2 -translate-y-1/2 -mr-1';
        default:
          return 'top-full left-1/2 -translate-x-1/2 -mt-1';
      }
    }
  },

  methods: {
    show(): void {
      this.timeout = window.setTimeout(() => {
        this.isVisible = true;
      }, this.delay);
    },

    hide(): void {
      if (this.timeout !== null) {
        clearTimeout(this.timeout);
        this.timeout = null;
      }
      this.isVisible = false;
    }
  },

  beforeUnmount() {
    if (this.timeout !== null) {
      clearTimeout(this.timeout);
    }
  }
});
</script>
