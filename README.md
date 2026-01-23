# Generic Scraper

Outil de scraping générique et configurable, basé sur Playwright.

> Automatisez vos extractions de données web sans écrire de code !

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org/)
[![Playwright](https://img.shields.io/badge/playwright-latest-blue)](https://playwright.dev/)
[![License](https://img.shields.io/badge/license-ISC-blue.svg)](LICENSE)
[![Status](https://img.shields.io/badge/status-production%20ready-success)](documentation/PROJECT_SUMMARY.md)
[![Version](https://img.shields.io/badge/version-1.0.0-blue)](documentation/CHANGELOG.md)

---

## 📚 Table des matières

- [Fonctionnalités](#fonctionnalités-principales)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Démarrage rapide](#démarrage-rapide)
- [Utilisation](#utilisation)
- [Configuration](#configuration)
- [Exemples](#exemples)
- [Documentation](#documentation)
- [Architecture](#architecture)
- [FAQ](#faq)

> 💡 **Nouveau sur le projet ?** Consultez le [Guide de démarrage rapide](documentation/documentation/QUICKSTART.md) !

## Fonctionnalités principales

- ✅ Configuration 100% via fichiers JSON
- ✅ Système de logging avancé avec Winston (rotation, niveaux, métadonnées)
- ✅ Gestion du navigateur Playwright (pool de pages, blocage de ressources)
- ✅ Actions configurables complètes :
  - `navigate` - Navigation avec options (waitUntil, timeout, referer)
  - `click` - Clics avec gestion d'erreurs et options avancées
  - `scroll` - Défilement (page, element, bottom, top, into-view)
  - `wait` - Attentes variées (timeout, selector, navigation, networkidle, function, url)
  - `input` - Saisies et formulaires (fill, type, press, select, check, uncheck, upload)
  - `extract` - Extraction de données (text, attribute, html, list)
  - `api` - Requêtes HTTP/API (GET, POST, PUT, DELETE, PATCH)
  - `pagination` - Gestion avancée de la pagination (click, url, scroll)
  - `loop` - Itération sur des éléments/tableaux
  - `condition` - Branchements conditionnels (if/then/else)
  - `subWorkflow` - Appel de sous-workflows réutilisables
- ✅ Extracteurs de données :
  - `text` - Extraction de texte (innerText, textContent)
  - `attribute` - Extraction d'attributs HTML
  - `html` - Extraction de code HTML (inner, outer)
  - `list` - Extraction de listes avec sous-champs
  - `pageUrl` - Récupération de l'URL de la page courante
- ✅ Workflows séquentiels :
  - Orchestration des étapes (steps)
  - Contexte partagé entre steps
  - Templating de variables {{variable}}
  - Gestion des erreurs par step
  - Validation JSON Schema
  - Sous-workflows réutilisables
  - Boucles et itérations
  - Conditions et branchements
- ✅ Pagination avancée :
  - Pagination par clic (bouton suivant)
  - Pagination par URL (pattern incrémental)
  - Scroll infini avec détection de fin
  - Limites configurables (maxPages, maxItems)
  - Répétition d'étapes sur chaque page
- ✅ Requêtes API :
  - Support méthodes HTTP (GET, POST, PUT, DELETE, PATCH)
  - Headers dynamiques avec templates
  - Body avec templating JSON/texte
  - Types de réponse multiples (json, text, blob, arrayBuffer)
  - Utilisation automatique des cookies de session du navigateur
  - Timeouts configurables
- ✅ Gestion robuste des erreurs :
  - Système de retry avec exponential backoff
  - Timeouts configurables (global et par action)
  - Screenshots automatiques lors des erreurs
  - Mode continue-on-error (ignorer les erreurs)
  - Logging détaillé avec contexte complet
- ✅ Planification et automatisation :
  - Scheduler avec expressions cron
  - Support des fuseaux horaires
  - Mode daemon (exécution en arrière-plan)
  - Persistence de l'état (reprise après crash)
  - Historique des exécutions
- ✅ Export de données :
  - Format JSON (pretty print, append mode)
  - Format CSV (headers, délimiteurs, colonnes)
  - Nommage avec templates ({{date}}, {{time}}, etc.)
  - Sélection et réordonnancement de colonnes
  - Mode append pour fichiers existants

## Prérequis

- **Node.js** 18+ (recommandé : v20 LTS)
- **npm** ou **yarn**
- Système d'exploitation : Windows, macOS, Linux

## Installation

### 1. Cloner le projet

```bash
git clone https://github.com/ArthurBr02/generic-scraper.git
cd generic-scraper
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Installer les navigateurs Playwright

```bash
npx playwright install chromium
```

**Notes :**
- `npx playwright install` télécharge les navigateurs nécessaires (~100 Mo)
- Pour installer tous les navigateurs : `npx playwright install`
- Pour un environnement headless Linux : `npx playwright install-deps`

## Démarrage rapide

### Option 1 : Exemple simple (scraping de texte)

1. Créez un fichier `quick-start.json` :

```json
{
  "name": "quick-start",
  "target": { "url": "https://example.com" },
  "browser": { "headless": true },
  "workflow": {
    "steps": [
      {
        "id": "1",
        "type": "navigate",
        "config": { "url": "{{target.url}}" }
      },
      {
        "id": "2",
        "type": "extract",
        "config": {
          "selector": "h1",
          "type": "text",
          "saveAs": "title"
        }
      }
    ]
  },
  "output": {
    "format": "json",
    "path": "./output/quick-start.json"
  }
}
```

2. Lancez le scraper :

```bash
npm run start -- --config quick-start.json
```

3. Vos données sont dans `output/quick-start.json` !

### Option 2 : Utiliser un exemple pré-configuré

```bash
npm run start -- --config ./configs/examples/simple-navigation.json
```

## Utilisation

### Lancement basique

Avec la config par défaut ([data/config.json](data/config.json)) :

```bash
npm run start
```

Ou sur Windows avec le script batch :

```bash
start.bat
```

### Avec une configuration spécifique

```bash
npm run start -- --config ./configs/examples/simple-scrape.json
```

### Mode scheduling (exécution planifiée)

```bash
# Lancer le scheduler (selon cron défini dans config)
npm run start -- --config ./configs/examples/scheduled-config.json --schedule

# Mode daemon (arrière-plan)
npm run start -- --config ./configs/examples/scheduled-config.json --daemon
```

### Options CLI complètes

```bash
# Aide
npm run start -- --help

# Override du format de sortie
npm run start -- --config ./data/config.json --format csv

# Mode non-headless (navigateur visible)
npm run start -- --headless false

# Spécifier le dossier de sortie
npm run start -- --output ./mes-donnees
```

### Avec variable d'environnement

**Linux/macOS :**

```bash
export SCRAPER_CONFIG=./configs/examples/simple-scrape.json
npm run start
```

**Windows (PowerShell) :**

```powershell
$env:SCRAPER_CONFIG = "./configs/examples/simple-scrape.json"
npm run start
```

Structure du projet (essentiel)

- `src/` : code source
	- `src/index.js` : point d'entrée CLI
	- `src/core/` : moteur, workflow, browser, scheduler
	- `src/actions/` : actions exécutables (click, navigate, extract...)
	- `src/extractors/` : extracteurs de données
	- `src/output/` : writers JSON/CSV
	- `src/utils/` : logger, loader de config, helpers
- `data/config.json` : configuration utilisateur par défaut
- `configs/examples/` : exemples de workflows/configs
- `documentation/plan.md` : plan d'implémentation détaillé

Configuration

Le projet est entièrement configurable via JSON. Voir `documentation/plan.md` pour le schéma et les exemples de `config.json` et `workflow.json`.

Scripts utiles
```markdown
# Generic Scraper

Outil de scraping générique et configurable, basé sur Playwright.

Fonctionnalités principales
- Configuration 100% via fichiers JSON
- Workflows séquentiels et sous-workflows
- Actions configurables : `navigate`, `click`, `scroll`, `wait`, `input`, `extract`, `api`, `pagination`, etc.
- Export en `JSON` et `CSV`
- Gestion des retries, timeouts et logs

Prérequis
- Node.js 18+ (recommandé)
- npm (ou yarn)

Installation (Node.js)

```bash
npm install
npx playwright install chromium
```

Remarques :
- `npx playwright install` installe les navigateurs Playwright nécessaires (Chromium, Firefox, WebKit selon le besoin).
- Sur Windows, vous pouvez également utiliser le script `start.bat` pour démarrer rapidement.

Utilisation (exemples)

Lancer avec la config par défaut (`data/config.json`):

```bash
npm run start
# ou sur Windows
start.bat
```

Lancer en précisant un fichier de configuration :

```bash
npm run start -- --config ./configs/examples/simple-scrape.json
```

Définir la variable d'environnement `SCRAPER_CONFIG` (Linux/macOS) :

```bash
export SCRAPER_CONFIG=./configs/examples/simple-scrape.json
npm run start
```

Sous Windows (PowerShell) :

```powershell
$env:SCRAPER_CONFIG = "./configs/examples/simple-scrape.json"
.
start.bat
```

## Structure du projet

```
generic-scraper/
├── src/
│   ├── index.js              # Point d'entrée CLI
│   ├── core/
│   │   ├── browser.js        # ✅ Gestion du navigateur Playwright
│   │   ├── scraper.js        # ✅ Orchestrateur principal
│   │   ├── workflow.js       # ✅ Exécution des workflows
│   │   └── scheduler.js      # ✅ Planification avec cron
│   ├── actions/
│   │   ├── index.js          # ✅ Registre d'actions (factory pattern)
│   │   ├── navigate.js       # ✅ Action de navigation
│   │   ├── click.js          # ✅ Action de clic
│   │   ├── wait.js           # ✅ Action d'attente
│   │   ├── scroll.js         # ✅ Action de défilement
│   │   ├── input.js          # ✅ Action de saisie
│   │   ├── extract.js        # ✅ Extraction de données
│   │   ├── api.js            # ✅ Requêtes HTTP/API
│   │   ├── pagination.js     # ✅ Gestion pagination
│   │   ├── loop.js           # ✅ Boucles et itérations
│   │   ├── condition.js      # ✅ Conditions if/else
│   │   └── subWorkflow.js    # ✅ Sous-workflows
│   ├── extractors/
│   │   ├── index.js          # ✅ Registre d'extracteurs
│   │   ├── text.js           # ✅ Extraction de texte
│   │   ├── attribute.js      # ✅ Extraction d'attributs
│   │   ├── html.js           # ✅ Extraction HTML
│   │   └── list.js           # ✅ Extraction de listes
│   ├── output/
│   │   ├── index.js          # ✅ Gestionnaire de sortie
│   │   ├── json-writer.js    # ✅ Export JSON
│   │   └── csv-writer.js     # ✅ Export CSV
│   └── utils/
│       ├── logger.js         # ✅ Logging avec Winston
│       ├── configLoader.js   # ✅ Chargeur de configuration
│       ├── error-handler.js  # ✅ Gestion d'erreurs + retry
│       ├── retry.js          # ✅ Système de retries
│       └── template.js       # ✅ Moteur de templates
├── configs/
│   └── examples/             # ✅ Exemples de configurations
│       ├── api-request-example.json
│       ├── error-handling-test.json
│       ├── scheduled-config.json
│       └── ...
├── data/
│   ├── config.json           # Configuration par défaut
│   └── schema.json           # Schéma JSON de validation
├── documentation/
│   └── plan.md               # Plan d'implémentation détaillé
├── logs/                     # Fichiers de logs (générés)
├── output/                   # Résultats du scraping (générés)
├── screenshots/              # Screenshots d'erreurs (générés)
├── package.json
└── README.md
```

**Légende :**
- ✅ Implémenté et testé

## Configuration

Le projet est entièrement configurable via JSON. Consultez [documentation/plan.md](documentation/plan.md) pour les schémas détaillés et exemples.

### Exemple de configuration minimale

```json
{
  "name": "mon-scraper",
  "target": {
    "url": "https://example.com"
  },
  "browser": {
    "headless": true,
    "timeout": 30000
  },
  "errorHandling": {
    "retries": 3,
    "retryDelay": 1000,
    "screenshotOnError": true
  },
  "logging": {
    "level": "info",
    "console": true
  },
  "workflow": "./configs/workflows/main.json",
  "output": {
    "format": "json",
    "path": "./output"
  }
}
```

### Exemple de workflow avec API

```json
{
  "name": "api-workflow",
  "steps": [
    {
      "id": "step-1",
      "name": "Récupérer données API",
      "type": "api",
      "config": {
        "method": "GET",
        "url": "https://api.example.com/data",
        "headers": {
          "Authorization": "Bearer {{token}}"
        },
        "responseType": "json",
        "saveAs": "apiData"
      }
    },
    {
      "id": "step-2",
      "name": "Navigation avec données",
      "type": "navigate",
      "config": {
        "url": "https://example.com/page/{{apiData.id}}"
      }
    }
  ]
}
```

### Configuration du scheduler

```json
{
  "scheduling": {
    "enabled": true,
    "cron": "0 */6 * * *",
    "timezone": "Europe/Paris",
    "persistState": true,
    "restartOnCrash": true
  }
}
```

**Expressions cron courantes :**
- `* * * * *` - Chaque minute
- `*/5 * * * *` - Toutes les 5 minutes
- `0 * * * *` - Chaque heure
- `0 */6 * * *` - Toutes les 6 heures
- `0 0 * * *` - Chaque jour à minuit
- `0 9 * * 1` - Chaque lundi à 9h00

## Exemples

### 1. Scraping simple d'une page

```json
{
  "name": "simple-scraping",
  "target": { "url": "https://books.toscrape.com" },
  "workflow": {
    "steps": [
      {
        "type": "navigate",
        "config": { "url": "{{target.url}}" }
      },
      {
        "type": "extract",
        "config": {
          "selector": ".product_pod h3 a",
          "type": "list",
          "fields": [
            { "name": "title", "type": "text" },
            { "name": "url", "type": "attribute", "attribute": "href" }
          ],
          "saveAs": "books"
        }
      }
    ]
  },
  "output": {
    "format": "json",
    "path": "./output/books.json"
  }
}
```

### 2. Pagination automatique

```json
{
  "name": "pagination-example",
  "workflow": {
    "steps": [
      {
        "type": "navigate",
        "config": { "url": "https://books.toscrape.com" }
      },
      {
        "type": "pagination",
        "config": {
          "type": "click",
          "nextSelector": ".next a",
          "maxPages": 5,
          "waitAfterClick": 1000,
          "repeatSteps": ["extract-books"]
        }
      },
      {
        "id": "extract-books",
        "type": "extract",
        "config": {
          "selector": ".product_pod",
          "type": "list",
          "fields": [
            { "name": "title", "selector": "h3 a", "type": "text" },
            { "name": "price", "selector": ".price_color", "type": "text" }
          ],
          "saveAs": "books"
        }
      }
    ]
  }
}
```

### 3. Workflow avec conditions

```json
{
  "workflow": {
    "steps": [
      {
        "type": "navigate",
        "config": { "url": "https://example.com" }
      },
      {
        "type": "condition",
        "config": {
          "if": {
            "selector": ".logged-in",
            "exists": true
          },
          "then": [
            { "type": "click", "config": { "selector": ".profile-button" } }
          ],
          "else": [
            { "type": "navigate", "config": { "url": "/login" } }
          ]
        }
      }
    ]
  }
}
```

### 4. Boucle sur des éléments

```json
{
  "workflow": {
    "steps": [
      {
        "type": "navigate",
        "config": { "url": "https://example.com/products" }
      },
      {
        "type": "loop",
        "config": {
          "selector": ".product-card",
          "maxIterations": 10,
          "steps": [
            {
              "type": "click",
              "config": { "selector": ".product-link" }
            },
            {
              "type": "extract",
              "config": {
                "selector": ".product-details",
                "type": "text",
                "saveAs": "productInfo"
              }
            },
            {
              "type": "navigate",
              "config": { "url": "back" }
            }
          ]
        }
      }
    ]
  }
}
```

### 5. Intégration API

```json
{
  "workflow": {
    "steps": [
      {
        "type": "api",
        "config": {
          "method": "GET",
          "url": "https://api.github.com/users/{{username}}",
          "headers": {
            "Accept": "application/json"
          },
          "responseType": "json",
          "saveAs": "userData"
        }
      },
      {
        "type": "navigate",
        "config": {
          "url": "https://github.com/{{userData.login}}"
        }
      },
      {
        "type": "extract",
        "config": {
          "selector": ".profile-name",
          "type": "text",
          "saveAs": "profileName"
        }
      }
    ]
  }
}
```

Pour plus d'exemples, consultez le dossier [`configs/examples/`](configs/examples/) et la [documentation des exemples](documentation/examples.md).

## Documentation

- � [Démarrage rapide](documentation/QUICKSTART.md) - Guide visuel en 5 minutes
- 📖 [Plan d'implémentation détaillé](documentation/plan.md)
- ⚙️ [Guide de configuration complète](documentation/configuration.md)
- 💡 [Exemples d'utilisation](documentation/examples.md)
- 🏗️ [Structure du projet](documentation/STRUCTURE.md)
- 📝 [Changelog](documentation/CHANGELOG.md)
- 📋 [Template de configuration](config.template.json)

## Scripts disponibles

```json
{
  "scripts": {
    "start": "node src/index.js",
    "dev": "node src/index.js --config ./data/config.json",
    "lint": "eslint src/"
  }
}
```

- `npm run start` - Lance le scraper avec la config par défaut
- `npm run dev` - Lance en mode développement
- `npm run lint` - Vérifie la qualité du code

## Architecture

Le projet suit une architecture modulaire :

1. **Core** : Gestion du navigateur et orchestration
2. **Actions** : Pattern factory avec registre d'actions
3. **Utils** : Logging, configuration, gestion d'erreurs
4. **Configuration** : 100% JSON avec validation via schéma

### Diagramme d'architecture

```
┌─────────────────────────────────────────────────────────┐
│                     CLI (index.js)                      │
└─────────────────────┬───────────────────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        │                           │
┌───────▼────────┐         ┌────────▼────────┐
│   Scheduler    │         │    Scraper      │
│  (Planning)    │         │  (Orchestrateur)│
└────────────────┘         └────────┬────────┘
                                    │
                  ┌─────────────────┼─────────────────┐
                  │                 │                 │
         ┌────────▼────────┐ ┌──────▼──────┐ ┌───────▼────────┐
         │    Browser      │ │  Workflow   │ │  OutputWriter  │
         │   (Playwright)  │ │  (Steps)    │ │  (JSON/CSV)    │
         └─────────────────┘ └──────┬──────┘ └────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
            ┌───────▼──────┐ ┌──────▼──────┐ ┌─────▼──────┐
            │   Actions    │ │ Extractors  │ │   Utils    │
            │ (navigate,   │ │ (text,      │ │ (logger,   │
            │  click...)   │ │  list...)   │ │  retry...) │
            └──────────────┘ └─────────────┘ └────────────┘
```

### Pattern d'action

Toutes les actions suivent le même contrat :

```javascript
module.exports = {
  name: 'action-name',
  description: 'Description de l\'action',
  
  /**
   * Exécute l'action
   * @param {Page} page - Page Playwright
   * @param {Object} config - Configuration de l'action
   * @param {Object} context - Contexte d'exécution (logger, data...)
   * @returns {Promise<any>} Résultat de l'action
   */
  async execute(page, config, context) {
    // Logique de l'action
    return result;
  }
};
```

## FAQ

### Comment scraper un site avec authentification ?

Utilisez l'action `input` pour remplir le formulaire de connexion :

```json
{
  "steps": [
    { "type": "navigate", "config": { "url": "https://example.com/login" } },
    { "type": "input", "config": { "selector": "#username", "value": "{{credentials.username}}", "method": "fill" } },
    { "type": "input", "config": { "selector": "#password", "value": "{{credentials.password}}", "method": "fill" } },
    { "type": "click", "config": { "selector": "#login-button" } },
    { "type": "wait", "config": { "type": "navigation" } }
  ]
}
```

### Comment gérer les pop-ups et cookies ?

Ajoutez un step pour fermer les pop-ups :

```json
{
  "type": "click",
  "continueOnError": true,
  "config": {
    "selector": ".cookie-accept-button"
  }
}
```

### Comment scraper des données paginées ?

Utilisez l'action `pagination` avec `repeatSteps` :

```json
{
  "type": "pagination",
  "config": {
    "type": "click",
    "nextSelector": ".next-page",
    "maxPages": 10,
    "repeatSteps": ["extract-data"]
  }
}
```

### Comment exporter en CSV avec des colonnes spécifiques ?

```json
{
  "output": {
    "format": "csv",
    "path": "./output/data.csv",
    "columns": ["title", "price", "url"],
    "csv": {
      "delimiter": ";",
      "includeHeaders": true
    }
  }
}
```

### Puis-je utiliser des proxies ?

Oui, configurez-les dans la section `browser` :

```json
{
  "browser": {
    "proxy": {
      "server": "http://proxy.example.com:8080",
      "username": "user",
      "password": "pass"
    }
  }
}
```

## Dépannage

### Le navigateur ne se lance pas

- Vérifiez que Playwright est bien installé : `npx playwright install`
- Sur Linux, installez les dépendances système : `npx playwright install-deps`

### Les sélecteurs ne trouvent pas les éléments

- Utilisez le mode headless=false pour voir ce qui se passe
- Ajoutez des `wait` avant les actions
- Vérifiez les sélecteurs CSS avec les DevTools du navigateur

### Les données extraites sont incorrectes

- Vérifiez le type d'extracteur utilisé (`text` vs `textContent` vs `innerText`)
- Ajoutez des logs pour débugger : `"logging": { "level": "debug" }`

### Le scraper est lent

- Activez le blocage de ressources : `"resourceBlocking": { "enabled": true }`
- Réduisez les délais : `"delayBetweenActions": 100`
- Utilisez le mode headless : `"headless": true`

## Roadmap

- [ ] Interface web de configuration (drag & drop)
- [ ] Support de Docker
- [ ] API REST pour déclencher des scrapings
- [ ] Dashboard de monitoring
- [ ] Support de plugins personnalisés
- [ ] Export vers bases de données (MongoDB, PostgreSQL)

## Licence

ISC

---

## Crédits

Développé avec ❤️ en utilisant :
- [Playwright](https://playwright.dev/) - Automation de navigateur
- [Winston](https://github.com/winstonjs/winston) - Logging
- [node-cron](https://github.com/node-cron/node-cron) - Scheduling
- [json2csv](https://github.com/zemirco/json2csv) - Export CSV

---

*Dernière mise à jour : Sprint 7.1 (2026-01-20)*
*Version : 1.0.0*

### Action API

Effectuez des requêtes HTTP directement depuis vos workflows :

```json
{
  "type": "api",
  "config": {
    "method": "POST",
    "url": "https://api.example.com/data",
    "headers": {
      "Authorization": "Bearer {{token}}",
      "Content-Type": "application/json"
    },
    "body": {
      "query": "{{searchTerm}}",
      "limit": 10
    },
    "responseType": "json",
    "saveAs": "apiResponse",
    "timeout": 5000
  }
}
```

**Méthodes supportées :** GET, POST, PUT, DELETE, PATCH  
**Types de réponse :** json, text, blob, arrayBuffer  
**Fonctionnalités :** Templates dans URL/headers/body, cookies automatiques, timeouts

### Gestion des erreurs

Configuration robuste avec retry et screenshots :

```json
{
  "errorHandling": {
    "retries": 3,
    "retryDelay": 1000,
    "continueOnError": false,
    "screenshotOnError": true,
    "screenshotPath": "./screenshots"
  }
}
```

**Au niveau d'un step :**

```json
{
  "type": "click",
  "continueOnError": true,
  "retry": {
    "retries": 5,
    "delay": 2000,
    "backoffMultiplier": 2,
    "screenshotOnError": true
  },
  "timeout": 10000,
  "config": {
    "selector": "#button"
  }
}
```

**Fonctionnalités :**
- Exponential backoff (délai x2 à chaque tentative)
- Screenshots automatiques lors des échecs
- Mode continue-on-error pour ignorer les erreurs
- Timeouts configurables globalement et par action

### Scheduler

Planifiez vos scrapings avec des expressions cron :

```bash
# Lancer en mode scheduler
node src/index.js --schedule --config ./configs/scheduled.json

# Mode daemon (arrière-plan)
node src/index.js --daemon --config ./configs/scheduled.json
```

**Configuration :**

```json
{
  "scheduling": {
    "enabled": true,
    "cron": "0 */6 * * *",
    "timezone": "Europe/Paris",
    "persistState": true,
    "stateFile": "./scheduler-state.json",
    "restartOnCrash": true
  }
}
```

**Fonctionnalités :**
- Expressions cron standard
- Support des fuseaux horaires
- Persistence de l'historique
- Restart automatique après crash
- Mode daemon avec gestion SIGINT/SIGTERM

### Logger (Winston)

```javascript
const { getLogger } = require('./src/utils/logger');
const logger = getLogger();

logger.info('Message');
logger.error('Erreur', { context: 'details' });
logger.withContext({ userId: 123 }).info('Action utilisateur');
```

### Browser

```javascript
const Browser = require('./src/core/browser');
const browser = new Browser(config);

await browser.launch({ headless: true });
const page = await browser.newPage();
// ... utilisation
await browser.close();
```

### Actions

Toutes les actions suivent le même pattern :

```javascript
module.exports = {
  name: 'mon-action',
  description: 'Description',
  async execute(page, config, context) {
    // Logique de l'action
    return result;
  }
};
```

## Licence

ISC

---

*Dernière mise à jour : Sprint 6.2 (2026-01-20)*
