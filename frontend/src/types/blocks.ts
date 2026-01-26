/**
 * Types pour la définition et la gestion des blocs de workflow
 */

/**
 * Catégories de blocs
 */
export type BlockCategory = 
  | 'navigation'    // Navigation (navigate, wait)
  | 'interaction'   // Interaction (click, input, scroll, form)
  | 'extraction'    // Extraction de données
  | 'api'          // Appels API
  | 'control'      // Structures de contrôle (loop, condition, pagination)
  | 'authentication'; // Authentification (login)

/**
 * Type de port (connexion)
 */
export type PortType = 'flow' | 'data';

/**
 * Type de données pour les ports data
 */
export type DataType = 
  | 'string'
  | 'number'
  | 'boolean'
  | 'object'
  | 'array'
  | 'any';

/**
 * Définition d'un port (entrée ou sortie)
 */
export interface PortDefinition {
  id: string;
  name: string;
  type: PortType;
  dataType?: DataType;
  required: boolean;
  multiple: boolean;  // Permet plusieurs connexions
}

/**
 * Type de champ de configuration
 */
export type FieldType = 
  | 'text'
  | 'textarea'
  | 'number'
  | 'select'
  | 'checkbox'
  | 'code'
  | 'keyvalue'
  | 'array'
  | 'fieldList'  // Liste de champs dynamiques avec sous-schéma
  | 'output';    // Champ de sauvegarde/export (saveAs ou output)

/**
 * Règle de validation
 */
export interface ValidationRule {
  pattern?: string;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  custom?: (value: any) => boolean | string;
}

/**
 * Option pour un champ select
 */
export interface SelectOption {
  value: string | number;
  label: string;
}

/**
 * Définition d'un champ de configuration
 */
export interface ConfigField {
  key: string;
  type: FieldType;
  label: string;
  description?: string;
  required?: boolean;
  default?: any;
  placeholder?: string;
  options?: SelectOption[];
  validation?: ValidationRule;
  dependsOn?: string;  // Champ dont dépend ce champ
  showIf?: { key: string; value: any } | ((config: any) => boolean);  // Condition d'affichage
  itemSchema?: ConfigField[];  // Pour fieldList: schéma des éléments de la liste
}

/**
 * Schéma de configuration d'un bloc
 */
export interface ConfigSchema {
  fields: ConfigField[];
}

/**
 * Définition complète d'un bloc
 */
export interface BlockDefinition {
  id: string;
  type: string;
  category: BlockCategory;
  name: string;
  description: string;
  icon: string;
  color: string;
  disabled?: boolean; // Si true, le bloc n'apparaît pas dans la bibliothèque
  inputs: PortDefinition[];
  outputs: PortDefinition[];
  configSchema: ConfigSchema;
  defaultConfig: Record<string, any>;
}

/**
 * Instance d'un bloc dans le workflow
 */
export interface BlockInstance {
  id: string;
  type: string;
  position: { x: number; y: number };
  config: Record<string, any>;
  selected?: boolean;
  error?: boolean;
  status?: 'idle' | 'running' | 'success' | 'error';
}

/**
 * Connexion entre deux blocs
 */
export interface BlockConnection {
  id: string;
  source: {
    blockId: string;
    portId: string;
  };
  target: {
    blockId: string;
    portId: string;
  };
  status?: 'idle' | 'active' | 'error';
}

/**
 * État du workflow
 */
export interface WorkflowState {
  nodes: BlockInstance[];
  edges: BlockConnection[];
  selectedNodes: string[];
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
  isDirty: boolean;
}
