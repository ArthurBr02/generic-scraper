<template>
  <div class="relative inline-block text-left" ref="dropdown">
    <div @click="toggle">
      <slot name="trigger" :isOpen="isOpen" />
    </div>

    <Transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="isOpen"
        :class="dropdownClasses"
        class="absolute z-50 mt-2 rounded-lg bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
      >
        <div class="py-1" @click="handleItemClick">
          <slot />
        </div>
      </div>
    </Transition>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

type DropdownPosition = 'left' | 'right';

export default defineComponent({
  name: 'Dropdown',

  props: {
    position: {
      type: String as PropType<DropdownPosition>,
      default: 'left'
    },
    width: {
      type: String as PropType<string>,
      default: 'w-56'
    },
    closeOnClick: {
      type: Boolean as PropType<boolean>,
      default: true
    }
  },

  data() {
    return {
      isOpen: false
    };
  },

  computed: {
    dropdownClasses(): string {
      const classes: string[] = [this.width];

      if (this.position === 'right') {
        classes.push('right-0 origin-top-right');
      } else {
        classes.push('left-0 origin-top-left');
      }

      return classes.join(' ');
    }
  },

  methods: {
    toggle(): void {
      this.isOpen = !this.isOpen;
    },

    open(): void {
      this.isOpen = true;
    },

    close(): void {
      this.isOpen = false;
    },

    handleItemClick(): void {
      if (this.closeOnClick) {
        this.close();
      }
    },

    handleClickOutside(event: MouseEvent): void {
      const dropdown = this.$refs.dropdown as HTMLElement;
      if (dropdown && !dropdown.contains(event.target as Node)) {
        this.close();
      }
    }
  },

  mounted() {
    document.addEventListener('click', this.handleClickOutside);
  },

  beforeUnmount() {
    document.removeEventListener('click', this.handleClickOutside);
  }
});
</script>
