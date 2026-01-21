# Plan d'implémentation V2 - Interface utilisateur graphique

> 🎯 **Objectif** : Créer une interface web moderne et intuitive pour la gestion des tâches de scraping avec drag & drop de blocs.

---

## 📋 Vue d'ensemble

### Description du projet
La V2 introduit une interface utilisateur graphique (GUI) web permettant de créer, configurer et gérer des workflows de scraping de manière visuelle, similaire à des outils comme n8n ou Node-RED.

### Fonctionnalités principales
- ✅ Éditeur visuel de workflows avec drag & drop
- ✅ Bibliothèque de blocs paramétrables
- ✅ Connexions visuelles entre blocs
- ✅ Gestion des tâches (CRUD)
- ✅ Exécution et suivi en temps réel
- ✅ Visualisation des données extraites
- ✅ Support dark/light mode

### Stack technique
| Composant | Technologie |
|-----------|-------------|
| Frontend | Vue.js 3 (Options API) + TypeScript + Tailwind CSS |
| Backend | Node.js + Express |
| Base de données | SQLite (sqlite3) |
| Communication temps réel | WebSocket (Socket.io) |
| Containerisation | Docker + Docker Compose |
| Stockage configurations | JSON (dossier `configs/`) |
| Stockage exécutions | SQLite (fichier `data/scraper.db`) |
| Logs | Dossier `logs/` |
| Outputs | Dossier `output/` |

### ⚠️ Conventions Vue.js

> **Important** : Le projet utilise **Vue Options API** et non pas Composition API.

**Règles à respecter** :
- Utiliser la syntaxe `export default { data(), methods, computed, watch, ... }`
- Ne **pas** utiliser `<script setup>` ni les fonctions `ref()`, `reactive()`, `computed()` de la Composition API
- Pinia reste utilisable avec l'Options API via `mapStores`, `mapState`, `mapActions`
- Les mixins peuvent être utilisés pour la logique réutilisable

**Exemple de composant** :
```vue
<template>
  <div class="my-component">
    <h1>{{ title }}</h1>
    <button @click="handleClick">{{ buttonText }}</button>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { mapState, mapActions } from 'pinia';
import { useTasksStore } from '@/stores/tasks';

export default defineComponent({
  name: 'MyComponent',
  
  props: {
    title: {
      type: String as PropType<string>,
      required: true
    }
  },
  
  data() {
    return {
      buttonText: 'Cliquez-moi',
      count: 0
    };
  },
  
  computed: {
    ...mapState(useTasksStore, ['tasks', 'loading']),
    
    doubleCount(): number {
      return this.count * 2;
    }
  },
  
  methods: {
    ...mapActions(useTasksStore, ['fetchTasks']),
    
    handleClick(): void {
      this.count++;
      this.$emit('clicked', this.count);
    }
  },
  
  mounted() {
    this.fetchTasks();
  }
});
</script>

<style scoped>
.my-component {
  padding: 1rem;
}
</style>
```

---

## 🗓️ Planning global

| Phase | Description | Durée estimée | Sprints |
|-------|-------------|---------------|---------|
| **Phase 1** | Setup & Infrastructure | 2 semaines | Sprint 1 |
| **Phase 2** | Interface de base & Gestion des tâches | 3 semaines | Sprint 2-3 |
| **Phase 3** | Éditeur de workflow visuel | 4 semaines | Sprint 4-6 |
| **Phase 4** | Exécution & Monitoring temps réel | 2 semaines | Sprint 7 |
| **Phase 5** | Visualisation des données | 2 semaines | Sprint 8 |
| **Phase 6** | Polish & Déploiement | 1 semaine | Sprint 9 |

**Durée totale estimée** : ~14 semaines (3.5 mois)

---

# 📦 Phase 1 : Setup & Infrastructure

> **Objectif** : Mettre en place l'infrastructure de base pour le développement

## Sprint 1 (2 semaines)

### 1.1 Initialisation du projet Frontend
**Durée** : 3 jours

**Tâches** :
- [ ] Créer le projet Vue.js 3 avec Vite dans `frontend/`
- [ ] Configurer TypeScript
- [ ] Installer et configurer Tailwind CSS
- [ ] Configurer ESLint et Prettier
- [ ] Créer la structure des dossiers :
  ```
  frontend/
  ├── src/
  │   ├── components/
  │   │   ├── common/          # Composants réutilisables (Button, Input, Modal...)
  │   │   ├── layout/          # Header, Sidebar, Footer
  │   │   ├── workflow/        # Composants de l'éditeur
  │   │   └── blocks/          # Composants des blocs
  │   ├── views/               # Pages principales
  │   ├── stores/              # Pinia stores (compatibles Options API)
  │   ├── mixins/              # Mixins Vue réutilisables
  │   ├── services/            # Services API
  │   ├── types/               # Types TypeScript
  │   ├── utils/               # Utilitaires
  │   └── assets/              # CSS, images
  ├── public/
  └── package.json
  ```

**Livrables** :
- Projet Vue.js fonctionnel
- Configuration Tailwind avec système de design (couleurs, espacements, typographie)
- Composants de base : Button, Input, Card, Modal

---

### 1.2 Initialisation du projet Backend
**Durée** : 2 jours

**Tâches** :
- [ ] Créer le projet Express dans `backend/`
- [ ] Configurer TypeScript (ou ESM natif)
- [ ] Installer les dépendances : express, cors, socket.io, uuid
- [ ] Créer la structure des dossiers :
  ```
  backend/
  ├── src/
  │   ├── routes/              # Routes API REST
  │   ├── controllers/         # Logique métier
  │   ├── services/            # Services (scraper, config...)
  │   ├── middlewares/         # Middlewares Express
  │   ├── websocket/           # Gestion WebSocket
  │   ├── types/               # Types TypeScript
  │   └── utils/               # Utilitaires
  ├── package.json
  └── Dockerfile
  ```

**Livrables** :
- Serveur Express fonctionnel avec CORS configuré
- Structure de base des routes
- Middleware de logging

---

### 1.3 Configuration Docker
**Durée** : 2 jours

**Tâches** :
- [ ] Créer `frontend/Dockerfile`
- [ ] Créer `backend/Dockerfile`
- [ ] Créer `docker-compose.yml` à la racine
- [ ] Configurer les volumes pour les dossiers `configs/`, `logs/`, `output/`
- [ ] Configurer les variables d'environnement
- [ ] Tester le déploiement local

**Fichier docker-compose.yml** :
```yaml
version: '3.8'
services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend
    environment:
      - VITE_API_URL=http://localhost:4000
      - VITE_WS_URL=ws://localhost:4000

  backend:
    build: ./backend
    ports:
      - "4000:4000"
    volumes:
      - ./configs:/app/configs
      - ./logs:/app/logs
      - ./output:/app/output
      - ./src:/app/src
      - ./data:/app/data          # Base de données SQLite
    environment:
      - NODE_ENV=development
      - PORT=4000
      - DATABASE_PATH=/app/data/scraper.db
```

**Livrables** :
- Configuration Docker complète
- Déploiement local fonctionnel avec `docker-compose up`

---

### 1.4 Intégration du moteur de scraping existant
**Durée** : 3 jours

> ⚠️ **ATTENTION - Pas de régression CLI**
> 
> Le moteur de scraping existant dans `src/` **DOIT continuer à fonctionner en mode CLI**.
> L'utilisateur doit pouvoir exécuter `npm run start -- --config config.json` exactement comme avant.
> Le refactoring ne doit ajouter que des exports supplémentaires, sans casser l'existant.

**Stratégie de refactoring** :

```
                    ┌─────────────────────────────────────┐
                    │         src/ (Code existant)        │
                    │    Scraper, Workflow, Actions...    │
                    └──────────────┬──────────────────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                    │
              ▼                    ▼                    ▼
    ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
    │   CLI (existant)│  │  Backend API    │  │   Tests         │
    │   src/index.js  │  │  (nouveau)      │  │   (nouveau)     │
    └─────────────────┘  └─────────────────┘  └─────────────────┘
```

**Règles de refactoring** :
1. ❌ **NE PAS** modifier la signature des fonctions existantes
2. ❌ **NE PAS** supprimer ou renommer des fichiers dans `src/`
3. ✅ **AJOUTER** des exports dans les modules existants
4. ✅ **CRÉER** un fichier `src/lib.js` qui expose une API propre pour le backend
5. ✅ **TESTER** le CLI après chaque modification

**Tâches** :
- [ ] Créer `src/lib.js` comme point d'entrée pour l'utilisation comme bibliothèque
- [ ] Exporter les classes/fonctions nécessaires depuis les modules existants
- [ ] Créer un service `ScraperService` dans le backend qui utilise `src/lib.js`
- [ ] Exposer les fonctions principales :
  - `executeConfig(configPath)` : Exécuter une configuration
  - `executeConfigObject(config)` : Exécuter une configuration depuis un objet JS
  - `validateConfig(config)` : Valider une configuration
  - `getAvailableActions()` : Lister les actions disponibles
  - `getActionSchema(actionType)` : Récupérer le schéma d'une action
- [ ] Créer une interface TypeScript pour les configurations
- [ ] **Vérifier la non-régression CLI** : `npm run start -- --config ./configs/examples/simple-navigation.json`

**Fichier src/lib.js (exemple)** :
```javascript
/**
 * Point d'entrée pour utiliser le scraper comme bibliothèque
 * NE MODIFIE PAS le comportement CLI existant
 */

const Scraper = require('./core/scraper');
const Scheduler = require('./core/scheduler');
const { loadConfig } = require('./utils/configLoader');
const actionRegistry = require('./actions');

module.exports = {
  // Classes principales
  Scraper,
  Scheduler,
  
  // Utilitaires
  loadConfig,
  
  // Registre des actions
  getAvailableActions: () => Object.keys(actionRegistry.actions),
  getActionSchema: (type) => actionRegistry.actions[type]?.schema || null,
  
  // Fonction d'exécution simplifiée
  async execute(config) {
    const scraper = new Scraper(config);
    return await scraper.execute();
  }
};
```

**Livrables** :
- Module scraper intégrable via `src/lib.js`
- API de base pour l'exécution
- ✅ CLI toujours fonctionnel (testé)

---

### 1.5 Configuration de la base de données SQLite
**Durée** : 2 jours

> 💾 **Pourquoi SQLite ?**
> - Léger, sans serveur séparé
> - Fichier unique facilement sauvegardable
> - Performant pour les besoins de l'application
> - Compatible avec Docker (volume persistant)

**Tâches** :
- [ ] Installer `sqlite3` (asynchrone, compatible avec toutes les versions de Node.js)
- [ ] Créer le dossier `data/` à la racine du projet
- [ ] Créer le service `DatabaseService` pour la gestion de la BDD
- [ ] Implémenter les migrations automatiques au démarrage
- [ ] Créer les tables nécessaires (voir schéma ci-dessous)

**Schéma de la base de données** :

```sql
-- ============================================
-- Table: executions
-- Historique des exécutions de tâches
-- ============================================
CREATE TABLE IF NOT EXISTS executions (
  id TEXT PRIMARY KEY,                    -- UUID de l'exécution
  task_id TEXT NOT NULL,                  -- ID de la tâche (nom du fichier config)
  task_name TEXT,                         -- Nom lisible de la tâche
  status TEXT NOT NULL DEFAULT 'pending', -- pending, running, completed, failed, cancelled
  started_at DATETIME,                    -- Date/heure de début
  completed_at DATETIME,                  -- Date/heure de fin
  duration_ms INTEGER,                    -- Durée en millisecondes
  items_extracted INTEGER DEFAULT 0,      -- Nombre d'éléments extraits
  error_message TEXT,                     -- Message d'erreur si échec
  error_stack TEXT,                       -- Stack trace si échec
  output_file TEXT,                       -- Chemin du fichier de sortie
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_executions_task_id ON executions(task_id);
CREATE INDEX idx_executions_status ON executions(status);
CREATE INDEX idx_executions_started_at ON executions(started_at);

-- ============================================
-- Table: execution_logs
-- Logs détaillés de chaque exécution
-- ============================================
CREATE TABLE IF NOT EXISTS execution_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  execution_id TEXT NOT NULL,             -- Référence à executions.id
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  level TEXT NOT NULL,                    -- debug, info, warn, error
  message TEXT NOT NULL,
  step_id TEXT,                           -- ID de l'étape du workflow
  step_name TEXT,                         -- Nom de l'étape
  metadata TEXT,                          -- JSON avec données supplémentaires
  FOREIGN KEY (execution_id) REFERENCES executions(id) ON DELETE CASCADE
);

CREATE INDEX idx_execution_logs_execution_id ON execution_logs(execution_id);
CREATE INDEX idx_execution_logs_level ON execution_logs(level);

-- ============================================
-- Table: execution_data
-- Données extraites par exécution (résumé)
-- ============================================
CREATE TABLE IF NOT EXISTS execution_data (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  execution_id TEXT NOT NULL,             -- Référence à executions.id
  data_key TEXT NOT NULL,                 -- Clé de la donnée (ex: "products", "articles")
  data_type TEXT,                         -- Type: array, object, string, number
  item_count INTEGER,                     -- Nombre d'éléments si array
  sample_data TEXT,                       -- Échantillon JSON (premiers éléments)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (execution_id) REFERENCES executions(id) ON DELETE CASCADE
);

CREATE INDEX idx_execution_data_execution_id ON execution_data(execution_id);

-- ============================================
-- Table: tasks_metadata
-- Métadonnées des tâches (stats, dernière exécution)
-- ============================================
CREATE TABLE IF NOT EXISTS tasks_metadata (
  task_id TEXT PRIMARY KEY,               -- ID de la tâche (nom du fichier config)
  display_name TEXT,                      -- Nom affiché
  description TEXT,                       -- Description
  run_count INTEGER DEFAULT 0,            -- Nombre total d'exécutions
  success_count INTEGER DEFAULT 0,        -- Nombre de succès
  failure_count INTEGER DEFAULT 0,        -- Nombre d'échecs
  last_run_at DATETIME,                   -- Dernière exécution
  last_run_status TEXT,                   -- Statut de la dernière exécution
  last_run_duration_ms INTEGER,           -- Durée de la dernière exécution
  avg_duration_ms INTEGER,                -- Durée moyenne
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Table: settings
-- Paramètres de l'application
-- ============================================
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  type TEXT DEFAULT 'string',             -- string, number, boolean, json
  description TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Paramètres par défaut
INSERT OR IGNORE INTO settings (key, value, type, description) VALUES
  ('app_theme', 'system', 'string', 'Thème de l''application: light, dark, system'),
  ('max_concurrent_executions', '1', 'number', 'Nombre max d''exécutions simultanées'),
  ('log_retention_days', '30', 'number', 'Durée de conservation des logs en jours'),
  ('execution_retention_days', '90', 'number', 'Durée de conservation des exécutions en jours');
```

**Service DatabaseService (exemple)** :

```javascript
// backend/src/services/DatabaseService.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');

class DatabaseService {
  constructor(dbPath) {
    this.dbPath = dbPath || process.env.DATABASE_PATH || './data/scraper.db';
    
    // Créer le dossier data/ si nécessaire
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    this.db = new sqlite3.Database(this.dbPath);
    
    // Promisifier les méthodes de base
    this.run = promisify(this.db.run.bind(this.db));
    this.get = promisify(this.db.get.bind(this.db));
    this.all = promisify(this.db.all.bind(this.db));
    this.exec = promisify(this.db.exec.bind(this.db));
  }
  
  async init() {
    // Activer le mode WAL pour de meilleures performances
    await this.run('PRAGMA journal_mode = WAL');
    await this.runMigrations();
  }
  
  async runMigrations() {
    // Exécuter le schéma SQL ci-dessus
    const schema = fs.readFileSync('./sql/schema.sql', 'utf8');
    await this.exec(schema);
  }
  
  // === Executions ===
  
  async createExecution(execution) {
    return await this.run(
      `INSERT INTO executions (id, task_id, task_name, status, started_at)
       VALUES (?, ?, ?, ?, ?)`,
      execution.id,
      execution.taskId,
      execution.taskName,
      'running',
      new Date().toISOString()
    );
  }
  
  async updateExecution(id, data) {
    const fields = Object.keys(data)
      .map(k => `${this.camelToSnake(k)} = ?`)
      .join(', ');
    return await this.run(
      `UPDATE executions SET ${fields} WHERE id = ?`,
      ...Object.values(data),
      id
    );
  }
  
  async getExecution(id) {
    return await this.get('SELECT * FROM executions WHERE id = ?', id);
  }
  
  async getExecutionsByTask(taskId, limit = 50) {
    return await this.all(
      `SELECT * FROM executions 
       WHERE task_id = ? 
       ORDER BY started_at DESC 
       LIMIT ?`,
      taskId,
      limit
    );
  }
  
  async getRecentExecutions(limit = 50) {
    return await this.all(
      `SELECT * FROM executions 
       ORDER BY started_at DESC 
       LIMIT ?`,
      limit
    );
  }
  
  // === Logs ===
  
  async addLog(executionId, level, message, stepId = null, stepName = null, metadata = null) {
    return await this.run(
      `INSERT INTO execution_logs (execution_id, level, message, step_id, step_name, metadata)
       VALUES (?, ?, ?, ?, ?, ?)`,
      executionId,
      level,
      message,
      stepId,
      stepName,
      metadata ? JSON.stringify(metadata) : null
    );
  }
  
  async getLogsByExecution(executionId) {
    return await this.all(
      `SELECT * FROM execution_logs 
       WHERE execution_id = ? 
       ORDER BY timestamp ASC`,
      executionId
    );
  }
  
  // === Task Metadata ===
  
  async updateTaskStats(taskId, success) {
    const successVal = success ? 1 : 0;
    const failureVal = success ? 0 : 1;
    const status = success ? 'completed' : 'failed';
    
    return await this.run(
      `INSERT INTO tasks_metadata (task_id, run_count, success_count, failure_count, last_run_at, last_run_status)
       VALUES (?, 1, ?, ?, datetime('now'), ?)
       ON CONFLICT(task_id) DO UPDATE SET
         run_count = run_count + 1,
         success_count = success_count + ?,
         failure_count = failure_count + ?,
         last_run_at = datetime('now'),
         last_run_status = ?,
         updated_at = datetime('now')`,
      taskId,
      successVal,
      failureVal,
      status,
      successVal,
      failureVal,
      status
    );
  }
  
  // === Settings ===
  
  async getSetting(key) {
    const row = await this.get('SELECT value, type FROM settings WHERE key = ?', key);
    if (!row) return null;
    
    switch (row.type) {
      case 'number': return Number(row.value);
      case 'boolean': return row.value === 'true';
      case 'json': return JSON.parse(row.value);
      default: return row.value;
    }
  }
  
  async setSetting(key, value, type = 'string') {
    const strValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
    return await this.run(
      `INSERT INTO settings (key, value, type, updated_at)
       VALUES (?, ?, ?, datetime('now'))
       ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = datetime('now')`,
      key,
      strValue,
      type,
      strValue
    );
  }
  
  // === Cleanup ===
  
  async cleanupOldData() {
    const logDays = await this.getSetting('log_retention_days') || 30;
    const execDays = await this.getSetting('execution_retention_days') || 90;
    
    await this.run(
      `DELETE FROM execution_logs 
       WHERE timestamp < datetime('now', '-' || ? || ' days')`,
      logDays
    );
    
    await this.run(
      `DELETE FROM executions 
       WHERE created_at < datetime('now', '-' || ? || ' days')`,
      execDays
    );
  }
  
  // Utilitaire
  camelToSnake(str) {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
  
  close() {
    this.db.close();
  }
}

module.exports = DatabaseService;
```

**Structure des fichiers** :
```
backend/
├── src/
│   ├── services/
│   │   └── DatabaseService.js
│   └── ...
├── sql/
│   └── schema.sql              # Schéma de la BDD
└── ...

data/                           # À la racine du projet
└── scraper.db                  # Fichier SQLite (créé automatiquement)
```

**Livrables** :
- Base de données SQLite configurée
- Service `DatabaseService` opérationnel
- Migrations automatiques au démarrage
- Volume Docker persistant pour les données

---

# 📦 Phase 2 : Interface de base & Gestion des tâches

> **Objectif** : Créer l'interface d'accueil et la gestion CRUD des tâches

## Sprint 2 (1.5 semaines)

### 2.1 Système de design et composants UI
**Durée** : 3 jours

**Tâches** :
- [ ] Configurer Tailwind avec thème dark/light
- [ ] Créer le store Pinia pour le thème
- [ ] Créer les composants communs :

| Composant | Description |
|-----------|-------------|
| `Button.vue` | Bouton avec variantes (primary, secondary, danger, ghost) |
| `Input.vue` | Champ de saisie avec label, erreur, icônes |
| `Select.vue` | Liste déroulante |
| `Card.vue` | Carte conteneur |
| `Modal.vue` | Fenêtre modale |
| `Badge.vue` | Badge de statut |
| `Toast.vue` | Notifications toast |
| `Spinner.vue` | Indicateur de chargement |
| `IconButton.vue` | Bouton avec icône |
| `Dropdown.vue` | Menu déroulant |
| `Tooltip.vue` | Info-bulle |
| `Tabs.vue` | Onglets |

**Livrables** :
- Bibliothèque de composants documentée
- Thème dark/light fonctionnel

---

### 2.2 Layout principal
**Durée** : 2 jours

**Tâches** :
- [ ] Créer le composant `MainLayout.vue`
- [ ] Créer le composant `Header.vue` avec :
  - Logo et titre "Generic Scraper"
  - Toggle dark/light mode
  - Version de l'application
- [ ] Créer le composant `Sidebar.vue` (optionnel pour navigation future)
- [ ] Configurer Vue Router avec les routes de base

**Routes initiales** :
```typescript
const routes = [
  { path: '/', name: 'tasks', component: TasksListView },
  { path: '/task/new', name: 'task-create', component: TaskEditorView },
  { path: '/task/:id', name: 'task-edit', component: TaskEditorView },
  { path: '/task/:id/run', name: 'task-run', component: TaskRunView },
]
```

**Livrables** :
- Layout responsive fonctionnel
- Navigation de base

---

### 2.3 API Backend - Gestion des tâches
**Durée** : 3 jours

**Tâches** :
- [ ] Créer le service `ConfigService` pour manipuler les fichiers JSON
- [ ] Implémenter les endpoints REST :

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/tasks` | Lister toutes les tâches |
| GET | `/api/tasks/:id` | Récupérer une tâche |
| POST | `/api/tasks` | Créer une nouvelle tâche |
| PUT | `/api/tasks/:id` | Modifier une tâche |
| DELETE | `/api/tasks/:id` | Supprimer une tâche |
| POST | `/api/tasks/:id/run` | Lancer une tâche |
| POST | `/api/tasks/:id/duplicate` | Dupliquer une tâche |

- [ ] Implémenter la validation des configurations avec le schéma JSON existant
- [ ] Ajouter la gestion des métadonnées (créé le, modifié le, dernière exécution)

**Structure d'une tâche** :
```typescript
interface Task {
  id: string;
  name: string;
  description?: string;
  config: ScraperConfig;
  createdAt: string;
  updatedAt: string;
  lastRunAt?: string;
  lastRunStatus?: 'success' | 'error' | 'running';
  runCount: number;
}
```

**Livrables** :
- API REST complète pour les tâches
- Validation des configurations

---

## Sprint 3 (1.5 semaines)

### 2.4 Vue liste des tâches
**Durée** : 4 jours

**Tâches** :
- [ ] Créer le composant `TasksListView.vue`
- [ ] Créer le composant `TaskCard.vue` avec :
  - Nom et description de la tâche
  - Statut de la dernière exécution (badge coloré)
  - Date de dernière exécution
  - Boutons d'actions : Lancer, Modifier, Dupliquer, Supprimer
- [ ] Implémenter la recherche et le filtrage
- [ ] Ajouter le bouton "Nouvelle tâche"
- [ ] Créer le store Pinia `useTasksStore` :
  ```typescript
  interface TasksState {
    tasks: Task[];
    loading: boolean;
    error: string | null;
    filters: TaskFilters;
  }
  ```
- [ ] Implémenter la pagination côté client

**Livrables** :
- Vue liste des tâches fonctionnelle
- Actions CRUD accessibles
- Recherche et filtrage

---

### 2.5 Modal de confirmation et notifications
**Durée** : 2 jours

**Tâches** :
- [ ] Créer le composant `ConfirmModal.vue`
- [ ] Implémenter le système de toast/notifications
- [ ] Créer le store Pinia `useNotificationStore`
- [ ] Ajouter les confirmations pour :
  - Suppression de tâche
  - Lancement de tâche
  - Annulation de modifications non sauvegardées

**Livrables** :
- Système de notifications fonctionnel
- Confirmations utilisateur

---

# 📦 Phase 3 : Éditeur de workflow visuel

> **Objectif** : Créer l'éditeur de workflow avec drag & drop

## Sprint 4 (1.5 semaines)

### 3.1 Bibliothèque de blocs - Définition
**Durée** : 3 jours

**Tâches** :
- [ ] Analyser les actions existantes dans `src/actions/`
- [ ] Définir la structure des blocs :

```typescript
interface BlockDefinition {
  id: string;
  type: string;                    // navigate, click, extract, etc.
  category: BlockCategory;         // trigger, action, extraction, control
  name: string;                    // Nom affiché
  description: string;             // Description courte
  icon: string;                    // Icône
  color: string;                   // Couleur du bloc
  inputs: PortDefinition[];        // Ports d'entrée
  outputs: PortDefinition[];       // Ports de sortie
  configSchema: ConfigSchema;      // Schéma de configuration
  defaultConfig: object;           // Configuration par défaut
}

interface PortDefinition {
  id: string;
  name: string;
  type: 'flow' | 'data';           // flux d'exécution ou données
  dataType?: string;               // type de données (si data)
  required: boolean;
  multiple: boolean;               // permet plusieurs connexions
}

type BlockCategory = 'trigger' | 'navigation' | 'interaction' | 'extraction' | 'data' | 'control' | 'output';
```

- [ ] Créer les définitions pour chaque type de bloc :

| Catégorie | Blocs |
|-----------|-------|
| **Navigation** | `navigate`, `wait` |
| **Interaction** | `click`, `input`, `scroll`, `form`, `login` |
| **Extraction** | `extract` (text, attribute, html, list) |
| **API** | `api` |
| **Contrôle** | `loop`, `condition`, `subWorkflow`, `pagination` |

**Livrables** :
- Fichier de définitions des blocs `blocks.config.ts`
- Types TypeScript pour les blocs

---

### 3.2 Composant Block
**Durée** : 3 jours

**Tâches** :
- [ ] Créer le composant `Block.vue` :
  - Header avec icône, nom et bouton de suppression
  - Ports d'entrée (gauche) et de sortie (droite)
  - Zone centrale avec aperçu de la configuration
  - États visuels : sélectionné, en cours d'exécution, erreur, succès
- [ ] Créer les composants de ports :
  - `InputPort.vue`
  - `OutputPort.vue`
- [ ] Gérer le drag & drop des blocs sur le canvas

**Style des blocs par catégorie** :
```typescript
const categoryColors = {
  navigation: 'blue',
  interaction: 'purple',
  extraction: 'green',
  api: 'orange',
  control: 'yellow',
};
```

**Livrables** :
- Composant Block stylisé et fonctionnel
- Ports visuels interactifs

---

### 3.3 Panneau de blocs (Block Library)
**Durée** : 2 jours

**Tâches** :
- [ ] Créer le composant `BlockLibrary.vue`
- [ ] Afficher les blocs par catégorie
- [ ] Implémenter la recherche de blocs
- [ ] Rendre les blocs draggables vers le canvas
- [ ] Afficher une info-bulle de description au survol

**Livrables** :
- Panneau latéral avec bibliothèque de blocs
- Drag source fonctionnel

---

## Sprint 5 (1.5 semaines)

### 3.4 Canvas de workflow
**Durée** : 4 jours

**Tâches** :
- [ ] Choisir et intégrer une bibliothèque de graphe : **Vue Flow** (recommandé)
  - Alternative : @vue-flow/core, @antv/g6
- [ ] Créer le composant `WorkflowCanvas.vue`
- [ ] Implémenter les fonctionnalités :
  - Drop des blocs depuis la bibliothèque
  - Déplacement des blocs sur le canvas
  - Zoom et pan (défilement)
  - Sélection simple et multiple
  - Grille de positionnement (snap to grid)
  - Mini-map de navigation

**Store du workflow** :
```typescript
interface WorkflowState {
  nodes: Node[];           // Blocs placés
  edges: Edge[];           // Connexions
  selectedNodes: string[]; // Nœuds sélectionnés
  viewport: Viewport;      // Position et zoom
  isDirty: boolean;        // Modifications non sauvegardées
}
```

**Livrables** :
- Canvas de workflow interactif
- Placement et déplacement des blocs

---

### 3.5 Connexions entre blocs
**Durée** : 3 jours

**Tâches** :
- [ ] Implémenter le dessin des connexions (edges)
- [ ] Créer la logique de connexion :
  - Drag depuis un port de sortie vers un port d'entrée
  - Validation des connexions (types compatibles)
  - Animation de la ligne pendant le drag
- [ ] Gérer les états des connexions :
  - Normal
  - Survol
  - Actif (données en transit)
- [ ] Supprimer les connexions (clic + touche ou menu contextuel)

**Règles de connexion** :
```typescript
const connectionRules = {
  'flow-flow': true,           // flux vers flux
  'data-data': 'type-match',   // données vers données (types compatibles)
  'flow-data': false,          // pas de mélange
};
```

**Livrables** :
- Système de connexions fonctionnel
- Validation des connexions

---

## Sprint 6 (1 semaine)

### 3.6 Panneau de configuration des blocs
**Durée** : 3 jours

**Tâches** :
- [ ] Créer le composant `BlockConfigPanel.vue`
- [ ] Générer dynamiquement le formulaire selon le schéma du bloc
- [ ] Créer les composants de champs :
  - `TextField.vue` : Champ texte simple
  - `TextareaField.vue` : Champ texte multiligne
  - `SelectField.vue` : Liste déroulante
  - `CheckboxField.vue` : Case à cocher
  - `NumberField.vue` : Champ numérique
  - `CodeField.vue` : Éditeur de code (pour sélecteurs CSS, JSON)
  - `KeyValueField.vue` : Paires clé-valeur (headers HTTP)
  - `ArrayField.vue` : Liste d'éléments
- [ ] Gérer la validation en temps réel
- [ ] Afficher les erreurs de configuration

**Exemple de schéma pour le bloc "navigate"** :
```typescript
const navigateConfigSchema = {
  fields: [
    {
      key: 'url',
      type: 'text',
      label: 'URL',
      required: true,
      placeholder: 'https://example.com',
      validation: { pattern: '^https?://' }
    },
    {
      key: 'waitUntil',
      type: 'select',
      label: 'Attendre',
      options: ['load', 'domcontentloaded', 'networkidle'],
      default: 'load'
    },
    {
      key: 'timeout',
      type: 'number',
      label: 'Timeout (ms)',
      default: 30000,
      min: 0,
      max: 120000
    }
  ]
};
```

**Livrables** :
- Panneau de configuration dynamique
- Formulaires pour tous les types de blocs

---

### 3.7 Conversion workflow visuel ↔ JSON
**Durée** : 2 jours

**Tâches** :
- [ ] Créer le service `WorkflowConverter`
- [ ] Implémenter `toConfig()` : Convertit le graphe visuel en JSON de configuration
- [ ] Implémenter `fromConfig()` : Convertit un JSON existant en graphe visuel
- [ ] Gérer les cas complexes :
  - Sous-workflows
  - Boucles et conditions
  - Variables et templating
- [ ] Valider la configuration générée

**Exemple de conversion** :
```
Node "Nav1" (navigate) → Node "Click1" (click) → Node "Extract1" (extract)

↓ toConfig()

{
  "workflow": {
    "steps": [
      { "id": "Nav1", "type": "navigate", "config": {...} },
      { "id": "Click1", "type": "click", "config": {...} },
      { "id": "Extract1", "type": "extract", "config": {...} }
    ]
  }
}
```

**Livrables** :
- Service de conversion bidirectionnel
- Support des configurations complexes

---

# 📦 Phase 4 : Exécution & Monitoring temps réel

> **Objectif** : Permettre l'exécution des workflows et le suivi en temps réel

## Sprint 7 (2 semaines)

### 4.1 Configuration WebSocket
**Durée** : 2 jours

**Tâches** :
- [ ] Configurer Socket.io côté backend
- [ ] Créer le service `WebSocketService` côté frontend
- [ ] Définir les événements :

| Événement | Direction | Description |
|-----------|-----------|-------------|
| `task:start` | Client → Server | Démarrer une tâche |
| `task:stop` | Client → Server | Arrêter une tâche |
| `task:status` | Server → Client | Mise à jour du statut |
| `task:progress` | Server → Client | Progression de l'exécution |
| `task:log` | Server → Client | Nouveau log |
| `task:step` | Server → Client | Étape en cours |
| `task:data` | Server → Client | Données extraites |
| `task:complete` | Server → Client | Fin d'exécution |
| `task:error` | Server → Client | Erreur survenue |

**Livrables** :
- Communication WebSocket fonctionnelle
- Store Pinia pour l'état temps réel

---

### 4.2 Service d'exécution backend
**Durée** : 3 jours

**Tâches** :
- [ ] Créer le service `ExecutionService`
- [ ] Intégrer le scraper existant avec émission d'événements
- [ ] Implémenter la gestion des exécutions concurrentes
- [ ] Créer une queue d'exécution (file d'attente)
- [ ] Permettre l'arrêt propre d'une exécution

**Structure d'une exécution** :
```typescript
interface Execution {
  id: string;
  taskId: string;
  status: ExecutionStatus;
  startedAt: string;
  completedAt?: string;
  currentStep?: string;
  progress: number;          // 0-100
  logs: LogEntry[];
  data: Record<string, any>;
  error?: string;
}

type ExecutionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
```

**Livrables** :
- Service d'exécution avec événements
- Gestion de la file d'attente

---

### 4.3 Vue d'exécution en temps réel
**Durée** : 4 jours

**Tâches** :
- [ ] Créer le composant `TaskRunView.vue`
- [ ] Afficher le workflow avec l'étape en cours mise en évidence
- [ ] Créer le panneau de logs en temps réel :
  - Filtrage par niveau (info, warn, error, debug)
  - Recherche dans les logs
  - Scroll automatique
  - Export des logs
- [ ] Afficher la progression globale (barre de progression)
- [ ] Boutons de contrôle : Pause (si possible), Arrêter
- [ ] Afficher l'aperçu des données extraites en temps réel

**Livrables** :
- Vue d'exécution en temps réel
- Logs en streaming
- Visualisation de la progression

---

### 4.4 Historique des exécutions
**Durée** : 2 jours

**Tâches** :
- [ ] Créer l'API pour l'historique des exécutions
- [ ] Stocker les résultats des exécutions (fichier JSON ou DB légère)
- [ ] Créer le composant `ExecutionHistory.vue`
- [ ] Permettre de consulter les détails d'une exécution passée
- [ ] Afficher les statistiques : durée, éléments extraits, erreurs

**Livrables** :
- Historique des exécutions consultable
- Statistiques d'exécution

---

# 📦 Phase 5 : Visualisation des données

> **Objectif** : Permettre la consultation et l'export des données extraites

## Sprint 8 (2 semaines)

### 5.1 Vue des outputs
**Durée** : 3 jours

**Tâches** :
- [ ] Créer l'API pour lister les fichiers de sortie
- [ ] Créer le composant `OutputsListView.vue`
- [ ] Afficher la liste des fichiers avec :
  - Nom du fichier
  - Taille
  - Date de création
  - Format (JSON/CSV)
  - Tâche associée
- [ ] Actions : Voir, Télécharger, Supprimer

**Livrables** :
- Liste des fichiers de sortie
- Actions de base sur les fichiers

---

### 5.2 Visualisation JSON
**Durée** : 3 jours

**Tâches** :
- [ ] Créer le composant `JsonViewer.vue`
- [ ] Implémenter l'arborescence pliable/dépliable
- [ ] Coloration syntaxique des types (string, number, boolean, null)
- [ ] Recherche dans les données
- [ ] Copier une valeur ou un chemin
- [ ] Pagination pour les grands tableaux

**Livrables** :
- Visualiseur JSON interactif

---

### 5.3 Visualisation tableau (CSV/Data)
**Durée** : 3 jours

**Tâches** :
- [ ] Créer le composant `DataTable.vue`
- [ ] Implémenter les fonctionnalités :
  - Colonnes triables
  - Filtrage par colonne
  - Recherche globale
  - Pagination
  - Redimensionnement des colonnes
  - Masquer/afficher des colonnes
- [ ] Exporter les données filtrées (JSON, CSV)

**Livrables** :
- Table de données interactive
- Export avec filtres

---

### 5.4 Consultation des logs
**Durée** : 2 jours

**Tâches** :
- [ ] Créer l'API pour lire les fichiers de logs
- [ ] Créer le composant `LogsView.vue`
- [ ] Afficher les logs avec :
  - Filtrage par niveau
  - Filtrage par date
  - Recherche textuelle
  - Pagination
- [ ] Coloration par niveau de log

**Livrables** :
- Interface de consultation des logs

---

# 📦 Phase 6 : Polish & Déploiement

> **Objectif** : Finaliser l'application et préparer le déploiement

## Sprint 9 (1 semaine)

### 6.1 Tests et corrections
**Durée** : 2 jours

**Tâches** :
- [ ] Tester tous les flux utilisateur
- [ ] Corriger les bugs identifiés
- [ ] Vérifier la responsivité
- [ ] Tester les thèmes dark/light
- [ ] Vérifier les performances

**Livrables** :
- Application sans bugs critiques

---

### 6.2 Documentation utilisateur
**Durée** : 1 jour

**Tâches** :
- [ ] Créer le guide utilisateur (`documentation/user-guide-v2.md`)
- [ ] Documenter l'API backend (`documentation/api-v2.md`)
- [ ] Ajouter des info-bulles d'aide dans l'interface
- [ ] Créer une page "À propos" avec version et changelog

**Livrables** :
- Documentation utilisateur complète

---

### 6.3 Optimisation et finalisation
**Durée** : 2 jours

**Tâches** :
- [ ] Optimiser les bundles frontend (tree-shaking, lazy loading)
- [ ] Configurer les builds de production
- [ ] Finaliser les Dockerfiles pour la production
- [ ] Mettre à jour le README.md principal
- [ ] Créer les scripts de démarrage simples
- [ ] Tester le déploiement Docker complet

**Livrables** :
- Application prête pour la production
- Documentation de déploiement

---

# 📝 Récapitulatif des livrables

## Frontend
| Composant | Fichier | Description |
|-----------|---------|-------------|
| Layout | `MainLayout.vue` | Structure principale |
| Header | `Header.vue` | En-tête avec navigation |
| Liste tâches | `TasksListView.vue` | Page d'accueil |
| Carte tâche | `TaskCard.vue` | Aperçu d'une tâche |
| Éditeur | `TaskEditorView.vue` | Page d'édition |
| Canvas | `WorkflowCanvas.vue` | Zone de travail |
| Bloc | `Block.vue` | Composant bloc |
| Bibliothèque | `BlockLibrary.vue` | Liste des blocs |
| Config bloc | `BlockConfigPanel.vue` | Configuration |
| Exécution | `TaskRunView.vue` | Suivi en temps réel |
| Outputs | `OutputsListView.vue` | Liste des sorties |
| JSON Viewer | `JsonViewer.vue` | Visualisation JSON |
| Data Table | `DataTable.vue` | Tableau de données |
| Logs | `LogsView.vue` | Consultation logs |

## Backend
| Service | Fichier | Description |
|---------|---------|-------------|
| Tasks | `routes/tasks.js` | CRUD tâches |
| Execution | `services/ExecutionService.js` | Exécution scraper |
| WebSocket | `websocket/handler.js` | Communication temps réel |
| Outputs | `routes/outputs.js` | Gestion des sorties |
| Logs | `routes/logs.js` | Consultation logs |

## Docker
| Fichier | Description |
|---------|-------------|
| `frontend/Dockerfile` | Build frontend |
| `backend/Dockerfile` | Build backend |
| `docker-compose.yml` | Orchestration |
| `docker-compose.prod.yml` | Production |

---

# 🎨 Maquettes UI (Description)

## Page d'accueil (Liste des tâches)
```
┌─────────────────────────────────────────────────────────────────────┐
│  🕷️ Generic Scraper                                    [🌙] [v2.0] │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Mes tâches de scraping                            [+ Nouvelle]     │
│                                                                     │
│  🔍 Rechercher...                    Filtre: [Tous ▼]              │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 📋 Scraping Products          ✅ Succès     Il y a 2h       │   │
│  │    Extraction des produits                                   │   │
│  │                               [▶️ Lancer] [✏️] [📋] [🗑️]     │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 📋 Daily News Scraper         ⏰ Planifié   Prochain: 9h    │   │
│  │    Actualités quotidiennes                                   │   │
│  │                               [▶️ Lancer] [✏️] [📋] [🗑️]     │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Éditeur de workflow
```
┌─────────────────────────────────────────────────────────────────────┐
│  🕷️ Generic Scraper > Édition: Scraping Products     [💾] [▶️]     │
├───────────┬─────────────────────────────────────┬───────────────────┤
│ BLOCS     │          CANVAS                     │ CONFIGURATION     │
├───────────┤                                     ├───────────────────┤
│ 🔍 Search │   ┌─────────┐   ┌─────────┐        │ Navigate          │
│           │   │Navigate │──▶│  Click  │        │ ─────────────     │
│ Navigation│   └─────────┘   └────┬────┘        │                   │
│  ├ Navigate                      │             │ URL:              │
│  └ Wait   │                 ┌────▼────┐        │ [https://...]     │
│           │                 │ Extract │        │                   │
│ Interaction                 └─────────┘        │ Attendre:         │
│  ├ Click  │                                    │ [networkidle ▼]   │
│  ├ Input  │      [🔍 Zoom: 100%]              │                   │
│  └ Scroll │                                    │ Timeout:          │
│           │                                    │ [30000] ms        │
│ Extraction│                                    │                   │
│  └ Extract│                                    │                   │
│           │                                    │                   │
│ Contrôle  │                                    │                   │
│  ├ Loop   │                                    │                   │
│  └ Condition                                   │                   │
└───────────┴─────────────────────────────────────┴───────────────────┘
```

---

# 📌 Notes importantes

## Dépendances recommandées

### Frontend
```json
{
  "dependencies": {
    "vue": "^3.4.0",
    "vue-router": "^4.2.0",
    "pinia": "^2.1.0",
    "@vueuse/core": "^10.7.0",
    "@vue-flow/core": "^1.28.0",
    "socket.io-client": "^4.7.0",
    "axios": "^1.6.0",
    "lucide-vue-next": "^0.300.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "tailwindcss": "^3.4.0",
    "vite": "^5.0.0"
  }
}
```

### Backend
```json
{
  "dependencies": {
    "express": "^4.18.0",
    "cors": "^2.8.0",
    "socket.io": "^4.7.0",
    "uuid": "^9.0.0",
    "chokidar": "^3.5.0"
  }
}
```

## Bonnes pratiques
- Utiliser les conventions de nommage Vue.js (PascalCase pour composants)
- Typer toutes les interfaces et props
- Utiliser les composables Vue pour la logique réutilisable
- Implémenter la gestion d'erreurs à tous les niveaux
- Logger toutes les actions importantes
- Tester régulièrement avec Docker

## Points d'attention
- Performance du canvas avec de nombreux blocs
- Gestion de la mémoire pour les gros fichiers JSON
- Timeout des WebSocket lors d'exécutions longues
- Compatibilité des navigateurs (cibler les versions récentes)

---

*Document créé le : 2026-01-21*  
*Dernière mise à jour : 2026-01-21*  
*Version : 1.0.0*
