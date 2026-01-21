<template>
  <div 
    :class="[
      'port port-output',
      portTypeClass,
      { 
        'port-connected': isConnected,
        'port-hover': isHover,
        'port-dragging': isDragging
      }
    ]"
    :title="port.name"
    @mousedown="handleMouseDown"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <div class="port-dot"></div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import type { PortDefinition } from '@/types/blocks';

export default defineComponent({
  name: 'OutputPort',

  props: {
    port: {
      type: Object as PropType<PortDefinition>,
      required: true
    },
    blockId: {
      type: String as PropType<string>,
      required: true
    },
    isConnected: {
      type: Boolean as PropType<boolean>,
      default: false
    }
  },

  data() {
    return {
      isHover: false,
      isDragging: false
    };
  },

  computed: {
    portTypeClass(): string {
      return `port-${this.port.type}`;
    }
  },

  methods: {
    handleMouseDown(event: MouseEvent): void {
      event.stopPropagation();
      this.isDragging = true;
      
      this.$emit('dragstart', {
        blockId: this.blockId,
        portId: this.port.id,
        port: this.port,
        event
      });

      // Gérer le mouseup global pour terminer le drag
      const handleMouseUp = (e: MouseEvent) => {
        this.isDragging = false;
        this.$emit('dragend', {
          blockId: this.blockId,
          portId: this.port.id,
          port: this.port,
          event: e
        });
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mouseup', handleMouseUp);
    },

    handleMouseEnter(): void {
      this.isHover = true;
      this.$emit('mouseenter', {
        blockId: this.blockId,
        portId: this.port.id,
        port: this.port
      });
    },

    handleMouseLeave(): void {
      this.isHover = false;
      this.$emit('mouseleave', {
        blockId: this.blockId,
        portId: this.port.id,
        port: this.port
      });
    }
  }
});
</script>

<style scoped>
.port {
  position: relative;
  width: 12px;
  height: 12px;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.port-output {
  margin-left: 4px;
}

.port-dot {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 2px solid currentColor;
  background: white;
  transition: all 0.2s ease;
}

.port-flow .port-dot {
  @apply border-blue-500;
}

.port-data .port-dot {
  @apply border-green-500;
}

.port-connected .port-dot {
  @apply bg-current;
}

.port-flow.port-connected .port-dot {
  @apply bg-blue-500;
}

.port-data.port-connected .port-dot {
  @apply bg-green-500;
}

.port-hover,
.port-dragging {
  transform: scale(1.3);
}

.port-hover .port-dot,
.port-dragging .port-dot {
  @apply shadow-lg;
}

.port-dragging {
  cursor: grabbing;
}

/* Dark mode */
:global(.dark) .port-dot {
  background: #1f2937;
}

:global(.dark) .port-connected .port-dot {
  @apply bg-current;
}
</style>
