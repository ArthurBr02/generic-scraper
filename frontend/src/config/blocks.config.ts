/**
 * Configuration des blocs disponibles dans l'éditeur de workflow
 */

import type { BlockDefinition } from '@/types/blocks';

/**
 * Couleurs par catégorie
 */
export const categoryColors: Record<string, string> = {
  navigation: '#3B82F6',      // blue-500
  interaction: '#8B5CF6',     // purple-500
  extraction: '#10B981',      // green-500
  api: '#F59E0B',            // orange-500
  control: '#EAB308',        // yellow-500
  authentication: '#EC4899'   // pink-500
};

/**
 * Icônes par catégorie (Heroicons)
 */
export const categoryIcons: Record<string, string> = {
  navigation: 'M13 10V3L4 14h7v7l9-11h-7z',
  interaction: 'M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122',
  extraction: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12',
  api: 'M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  control: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4',
  authentication: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z'
};

/**
 * Définitions de tous les blocs disponibles
 */
export const blockDefinitions: BlockDefinition[] = [
  // ========== NAVIGATION ==========
  {
    id: 'navigate',
    type: 'navigate',
    category: 'navigation',
    name: 'Navigation',
    description: 'Navigue vers une URL',
    icon: categoryIcons.navigation,
    color: categoryColors.navigation,
    inputs: [
      {
        id: 'in',
        name: 'Entrée',
        type: 'flow',
        required: false,
        multiple: false
      }
    ],
    outputs: [
      {
        id: 'out',
        name: 'Sortie',
        type: 'flow',
        required: false,
        multiple: true
      }
    ],
    configSchema: {
      fields: [
        {
          key: 'url',
          type: 'text',
          label: 'URL',
          required: true,
          placeholder: 'https://example.com'
        },
        {
          key: 'waitUntil',
          type: 'select',
          label: 'Attendre',
          default: 'load',
          options: [
            { value: 'load', label: 'Load complet' },
            { value: 'domcontentloaded', label: 'DOM Content Loaded' },
            { value: 'networkidle', label: 'Network Idle' }
          ]
        },
        {
          key: 'timeout',
          type: 'number',
          label: 'Timeout (ms)',
          default: 30000,
          validation: { min: 0, max: 120000 }
        }
      ]
    },
    defaultConfig: {
      url: '',
      waitUntil: 'load',
      timeout: 30000
    }
  },

  {
    id: 'wait',
    type: 'wait',
    category: 'navigation',
    name: 'Attente',
    description: 'Attend un temps défini ou une condition',
    icon: categoryIcons.navigation,
    color: categoryColors.navigation,
    inputs: [
      {
        id: 'in',
        name: 'Entrée',
        type: 'flow',
        required: false,
        multiple: false
      }
    ],
    outputs: [
      {
        id: 'out',
        name: 'Sortie',
        type: 'flow',
        required: false,
        multiple: true
      }
    ],
    configSchema: {
      fields: [
        {
          key: 'type',
          type: 'select',
          label: 'Type d\'attente',
          default: 'time',
          options: [
            { value: 'time', label: 'Temps fixe' },
            { value: 'selector', label: 'Sélecteur CSS' },
            { value: 'function', label: 'Fonction personnalisée' }
          ]
        },
        {
          key: 'duration',
          type: 'number',
          label: 'Durée (ms)',
          default: 1000,
          showIf: (config) => config.type === 'time'
        },
        {
          key: 'selector',
          type: 'text',
          label: 'Sélecteur',
          placeholder: '.my-element',
          showIf: (config) => config.type === 'selector'
        },
        {
          key: 'timeout',
          type: 'number',
          label: 'Timeout (ms)',
          default: 5000
        }
      ]
    },
    defaultConfig: {
      type: 'time',
      duration: 1000,
      timeout: 5000
    }
  },

  // ========== INTERACTION ==========
  {
    id: 'click',
    type: 'click',
    category: 'interaction',
    name: 'Clic',
    description: 'Clique sur un élément',
    icon: categoryIcons.interaction,
    color: categoryColors.interaction,
    inputs: [
      {
        id: 'in',
        name: 'Entrée',
        type: 'flow',
        required: false,
        multiple: false
      }
    ],
    outputs: [
      {
        id: 'out',
        name: 'Sortie',
        type: 'flow',
        required: false,
        multiple: true
      }
    ],
    configSchema: {
      fields: [
        {
          key: 'selector',
          type: 'text',
          label: 'Sélecteur CSS',
          required: true,
          placeholder: 'button.submit'
        },
        {
          key: 'button',
          type: 'select',
          label: 'Bouton',
          default: 'left',
          options: [
            { value: 'left', label: 'Gauche' },
            { value: 'right', label: 'Droit' },
            { value: 'middle', label: 'Milieu' }
          ]
        },
        {
          key: 'clickCount',
          type: 'number',
          label: 'Nombre de clics',
          default: 1,
          validation: { min: 1, max: 5 }
        },
        {
          key: 'optional',
          type: 'checkbox',
          label: 'Optionnel (ne pas échouer si absent)',
          default: false
        },
        {
          key: 'timeout',
          type: 'number',
          label: 'Timeout (ms)',
          default: 5000
        }
      ]
    },
    defaultConfig: {
      selector: '',
      button: 'left',
      clickCount: 1,
      optional: false,
      timeout: 5000
    }
  },

  {
    id: 'input',
    type: 'input',
    category: 'interaction',
    name: 'Saisie',
    description: 'Saisit du texte dans un champ',
    icon: categoryIcons.interaction,
    color: categoryColors.interaction,
    inputs: [
      {
        id: 'in',
        name: 'Entrée',
        type: 'flow',
        required: false,
        multiple: false
      }
    ],
    outputs: [
      {
        id: 'out',
        name: 'Sortie',
        type: 'flow',
        required: false,
        multiple: true
      }
    ],
    configSchema: {
      fields: [
        {
          key: 'selector',
          type: 'text',
          label: 'Sélecteur CSS',
          required: true,
          placeholder: 'input[name="email"]'
        },
        {
          key: 'value',
          type: 'text',
          label: 'Valeur',
          required: true,
          placeholder: 'Texte à saisir'
        },
        {
          key: 'clear',
          type: 'checkbox',
          label: 'Effacer avant saisie',
          default: true
        },
        {
          key: 'delay',
          type: 'number',
          label: 'Délai entre touches (ms)',
          default: 0
        },
        {
          key: 'timeout',
          type: 'number',
          label: 'Timeout (ms)',
          default: 5000
        }
      ]
    },
    defaultConfig: {
      selector: '',
      value: '',
      clear: true,
      delay: 0,
      timeout: 5000
    }
  },

  {
    id: 'scroll',
    type: 'scroll',
    category: 'interaction',
    name: 'Défilement',
    description: 'Fait défiler la page',
    icon: categoryIcons.interaction,
    color: categoryColors.interaction,
    inputs: [
      {
        id: 'in',
        name: 'Entrée',
        type: 'flow',
        required: false,
        multiple: false
      }
    ],
    outputs: [
      {
        id: 'out',
        name: 'Sortie',
        type: 'flow',
        required: false,
        multiple: true
      }
    ],
    configSchema: {
      fields: [
        {
          key: 'type',
          type: 'select',
          label: 'Type de défilement',
          default: 'pixels',
          options: [
            { value: 'pixels', label: 'Pixels' },
            { value: 'element', label: 'Vers élément' },
            { value: 'bottom', label: 'Jusqu\'en bas' }
          ]
        },
        {
          key: 'x',
          type: 'number',
          label: 'Défilement X (px)',
          default: 0,
          showIf: (config) => config.type === 'pixels'
        },
        {
          key: 'y',
          type: 'number',
          label: 'Défilement Y (px)',
          default: 500,
          showIf: (config) => config.type === 'pixels'
        },
        {
          key: 'selector',
          type: 'text',
          label: 'Sélecteur',
          placeholder: '#target-element',
          showIf: (config) => config.type === 'element'
        }
      ]
    },
    defaultConfig: {
      type: 'pixels',
      x: 0,
      y: 500
    }
  },

  // ========== EXTRACTION ==========
  {
    id: 'extract',
    type: 'extract',
    category: 'extraction',
    name: 'Extraction',
    description: 'Extrait des données de la page',
    icon: categoryIcons.extraction,
    color: categoryColors.extraction,
    inputs: [
      {
        id: 'in',
        name: 'Entrée',
        type: 'flow',
        required: false,
        multiple: false
      }
    ],
    outputs: [
      {
        id: 'out',
        name: 'Sortie',
        type: 'flow',
        required: false,
        multiple: true
      },
      {
        id: 'data',
        name: 'Données',
        type: 'data',
        dataType: 'object',
        required: false,
        multiple: false
      }
    ],
    configSchema: {
      fields: [
        {
          key: 'multiple',
          type: 'checkbox',
          label: 'Extraction multiple',
          default: false,
          description: 'Extrait plusieurs éléments'
        },
        {
          key: 'container',
          type: 'text',
          label: 'Conteneur',
          placeholder: '.article',
          description: 'Sélecteur du conteneur'
        },
        {
          key: 'fields',
          type: 'array',
          label: 'Champs à extraire',
          required: true,
          description: 'Liste des champs à extraire'
        },
        {
          key: 'limit',
          type: 'number',
          label: 'Limite',
          default: 0,
          description: '0 = pas de limite',
          showIf: (config) => config.multiple
        }
      ]
    },
    defaultConfig: {
      multiple: false,
      container: '',
      fields: [],
      limit: 0
    }
  },

  // ========== API ==========
  {
    id: 'api',
    type: 'api',
    category: 'api',
    name: 'Requête API',
    description: 'Effectue une requête HTTP',
    icon: categoryIcons.api,
    color: categoryColors.api,
    inputs: [
      {
        id: 'in',
        name: 'Entrée',
        type: 'flow',
        required: false,
        multiple: false
      }
    ],
    outputs: [
      {
        id: 'out',
        name: 'Sortie',
        type: 'flow',
        required: false,
        multiple: true
      },
      {
        id: 'data',
        name: 'Réponse',
        type: 'data',
        dataType: 'object',
        required: false,
        multiple: false
      }
    ],
    configSchema: {
      fields: [
        {
          key: 'method',
          type: 'select',
          label: 'Méthode',
          default: 'GET',
          options: [
            { value: 'GET', label: 'GET' },
            { value: 'POST', label: 'POST' },
            { value: 'PUT', label: 'PUT' },
            { value: 'DELETE', label: 'DELETE' },
            { value: 'PATCH', label: 'PATCH' }
          ]
        },
        {
          key: 'url',
          type: 'text',
          label: 'URL',
          required: true,
          placeholder: 'https://api.example.com/data'
        },
        {
          key: 'headers',
          type: 'keyvalue',
          label: 'En-têtes',
          default: {}
        },
        {
          key: 'body',
          type: 'code',
          label: 'Corps (JSON)',
          placeholder: '{"key": "value"}',
          showIf: (config) => ['POST', 'PUT', 'PATCH'].includes(config.method)
        }
      ]
    },
    defaultConfig: {
      method: 'GET',
      url: '',
      headers: {},
      body: ''
    }
  },

  // ========== CONTROL ==========
  {
    id: 'loop',
    type: 'loop',
    category: 'control',
    name: 'Boucle',
    description: 'Répète des actions',
    icon: categoryIcons.control,
    color: categoryColors.control,
    inputs: [
      {
        id: 'in',
        name: 'Entrée',
        type: 'flow',
        required: false,
        multiple: false
      }
    ],
    outputs: [
      {
        id: 'out',
        name: 'Sortie',
        type: 'flow',
        required: false,
        multiple: true
      },
      {
        id: 'loop',
        name: 'Corps boucle',
        type: 'flow',
        required: false,
        multiple: true
      }
    ],
    configSchema: {
      fields: [
        {
          key: 'type',
          type: 'select',
          label: 'Type de boucle',
          default: 'count',
          options: [
            { value: 'count', label: 'Nombre d\'itérations' },
            { value: 'while', label: 'Tant que (condition)' }
          ]
        },
        {
          key: 'count',
          type: 'number',
          label: 'Nombre d\'itérations',
          default: 5,
          showIf: (config) => config.type === 'count'
        },
        {
          key: 'condition',
          type: 'code',
          label: 'Condition',
          placeholder: 'page.locator(".next").isVisible()',
          showIf: (config) => config.type === 'while'
        }
      ]
    },
    defaultConfig: {
      type: 'count',
      count: 5
    }
  },

  {
    id: 'condition',
    type: 'condition',
    category: 'control',
    name: 'Condition',
    description: 'Branchement conditionnel',
    icon: categoryIcons.control,
    color: categoryColors.control,
    inputs: [
      {
        id: 'in',
        name: 'Entrée',
        type: 'flow',
        required: false,
        multiple: false
      }
    ],
    outputs: [
      {
        id: 'true',
        name: 'Vrai',
        type: 'flow',
        required: false,
        multiple: true
      },
      {
        id: 'false',
        name: 'Faux',
        type: 'flow',
        required: false,
        multiple: true
      }
    ],
    configSchema: {
      fields: [
        {
          key: 'condition',
          type: 'code',
          label: 'Condition',
          required: true,
          placeholder: 'page.locator(".element").isVisible()'
        }
      ]
    },
    defaultConfig: {
      condition: ''
    }
  },

  // ========== AUTHENTICATION ==========
  {
    id: 'login',
    type: 'login',
    category: 'authentication',
    name: 'Authentification',
    description: 'Se connecte à un site',
    icon: categoryIcons.authentication,
    color: categoryColors.authentication,
    inputs: [
      {
        id: 'in',
        name: 'Entrée',
        type: 'flow',
        required: false,
        multiple: false
      }
    ],
    outputs: [
      {
        id: 'out',
        name: 'Sortie',
        type: 'flow',
        required: false,
        multiple: true
      }
    ],
    configSchema: {
      fields: [
        {
          key: 'type',
          type: 'select',
          label: 'Type d\'authentification',
          default: 'form',
          options: [
            { value: 'form', label: 'Formulaire' },
            { value: 'basic', label: 'HTTP Basic' },
            { value: 'token', label: 'Token Bearer' }
          ]
        },
        {
          key: 'usernameSelector',
          type: 'text',
          label: 'Sélecteur utilisateur',
          placeholder: 'input[name="username"]',
          showIf: (config) => config.type === 'form'
        },
        {
          key: 'passwordSelector',
          type: 'text',
          label: 'Sélecteur mot de passe',
          placeholder: 'input[name="password"]',
          showIf: (config) => config.type === 'form'
        },
        {
          key: 'submitSelector',
          type: 'text',
          label: 'Sélecteur bouton',
          placeholder: 'button[type="submit"]',
          showIf: (config) => config.type === 'form'
        },
        {
          key: 'username',
          type: 'text',
          label: 'Identifiant',
          required: true
        },
        {
          key: 'password',
          type: 'text',
          label: 'Mot de passe',
          required: true
        }
      ]
    },
    defaultConfig: {
      type: 'form',
      username: '',
      password: ''
    }
  }
];

/**
 * Récupère une définition de bloc par son type
 */
export function getBlockDefinition(type: string): BlockDefinition | undefined {
  return blockDefinitions.find(block => block.type === type);
}

/**
 * Récupère tous les blocs d'une catégorie
 */
export function getBlocksByCategory(category: string): BlockDefinition[] {
  return blockDefinitions.filter(block => block.category === category);
}

/**
 * Liste toutes les catégories disponibles
 */
export function getAllCategories(): string[] {
  return Array.from(new Set(blockDefinitions.map(block => block.category)));
}
