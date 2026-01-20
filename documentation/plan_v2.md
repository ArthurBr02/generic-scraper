# Plan d'implémentation V2 - Interface Utilisateur Graphique

> **Objectif principal** : Créer une interface web avec drag & drop de blocs pour créer des workflows de scraping, comme n8n.

---

## 📋 Résumé Exécutif

| Information | Détail |
|-------------|--------|
| **Version** | 2.0.0 |
| **Durée estimée** | 12-14 semaines |
| **Nombre de phases** | 4 |
| **Nombre de sprints** | 12 |
| **Stack Frontend** | Vue.js 3 + TypeScript + TailwindCSS |
| **Stack Backend** | Node.js + Express + WebSocket |
| **Containerisation** | Docker + Docker Compose |

---

## ⚠️ Note Importante sur l'Architecture

### Réutilisation du Code Scraper Existant

**Le backend V2 NE réécrit PAS le moteur de scraping**. Il réutilise le code existant dans `src/` de manière intelligente :

#### 🔧 Comment ça fonctionne ?

1. **Le code scraper existant reste intact** (`src/index.js`, `src/core/`, `src/actions/`, etc.)
2. **Le backend TypeScript** (`backend/`) agit comme une **couche d'orchestration** :
   - Il expose une API REST pour gérer les configurations
   - Il lance les scrapers via `child_process.spawn()` en appelant `node src/index.js --config <path>`
   - Il capture les logs et la progression via stdout/stderr
   - Il transmet les événements en temps réel via WebSocket

#### 📦 Architecture en couches

```
┌─────────────────────────────────────────────────────────┐
│  Frontend Vue.js (Interface graphique)                  │
│  - Éditeur drag & drop                                  │
│  - Visualisation logs/données                           │
└──────────────────┬──────────────────────────────────────┘
                   │ HTTP/WebSocket
┌──────────────────▼──────────────────────────────────────┐
│  Backend Express/TypeScript (Orchestrateur)             │
│  - API REST (configs, tasks, logs)                      │
│  - WebSocket (temps réel)                               │
│  - Gestion des processus                                │
└──────────────────┬──────────────────────────────────────┘
                   │ spawn()
┌──────────────────▼──────────────────────────────────────┐
│  Scraper Engine (Code existant en CommonJS)             │
│  - src/index.js (CLI)                                   │
│  - src/core/scraper.js                                  │
│  - src/actions/* (11 actions)                           │
│  - src/extractors/* (4 extractors)                      │
└─────────────────────────────────────────────────────────┘
```

#### ✅ Avantages de cette approche

- **Pas de réécriture** : Le moteur de scraping fonctionne déjà parfaitement
- **Isolation** : Chaque tâche de scraping tourne dans son propre processus
- **Stabilité** : Un crash de scraper n'affecte pas le backend
- **Compatibilité** : Les configurations JSON existantes fonctionnent sans modification
- **Évolutivité** : Facile d'ajouter des features au backend sans toucher au scraper

#### 🔄 Flux d'exécution

```
1. Frontend : Utilisateur crée un workflow via drag & drop
2. Frontend : Envoie la config JSON au backend (POST /api/configs)
3. Backend : Sauvegarde la config dans configs/
4. Frontend : Lance le scraper (POST /api/tasks)
5. Backend : Exécute `spawn('node', ['src/index.js', '--config', 'configs/my-config.json'])`
6. Backend : Capture stdout/stderr du processus
7. Backend : Parse les logs et envoie via WebSocket au frontend
8. Scraper : S'exécute normalement, écrit dans logs/ et output/
9. Backend : Détecte la fin du processus, notifie le frontend
10. Frontend : Affiche les résultats et permet de visualiser les données
```

#### 🛠️ Implémentation technique (Sprint 3)

Le `ScraperService` du backend sera simple :

```typescript
class ScraperService {
  async startScraper(configName: string): Promise<string> {
    const taskId = generateId();
    const configPath = path.join(config.dirs.configs, `${configName}.json`);
    
    // Lancer le scraper existant
    const child = spawn('node', [
      path.join(config.dirs.scraper, 'index.js'),
      '--config', configPath
    ]);
    
    // Capturer les logs
    child.stdout.on('data', (data) => {
      this.handleLog(taskId, data.toString());
    });
    
    child.stderr.on('data', (data) => {
      this.handleError(taskId, data.toString());
    });
    
    child.on('close', (code) => {
      this.handleComplete(taskId, code);
    });
    
    return taskId;
  }
}
```

Cette approche est **100% faisable** et **recommandée** car elle maximise la réutilisation du code existant.

---

## 🏗️ Architecture Globale

```
generic-scraper/
├── backend/                    # API Node.js/Express
│   ├── src/
│   │   ├── api/               # Routes REST
│   │   ├── websocket/         # Communication temps réel
│   │   ├── services/          # Logique métier
│   │   └── middleware/        # Middlewares Express
│   ├── Dockerfile
│   └── package.json
│
├── frontend/                   # Interface Vue.js
│   ├── src/
│   │   ├── components/        # Composants Vue
│   │   ├── views/             # Pages
│   │   ├── stores/            # Pinia stores
│   │   ├── composables/       # Logique réutilisable
│   │   └── services/          # API client
│   ├── Dockerfile
│   └── package.json
│
├── src/                        # Code scraper existant (inchangé)
├── configs/                    # Configurations JSON
├── logs/                       # Logs
├── output/                     # Données extraites
└── docker-compose.yml          # Orchestration
```

---

# 📅 Phase 1 : Infrastructure & Backend API

> **Objectif** : Mettre en place l'infrastructure Docker et l'API backend de base.
> 
> **Durée** : 3 sprints (3 semaines)

---

## Sprint 1 : Configuration Docker & Structure Backend

**Durée** : 1 semaine

### Tâches

#### 1.1 Configuration Docker Compose
- [ ] Créer `docker-compose.yml` avec services backend et frontend
- [ ] Configurer les volumes pour configs/, logs/, output/
- [ ] Définir le réseau interne Docker
- [ ] Configurer les variables d'environnement

**Fichiers à créer** :
```
docker-compose.yml
.env.example
.dockerignore
```

**docker-compose.yml** :
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "3001:3001"
    volumes:
      - ./configs:/app/configs
      - ./logs:/app/logs
      - ./output:/app/output
      - ./src:/app/scraper
    environment:
      - NODE_ENV=development
      - WS_PORT=3002
    
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend
    environment:
      - VITE_API_URL=http://localhost:3001
      - VITE_WS_URL=ws://localhost:3002
```

#### 1.2 Structure Backend
- [ ] Initialiser le projet Node.js avec TypeScript
- [ ] Configurer ESLint + Prettier
- [ ] Créer la structure de dossiers
- [ ] Configurer le Dockerfile backend

**Fichiers à créer** :
```
backend/
├── src/
│   ├── index.ts              # Point d'entrée
│   ├── app.ts                # Configuration Express
│   ├── config/
│   │   └── index.ts          # Configuration centralisée
│   ├── api/
│   │   └── routes/
│   │       └── index.ts      # Routeur principal
│   ├── middleware/
│   │   ├── errorHandler.ts   # Gestion des erreurs
│   │   └── cors.ts           # Configuration CORS
│   └── types/
│       └── index.ts          # Types TypeScript
├── Dockerfile
├── package.json
├── tsconfig.json
└── .eslintrc.js
```

#### 1.3 Configuration Express de base
- [ ] Configurer Express avec CORS
- [ ] Ajouter middleware de logging
- [ ] Configurer les routes de base
- [ ] Ajouter endpoint de health check

**Livrables Sprint 1** :
- ✅ Docker Compose fonctionnel
- ✅ Backend Express démarrable
- ✅ Structure de projet établie

---

## Sprint 2 : API REST - Gestion des Configurations

**Durée** : 1 semaine

### Tâches

#### 2.1 Service de gestion des fichiers de configuration
- [ ] Créer `ConfigService` pour CRUD des configurations
- [ ] Implémenter lecture du dossier configs/
- [ ] Implémenter sauvegarde de configurations
- [ ] Implémenter suppression de configurations

**Fichiers à créer** :
```
backend/src/services/
├── configService.ts          # Gestion des fichiers config
├── validationService.ts      # Validation JSON Schema
└── index.ts                  # Export des services
```

**Interface ConfigService** :
```typescript
interface ConfigService {
  listConfigs(): Promise<ConfigSummary[]>;
  getConfig(name: string): Promise<Config>;
  saveConfig(name: string, config: Config): Promise<void>;
  deleteConfig(name: string): Promise<void>;
  duplicateConfig(name: string, newName: string): Promise<void>;
  validateConfig(config: Config): ValidationResult;
}
```

#### 2.2 Routes API pour les configurations
- [ ] GET `/api/configs` - Liste des configurations
- [ ] GET `/api/configs/:name` - Détail d'une configuration
- [ ] POST `/api/configs` - Créer une configuration
- [ ] PUT `/api/configs/:name` - Modifier une configuration
- [ ] DELETE `/api/configs/:name` - Supprimer une configuration
- [ ] POST `/api/configs/:name/duplicate` - Dupliquer

**Fichiers à créer** :
```
backend/src/api/routes/
├── configs.ts                # Routes configurations
└── index.ts                  # Routeur principal
```

#### 2.3 Validation des configurations
- [ ] Intégrer le schema.json existant
- [ ] Créer endpoint de validation
- [ ] POST `/api/configs/validate` - Valider une configuration

**Livrables Sprint 2** :
- ✅ API CRUD configurations fonctionnelle
- ✅ Validation JSON Schema intégrée
- ✅ Tests manuels avec Postman/curl

---

## Sprint 3 : API REST - Exécution des Scrapers

**Durée** : 1 semaine

### Tâches

#### 3.1 Service d'exécution des scrapers
- [ ] Créer `ScraperService` pour lancer des scrapers
- [ ] Intégrer le code scraper existant (src/)
- [ ] Gérer les processus enfants (spawn)
- [ ] Suivre l'état des exécutions en cours

**Fichiers à créer** :
```
backend/src/services/
├── scraperService.ts         # Exécution des scrapers
├── processManager.ts         # Gestion des processus
└── taskQueue.ts              # File d'attente des tâches
```

**Interface ScraperService** :
```typescript
interface ScraperService {
  startScraper(configName: string): Promise<TaskId>;
  stopScraper(taskId: string): Promise<void>;
  getTaskStatus(taskId: string): TaskStatus;
  listRunningTasks(): RunningTask[];
}

interface TaskStatus {
  id: string;
  configName: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: Date;
  endTime?: Date;
  progress?: { current: number; total: number };
  error?: string;
}
```

#### 3.2 Routes API pour l'exécution
- [ ] POST `/api/tasks` - Lancer un scraper
- [ ] GET `/api/tasks` - Liste des tâches en cours
- [ ] GET `/api/tasks/:id` - Statut d'une tâche
- [ ] DELETE `/api/tasks/:id` - Arrêter une tâche

**Fichiers à créer** :
```
backend/src/api/routes/
├── tasks.ts                  # Routes tâches
└── index.ts                  # Mise à jour routeur
```

#### 3.3 Service de logs
- [ ] Créer `LogService` pour lire les logs
- [ ] GET `/api/logs` - Liste des fichiers de logs
- [ ] GET `/api/logs/:name` - Contenu d'un fichier de log
- [ ] GET `/api/logs/:name/tail` - Dernières lignes (pour streaming)

**Fichiers à créer** :
```
backend/src/services/
└── logService.ts             # Lecture des logs
```

**Livrables Sprint 3** :
- ✅ Lancement de scrapers via API
- ✅ Suivi du statut des tâches
- ✅ Lecture des logs via API

---

# 📅 Phase 2 : Communication Temps Réel & Frontend Base

> **Objectif** : Ajouter WebSocket et créer la structure frontend Vue.js.
> 
> **Durée** : 3 sprints (3 semaines)

---

## Sprint 4 : WebSocket - Communication Temps Réel

**Durée** : 1 semaine

### Tâches

#### 4.1 Configuration WebSocket backend
- [ ] Installer `ws` ou `socket.io`
- [ ] Créer serveur WebSocket
- [ ] Gérer les connexions/déconnexions clients
- [ ] Implémenter système de rooms (par tâche)

**Fichiers à créer** :
```
backend/src/websocket/
├── server.ts                 # Serveur WebSocket
├── handlers/
│   ├── taskHandler.ts        # Événements tâches
│   └── logHandler.ts         # Événements logs
├── events.ts                 # Types d'événements
└── index.ts
```

**Événements WebSocket** :
```typescript
// Événements serveur -> client
interface ServerEvents {
  'task:started': { taskId: string; configName: string };
  'task:progress': { taskId: string; progress: number; message: string };
  'task:completed': { taskId: string; result: any };
  'task:failed': { taskId: string; error: string };
  'log:new': { taskId: string; level: string; message: string; timestamp: Date };
}

// Événements client -> serveur
interface ClientEvents {
  'task:subscribe': { taskId: string };
  'task:unsubscribe': { taskId: string };
  'logs:subscribe': { taskId: string };
  'logs:unsubscribe': { taskId: string };
}
```

#### 4.2 Streaming des logs
- [ ] Créer watcher sur le dossier logs/
- [ ] Détecter les nouvelles lignes en temps réel
- [ ] Envoyer les mises à jour via WebSocket
- [ ] Filtrer par tâche

#### 4.3 Événements de progression
- [ ] Modifier le scraper pour émettre des événements
- [ ] Capturer les événements du processus enfant
- [ ] Transmettre via WebSocket

**Livrables Sprint 4** :
- ✅ Serveur WebSocket fonctionnel
- ✅ Streaming des logs en temps réel
- ✅ Progression des tâches en temps réel

---

## Sprint 5 : Structure Frontend Vue.js

**Durée** : 1 semaine

### Tâches

#### 5.1 Initialisation du projet Vue.js
- [ ] Créer projet avec Vite + Vue 3 + TypeScript
- [ ] Configurer TailwindCSS
- [ ] Configurer Vue Router
- [ ] Configurer Pinia (state management)
- [ ] Créer Dockerfile frontend

**Commandes** :
```bash
npm create vite@latest frontend -- --template vue-ts
cd frontend
npm install tailwindcss postcss autoprefixer
npm install vue-router@4 pinia
npm install @vueuse/core
```

**Fichiers à créer** :
```
frontend/
├── src/
│   ├── main.ts
│   ├── App.vue
│   ├── router/
│   │   └── index.ts          # Configuration routes
│   ├── stores/
│   │   ├── config.ts         # Store configurations
│   │   ├── tasks.ts          # Store tâches
│   │   └── websocket.ts      # Store WebSocket
│   ├── services/
│   │   ├── api.ts            # Client HTTP
│   │   └── websocket.ts      # Client WebSocket
│   ├── components/
│   │   └── layout/
│   │       ├── AppHeader.vue
│   │       ├── AppSidebar.vue
│   │       └── AppLayout.vue
│   └── views/
│       ├── DashboardView.vue
│       ├── ConfigsView.vue
│       ├── TasksView.vue
│       └── LogsView.vue
├── Dockerfile
├── tailwind.config.js
├── postcss.config.js
└── vite.config.ts
```

#### 5.2 Service API Client
- [ ] Créer client HTTP avec fetch/axios
- [ ] Gérer les erreurs API
- [ ] Typer les réponses

**Interface API Client** :
```typescript
// frontend/src/services/api.ts
const api = {
  configs: {
    list: () => Promise<ConfigSummary[]>,
    get: (name: string) => Promise<Config>,
    save: (name: string, config: Config) => Promise<void>,
    delete: (name: string) => Promise<void>,
    validate: (config: Config) => Promise<ValidationResult>,
  },
  tasks: {
    start: (configName: string) => Promise<{ taskId: string }>,
    list: () => Promise<RunningTask[]>,
    get: (id: string) => Promise<TaskStatus>,
    stop: (id: string) => Promise<void>,
  },
  logs: {
    list: () => Promise<LogFile[]>,
    get: (name: string) => Promise<string>,
  },
};
```

#### 5.3 Service WebSocket Client
- [ ] Créer client WebSocket réactif
- [ ] Gérer reconnexion automatique
- [ ] Intégrer avec Pinia

**Livrables Sprint 5** :
- ✅ Projet Vue.js configuré
- ✅ Layout de base fonctionnel
- ✅ Services API et WebSocket

---

## Sprint 6 : Pages de Base & Navigation

**Durée** : 1 semaine

### Tâches

#### 6.1 Layout Principal
- [ ] Créer header avec logo et navigation
- [ ] Créer sidebar avec menu
- [ ] Créer layout responsive
- [ ] Ajouter thème sombre (optionnel)

**Composants** :
```
frontend/src/components/layout/
├── AppLayout.vue             # Layout principal
├── AppHeader.vue             # Header avec nav
├── AppSidebar.vue            # Sidebar menu
├── AppBreadcrumb.vue         # Fil d'Ariane
└── AppFooter.vue             # Footer
```

#### 6.2 Page Dashboard
- [ ] Afficher statistiques globales
- [ ] Liste des tâches récentes
- [ ] Liste des dernières configurations
- [ ] Graphiques simples (optionnel)

**Composants** :
```
frontend/src/views/
└── DashboardView.vue

frontend/src/components/dashboard/
├── StatsCard.vue             # Carte statistique
├── RecentTasks.vue           # Tâches récentes
├── RecentConfigs.vue         # Configs récentes
└── QuickActions.vue          # Actions rapides
```

#### 6.3 Page Liste des Configurations
- [ ] Afficher liste des configurations
- [ ] Actions: ouvrir, dupliquer, supprimer
- [ ] Filtrer et rechercher
- [ ] Bouton créer nouvelle config

**Composants** :
```
frontend/src/views/
└── ConfigsView.vue

frontend/src/components/configs/
├── ConfigsList.vue           # Liste des configs
├── ConfigCard.vue            # Carte d'une config
├── ConfigActions.vue         # Actions sur config
└── ConfigSearch.vue          # Recherche/filtre
```

#### 6.4 Page Liste des Tâches
- [ ] Afficher tâches en cours et passées
- [ ] Statut en temps réel (WebSocket)
- [ ] Actions: arrêter, voir logs
- [ ] Filtrer par statut

**Composants** :
```
frontend/src/views/
└── TasksView.vue

frontend/src/components/tasks/
├── TasksList.vue             # Liste des tâches
├── TaskCard.vue              # Carte d'une tâche
├── TaskStatus.vue            # Badge de statut
├── TaskProgress.vue          # Barre de progression
└── TaskActions.vue           # Actions sur tâche
```

**Livrables Sprint 6** :
- ✅ Navigation complète
- ✅ Dashboard fonctionnel
- ✅ Liste configurations
- ✅ Liste tâches avec temps réel

---

# 📅 Phase 3 : Éditeur de Workflow Drag & Drop

> **Objectif** : Créer l'éditeur visuel de workflows avec drag & drop.
> 
> **Durée** : 4 sprints (4 semaines)

---

## Sprint 7 : Canvas de Workflow - Base

**Durée** : 1 semaine

### Tâches

#### 7.1 Choix et intégration de la bibliothèque
- [ ] Évaluer les options (Vue Flow, Drawflow, custom)
- [ ] Installer et configurer la bibliothèque choisie
- [ ] Créer composant canvas de base

**Options recommandées** :
1. **Vue Flow** (recommandé) - Fork de React Flow pour Vue 3
2. **Drawflow** - Léger et simple
3. **Rete.js** - Puissant mais plus complexe

**Installation** :
```bash
npm install @vue-flow/core @vue-flow/background @vue-flow/controls @vue-flow/minimap
```

**Fichiers à créer** :
```
frontend/src/components/workflow/
├── WorkflowCanvas.vue        # Canvas principal
├── WorkflowControls.vue      # Contrôles (zoom, reset)
├── WorkflowMinimap.vue       # Minimap
└── WorkflowBackground.vue    # Fond (grille)
```

#### 7.2 Système de nœuds de base
- [ ] Créer composant nœud générique
- [ ] Implémenter drag & drop depuis palette
- [ ] Permettre connexion entre nœuds
- [ ] Gérer la suppression de nœuds

**Fichiers à créer** :
```
frontend/src/components/workflow/nodes/
├── BaseNode.vue              # Nœud de base
├── StartNode.vue             # Nœud de départ
├── EndNode.vue               # Nœud de fin
└── ActionNode.vue            # Nœud d'action générique
```

#### 7.3 Store Workflow
- [ ] Créer store Pinia pour le workflow
- [ ] Gérer la liste des nœuds
- [ ] Gérer les connexions (edges)
- [ ] Historique undo/redo (optionnel)

**Store Workflow** :
```typescript
// frontend/src/stores/workflow.ts
interface WorkflowStore {
  nodes: Node[];
  edges: Edge[];
  selectedNode: Node | null;
  
  addNode(type: string, position: Position): void;
  removeNode(id: string): void;
  updateNode(id: string, data: Partial<Node>): void;
  addEdge(source: string, target: string): void;
  removeEdge(id: string): void;
  
  toConfig(): Config;
  fromConfig(config: Config): void;
}
```

**Livrables Sprint 7** :
- ✅ Canvas avec grille
- ✅ Drag & drop de nœuds
- ✅ Connexions entre nœuds

---

## Sprint 8 : Palette de Blocs (Actions)

**Durée** : 1 semaine

### Tâches

#### 8.1 Palette latérale
- [ ] Créer sidebar de blocs disponibles
- [ ] Catégoriser les blocs
- [ ] Permettre drag depuis la palette
- [ ] Ajouter recherche de blocs

**Fichiers à créer** :
```
frontend/src/components/workflow/
├── BlockPalette.vue          # Palette principale
├── BlockCategory.vue         # Catégorie de blocs
├── BlockItem.vue             # Item draggable
└── BlockSearch.vue           # Recherche
```

**Catégories et blocs** :
```typescript
const blockCategories = [
  {
    name: 'Navigation',
    icon: 'compass',
    blocks: ['navigate', 'click', 'scroll', 'wait']
  },
  {
    name: 'Données',
    icon: 'database',
    blocks: ['extract', 'input']
  },
  {
    name: 'API',
    icon: 'cloud',
    blocks: ['api']
  },
  {
    name: 'Contrôle',
    icon: 'git-branch',
    blocks: ['pagination', 'loop', 'condition', 'subWorkflow']
  }
];
```

#### 8.2 Création des nœuds pour chaque action
- [ ] Navigate Node
- [ ] Click Node
- [ ] Scroll Node
- [ ] Wait Node
- [ ] Input Node
- [ ] Extract Node
- [ ] API Node
- [ ] Pagination Node
- [ ] Loop Node
- [ ] Condition Node
- [ ] SubWorkflow Node

**Fichiers à créer** :
```
frontend/src/components/workflow/nodes/
├── NavigateNode.vue
├── ClickNode.vue
├── ScrollNode.vue
├── WaitNode.vue
├── InputNode.vue
├── ExtractNode.vue
├── ApiNode.vue
├── PaginationNode.vue
├── LoopNode.vue
├── ConditionNode.vue
└── SubWorkflowNode.vue
```

#### 8.3 Définition des blocs
- [ ] Créer fichier de définition pour chaque bloc
- [ ] Spécifier les ports d'entrée/sortie
- [ ] Définir les paramètres par défaut
- [ ] Ajouter icônes et couleurs

**Fichiers à créer** :
```
frontend/src/config/blocks/
├── index.ts                  # Export de tous les blocs
├── navigate.ts
├── click.ts
├── scroll.ts
├── wait.ts
├── input.ts
├── extract.ts
├── api.ts
├── pagination.ts
├── loop.ts
├── condition.ts
└── subWorkflow.ts
```

**Exemple de définition** :
```typescript
// frontend/src/config/blocks/navigate.ts
export const navigateBlock: BlockDefinition = {
  type: 'navigate',
  category: 'Navigation',
  label: 'Navigate',
  icon: 'compass',
  color: '#3b82f6',
  description: 'Navigate to a URL',
  inputs: ['trigger'],
  outputs: ['success', 'error'],
  defaultConfig: {
    url: '',
    waitUntil: 'networkidle'
  },
  configSchema: {
    url: { type: 'string', required: true, label: 'URL' },
    waitUntil: { 
      type: 'select', 
      options: ['load', 'domcontentloaded', 'networkidle'],
      default: 'networkidle'
    }
  }
};
```

**Livrables Sprint 8** :
- ✅ Palette de blocs complète
- ✅ Tous les types de nœuds créés
- ✅ Drag & drop depuis palette

---

## Sprint 9 : Panneau de Configuration des Blocs

**Durée** : 1 semaine

### Tâches

#### 9.1 Panneau latéral de propriétés
- [ ] Créer panneau qui s'affiche à la sélection
- [ ] Afficher les propriétés du nœud sélectionné
- [ ] Permettre l'édition des propriétés
- [ ] Valider les entrées en temps réel

**Fichiers à créer** :
```
frontend/src/components/workflow/
├── NodePropertiesPanel.vue   # Panneau principal
├── PropertyGroup.vue         # Groupe de propriétés
└── PropertyField.vue         # Champ de propriété
```

#### 9.2 Composants de formulaire pour les propriétés
- [ ] Input texte (simple, URL, selector)
- [ ] Select (dropdown)
- [ ] Checkbox
- [ ] Number input
- [ ] Éditeur JSON
- [ ] Champ template avec suggestions

**Fichiers à créer** :
```
frontend/src/components/form/
├── TextInput.vue             # Input texte
├── SelectInput.vue           # Dropdown
├── CheckboxInput.vue         # Checkbox
├── NumberInput.vue           # Nombre
├── JsonEditor.vue            # Éditeur JSON
├── TemplateInput.vue         # Input avec {{variables}}
├── SelectorInput.vue         # Input sélecteur CSS
└── KeyValueInput.vue         # Paires clé/valeur
```

#### 9.3 Configuration spécifique par type de bloc
- [ ] Formulaire Navigate (url, waitUntil, timeout)
- [ ] Formulaire Click (selector, waitAfter)
- [ ] Formulaire Scroll (direction, distance, behavior)
- [ ] Formulaire Wait (type, duration, selector)
- [ ] Formulaire Input (selector, value, clear)
- [ ] Formulaire Extract (fields, saveAs, format)
- [ ] Formulaire API (method, url, headers, body)
- [ ] Formulaire Pagination (type, selector, maxPages)
- [ ] Formulaire Loop (selector, variable, steps)
- [ ] Formulaire Condition (condition, then, else)

**Fichiers à créer** :
```
frontend/src/components/workflow/config/
├── NavigateConfig.vue
├── ClickConfig.vue
├── ScrollConfig.vue
├── WaitConfig.vue
├── InputConfig.vue
├── ExtractConfig.vue
├── ApiConfig.vue
├── PaginationConfig.vue
├── LoopConfig.vue
└── ConditionConfig.vue
```

#### 9.4 Éditeur de champs Extract
- [ ] Interface pour ajouter/supprimer des champs
- [ ] Configuration du type d'extracteur
- [ ] Configuration des transformations
- [ ] Preview des sélecteurs

**Fichiers à créer** :
```
frontend/src/components/workflow/extract/
├── FieldsEditor.vue          # Éditeur de champs
├── FieldRow.vue              # Ligne de champ
├── ExtractorConfig.vue       # Config extracteur
└── TransformConfig.vue       # Config transformations
```

**Livrables Sprint 9** :
- ✅ Panneau de propriétés fonctionnel
- ✅ Tous les formulaires de configuration
- ✅ Validation en temps réel

---

## Sprint 10 : Conversion Workflow ↔ JSON

**Durée** : 1 semaine

### Tâches

#### 10.1 Sérialisation Workflow vers Config JSON
- [ ] Convertir la structure de nœuds en steps
- [ ] Gérer l'ordre des étapes (topological sort)
- [ ] Gérer les blocs imbriqués (pagination, loop, condition)
- [ ] Valider la configuration générée

**Fichiers à créer** :
```
frontend/src/utils/
├── workflowSerializer.ts     # Workflow -> JSON
├── workflowDeserializer.ts   # JSON -> Workflow
├── topologicalSort.ts        # Tri des nœuds
└── configValidator.ts        # Validation
```

**Logique de sérialisation** :
```typescript
// frontend/src/utils/workflowSerializer.ts
interface SerializerResult {
  config: Config;
  errors: ValidationError[];
  warnings: Warning[];
}

function serializeWorkflow(workflow: WorkflowState): SerializerResult {
  // 1. Valider la structure (nœud start, connectivité)
  // 2. Trier les nœuds (topological sort)
  // 3. Convertir chaque nœud en step
  // 4. Gérer les imbrications (loop, condition)
  // 5. Assembler la config finale
}
```

#### 10.2 Désérialisation Config JSON vers Workflow
- [ ] Parser les steps en nœuds
- [ ] Générer les positions des nœuds (layout automatique)
- [ ] Créer les connexions
- [ ] Gérer les structures imbriquées

**Logique de désérialisation** :
```typescript
// frontend/src/utils/workflowDeserializer.ts
interface DeserializerResult {
  nodes: Node[];
  edges: Edge[];
  errors: ValidationError[];
}

function deserializeConfig(config: Config): DeserializerResult {
  // 1. Créer nœud Start
  // 2. Pour chaque step, créer un nœud
  // 3. Positionner les nœuds avec algorithme de layout
  // 4. Créer les edges entre nœuds consécutifs
  // 5. Gérer les branches (condition)
}
```

#### 10.3 Import/Export de configurations
- [ ] Bouton "Importer JSON"
- [ ] Bouton "Exporter JSON" 
- [ ] Aperçu JSON en temps réel (optionnel)
- [ ] Copier dans le presse-papier

**Fichiers à créer** :
```
frontend/src/components/workflow/
├── ImportExportPanel.vue     # Panneau import/export
├── JsonPreview.vue           # Aperçu JSON
└── ImportDialog.vue          # Dialog d'import
```

#### 10.4 Sauvegarde et chargement
- [ ] Sauvegarder dans le store
- [ ] Sauvegarder sur le backend
- [ ] Charger une configuration existante
- [ ] Détection des modifications non sauvegardées

**Livrables Sprint 10** :
- ✅ Conversion workflow <-> JSON
- ✅ Import/export fonctionnel
- ✅ Sauvegarde/chargement

---

# 📅 Phase 4 : Visualisation & Finitions

> **Objectif** : Ajouter les vues de données, logs temps réel et finaliser.
> 
> **Durée** : 2 sprints (2 semaines)

---

## Sprint 11 : Visualisation des Données & Logs

**Durée** : 1 semaine

### Tâches

#### 11.1 Visualiseur de logs en temps réel
- [ ] Créer composant de logs streaming
- [ ] Filtrer par niveau (debug, info, warn, error)
- [ ] Filtrer par tâche
- [ ] Recherche dans les logs
- [ ] Export des logs

**Fichiers à créer** :
```
frontend/src/views/
└── LogsView.vue

frontend/src/components/logs/
├── LogsViewer.vue            # Viewer principal
├── LogLine.vue               # Ligne de log
├── LogFilter.vue             # Filtres
├── LogSearch.vue             # Recherche
└── LogExport.vue             # Export
```

#### 11.2 Visualiseur de données JSON
- [ ] Créer viewer JSON avec arborescence
- [ ] Permettre expansion/collapse
- [ ] Copier des valeurs
- [ ] Recherche dans les données

**Fichiers à créer** :
```
frontend/src/components/data/
├── JsonViewer.vue            # Viewer JSON
├── JsonNode.vue              # Nœud JSON
├── JsonSearch.vue            # Recherche
└── JsonToolbar.vue           # Actions
```

#### 11.3 Visualiseur de données CSV/Table
- [ ] Créer composant table de données
- [ ] Pagination des données
- [ ] Tri par colonne
- [ ] Filtrage par colonne
- [ ] Export CSV

**Fichiers à créer** :
```
frontend/src/components/data/
├── DataTable.vue             # Table principale
├── TableHeader.vue           # En-têtes triables
├── TableRow.vue              # Ligne de données
├── TablePagination.vue       # Pagination
├── TableFilter.vue           # Filtres
└── TableExport.vue           # Export
```

#### 11.4 Page de visualisation des outputs
- [ ] Lister les fichiers output/
- [ ] Ouvrir et visualiser JSON
- [ ] Ouvrir et visualiser CSV
- [ ] Télécharger les fichiers

**Fichiers à créer** :
```
frontend/src/views/
└── OutputsView.vue

frontend/src/components/outputs/
├── OutputsList.vue           # Liste des fichiers
├── OutputCard.vue            # Carte d'un output
└── OutputViewer.vue          # Viewer intégré
```

**Routes API à ajouter** :
- GET `/api/outputs` - Liste des fichiers output
- GET `/api/outputs/:name` - Contenu d'un fichier
- GET `/api/outputs/:name/download` - Téléchargement

**Livrables Sprint 11** :
- ✅ Logs temps réel
- ✅ Viewer JSON/CSV
- ✅ Page outputs

---

## Sprint 12 : Finitions & Polish

**Durée** : 1 semaine

### Tâches

#### 12.1 Améliorations UX
- [ ] Notifications toast (succès, erreur)
- [ ] Confirmations avant actions destructives
- [ ] Messages d'erreur explicites
- [ ] États de chargement (skeleton)
- [ ] Raccourcis clavier

**Fichiers à créer** :
```
frontend/src/components/ui/
├── Toast.vue                 # Notification toast
├── ConfirmDialog.vue         # Dialog de confirmation
├── LoadingSkeleton.vue       # Skeleton loader
├── EmptyState.vue            # État vide
└── ErrorState.vue            # État erreur
```

#### 12.2 Responsive design
- [ ] Adapter le layout pour tablettes
- [ ] Adapter le layout pour mobile
- [ ] Menu hamburger sur mobile
- [ ] Optimisation workflow editor mobile

#### 12.3 Documentation utilisateur
- [ ] Créer page d'aide intégrée
- [ ] Tooltips sur les blocs
- [ ] Tutoriel premier lancement
- [ ] Exemples intégrés

**Fichiers à créer** :
```
frontend/src/views/
└── HelpView.vue

frontend/src/components/help/
├── GettingStarted.vue        # Guide démarrage
├── BlockReference.vue        # Référence des blocs
├── Examples.vue              # Exemples
└── Shortcuts.vue             # Raccourcis
```

#### 12.4 Tests et optimisation
- [ ] Tests unitaires composants critiques
- [ ] Tests e2e parcours principaux
- [ ] Optimisation bundle (lazy loading)
- [ ] Optimisation performances canvas

**Fichiers à créer** :
```
frontend/tests/
├── unit/
│   ├── components/
│   └── utils/
└── e2e/
    ├── workflow.spec.ts
    └── configs.spec.ts
```

#### 12.5 Documentation technique
- [ ] README pour backend
- [ ] README pour frontend
- [ ] Documentation API (OpenAPI/Swagger)
- [ ] Guide de déploiement

**Livrables Sprint 12** :
- ✅ UX finalisée
- ✅ Responsive design
- ✅ Documentation complète
- ✅ Application production-ready

---

# 📊 Récapitulatif

## Phases et Sprints

| Phase | Sprint | Durée | Focus |
|-------|--------|-------|-------|
| **Phase 1** | Sprint 1 | 1 sem | Docker + Structure Backend |
| | Sprint 2 | 1 sem | API Configurations |
| | Sprint 3 | 1 sem | API Exécution Scrapers |
| **Phase 2** | Sprint 4 | 1 sem | WebSocket Temps Réel |
| | Sprint 5 | 1 sem | Structure Frontend Vue.js |
| | Sprint 6 | 1 sem | Pages de Base |
| **Phase 3** | Sprint 7 | 1 sem | Canvas Workflow Base |
| | Sprint 8 | 1 sem | Palette de Blocs |
| | Sprint 9 | 1 sem | Configuration Blocs |
| | Sprint 10 | 1 sem | Conversion Workflow ↔ JSON |
| **Phase 4** | Sprint 11 | 1 sem | Visualisation Données/Logs |
| | Sprint 12 | 1 sem | Finitions |

## Dépendances Principales

```
npm packages backend:
- express
- ws / socket.io
- typescript
- cors
- ajv (validation)

npm packages frontend:
- vue@3
- vite
- typescript
- tailwindcss
- @vue-flow/core
- pinia
- vue-router@4
- @vueuse/core
```

## Livrables Finaux

1. **Backend API**
   - API REST complète pour configs, tasks, logs, outputs
   - WebSocket pour temps réel
   - Intégration scraper existant
   - Docker ready

2. **Frontend Vue.js**
   - Dashboard
   - Éditeur de workflow drag & drop
   - Gestion des configurations
   - Visualisation logs temps réel
   - Visualisation données JSON/CSV
   - Responsive

3. **Infrastructure**
   - Docker Compose complet
   - Documentation déploiement
   - Scripts de démarrage

---

*Dernière mise à jour : 2026-01-20*
*Version : 2.0.0 (Plan)*
