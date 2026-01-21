import { defineStore } from 'pinia';

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
    blocks: [
      // Navigation
      {
        id: 'navigate',
        type: 'navigate',
        name: 'Navigation',
        description: 'Navigue vers une URL',
        category: 'navigation',
        icon: '🌐',
        inputs: [{ id: 'in', name: 'Entrée', type: 'flow' }],
        outputs: [{ id: 'out', name: 'Sortie', type: 'flow' }]
      },
      {
        id: 'wait',
        type: 'wait',
        name: 'Attente',
        description: 'Attend un délai ou un sélecteur',
        category: 'navigation',
        icon: '⏱️',
        inputs: [{ id: 'in', name: 'Entrée', type: 'flow' }],
        outputs: [{ id: 'out', name: 'Sortie', type: 'flow' }]
      },
      {
        id: 'screenshot',
        type: 'screenshot',
        name: 'Capture d\'écran',
        description: 'Prend une capture d\'écran',
        category: 'navigation',
        icon: '📸',
        inputs: [{ id: 'in', name: 'Entrée', type: 'flow' }],
        outputs: [{ id: 'out', name: 'Sortie', type: 'flow' }]
      },

      // Actions
      {
        id: 'click',
        type: 'click',
        name: 'Clic',
        description: 'Clique sur un élément',
        category: 'action',
        icon: '👆',
        inputs: [{ id: 'in', name: 'Entrée', type: 'flow' }],
        outputs: [{ id: 'out', name: 'Sortie', type: 'flow' }]
      },
      {
        id: 'type',
        type: 'type',
        name: 'Saisie',
        description: 'Saisit du texte dans un champ',
        category: 'action',
        icon: '⌨️',
        inputs: [{ id: 'in', name: 'Entrée', type: 'flow' }],
        outputs: [{ id: 'out', name: 'Sortie', type: 'flow' }]
      },
      {
        id: 'scroll',
        type: 'scroll',
        name: 'Défilement',
        description: 'Fait défiler la page',
        category: 'action',
        icon: '📜',
        inputs: [{ id: 'in', name: 'Entrée', type: 'flow' }],
        outputs: [{ id: 'out', name: 'Sortie', type: 'flow' }]
      },
      {
        id: 'select',
        type: 'select',
        name: 'Sélection',
        description: 'Sélectionne une option',
        category: 'action',
        icon: '📋',
        inputs: [{ id: 'in', name: 'Entrée', type: 'flow' }],
        outputs: [{ id: 'out', name: 'Sortie', type: 'flow' }]
      },

      // Extraction
      {
        id: 'extract',
        type: 'extract',
        name: 'Extraction',
        description: 'Extrait des données de la page',
        category: 'extraction',
        icon: '📝',
        inputs: [{ id: 'in', name: 'Entrée', type: 'flow' }],
        outputs: [
          { id: 'out', name: 'Sortie', type: 'flow' },
          { id: 'data', name: 'Données', type: 'data', dataType: 'object' }
        ]
      },
      {
        id: 'extractList',
        type: 'extractList',
        name: 'Extraction de liste',
        description: 'Extrait une liste d\'éléments',
        category: 'extraction',
        icon: '📋',
        inputs: [{ id: 'in', name: 'Entrée', type: 'flow' }],
        outputs: [
          { id: 'out', name: 'Sortie', type: 'flow' },
          { id: 'data', name: 'Données', type: 'data', dataType: 'array' }
        ]
      },

      // Contrôle
      {
        id: 'condition',
        type: 'condition',
        name: 'Condition',
        description: 'Exécute conditionnellement',
        category: 'control',
        icon: '🔀',
        inputs: [
          { id: 'in', name: 'Entrée', type: 'flow' },
          { id: 'data', name: 'Données', type: 'data' }
        ],
        outputs: [
          { id: 'true', name: 'Vrai', type: 'flow' },
          { id: 'false', name: 'Faux', type: 'flow' }
        ]
      },
      {
        id: 'loop',
        type: 'loop',
        name: 'Boucle',
        description: 'Répète des actions',
        category: 'control',
        icon: '🔁',
        inputs: [
          { id: 'in', name: 'Entrée', type: 'flow' },
          { id: 'data', name: 'Données', type: 'data', dataType: 'array' }
        ],
        outputs: [
          { id: 'loop', name: 'Itération', type: 'flow' },
          { id: 'item', name: 'Élément', type: 'data' },
          { id: 'done', name: 'Terminé', type: 'flow' }
        ]
      },

      // Sortie
      {
        id: 'output',
        type: 'output',
        name: 'Sortie',
        description: 'Enregistre les données',
        category: 'output',
        icon: '💾',
        inputs: [
          { id: 'in', name: 'Entrée', type: 'flow' },
          { id: 'data', name: 'Données', type: 'data' }
        ],
        outputs: []
      }
    ]
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
