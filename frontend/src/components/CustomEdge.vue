<template>
  <g 
    @mouseenter="isHovered = true" 
    @mouseleave="isHovered = false"
    class="custom-edge"
  >
    <!-- Zone de clic élargie pour faciliter la sélection -->
    <path
      :d="path"
      fill="none"
      stroke="transparent"
      stroke-width="20"
      class="edge-click-area"
      @click="onSelect"
    />

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

    <!-- Bouton de suppression moderne -->
    <g
      :class="['edge-delete-container', { 'is-visible': showDeleteButton }]"
      @click.stop="onDeleteEdge"
    >
      <!-- Zone de hit plus large et invisible pour stabiliser le hover -->
      <circle :cx="labelX" :cy="labelY" r="14" fill="transparent" class="cursor-pointer" />
      
      <g class="edge-delete-button-visual">
        <circle
          :cx="labelX"
          :cy="labelY"
          r="10"
          class="edge-delete-bg"
        />
        <path
          :d="`M${labelX - 3} ${labelY - 3}L${labelX + 3} ${labelY + 3}M${labelX - 3} ${labelY + 3}L${labelX + 3} ${labelY - 3}`"
          class="edge-delete-cross"
        />
      </g>
    </g>
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
    },
    isDarkMode: {
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
     * Calcule le chemin de la connexion et les coordonnées du label
     */
    edgeParams() {
      return getSmoothStepPath({
        sourceX: this.sourceX,
        sourceY: this.sourceY,
        targetX: this.targetX,
        targetY: this.targetY,
        sourcePosition: this.sourcePosition as any,
        targetPosition: this.targetPosition as any,
        borderRadius: 16
      });
    },

    path(): string {
      return this.edgeParams[0];
    },

    labelX(): number {
      return this.edgeParams[1];
    },

    labelY(): number {
      return this.edgeParams[2];
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
        baseStyle.stroke = '#ec4899';
        baseStyle.strokeDasharray = '3,3';
      } else {
        baseStyle.stroke = this.isDarkMode ? '#4b5563' : '#cbd5e1';
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
     * Sélection de l'edge
     */
    onSelect(): void {
      // La sélection est gérée par Vue Flow, mais on peut ajouter une logique ici si besoin
    },

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
.custom-edge {
  outline: none;
}

.edge-click-area {
  cursor: pointer;
  pointer-events: all;
}

.custom-edge-path {
  fill: none;
  transition: all 0.2s ease;
  pointer-events: none; /* Laisse la zone de clic gérer les événements */
}

.edge-click-area:hover + .custom-edge-path {
  stroke-width: 3 !important;
  stroke: #3b82f6 !important;
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
  font-size: 10px;
  fill: #6b7280;
  font-weight: 700;
  text-transform: uppercase;
  pointer-events: none;
  letter-spacing: 0.05em;
}

/* Bouton de suppression */
.edge-delete-container {
  cursor: pointer;
  opacity: 0;
  visibility: hidden;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: none;
}

.edge-delete-container.is-visible {
  opacity: 1;
  visibility: visible;
  pointer-events: all;
}

.edge-delete-button-visual {
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.edge-delete-container:hover .edge-delete-button-visual {
  /* No scale */
}

.edge-delete-bg {
  fill: #ef4444;
}

.edge-delete-container:hover .edge-delete-bg {
  fill: #dc2626;
}

.edge-delete-cross {
  fill: none;
  stroke: white;
  stroke-width: 2;
  stroke-linecap: round;
}

.dark .edge-delete-bg {
  fill: #ef4444;
}

.dark .edge-delete-container:hover .edge-delete-bg {
  fill: #f87171;
}
</style>
