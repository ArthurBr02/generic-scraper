<template>
  <div class="custom-node-wrapper">
    <!-- Label personnalisé au-dessus du bloc -->
    <div v-if="data.label" class="node-label-above">
      {{ data.label }}
    </div>
    
    <div
      :class="[
        'custom-node loop-node', 
        { selected: selected }
      ]"
      @contextmenu.prevent="$emit('context-menu', $event)"
    >
      <!-- En-tête du bloc loop -->
      <div class="node-content loop-header-content">
        <div class="node-icon" :style="{ backgroundColor: color }">
          <svg class="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="icon" />
          </svg>
        </div>
        <div class="node-info">
          <div class="node-type">{{ data.type }}</div>
          <div v-if="loopInfo" class="node-description">{{ loopInfo }}</div>
        </div>
        <button
          class="node-delete"
          @click.stop="$emit('delete')"
          title="Supprimer"
        >
          ×
        </button>
      </div>

      <!-- Zone de boucle (corps) -->
      <div class="loop-body">
        <div class="loop-body-label">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Corps de la boucle</span>
        </div>
        <div class="loop-body-hint" v-if="stepCount > 0">
          {{ stepCount }} step{{ stepCount > 1 ? 's' : '' }}
        </div>
        <div class="loop-body-hint" v-else>
          Connecter les étapes ici
        </div>
      </div>

      <!-- Port d'entrée -->
      <Handle
        type="target"
        :position="Position.Left"
        :id="`${id}-in`"
        class="node-handle node-handle-input"
        style="top: 26px"
      />

      <!-- Port de sortie "loop" (corps de boucle) - placé en bas -->
      <Handle
        type="source"
        :position="Position.Bottom"
        :id="`${id}-loop`"
        class="node-handle node-handle-loop"
        style="left: 50%;"
      />

      <!-- Port de sortie normale (après la boucle) -->
      <Handle
        type="source"
        :position="Position.Right"
        :id="`${id}-out`"
        class="node-handle node-handle-output"
        style="top: 26px"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { Handle, Position } from '@vue-flow/core';

export default defineComponent({
  name: 'LoopNode',
  components: { Handle },
  props: {
    id: { type: String, required: true },
    data: { type: Object as PropType<any>, required: true },
    selected: { type: Boolean, default: false },
    color: { type: String, required: true },
    icon: { type: String, required: true }
  },
  emits: ['context-menu', 'delete'],
  data() { return { Position }; },
  computed: {
    loopInfo(): string {
      const config = this.data?.config;
      if (!config) return '';
      
      if (config.items) {
        const count = config.limit ? ` (max ${config.limit})` : '';
        return `${config.items}${count}`;
      }
      return '';
    },
    
    stepCount(): number {
      const config = this.data?.config;
      if (config?.steps && Array.isArray(config.steps)) {
        return config.steps.length;
      }
      return 0;
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
  @apply text-sm font-bold text-gray-900 dark:text-gray-100 truncate leading-tight;
}

.node-description {
  @apply text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 whitespace-normal line-clamp-1 italic;
}

.node-delete {
  @apply flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer;
  @apply -mr-1 text-lg self-start;
}

.loop-body {
  @apply px-3 py-2 bg-amber-50 dark:bg-amber-900/10 border-t border-gray-100 dark:border-gray-700 rounded-b-lg;
}

.loop-body-label {
  @apply flex items-center gap-2 text-[11px] font-bold text-amber-700 dark:text-amber-400;
}

.loop-body-hint {
  @apply text-[10px] text-amber-600/70 dark:text-amber-500/50 mt-0.5;
}

/* Handles (ports de connexion) */
.node-handle {
  width: 8px;
  height: 8px;
  border: 2px solid #3b82f6;
  background: white;
  border-radius: 50%;
  transition: background 0.2s, border-color 0.2s;
  z-index: 20;
}

.node-handle-input {
  left: -5px !important;
}

.node-handle-output,
.node-handle-loop {
  right: -5px !important;
}

.node-handle-loop {
  @apply !border-amber-500;
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
  @apply bg-blue-500 border-blue-500;
}

.node-handle-loop:hover {
  @apply bg-amber-500 border-amber-500;
}

.dark .node-handle {
  background: #0f172a;
  border-color: #3b82f6;
}

.dark .node-handle-loop {
  border-color: #f59e0b;
}

.dark .node-handle:hover {
  background: #3b82f6;
  border-color: #3b82f6;
}

.dark .node-handle-loop:hover {
  background: #f59e0b;
  border-color: #f59e0b;
}
</style>
