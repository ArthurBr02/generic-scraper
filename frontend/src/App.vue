<template>
  <div>
    <router-view />
    <ToastContainer />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import ToastContainer from '@/components/common/ToastContainer.vue';

export default defineComponent({
  name: 'App',
  
  components: {
    ToastContainer
  }
});
</script>
