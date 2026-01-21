<template>
  <div class="tabs">
    <div :class="tabListClasses" class="border-b border-gray-200 dark:border-gray-700">
      <nav class="-mb-px flex space-x-4" :class="{ 'space-x-8': variant === 'underline' }">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="selectTab(tab.id)"
          :class="getTabClasses(tab.id)"
          :disabled="tab.disabled"
          class="py-2 px-1 text-sm font-medium transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span v-if="tab.icon" class="inline-flex items-center gap-2">
            <component v-if="typeof tab.icon === 'object'" :is="tab.icon" class="h-4 w-4" />
            <span v-else v-html="tab.icon"></span>
            {{ tab.label }}
          </span>
          <span v-else>{{ tab.label }}</span>
          <span v-if="tab.badge" class="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-200 dark:bg-gray-700">
            {{ tab.badge }}
          </span>
        </button>
      </nav>
    </div>
    <div class="tab-content mt-4">
      <slot />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

type TabVariant = 'underline' | 'pills';

interface Tab {
  id: string;
  label: string;
  icon?: string | object;
  badge?: string | number;
  disabled?: boolean;
}

export default defineComponent({
  name: 'Tabs',

  props: {
    tabs: {
      type: Array as PropType<Tab[]>,
      required: true
    },
    modelValue: {
      type: String as PropType<string>,
      required: true
    },
    variant: {
      type: String as PropType<TabVariant>,
      default: 'underline'
    }
  },

  emits: ['update:modelValue', 'change'],

  computed: {
    tabListClasses(): string {
      return this.variant === 'pills' ? '' : '';
    }
  },

  methods: {
    selectTab(tabId: string): void {
      const tab = this.tabs.find(t => t.id === tabId);
      if (tab && !tab.disabled) {
        this.$emit('update:modelValue', tabId);
        this.$emit('change', tabId);
      }
    },

    getTabClasses(tabId: string): string {
      const classes: string[] = [];
      const isActive = this.modelValue === tabId;

      if (this.variant === 'underline') {
        if (isActive) {
          classes.push(
            'border-b-2 border-primary-600 text-primary-600',
            'dark:border-primary-400 dark:text-primary-400'
          );
        } else {
          classes.push(
            'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
            'dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600'
          );
        }
      } else {
        // pills
        if (isActive) {
          classes.push(
            'bg-primary-100 text-primary-700 rounded-lg',
            'dark:bg-primary-900 dark:text-primary-300'
          );
        } else {
          classes.push(
            'text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg',
            'dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-800'
          );
        }
      }

      return classes.join(' ');
    }
  }
});
</script>
