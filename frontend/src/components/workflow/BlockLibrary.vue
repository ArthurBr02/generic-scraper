<template>
  <div class="block-library">
    <!-- Header -->
    <div class="library-header">
      <h3 class="library-title">Bibliothèque de blocs</h3>
      
      <!-- Search -->
      <div class="library-search">
        <div class="relative">
          <svg class="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Rechercher un bloc..."
            class="search-input"
          />
        </div>
      </div>
    </div>

    <!-- Categories -->
    <div class="library-content">
      <div
        v-for="category in filteredCategories"
        :key="category.name"
        class="category-section"
      >
        <button
          class="category-header"
          @click="toggleCategory(category.name)"
        >
          <svg 
            class="category-icon"
            :class="{ 'category-icon-collapsed': !isCategoryExpanded(category.name) }"
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
          <span class="category-name">{{ getCategoryLabel(category.name) }}</span>
          <span class="category-count">{{ category.blocks.length }}</span>
        </button>

        <div v-show="isCategoryExpanded(category.name)" class="category-blocks">
          <div
            v-for="block in category.blocks"
            :key="block.id"
            class="block-item"
            :draggable="true"
            @dragstart="handleDragStart($event, block)"
            @dragend="handleDragEnd"
          >
            <div class="block-item-icon" :style="{ backgroundColor: block.color }">
              <svg class="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="block.icon" />
              </svg>
            </div>
            <div class="block-item-content">
              <div class="block-item-name">{{ block.name }}</div>
              <div class="block-item-description">{{ block.description }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="filteredCategories.length === 0" class="library-empty">
        <svg class="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p class="empty-text">Aucun bloc trouvé</p>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { blockDefinitions, categoryColors } from '@/config/blocks.config';
import type { BlockDefinition } from '@/types/blocks';

interface CategoryGroup {
  name: string;
  blocks: BlockDefinition[];
}

const CATEGORY_LABELS: Record<string, string> = {
  navigation: 'Navigation',
  interaction: 'Interaction',
  extraction: 'Extraction',
  api: 'API',
  control: 'Contrôle',
  authentication: 'Authentification'
};

export default defineComponent({
  name: 'BlockLibrary',

  data() {
    return {
      searchQuery: '',
      expandedCategories: ['navigation', 'interaction', 'extraction'] as string[]
    };
  },

  computed: {
    categories(): CategoryGroup[] {
      const categoryMap = new Map<string, BlockDefinition[]>();
      
      blockDefinitions.forEach(block => {
        if (!categoryMap.has(block.category)) {
          categoryMap.set(block.category, []);
        }
        categoryMap.get(block.category)!.push(block);
      });

      return Array.from(categoryMap.entries()).map(([name, blocks]) => ({
        name,
        blocks
      }));
    },

    filteredCategories(): CategoryGroup[] {
      if (!this.searchQuery) {
        return this.categories;
      }

      const query = this.searchQuery.toLowerCase();
      
      return this.categories
        .map(category => ({
          name: category.name,
          blocks: category.blocks.filter(block =>
            block.name.toLowerCase().includes(query) ||
            block.description.toLowerCase().includes(query) ||
            block.type.toLowerCase().includes(query)
          )
        }))
        .filter(category => category.blocks.length > 0);
    }
  },

  methods: {
    getCategoryLabel(category: string): string {
      return CATEGORY_LABELS[category] || category;
    },

    isCategoryExpanded(category: string): boolean {
      return this.expandedCategories.includes(category);
    },

    toggleCategory(category: string): void {
      const index = this.expandedCategories.indexOf(category);
      if (index > -1) {
        this.expandedCategories.splice(index, 1);
      } else {
        this.expandedCategories.push(category);
      }
    },

    handleDragStart(event: DragEvent, block: BlockDefinition): void {
      if (!event.dataTransfer) return;

      event.dataTransfer.effectAllowed = 'copy';
      event.dataTransfer.setData('application/block-type', block.type);
      event.dataTransfer.setData('application/block-data', JSON.stringify(block));

      this.$emit('block-dragstart', { block, event });
    },

    handleDragEnd(event: DragEvent): void {
      this.$emit('block-dragend', { event });
    }
  }
});
</script>

<style scoped>
.block-library {
  @apply h-full flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700;
  width: 280px;
}

/* Header */
.library-header {
  @apply flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700;
}

.library-title {
  @apply text-lg font-semibold text-gray-900 dark:text-white mb-3;
}

.library-search {
  @apply relative;
}

.search-icon {
  @apply absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400;
}

.search-input {
  @apply w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg;
  @apply bg-white dark:bg-gray-700 text-gray-900 dark:text-white;
  @apply placeholder-gray-400 dark:placeholder-gray-500;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent;
  @apply text-sm;
}

/* Content */
.library-content {
  @apply flex-1 overflow-y-auto p-2;
}

/* Category */
.category-section {
  @apply mb-2;
}

.category-header {
  @apply w-full flex items-center gap-2 px-3 py-2 rounded-lg;
  @apply text-left text-sm font-medium text-gray-700 dark:text-gray-300;
  @apply hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors;
}

.category-icon {
  @apply h-4 w-4 flex-shrink-0 transition-transform;
}

.category-icon-collapsed {
  transform: rotate(-90deg);
}

.category-name {
  @apply flex-1;
}

.category-count {
  @apply flex-shrink-0 text-xs text-gray-500 dark:text-gray-400;
}

.category-blocks {
  @apply mt-1 space-y-1;
}

/* Block item */
.block-item {
  @apply flex items-start gap-2 p-2 rounded-lg cursor-grab;
  @apply bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700;
  @apply border border-gray-200 dark:border-gray-600;
  @apply transition-all duration-150;
}

.block-item:active {
  @apply cursor-grabbing opacity-50;
}

.block-item-icon {
  @apply flex-shrink-0 w-8 h-8 rounded flex items-center justify-center;
}

.block-item-content {
  @apply flex-1 min-w-0;
}

.block-item-name {
  @apply text-sm font-medium text-gray-900 dark:text-white truncate;
}

.block-item-description {
  @apply text-xs text-gray-600 dark:text-gray-400 truncate;
}

/* Empty state */
.library-empty {
  @apply flex flex-col items-center justify-center py-12 px-4;
}

.empty-icon {
  @apply h-12 w-12 text-gray-400 dark:text-gray-600 mb-3;
}

.empty-text {
  @apply text-sm text-gray-500 dark:text-gray-400 text-center;
}

/* Scrollbar */
.library-content::-webkit-scrollbar {
  width: 6px;
}

.library-content::-webkit-scrollbar-track {
  @apply bg-gray-100 dark:bg-gray-800;
}

.library-content::-webkit-scrollbar-thumb {
  @apply bg-gray-300 dark:bg-gray-600 rounded-full;
}

.library-content::-webkit-scrollbar-thumb:hover {
  @apply bg-gray-400 dark:bg-gray-500;
}
</style>
