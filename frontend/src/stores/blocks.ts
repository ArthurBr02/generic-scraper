import { defineStore } from 'pinia';
import { blockDefinitions } from '@/config/blocks.config';

// Définition d'un bloc
export interface Block {
  id: string;
  type: string;
  name: string;
  description: string;
  category: 'navigation' | 'action' | 'extraction' | 'control' | 'output';
  icon: string;
  inputs: Port[];
  outputs: Port[];
  configSchema?: any;
}

// Définition d'un port (entrée/sortie)
export interface Port {
  id: string;
  name: string;
  type: 'flow' | 'data';
  dataType?: string; // Pour les ports de données
  required?: boolean;
}

// État du store
export interface BlocksState {
  blocks: Block[];
}

export const useBlocksStore = defineStore('blocks', {
  state: (): BlocksState => ({
    blocks: blockDefinitions as any[]
  }),

  getters: {
    /**
     * Récupère tous les blocs
     */
    getAllBlocks: (state): Block[] => {
      return state.blocks;
    },

    /**
     * Récupère un bloc par son type
     */
    getBlockByType: (state) => (type: string): Block | undefined => {
      return state.blocks.find((block) => block.type === type);
    },

    /**
     * Récupère les blocs d'une catégorie
     */
    getBlocksByCategory: (state) => (category: string): Block[] => {
      return state.blocks.filter((block) => block.category === category);
    },

    /**
     * Récupère les catégories disponibles
     */
    getCategories: (state): string[] => {
      return [...new Set(state.blocks.map((block) => block.category))];
    }
  },

  actions: {
    /**
     * Ajoute un bloc personnalisé
     */
    addCustomBlock(block: Block): void {
      this.blocks.push(block);
    },

    /**
     * Supprime un bloc personnalisé
     */
    removeCustomBlock(blockId: string): void {
      this.blocks = this.blocks.filter((block) => block.id !== blockId);
    }
  }
});
