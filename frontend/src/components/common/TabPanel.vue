<template>
  <div v-show="isActive" class="tab-panel">
    <slot />
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

export default defineComponent({
  name: 'TabPanel',

  props: {
    id: {
      type: String as PropType<string>,
      required: true
    },
    activeTab: {
      type: String as PropType<string>,
      required: true
    }
  },

  computed: {
    isActive(): boolean {
      return this.id === this.activeTab;
    }
  }
});
</script>
