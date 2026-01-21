<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
    <Header />
    <main class="w-[100vw]">
      <slot />
    </main>
    <ToastContainer />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import Header from './Header.vue';
import ToastContainer from '../common/ToastContainer.vue';

export default defineComponent({
  name: 'MainVueFlowLayout',

  components: {
    Header,
    ToastContainer
  }
});
</script>
