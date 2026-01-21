<template>
  <header class="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800 transition-colors duration-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <!-- Logo et titre -->
        <div class="flex items-center gap-3">
          <div class="flex-shrink-0">
            <svg class="h-8 w-8 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
          </div>
          <div>
            <h1 class="text-xl font-bold text-gray-900 dark:text-white">
              Generic Scraper
            </h1>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              v{{ version }}
            </p>
          </div>
        </div>

        <!-- Navigation -->
        <nav class="flex items-center gap-6">
          <router-link
            to="/"
            class="text-sm font-medium transition-colors duration-150"
            :class="isActiveRoute('/') 
              ? 'text-primary-600 dark:text-primary-400' 
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'"
          >
            Tâches
          </router-link>
        </nav>

        <!-- Actions -->
        <div class="flex items-center gap-3">
          <!-- Toggle dark mode -->
          <Tooltip :text="themeTooltipText" position="bottom">
            <IconButton
              variant="ghost"
              size="md"
              @click="toggleTheme"
              aria-label="Changer le thème"
            >
              <svg v-if="theme === 'light'" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <svg v-else-if="theme === 'dark'" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
              <svg v-else class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </IconButton>
          </Tooltip>
        </div>
      </div>
    </div>
  </header>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { mapState, mapActions } from 'pinia';
import { useThemeStore } from '@/stores/theme';
import IconButton from '../common/IconButton.vue';
import Tooltip from '../common/Tooltip.vue';

export default defineComponent({
  name: 'Header',

  components: {
    IconButton,
    Tooltip
  },

  data() {
    return {
      version: '2.0.0'
    };
  },

  computed: {
    ...mapState(useThemeStore, ['theme']),

    themeTooltipText(): string {
      if (this.theme === 'light') {
        return 'Passer en mode sombre';
      } else if (this.theme === 'dark') {
        return 'Passer en mode système';
      } else {
        return 'Passer en mode clair';
      }
    }
  },

  methods: {
    ...mapActions(useThemeStore, ['toggleTheme']),

    isActiveRoute(path: string): boolean {
      return this.$route.path === path;
    }
  }
});
</script>
