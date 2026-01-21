<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="modal-overlay" @click="handleOverlayClick">
        <div class="modal-container" :class="sizeClasses" @click.stop>
          <!-- Header -->
          <div class="modal-header">
            <h3 class="modal-title">{{ title }}</h3>
            <button
              v-if="closable"
              type="button"
              class="modal-close"
              @click="handleClose"
              aria-label="Fermer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clip-rule="evenodd"
                />
              </svg>
            </button>
          </div>

          <!-- Body -->
          <div class="modal-body scrollbar-thin">
            <slot></slot>
          </div>

          <!-- Footer -->
          <div v-if="$slots.footer" class="modal-footer">
            <slot name="footer"></slot>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script lang="ts">
import { defineComponent, computed, watch } from 'vue';
import type { PropType } from 'vue';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export default defineComponent({
  name: 'Modal',

  props: {
    modelValue: {
      type: Boolean,
      required: true,
    },
    title: {
      type: String,
      default: '',
    },
    size: {
      type: String as PropType<ModalSize>,
      default: 'md',
    },
    closable: {
      type: Boolean,
      default: true,
    },
    closeOnOverlay: {
      type: Boolean,
      default: true,
    },
  },

  emits: ['update:modelValue', 'close'],

  setup(props, { emit }) {
    const sizeClasses = computed(() => {
      const sizes = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
        full: 'max-w-full mx-4',
      };
      return sizes[props.size];
    });

    const handleClose = () => {
      emit('update:modelValue', false);
      emit('close');
    };

    const handleOverlayClick = () => {
      if (props.closeOnOverlay && props.closable) {
        handleClose();
      }
    };

    // Prevent body scroll when modal is open
    watch(
      () => props.modelValue,
      (isOpen) => {
        if (isOpen) {
          document.body.style.overflow = 'hidden';
        } else {
          document.body.style.overflow = '';
        }
      }
    );

    return {
      sizeClasses,
      handleClose,
      handleOverlayClick,
    };
  },
});
</script>

<style scoped>
.modal-overlay {
  @apply fixed inset-0 z-50 flex items-center justify-center;
  @apply bg-black/50 backdrop-blur-sm;
}

.modal-container {
  @apply bg-white dark:bg-gray-900 rounded-xl shadow-soft-lg;
  @apply w-full max-h-[90vh] overflow-hidden;
  @apply flex flex-col;
}

.modal-header {
  @apply flex items-center justify-between;
  @apply px-6 py-4 border-b border-gray-200 dark:border-gray-800;
}

.modal-title {
  @apply text-lg font-semibold text-gray-900 dark:text-gray-100;
}

.modal-close {
  @apply text-gray-400 hover:text-gray-600 dark:hover:text-gray-300;
  @apply transition-colors duration-200;
}

.modal-body {
  @apply flex-1 overflow-y-auto px-6 py-4;
}

.modal-footer {
  @apply px-6 py-4 border-t border-gray-200 dark:border-gray-800;
  @apply flex items-center justify-end gap-3;
}

/* Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition: transform 0.3s ease;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: scale(0.95);
}
</style>
