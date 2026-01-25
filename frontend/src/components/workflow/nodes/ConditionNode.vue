<template>
  <div class="custom-node-wrapper">
    <!-- Label personnalisé au-dessus du bloc -->
    <div v-if="data.label" class="node-label-above">
      {{ data.label }}
    </div>
    
    <div
      :class="['condition-node', { selected: selected }]"
      @contextmenu.prevent="$emit('context-menu', $event)"
    >
      <!-- Forme de losange pour la condition -->
      <svg class="condition-shape" viewBox="0 0 120 120" preserveAspectRatio="none">
        <path
          d="M 60 10 L 110 60 L 60 110 L 10 60 Z"
          :fill="color"
          :stroke="selected ? '#3b82f6' : 'rgba(0,0,0,0.1)'"
          :stroke-width="selected ? '3' : '1'"
        />
      </svg>

      <!-- Contenu du nœud -->
      <div class="condition-content">
        <div class="node-icon-bg">
          <svg class="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="icon" />
          </svg>
        </div>
        <div class="node-type-label">Condition</div>
        <button
          class="node-delete-btn"
          @click.stop="$emit('delete')"
          title="Supprimer"
        >
          ×
        </button>
      </div>

      <!-- Labels pour les sorties -->
      <div class="output-label output-label-true">
        <span>Vrai</span>
      </div>
      <div class="output-label output-label-false">
        <span>Faux</span>
      </div>

      <!-- Port d'entrée -->
      <Handle
        type="target"
        :position="Position.Left"
        :id="`${id}-in`"
        class="node-handle node-handle-input"
        style="left: 10px; top: 50%"
      />

      <!-- Port de sortie "true" -->
      <Handle
        type="source"
        :position="Position.Right"
        :id="`${id}-true`"
        class="node-handle node-handle-true"
        style="right: 10px; top: 35%"
      />

      <!-- Port de sortie "false" -->
      <Handle
        type="source"
        :position="Position.Right"
        :id="`${id}-false`"
        class="node-handle node-handle-false"
        style="right: 10px; top: 65%"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { Handle, Position } from '@vue-flow/core';

export default defineComponent({
  name: 'ConditionNode',
  components: { Handle },
  props: {
    id: { type: String, required: true },
    data: { type: Object as PropType<any>, required: true },
    selected: { type: Boolean, default: false },
    color: { type: String, required: true },
    icon: { type: String, required: true }
  },
  emits: ['context-menu', 'delete'],
  data() { return { Position }; }
});
</script>

<style scoped>
.custom-node-wrapper {
  @apply flex flex-col items-center;
}

.node-label-above {
  @apply text-xs font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 px-3 py-1 rounded-md shadow-sm mb-2 whitespace-nowrap border border-gray-200 dark:border-gray-700;
}

.condition-node {
  width: 120px;
  height: 120px;
  @apply relative transition-all duration-150;
}

.condition-shape {
  @apply w-full h-full drop-shadow-sm;
}

.condition-node.selected .condition-shape {
  @apply drop-shadow-md;
}

.condition-content {
  @apply absolute inset-0 flex flex-col items-center justify-center p-4 pointer-events-none;
}

.node-icon-bg {
  @apply w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shadow-inner mb-1;
}

.node-type-label {
  @apply text-[10px] font-bold text-white uppercase tracking-wider text-center;
  text-shadow: 0 1px 2px rgba(0,0,0,0.2);
}

.node-delete-btn {
  @apply absolute top-8 right-8 w-5 h-5 flex items-center justify-center rounded-full bg-white/90 text-gray-400 hover:text-red-500 hover:bg-white transition-colors cursor-pointer pointer-events-auto;
  @apply text-sm shadow-sm;
}

.output-label {
  @apply absolute right-[-35px] text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm pointer-events-none uppercase;
}

.output-label-true {
  @apply top-[35%] -translate-y-1/2 bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 border border-green-200 dark:border-green-800;
}

.output-label-false {
  @apply top-[65%] -translate-y-1/2 bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 border border-red-200 dark:border-red-800;
}

.node-handle {
  width: 8px;
  height: 8px;
  border: 2px solid #3b82f6;
  background: white;
  border-radius: 50%;
  transition: background 0.2s, border-color 0.2s;
  z-index: 20;
  transform: translate(-50%, -50%);
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

.node-handle-input {
  /* Garder la bordure bleue par défaut */
}

.node-handle-true {
  @apply !border-green-500;
}

.node-handle-false {
  @apply !border-red-500;
}

.node-handle:hover {
  background: #3b82f6;
  border-color: #3b82f6;
}

.node-handle-true:hover {
  background: #22c55e;
  border-color: #22c55e;
}

.node-handle-false:hover {
  background: #ef4444;
  border-color: #ef4444;
}

.dark .node-handle {
  background: #0f172a;
  border-color: #3b82f6;
}

.dark .node-handle-true {
  border-color: #22c55e;
}

.dark .node-handle-false {
  border-color: #ef4444;
}

.dark .node-handle:hover {
  background: #3b82f6;
  border-color: #3b82f6;
}
</style>
