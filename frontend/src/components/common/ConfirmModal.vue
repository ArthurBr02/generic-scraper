<template>
  <Modal
    :open="open"
    :title="title"
    @close="handleCancel"
  >
    <template #default>
      <div class="space-y-4">
        <!-- Icône -->
        <div v-if="variant" class="flex items-center justify-center">
          <div 
            :class="[
              'rounded-full p-3',
              variantClasses.bg
            ]"
          >
            <svg 
              class="h-6 w-6"
              :class="variantClasses.icon"
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                v-if="variant === 'danger'"
                stroke-linecap="round" 
                stroke-linejoin="round" 
                stroke-width="2" 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
              />
              <path 
                v-else-if="variant === 'warning'"
                stroke-linecap="round" 
                stroke-linejoin="round" 
                stroke-width="2" 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
              />
              <path 
                v-else-if="variant === 'info'"
                stroke-linecap="round" 
                stroke-linejoin="round" 
                stroke-width="2" 
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
          </div>
        </div>

        <!-- Message -->
        <div class="text-center">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            {{ message }}
          </p>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex items-center justify-end gap-3">
        <Button
          variant="ghost"
          @click="handleCancel"
          :disabled="loading"
        >
          {{ cancelText }}
        </Button>
        <Button
          :variant="confirmVariant"
          @click="handleConfirm"
          :loading="loading"
        >
          {{ confirmText }}
        </Button>
      </div>
    </template>
  </Modal>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import Modal from './Modal.vue';
import Button from './Button.vue';

export default defineComponent({
  name: 'ConfirmModal',

  components: {
    Modal,
    Button
  },

  props: {
    open: {
      type: Boolean as PropType<boolean>,
      default: false
    },
    title: {
      type: String as PropType<string>,
      default: 'Confirmation'
    },
    message: {
      type: String as PropType<string>,
      required: true
    },
    variant: {
      type: String as PropType<'danger' | 'warning' | 'info' | null>,
      default: null
    },
    confirmText: {
      type: String as PropType<string>,
      default: 'Confirmer'
    },
    cancelText: {
      type: String as PropType<string>,
      default: 'Annuler'
    },
    loading: {
      type: Boolean as PropType<boolean>,
      default: false
    }
  },

  emits: ['confirm', 'cancel', 'close'],

  computed: {
    confirmVariant(): 'primary' | 'danger' | 'warning' {
      if (this.variant === 'danger') return 'danger';
      if (this.variant === 'warning') return 'warning';
      return 'primary';
    },

    variantClasses(): { bg: string; icon: string } {
      switch (this.variant) {
        case 'danger':
          return {
            bg: 'bg-red-100 dark:bg-red-900/20',
            icon: 'text-red-600 dark:text-red-400'
          };
        case 'warning':
          return {
            bg: 'bg-yellow-100 dark:bg-yellow-900/20',
            icon: 'text-yellow-600 dark:text-yellow-400'
          };
        case 'info':
          return {
            bg: 'bg-blue-100 dark:bg-blue-900/20',
            icon: 'text-blue-600 dark:text-blue-400'
          };
        default:
          return {
            bg: '',
            icon: ''
          };
      }
    }
  },

  methods: {
    handleConfirm(): void {
      this.$emit('confirm');
    },

    handleCancel(): void {
      this.$emit('cancel');
      this.$emit('close');
    }
  }
});
</script>
