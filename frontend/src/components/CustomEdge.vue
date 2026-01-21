<template>
  <g>
    <!-- Ligne de connexion principale -->
    <path
      :id="id"
      :d="path"
      :class="['custom-edge-path', edgeClass]"
      :style="edgeStyle"
      :marker-end="markerEnd"
    />

    <!-- Label de la connexion (optionnel) -->
    <text v-if="label" class="edge-label">
      <textPath :href="`#${id}`" startOffset="50%" text-anchor="middle">
        {{ label }}
      </textPath>
    </text>

    <!-- Point de suppression -->
    <circle
      v-if="showDeleteButton"
      :cx="centerX"
      :cy="centerY"
      r="10"
      class="edge-delete-button"
      @click="onDeleteEdge"
    />
    <text
      v-if="showDeleteButton"
      :x="centerX"
      :y="centerY"
      class="edge-delete-icon"
      text-anchor="middle"
      dominant-baseline="middle"
      @click="onDeleteEdge"
    >
      ×
    </text>
  </g>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { getSmoothStepPath } from '@vue-flow/core';
import type { EdgeProps } from '@vue-flow/core';

export default defineComponent({
  name: 'CustomEdge',

  props: {
    id: {
      type: String as PropType<string>,
      required: true
    },
    sourceX: {
      type: Number as PropType<number>,
      required: true
    },
    sourceY: {
      type: Number as PropType<number>,
      required: true
    },
    targetX: {
      type: Number as PropType<number>,
      required: true
    },
    targetY: {
      type: Number as PropType<number>,
      required: true
    },
    sourcePosition: {
      type: String as PropType<string>,
      default: 'right'
    },
    targetPosition: {
      type: String as PropType<string>,
      default: 'left'
    },
    data: {
      type: Object as PropType<any>,
      default: () => ({})
    },
    markerEnd: {
      type: String as PropType<string>,
      default: 'url(#arrowclosed)'
    },
    selected: {
      type: Boolean as PropType<boolean>,
      default: false
    }
  },

  data() {
    return {
      isHovered: false
    };
  },

  computed: {
    /**
     * Calcule le chemin de la connexion
     */
    path(): string {
      const [path] = getSmoothStepPath({
        sourceX: this.sourceX,
        sourceY: this.sourceY,
        targetX: this.targetX,
        targetY: this.targetY,
        sourcePosition: this.sourcePosition as any,
        targetPosition: this.targetPosition as any
      });
      return path;
    },

    /**
     * Centre X de la connexion pour le bouton de suppression
     */
    centerX(): number {
      return (this.sourceX + this.targetX) / 2;
    },

    /**
     * Centre Y de la connexion pour le bouton de suppression
     */
    centerY(): number {
      return (this.sourceY + this.targetY) / 2;
    },

    /**
     * Label de la connexion
     */
    label(): string | undefined {
      return this.data.label;
    },

    /**
     * État de la connexion (normal, active, error)
     */
    state(): 'normal' | 'active' | 'error' {
      return this.data.state || 'normal';
    },

    /**
     * Type de connexion (flow ou data)
     */
    connectionType(): 'flow' | 'data' {
      return this.data.type || 'flow';
    },

    /**
     * Classe CSS de l'edge
     */
    edgeClass(): string {
      return [
        `edge-state-${this.state}`,
        `edge-type-${this.connectionType}`,
        this.selected ? 'selected' : '',
        this.isHovered ? 'hovered' : ''
      ].join(' ');
    },

    /**
     * Style de l'edge
     */
    edgeStyle(): Record<string, any> {
      const baseStyle: Record<string, any> = {
        strokeWidth: 2
      };

      if (this.state === 'active') {
        baseStyle.stroke = '#3b82f6';
        baseStyle.strokeWidth = 3;
      } else if (this.state === 'error') {
        baseStyle.stroke = '#ef4444';
        baseStyle.strokeWidth = 2;
        baseStyle.strokeDasharray = '5,5';
      } else if (this.connectionType === 'data') {
        baseStyle.stroke = '#8b5cf6';
        baseStyle.strokeDasharray = '3,3';
      } else {
        baseStyle.stroke = '#b1b1b7';
      }

      if (this.selected) {
        baseStyle.strokeWidth = 3;
        baseStyle.stroke = '#3b82f6';
      }

      return baseStyle;
    },

    /**
     * Affiche le bouton de suppression
     */
    showDeleteButton(): boolean {
      return this.isHovered || this.selected;
    }
  },

  methods: {
    /**
     * Suppression de l'edge
     */
    onDeleteEdge(): void {
      this.$emit('delete-edge', this.id);
    }
  }
});
</script>

<style scoped>
.custom-edge-path {
  fill: none;
  transition: all 0.2s ease;
}

.custom-edge-path:hover {
  stroke-width: 3 !important;
  cursor: pointer;
}

.custom-edge-path.selected {
  filter: drop-shadow(0 0 4px rgba(59, 130, 246, 0.5));
}

.custom-edge-path.edge-state-active {
  animation: edge-flow 1.5s linear infinite;
}

@keyframes edge-flow {
  0% {
    stroke-dashoffset: 0;
  }
  100% {
    stroke-dashoffset: 20;
  }
}

.edge-label {
  font-size: 12px;
  fill: #6b7280;
  font-weight: 500;
  pointer-events: none;
}

.edge-delete-button {
  fill: white;
  stroke: #dc2626;
  stroke-width: 2;
  cursor: pointer;
  transition: all 0.2s;
}

.edge-delete-button:hover {
  fill: #fee2e2;
  stroke-width: 3;
}

.edge-delete-icon {
  font-size: 16px;
  fill: #dc2626;
  font-weight: bold;
  cursor: pointer;
  pointer-events: none;
}
</style>
