# Structure du projet - Generic Scraper

Ce document décrit en détail l'organisation du projet.

## Vue d'ensemble

```
generic-scraper/
├── 📄 Configuration & Documentation
│   ├── README.md                    # Documentation principale
│   ├── CHANGELOG.md                 # Historique des versions
│   ├── LICENSE                      # Licence ISC
│   ├── AGENTS.md                    # Suivi du projet
│   ├── package.json                 # Configuration npm
│   ├── .gitignore                   # Fichiers ignorés par Git
│   ├── start.bat                    # Script de lancement Windows
│   └── test-lib-integration.js      # Tests d'intégration bibliothèque
│
├── 📚 Documentation
│   └── documentation/
│       ├── plan_v2.md               # Plan d'implémentation V2
│       ├── configuration.md         # Guide de configuration complet
│       ├── examples.md              # Exemples d'utilisation
│       ├── LIBRARY_INTEGRATION.md   # Guide d'intégration bibliothèque
│       └── STRUCTURE.md             # Ce fichier
│
├── ⚙️ Configuration
│   ├── data/
│   │   ├── config.json              # Configuration par défaut
│   │   └── schema.json              # Schéma de validation JSON
│   └── configs/
│       └── examples/                # 17 exemples de configurations
│           ├── simple-navigation.json
│           ├── pagination-*.json
│           ├── api-*.json
│           ├── workflow-*.json
│           ├── error-handling-*.json
│           ├── scheduled-*.json
│           └── ...
│
├── 💻 Code source - Scraper
│   └── src/
│       ├── index.js                 # Point d'entrée CLI
│       ├── lib.js                   # Point d'entrée bibliothèque (nouveau)
│       │
│       ├── core/                    # Composants principaux
│       │   ├── browser.js           # Gestion Playwright
│       │   ├── scraper.js           # Orchestrateur principal
│       │   ├── workflow.js          # Exécution des workflows
│       │   └── scheduler.js         # Planification avec cron
│       │
│       ├── actions/                 # Actions disponibles (11 actions)
│       │   ├── index.js             # Registre des actions (factory)
│       │   ├── navigate.js          # Navigation
│       │   ├── click.js             # Clics
│       │   ├── scroll.js            # Défilement
│       │   ├── wait.js              # Attentes
│       │   ├── input.js             # Saisies/formulaires
│       │   ├── extract.js           # Extraction de données
│       │   ├── api.js               # Requêtes HTTP/API
│       │   ├── pagination.js        # Pagination
│       │   ├── loop.js              # Boucles
│       │   ├── condition.js         # Conditions if/else
│       │   └── subWorkflow.js       # Sous-workflows
│       │
│       ├── extractors/              # Extracteurs de données (4 types)
│       │   ├── index.js             # Registre des extracteurs
│       │   ├── text.js              # Texte
│       │   ├── attribute.js         # Attributs HTML
│       │   ├── html.js              # Code HTML
│       │   └── list.js              # Listes avec sous-champs
│       │
│       ├── output/                  # Gestionnaires de sortie
│       │   ├── index.js             # Gestionnaire principal
│       │   ├── json-writer.js       # Export JSON
│       │   └── csv-writer.js        # Export CSV
│       │
│       ├── utils/                   # Utilitaires
│       │   ├── logger.js            # Logging avec Winston
│       │   ├── configLoader.js      # Chargement et validation
│       │   ├── error-handler.js     # Gestion des erreurs
│       │   ├── retry.js             # Système de retry
│       │   └── template.js          # Moteur de templates
│       │
│       └── schemas/                 # Schémas de validation
│           └── workflow.schema.json # Schéma des workflows
│
├── 🖥️ Backend - API & Services
│   └── backend/
│       ├── package.json             # Dépendances backend
│       ├── tsconfig.json            # Configuration TypeScript
│       ├── Dockerfile               # Image Docker production
│       ├── Dockerfile.dev           # Image Docker développement
│       └── src/
│           ├── app.ts               # Application Express
│           ├── index.ts             # Point d'entrée
│           ├── config.ts            # Configuration
│           │
│           ├── controllers/         # Contrôleurs API
│           │   └── ScraperController.ts
│           │
│           ├── routes/              # Routes Express
│           │   ├── index.ts         # Routes principales
│           │   └── scraper.ts       # Routes scraper
│           │
│           ├── services/            # Services métier
│           │   └── ScraperService.ts
│           │
│           ├── middlewares/         # Middlewares
│           │
│           ├── types/               # Types TypeScript
│           │   └── scraper.types.ts
│           │
│           ├── utils/               # Utilitaires backend
│           │
│           └── websocket/           # WebSocket (prévu)
│
├── 🎨 Frontend - Interface Web
│   └── frontend/
│       ├── package.json             # Dépendances frontend
│       ├── vite.config.ts           # Configuration Vite
│       ├── tsconfig.json            # Configuration TypeScript
│       ├── tailwind.config.js       # Configuration Tailwind
│       ├── Dockerfile               # Image Docker production
│       ├── Dockerfile.dev           # Image Docker développement
│       └── src/
│           ├── main.ts              # Point d'entrée
│           ├── App.vue              # Composant racine
│           │
│           ├── components/          # Composants Vue
│           │   ├── common/          # Composants réutilisables
│           │   ├── layout/          # Layout
│           │   ├── workflow/        # Éditeur de workflow
│           │   └── blocks/          # Blocs d'actions
│           │
│           ├── views/               # Pages
│           ├── stores/              # Pinia stores
│           ├── services/            # Services API
│           ├── types/               # Types TypeScript
│           └── utils/               # Utilitaires
│
├── 🐳 Docker
│   ├── docker-compose.yml           # Composition production
│   ├── docker-compose.dev.yml       # Composition développement
│   ├── docker-start.bat             # Lancement Windows
│   └── docker-start.sh              # Lancement Linux/Mac
│
└── 📁 Répertoires générés (gitignored)
    ├── node_modules/                # Dépendances npm
    ├── logs/                        # Fichiers de logs
    ├── output/                      # Données extraites
    ├── screenshots/                 # Screenshots d'erreurs
    └── scheduler-state.json         # État du scheduler
```

---

## Détails par répertoire

### `/src/core/` - Composants principaux

| Fichier | Responsabilité | Exports |
|---------|----------------|---------|
| `browser.js` | Gestion du navigateur Playwright | `Browser` (classe) |
| `scraper.js` | Orchestrateur principal | `Scraper` (classe) |
| `workflow.js` | Exécution des workflows | `Workflow` (classe) |
| `scheduler.js` | Planification et exécution automatique | `Scheduler` (classe) |

**Flux d'exécution :**
```
Scraper → Browser → Workflow → Actions
    ↓
Scheduler (optionnel)
```

---

### `/src/actions/` - Actions

Chaque action suit le pattern :

```javascript
module.exports = {
  name: 'action-name',
  description: 'Description',
  async execute(page, config, context) {
    // Logique
    return result;
  }
};
```

**Actions disponibles :**

| Action | Description | Fichier |
|--------|-------------|---------|
| `navigate` | Navigation vers une URL | `navigate.js` |
| `click` | Clic sur un élément | `click.js` |
| `scroll` | Défilement de page/élément | `scroll.js` |
| `wait` | Attente (timeout, selector, etc.) | `wait.js` |
| `input` | Saisie dans un formulaire | `input.js` |
| `extract` | Extraction de données | `extract.js` |
| `api` | Requête HTTP/API | `api.js` |
| `pagination` | Pagination (click, url, scroll) | `pagination.js` |
| `loop` | Boucle sur éléments/tableau | `loop.js` |
| `condition` | Condition if/then/else | `condition.js` |
| `subWorkflow` | Appel de sous-workflow | `subWorkflow.js` |

Le fichier `index.js` enregistre toutes les actions dans un objet `actions` et exporte la fonction `executeAction()`.

---

### `/src/extractors/` - Extracteurs

Chaque extracteur suit le pattern :

```javascript
module.exports = {
  async extract(element, config, context) {
    // Logique d'extraction
    return data;
  }
};
```

**Extracteurs disponibles :**

| Extracteur | Description | Fichier |
|------------|-------------|---------|
| `text` | Extrait le texte (innerText/textContent) | `text.js` |
| `attribute` | Extrait un attribut HTML | `attribute.js` |
| `html` | Extrait le code HTML | `html.js` |
| `list` | Extrait une liste avec sous-champs | `list.js` |

---

### `/src/output/` - Gestionnaires de sortie

| Fichier | Responsabilité |
|---------|----------------|
| `index.js` | Gestionnaire principal, dispatch vers JSON/CSV |
| `json-writer.js` | Export JSON (pretty, append) |
| `csv-writer.js` | Export CSV (headers, délimiteurs, colonnes) |

---

### `/src/utils/` - Utilitaires

| Fichier | Responsabilité | Exports principaux |
|---------|----------------|--------------------|
| `logger.js` | Logging avec Winston | `getLogger()`, `createLogger()` |
| `configLoader.js` | Chargement et validation JSON | `loadConfig()`, `validateConfig()` |
| `error-handler.js` | Gestion des erreurs | `handleError()`, `captureScreenshot()` |
| `retry.js` | Système de retry avec backoff | `withRetry()` |
| `template.js` | Moteur de templates | `resolveTemplate()`, `replaceVariables()` |

---

## Flux de données

### 1. Démarrage

```
index.js (CLI)
    ↓
configLoader.loadConfig()
    ↓
validateConfig() (JSON Schema)
    ↓
Scraper instance
```

### 2. Exécution

```
Scraper.initialize()
    ↓
Browser.launch()
    ↓
Browser.newPage()
    ↓
Workflow.execute(page)
    ↓
Pour chaque step:
    ↓
    executeAction(page, step, context)
        ↓
        Action spécifique (navigate, click, extract...)
        ↓
        Résultat stocké dans context.data
    ↓
OutputManager.write(data)
    ↓
Browser.close()
```

### 3. Extraction de données

```
extract action
    ↓
Extracteur approprié (text, list, etc.)
    ↓
Pour list:
    ↓
    page.$$(selector) → éléments
    ↓
    Pour chaque élément:
        ↓
        Extraire chaque field
        ↓
        Appliquer transformations
    ↓
    Retourner tableau de résultats
```

### 4. Workflow avec templating

```
Step config: { url: "{{target.url}}/page/{{pageNumber}}" }
    ↓
resolveTemplate(config, context)
    ↓
Remplacement des variables:
    {{target.url}} → "https://example.com"
    {{pageNumber}} → "1"
    ↓
Résultat: "https://example.com/page/1"
```

---

## Patterns de conception utilisés

### 1. Factory Pattern
- `src/actions/index.js` - Registre d'actions
- `src/extractors/index.js` - Registre d'extracteurs

### 2. Strategy Pattern
- Actions interchangeables
- Extracteurs interchangeables

### 3. Template Method Pattern
- Workflow.execute() définit la structure
- Les steps implémentent les détails

### 4. Singleton Pattern
- Logger (via `getLogger()`)

### 5. Builder Pattern
- Configuration des workflows
- Options du navigateur

---

## Configuration JSON

### Schéma de validation

Le fichier `data/schema.json` définit la structure attendue des configurations.

Validation effectuée par `ajv` (JSON Schema validator).

### Variables de templates

Disponibles partout où `{{variable}}` est supporté :

| Variable | Source | Exemple |
|----------|--------|---------|
| `{{target.url}}` | config.target.url | `https://example.com` |
| `{{name}}` | config.name | `my-scraper` |
| `{{date}}` | Date actuelle | `2026-01-20` |
| `{{time}}` | Heure actuelle | `14-30-00` |
| `{{datetime}}` | Date + heure | `2026-01-20_14-30-00` |
| `{{pageNumber}}` | Pagination | `1`, `2`, `3`... |
| `{{savedData}}` | Données extraites (saveAs) | Toute donnée extraite |

---

## Dépendances externes

| Package | Version | Usage |
|---------|---------|-------|
| `playwright` | ^1.57.0 | Automation de navigateur |
| `winston` | ^3.19.0 | Logging avancé |
| `node-cron` | ^4.2.1 | Planification avec expressions cron |
| `ajv` | ^8.17.1 | Validation JSON Schema |
| `json2csv` | ^6.0.0 | Export CSV |
| `minimist` | ^1.2.8 | Parsing des arguments CLI |

---

## Conventions de nommage

### Fichiers
- Classes : PascalCase (`Browser.js`, `Scraper.js`)
- Modules : kebab-case (`error-handler.js`, `config-loader.js`)
- Actions : kebab-case (`navigate.js`, `sub-workflow.js`)

### Code
- Classes : PascalCase (`class Workflow`)
- Fonctions : camelCase (`async function executeAction()`)
- Constantes : UPPER_SNAKE_CASE (`const DEFAULT_TIMEOUT = 5000`)
- Variables : camelCase (`const userName = 'john'`)

### Configuration
- Propriétés : camelCase (`headless`, `waitUntil`)
- Fichiers : kebab-case (`pagination-click.json`)

---

## Points d'extension

Pour étendre le projet :

1. **Nouvelle action** : Créer `src/actions/my-action.js` et l'enregistrer
2. **Nouvel extracteur** : Créer `src/extractors/my-extractor.js` et l'enregistrer
3. **Nouveau format de sortie** : Créer `src/output/my-writer.js`
4. **Nouveau logger transport** : Modifier `src/utils/logger.js`

---

## Tests

Structure recommandée pour les tests (à implémenter) :

```
tests/
├── unit/
│   ├── actions/
│   ├── extractors/
│   └── utils/
├── integration/
│   ├── workflows/
│   └── scenarios/
└── fixtures/
    ├── configs/
    └── html/
```

---

*Dernière mise à jour : 2026-01-20*
*Version du projet : 1.0.0*
