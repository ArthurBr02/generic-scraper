<template>
  <div class="custom-node-wrapper">
    <!-- Label personnalisé au-dessus du bloc -->
    <div v-if="data.label" class="node-label-above">
      {{ data.label }}
    </div>
    
    <div
      :class="[
        'custom-node init-node', 
        { selected: selected }
      ]"
      @contextmenu.prevent="$emit('context-menu', $event)"
    >
      <!-- En-tête du bloc init -->
      <div class="node-content">
        <div class="node-icon" :style="{ backgroundColor: color }">
          <svg class="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="icon" />
          </svg>
        </div>
        <div class="node-info">
          <div class="node-type">{{ data.type }}</div>
          <div class="node-description">{{ configSummary }}</div>
        </div>
      </div>

      <!-- Port de sortie -->
      <Handle
        type="source"
        :position="Position.Right"
        :id="`${id}-out`"
        class="node-handle node-handle-output"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { Handle, Position } from '@vue-flow/core';

export default defineComponent({
  name: 'InitNode',
  components: { Handle },
  props: {
    id: { type: String, required: true },
    data: { type: Object as PropType<any>, required: true },
    selected: { type: Boolean, default: false },
    color: { type: String, required: true },
    icon: { type: String, required: true }
  },
  emits: ['context-menu'],
  data() { 
    return { Position }; 
  },
  computed: {
    configSummary(): string {
      const config = this.data?.config;
      if (!config) return 'Configuration';
      
      const parts: string[] = [];
      
      // Navigateur
      if (config.browser?.type) {
        parts.push(`${config.browser.type}`);
      }
      
      // Output
      if (config.output?.format) {
        parts.push(`→ ${config.output.format}`);
      }
      
      return parts.join(' ') || 'Configuration';
    }
  }
});
</script>

<style scoped>
.custom-node-wrapper {
  @apply flex flex-col items-center;
}

.node-label-above {
  @apply text-xs font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 px-3 py-1 rounded-md shadow-sm mb-2 whitespace-nowrap border border-gray-200 dark:border-gray-700;
}

.custom-node {
  @apply relative flex flex-col min-w-[200px] max-w-[280px] bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm transition-all duration-150;
}

.custom-node:hover {
  @apply border-gray-300 dark:border-gray-600 shadow-md;
}

.custom-node.selected {
  @apply border-blue-500 ring-2 ring-blue-500/10 shadow-lg !z-50;
}

.node-content {
  @apply flex items-center gap-3 p-3;
}

.node-icon {
  @apply flex-shrink-0 w-8 h-8 rounded flex items-center justify-center;
}

.node-info {
  @apply flex-1 min-w-0 flex flex-col justify-center;
}

.node-type {
  @apply text-sm font-semibold text-gray-900 dark:text-white capitalize;
}

.node-description {
  @apply text-xs text-gray-600 dark:text-gray-400 truncate;
}

.node-handle {
  width: 8px;
  height: 8px;
  border: 2px solid #3b82f6;
  background: white;
  border-radius: 50%;
  transition: background 0.2s, border-color 0.2s;
  z-index: 20;
}

.node-handle-output {
  right: -5px !important;
}

.node-handle::after {
  content: "";
  position: absolute;
  top: -8px;
  left: -8px;
  right: -8px;
  bottom: -8px;
  border-radius: 50%;
}

.node-handle:hover {
  background: #3b82f6;
  border-color: #3b82f6;
}

.dark .node-handle {
  background: #0f172a;
  border-color: #3b82f6;
}

.dark .node-handle:hover {
  background: #3b82f6;
  border-color: #3b82f6;
}
</style>
