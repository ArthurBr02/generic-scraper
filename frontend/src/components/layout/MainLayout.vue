<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
    <Header />
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
  name: 'MainLayout',

  components: {
    Header,
    ToastContainer
  }
});
</script>
