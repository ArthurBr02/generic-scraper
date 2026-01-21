<template>
  <Teleport to="body">
    <div class="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
      <Toast
        v-for="notification in notifications"
        :key="notification.id"
        :type="notification.type"
        :title="notification.title"
        :message="notification.message"
        :duration="notification.duration"
        :closable="notification.closable"
        @close="removeNotification(notification.id)"
        class="pointer-events-auto"
      />
    </div>
  </Teleport>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { mapState, mapActions } from 'pinia';
import { useNotificationStore } from '@/stores/notification';
import Toast from './Toast.vue';

export default defineComponent({
  name: 'ToastContainer',

  components: {
    Toast
  },

  computed: {
    ...mapState(useNotificationStore, ['notifications'])
  },

  methods: {
    ...mapActions(useNotificationStore, ['removeNotification'])
  }
});
</script>
