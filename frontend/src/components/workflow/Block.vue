<template>
  <div
    :class="[
      'block',
      `block-${definition.category}`,
      {
        'block-selected': selected,
        'block-error': status === 'error',
        'block-running': status === 'running',
        'block-success': status === 'success'
      }
    ]"
    :style="{ borderColor: definition.color }"
    @click="handleClick"
  >
    <!-- Header -->
    <div class="block-header" :style="{ backgroundColor: definition.color }">
      <div class="block-icon">
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="definition.icon" />
        </svg>
      </div>
      <span class="block-title">{{ definition.name }}</span>
      <button
        v-if="!readOnly"
        class="block-delete"
        @click.stop="handleDelete"
        title="Supprimer"
      >
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Body -->
    <div class="block-body">
      <!-- Ports d'entrée -->
      <div v-if="definition.inputs.length > 0" class="block-ports block-ports-input">
        <div
          v-for="port in definition.inputs"
          :key="port.id"
          class="block-port-row"
        >
          <InputPort
            :port="port"
            :block-id="instance.id"
            :is-connected="isPortConnected('input', port.id)"
            @mouseenter="$emit('port-mouseenter', $event)"
            @mouseleave="$emit('port-mouseleave', $event)"
          />
          <span class="port-label">{{ port.name }}</span>
        </div>
      </div>

      <!-- Configuration preview -->
      <div class="block-config-preview">
        <div v-if="configPreview" class="config-preview-text">
          {{ configPreview }}
        </div>
        <div v-else class="config-preview-empty">
          Non configuré
        </div>
      </div>

      <!-- Ports de sortie -->
      <div v-if="definition.outputs.length > 0" class="block-ports block-ports-output">
        <div
          v-for="port in definition.outputs"
          :key="port.id"
          class="block-port-row"
        >
          <span class="port-label">{{ port.name }}</span>
          <OutputPort
            :port="port"
            :block-id="instance.id"
            :is-connected="isPortConnected('output', port.id)"
            @dragstart="$emit('port-dragstart', $event)"
            @dragend="$emit('port-dragend', $event)"
            @mouseenter="$emit('port-mouseenter', $event)"
            @mouseleave="$emit('port-mouseleave', $event)"
          />
        </div>
      </div>
    </div>

    <!-- Status indicator -->
    <div v-if="status && status !== 'idle'" class="block-status-indicator">
      <div v-if="status === 'running'" class="status-spinner"></div>
      <svg v-else-if="status === 'success'" class="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
      </svg>
      <svg v-else-if="status === 'error'" class="h-4 w-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
      </svg>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import type { BlockDefinition, BlockInstance } from '@/types/blocks';
import InputPort from './InputPort.vue';
import OutputPort from './OutputPort.vue';

export default defineComponent({
  name: 'Block',

  components: {
    InputPort,
    OutputPort
  },

  props: {
    definition: {
      type: Object as PropType<BlockDefinition>,
      required: true
    },
    instance: {
      type: Object as PropType<BlockInstance>,
      required: true
    },
    selected: {
      type: Boolean as PropType<boolean>,
      default: false
    },
    connectedPorts: {
      type: Array as PropType<Array<{ direction: 'input' | 'output'; portId: string }>>,
      default: () => []
    },
    readOnly: {
      type: Boolean as PropType<boolean>,
      default: false
    }
  },

  computed: {
    status(): 'idle' | 'running' | 'success' | 'error' | undefined {
      return this.instance.status;
    },

    configPreview(): string {
      const config = this.instance.config;
      
      // Générer un aperçu basé sur le type de bloc
      switch (this.definition.type) {
        case 'navigate':
          return config.url || 'Aucune URL';
        
        case 'click':
        case 'input':
          return config.selector || 'Aucun sélecteur';
        
        case 'extract':
          const fieldCount = config.fields?.length || 0;
          return config.multiple 
            ? `${fieldCount} champ(s) - multiple`
            : `${fieldCount} champ(s)`;
        
        case 'wait':
          if (config.type === 'time') {
            return `${config.duration || 0}ms`;
          }
          return config.selector || config.condition || '';
        
        case 'api':
          return `${config.method || 'GET'} ${config.url || ''}`.trim();
        
        case 'loop':
          return config.type === 'count'
            ? `${config.count || 0} itérations`
            : 'Boucle while';
        
        default:
          return '';
      }
    }
  },

  methods: {
    isPortConnected(direction: 'input' | 'output', portId: string): boolean {
      return this.connectedPorts.some(
        p => p.direction === direction && p.portId === portId
      );
    },

    handleClick(event: MouseEvent): void {
      this.$emit('click', {
        instance: this.instance,
        event
      });
    },

    handleDelete(): void {
      this.$emit('delete', this.instance.id);
    }
  }
});
</script>

<style scoped>
.block {
  @apply bg-white dark:bg-gray-800 rounded-lg shadow-md border-2 border-gray-300 dark:border-gray-600;
  min-width: 200px;
  max-width: 280px;
  cursor: pointer;
  user-select: none;
  transition: all 0.2s ease;
}

.block:hover {
  @apply shadow-lg;
  transform: translateY(-2px);
}

.block-selected {
  @apply border-blue-500 shadow-xl;
  transform: translateY(-2px);
}

.block-error {
  @apply border-red-500;
}

.block-running {
  @apply border-yellow-500;
}

.block-success {
  @apply border-green-500;
}

/* Header */
.block-header {
  @apply flex items-center gap-2 px-3 py-2 rounded-t-md text-white;
  position: relative;
}

.block-icon {
  @apply flex-shrink-0;
}

.block-title {
  @apply flex-1 font-medium text-sm truncate;
}

.block-delete {
  @apply flex-shrink-0 p-1 rounded hover:bg-black/10 transition-colors;
}

/* Body */
.block-body {
  @apply p-3;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.block-ports {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.block-port-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.block-ports-input .block-port-row {
  justify-content: flex-start;
}

.block-ports-output .block-port-row {
  justify-content: flex-end;
}

.port-label {
  @apply text-xs text-gray-600 dark:text-gray-400;
}

/* Config preview */
.block-config-preview {
  @apply px-2 py-1 min-h-[24px] flex items-center;
}

.config-preview-text {
  @apply text-xs text-gray-700 dark:text-gray-300 truncate;
}

.config-preview-empty {
  @apply text-xs text-gray-400 dark:text-gray-600 italic;
}

/* Status indicator */
.block-status-indicator {
  @apply absolute top-2 right-2 w-5 h-5 flex items-center justify-center;
}

.status-spinner {
  @apply w-4 h-4 border-2 border-white/30 border-t-white rounded-full;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
