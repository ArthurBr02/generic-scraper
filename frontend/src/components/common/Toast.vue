<template>
  <Transition
    enter-active-class="transition ease-out duration-300"
    enter-from-class="opacity-0 translate-y-2"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition ease-in duration-200"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 translate-y-2"
  >
    <div
      v-if="visible"
      :class="toastClasses"
      class="flex items-start gap-3 p-4 rounded-lg shadow-lg max-w-md"
    >
      <div class="flex-shrink-0">
        <component :is="iconComponent" :class="iconClasses" class="h-5 w-5" />
      </div>
      <div class="flex-1 pt-0.5">
        <p v-if="title" class="font-medium text-sm" :class="titleClasses">{{ title }}</p>
        <p class="text-sm" :class="messageClasses">{{ message }}</p>
      </div>
      <button
        v-if="closable"
        @click="close"
        class="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
      >
        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  </Transition>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

type ToastType = 'success' | 'error' | 'warning' | 'info';

export default defineComponent({
  name: 'Toast',

  props: {
    type: {
      type: String as PropType<ToastType>,
      default: 'info'
    },
    title: {
      type: String as PropType<string>,
      default: ''
    },
    message: {
      type: String as PropType<string>,
      required: true
    },
    duration: {
      type: Number as PropType<number>,
      default: 3000
    },
    closable: {
      type: Boolean as PropType<boolean>,
      default: true
    }
  },

  emits: ['close'],

  data() {
    return {
      visible: false,
      timeout: null as number | null
    };
  },

  computed: {
    toastClasses(): string {
      const classes: string[] = [];

      switch (this.type) {
        case 'success':
          classes.push('bg-success-50 border-l-4 border-success-500 dark:bg-success-900/20');
          break;
        case 'error':
          classes.push('bg-danger-50 border-l-4 border-danger-500 dark:bg-danger-900/20');
          break;
        case 'warning':
          classes.push('bg-warning-50 border-l-4 border-warning-500 dark:bg-warning-900/20');
          break;
        case 'info':
          classes.push('bg-info-50 border-l-4 border-info-500 dark:bg-info-900/20');
          break;
      }

      return classes.join(' ');
    },

    iconClasses(): string {
      switch (this.type) {
        case 'success':
          return 'text-success-600 dark:text-success-400';
        case 'error':
          return 'text-danger-600 dark:text-danger-400';
        case 'warning':
          return 'text-warning-600 dark:text-warning-400';
        case 'info':
          return 'text-info-600 dark:text-info-400';
        default:
          return '';
      }
    },

    titleClasses(): string {
      switch (this.type) {
        case 'success':
          return 'text-success-800 dark:text-success-200';
        case 'error':
          return 'text-danger-800 dark:text-danger-200';
        case 'warning':
          return 'text-warning-800 dark:text-warning-200';
        case 'info':
          return 'text-info-800 dark:text-info-200';
        default:
          return '';
      }
    },

    messageClasses(): string {
      if (this.title) {
        return 'text-gray-600 dark:text-gray-400 mt-1';
      }
      switch (this.type) {
        case 'success':
          return 'text-success-700 dark:text-success-300';
        case 'error':
          return 'text-danger-700 dark:text-danger-300';
        case 'warning':
          return 'text-warning-700 dark:text-warning-300';
        case 'info':
          return 'text-info-700 dark:text-info-300';
        default:
          return '';
      }
    },

    iconComponent(): object {
      return {
        template: this.getIconTemplate()
      };
    }
  },

  methods: {
    show(): void {
      this.visible = true;
      if (this.duration > 0) {
        this.timeout = window.setTimeout(() => {
          this.close();
        }, this.duration);
      }
    },

    close(): void {
      this.visible = false;
      if (this.timeout !== null) {
        clearTimeout(this.timeout);
        this.timeout = null;
      }
      this.$emit('close');
    },

    getIconTemplate(): string {
      switch (this.type) {
        case 'success':
          return '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>';
        case 'error':
          return '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>';
        case 'warning':
          return '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>';
        case 'info':
          return '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>';
        default:
          return '';
      }
    }
  },

  mounted() {
    this.show();
  },

  beforeUnmount() {
    if (this.timeout !== null) {
      clearTimeout(this.timeout);
    }
  }
});
</script>
