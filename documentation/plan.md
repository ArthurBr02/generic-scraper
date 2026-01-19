# Plan d'implémentation - Generic Scraper

> Scraper configurable basé sur Playwright avec gestion de workflows complexes

---

## Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture du projet](#architecture-du-projet)
3. [Format des fichiers de configuration](#format-des-fichiers-de-configuration)
4. [Phases d'implémentation](#phases-dimplémentation)
5. [Détails techniques](#détails-techniques)

---

## Vue d'ensemble

### Objectifs principaux
- Créer un scraper générique et réutilisable
- Configuration 100% via fichiers JSON (aucun code à modifier)
- Support de workflows complexes (multi-pages, pagination, API)
- Extensibilité pour futures fonctionnalités (auth, formulaires, cookies)

### Stack technique
| Composant | Technologie |
|-----------|-------------|
| Runtime | Node.js 18+ |
| Scraping | Playwright |
| CLI | minimist / commander |
| Logging | winston |
| Output | JSON, CSV (via json2csv) |
| Validation | ajv (JSON Schema) |

---

## Architecture du projet

```
generic-scraper/
├── src/
│   ├── index.js                 # Point d'entrée CLI
│   ├── core/
│   │   ├── scraper.js           # Moteur principal de scraping
│   │   ├── browser.js           # Gestion du navigateur Playwright
│   │   ├── workflow.js          # Orchestrateur de workflows
│   │   └── scheduler.js         # Planificateur d'exécutions
│   ├── actions/
│   │   ├── index.js             # Registre des actions
│   │   ├── click.js             # Action: clic
│   │   ├── scroll.js            # Action: défilement
│   │   ├── wait.js              # Action: attente
│   │   ├── input.js             # Action: saisie de texte
│   │   ├── navigate.js          # Action: navigation
│   │   └── api-request.js       # Action: requête API
│   ├── extractors/
│   │   ├── index.js             # Registre des extracteurs
│   │   ├── text.js              # Extraction de texte
│   │   ├── attribute.js         # Extraction d'attributs
│   │   ├── html.js              # Extraction HTML brut
│   │   └── list.js              # Extraction de listes
│   ├── output/
│   │   ├── index.js             # Gestionnaire de sortie
│   │   ├── json-writer.js       # Export JSON
│   │   └── csv-writer.js        # Export CSV
│   ├── utils/
│   │   ├── logger.js            # Configuration du logging
│   │   ├── config-loader.js     # Chargement et validation des configs
│   │   ├── error-handler.js     # Gestion des erreurs et retries
│   │   └── helpers.js           # Fonctions utilitaires
│   └── schemas/
│       ├── config.schema.json   # Schéma JSON pour validation
│       └── workflow.schema.json # Schéma des workflows
├── configs/
│   ├── examples/
│   │   ├── simple-scrape.json   # Exemple: scraping simple
│   │   ├── pagination.json      # Exemple: avec pagination
│   │   └── multi-page.json      # Exemple: multi-pages
│   └── default.json             # Configuration par défaut
├── data/
│   └── config.json              # Config utilisateur principale
├── output/                      # Dossier de sortie des données
├── logs/                        # Fichiers de logs
├── documentation/
│   ├── plan.md                  # Ce fichier
│   ├── configuration.md         # Documentation des configs
│   └── examples.md              # Exemples d'utilisation
├── package.json
└── README.md
```

---

## Format des fichiers de configuration

### 1. Configuration principale (`config.json`)

```json
{
  "$schema": "./schemas/config.schema.json",
  "name": "my-scraper",
  "version": "1.0.0",
  
  "target": {
    "url": "https://example.com",
    "baseUrl": "https://example.com"
  },

  "browser": {
    "headless": true,
    "slowMo": 0,
    "timeout": 30000,
    "viewport": {
      "width": 1920,
      "height": 1080
    },
    "userAgent": null,
    "locale": "fr-FR"
  },

  "performance": {
    "delayBetweenActions": 500,
    "maxConcurrency": 1,
    "resourceBlocking": {
      "enabled": false,
      "types": ["image", "font", "media"]
    }
  },

  "errorHandling": {
    "retries": 3,
    "retryDelay": 1000,
    "continueOnError": false,
    "screenshotOnError": true
  },

  "logging": {
    "level": "info",
    "console": true,
    "file": {
      "enabled": true,
      "path": "./logs/scraper.log",
      "maxSize": "10m",
      "maxFiles": 5
    }
  },

  "scheduling": {
    "enabled": false,
    "cron": "0 */6 * * *",
    "timezone": "Europe/Paris"
  },

  "workflow": "./configs/workflows/main-workflow.json",
  
  "output": {
    "format": "json",
    "path": "./output",
    "filename": "data-{{date}}-{{time}}",
    "options": {
      "pretty": true,
      "append": false
    },
    "columns": null
  }
}
```

### 2. Configuration de workflow (`workflow.json`)

```json
{
  "name": "main-workflow",
  "description": "Workflow principal de scraping",
  
  "steps": [
    {
      "id": "step-1",
      "name": "Accéder à la page",
      "type": "navigate",
      "config": {
        "url": "{{target.url}}/products",
        "waitUntil": "networkidle"
      }
    },
    {
      "id": "step-2",
      "name": "Accepter les cookies",
      "type": "click",
      "config": {
        "selector": "#accept-cookies",
        "optional": true,
        "timeout": 5000
      }
    },
    {
      "id": "step-3",
      "name": "Attendre le chargement",
      "type": "wait",
      "config": {
        "type": "selector",
        "value": ".product-list",
        "timeout": 10000
      }
    },
    {
      "id": "step-4",
      "name": "Extraire les produits",
      "type": "extract",
      "config": {
        "container": ".product-item",
        "multiple": true,
        "fields": [
          {
            "name": "title",
            "selector": ".product-title",
            "type": "text"
          },
          {
            "name": "price",
            "selector": ".product-price",
            "type": "text",
            "transform": "number"
          },
          {
            "name": "link",
            "selector": "a.product-link",
            "type": "attribute",
            "attribute": "href"
          },
          {
            "name": "image",
            "selector": "img.product-image",
            "type": "attribute",
            "attribute": "src"
          }
        ]
      },
      "output": "products"
    },
    {
      "id": "step-5",
      "name": "Pagination",
      "type": "pagination",
      "config": {
        "type": "click",
        "nextSelector": ".pagination .next:not(.disabled)",
        "maxPages": 10,
        "waitAfterClick": 2000,
        "repeatSteps": ["step-4"]
      }
    }
  ],

  "subWorkflows": {
    "product-details": {
      "steps": [
        {
          "id": "detail-1",
          "type": "navigate",
          "config": {
            "url": "{{item.link}}"
          }
        },
        {
          "id": "detail-2",
          "type": "extract",
          "config": {
            "fields": [
              {
                "name": "description",
                "selector": ".product-description",
                "type": "text"
              },
              {
                "name": "specs",
                "selector": ".specs-table tr",
                "type": "list",
                "fields": [
                  { "name": "key", "selector": "th", "type": "text" },
                  { "name": "value", "selector": "td", "type": "text" }
                ]
              }
            ]
          }
        }
      ]
    }
  }
}
```

### 3. Types d'actions disponibles

| Action | Description | Paramètres clés |
|--------|-------------|-----------------|
| `navigate` | Navigation vers une URL | `url`, `waitUntil` |
| `click` | Clic sur un élément | `selector`, `button`, `count` |
| `scroll` | Défilement | `direction`, `distance`, `selector` |
| `wait` | Attente | `type` (time/selector/function), `value` |
| `input` | Saisie de texte | `selector`, `value`, `clear` |
| `select` | Sélection dans un dropdown | `selector`, `value` |
| `hover` | Survol d'un élément | `selector` |
| `screenshot` | Capture d'écran | `path`, `fullPage` |
| `extract` | Extraction de données | `fields`, `container`, `multiple` |
| `api` | Requête API | `method`, `url`, `headers`, `body` |
| `condition` | Branchement conditionnel | `if`, `then`, `else` |
| `loop` | Boucle sur des éléments | `items`, `steps` |
| `subWorkflow` | Appel de sous-workflow | `name`, `params` |

### 4. Types d'extraction

```json
{
  "fields": [
    {
      "name": "title",
      "selector": "h1",
      "type": "text",
      "transform": "trim"
    },
    {
      "name": "link",
      "selector": "a",
      "type": "attribute",
      "attribute": "href",
      "transform": "absoluteUrl"
    },
    {
      "name": "content",
      "selector": ".content",
      "type": "html"
    },
    {
      "name": "items",
      "selector": ".item",
      "type": "list",
      "fields": [...]
    },
    {
      "name": "data",
      "type": "script",
      "script": "() => window.__DATA__"
    }
  ]
}
```

### 5. Transformations disponibles

| Transform | Description | Exemple |
|-----------|-------------|---------|
| `trim` | Supprime les espaces | `"  hello  "` → `"hello"` |
| `number` | Convertit en nombre | `"12.99€"` → `12.99` |
| `integer` | Convertit en entier | `"42"` → `42` |
| `lowercase` | Minuscules | `"HELLO"` → `"hello"` |
| `uppercase` | Majuscules | `"hello"` → `"HELLO"` |
| `absoluteUrl` | URL absolue | `"/page"` → `"https://site.com/page"` |
| `date` | Parse une date | `"2026-01-19"` → Date object |
| `regex` | Extraction regex | Pattern + groupe |
| `replace` | Remplacement | Pattern + replacement |
| `split` | Découpage | Délimiteur → array |
| `join` | Jointure | Array → string |
| `custom` | Fonction custom | Expression JS |

---

## Phases d'implémentation

### Phase 1 : Fondations (Sprint 1-2)
> **Durée estimée : 1-2 semaines**

#### Sprint 1.1 : Setup du projet
| Tâche | Détails | Fichiers |
|-------|---------|----------|
| **T1.1.1** Initialisation npm | `npm init`, configuration package.json | `package.json` |
| **T1.1.2** Installation dépendances | playwright, minimist, winston, ajv | `package.json` |
| **T1.1.3** Structure dossiers | Créer l'arborescence complète | Tous les dossiers |
| **T1.1.4** Configuration ESLint | Règles de linting | `.eslintrc.json` |
| **T1.1.5** Git setup | .gitignore, hooks | `.gitignore` |

```bash
# Commandes Sprint 1.1
npm init -y
npm install playwright minimist winston ajv json2csv
npm install -D eslint
npx playwright install chromium
```

#### Sprint 1.2 : CLI de base
| Tâche | Détails | Fichiers |
|-------|---------|----------|
| **T1.2.1** Point d'entrée CLI | Parsing des arguments --config | `src/index.js` |
| **T1.2.2** Chargement config | Lecture et merge des configs | `src/utils/config-loader.js` |
| **T1.2.3** Schéma de validation | JSON Schema pour config principale | `src/schemas/config.schema.json` |
| **T1.2.4** Validation des configs | Utilisation d'ajv | `src/utils/config-loader.js` |
| **T1.2.5** Gestion des erreurs | Classe d'erreurs custom | `src/utils/error-handler.js` |

```javascript
// Exemple T1.2.1 - src/index.js
const args = require('minimist')(process.argv.slice(2));
const configPath = args.config || './data/config.json';
// Charger et valider la config
const config = loadConfig(configPath);
// Lancer le scraper
run(config);
```

#### Sprint 1.3 : Système de logging
| Tâche | Détails | Fichiers |
|-------|---------|----------|
| **T1.3.1** Configuration Winston | Niveaux, formats, transports | `src/utils/logger.js` |
| **T1.3.2** Transport fichier | Rotation des logs | `src/utils/logger.js` |
| **T1.3.3** Transport console | Couleurs, formatage | `src/utils/logger.js` |
| **T1.3.4** Contexte de log | Ajout de métadonnées | `src/utils/logger.js` |

```javascript
// Exemple T1.3.1 - Configuration Winston
const winston = require('winston');

const logger = winston.createLogger({
  level: config.logging.level,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: config.logging.file.path }),
    new winston.transports.Console({ format: winston.format.simple() })
  ]
});
```

---

### Phase 2 : Moteur de scraping (Sprint 3-4)
> **Durée estimée : 2 semaines**

#### Sprint 2.1 : Gestion du navigateur
| Tâche | Détails | Fichiers |
|-------|---------|----------|
| **T2.1.1** Classe Browser | Wrapper Playwright | `src/core/browser.js` |
| **T2.1.2** Options de lancement | Headless, viewport, userAgent | `src/core/browser.js` |
| **T2.1.3** Gestion du contexte | Création/fermeture propre | `src/core/browser.js` |
| **T2.1.4** Pool de pages | Réutilisation des pages | `src/core/browser.js` |
| **T2.1.5** Blocage ressources | Images, fonts, etc. | `src/core/browser.js` |

```javascript
// Exemple T2.1.1 - src/core/browser.js
class Browser {
  async launch(options) {
    this.browser = await playwright.chromium.launch({
      headless: options.headless,
      slowMo: options.slowMo
    });
    this.context = await this.browser.newContext({
      viewport: options.viewport,
      userAgent: options.userAgent,
      locale: options.locale
    });
  }

  async newPage() {
    const page = await this.context.newPage();
    if (this.options.resourceBlocking?.enabled) {
      await this.setupResourceBlocking(page);
    }
    return page;
  }

  async close() {
    await this.context?.close();
    await this.browser?.close();
  }
}
```

#### Sprint 2.2 : Système d'actions
| Tâche | Détails | Fichiers |
|-------|---------|----------|
| **T2.2.1** Registre d'actions | Pattern factory | `src/actions/index.js` |
| **T2.2.2** Action navigate | Navigation avec options | `src/actions/navigate.js` |
| **T2.2.3** Action click | Clic avec gestion d'erreurs | `src/actions/click.js` |
| **T2.2.4** Action wait | Attentes diverses | `src/actions/wait.js` |
| **T2.2.5** Action scroll | Défilement | `src/actions/scroll.js` |
| **T2.2.6** Action input | Saisie de texte | `src/actions/input.js` |

```javascript
// Exemple T2.2.1 - src/actions/index.js
const actions = {
  navigate: require('./navigate'),
  click: require('./click'),
  wait: require('./wait'),
  scroll: require('./scroll'),
  input: require('./input')
};

async function executeAction(page, step, context) {
  const action = actions[step.type];
  if (!action) {
    throw new Error(`Unknown action type: ${step.type}`);
  }
  return await action.execute(page, step.config, context);
}

module.exports = { executeAction, registerAction };
```

```javascript
// Exemple T2.2.3 - src/actions/click.js
module.exports = {
  name: 'click',
  async execute(page, config, context) {
    const { selector, button = 'left', count = 1, optional = false } = config;
    
    try {
      await page.waitForSelector(selector, { timeout: config.timeout || 5000 });
      await page.click(selector, { button, clickCount: count });
      context.logger.debug(`Clicked on ${selector}`);
    } catch (error) {
      if (!optional) throw error;
      context.logger.warn(`Optional click failed: ${selector}`);
    }
  }
};
```

#### Sprint 2.3 : Système d'extraction
| Tâche | Détails | Fichiers |
|-------|---------|----------|
| **T2.3.1** Registre extracteurs | Pattern factory | `src/extractors/index.js` |
| **T2.3.2** Extraction texte | innerText, textContent | `src/extractors/text.js` |
| **T2.3.3** Extraction attribut | getAttribute | `src/extractors/attribute.js` |
| **T2.3.4** Extraction HTML | innerHTML, outerHTML | `src/extractors/html.js` |
| **T2.3.5** Extraction liste | Éléments multiples | `src/extractors/list.js` |
| **T2.3.6** Transformations | Pipeline de transforms | `src/extractors/transforms.js` |

```javascript
// Exemple T2.3.5 - src/extractors/list.js
module.exports = {
  name: 'list',
  async extract(page, config, context) {
    const { container, fields, multiple = true } = config;
    
    const elements = await page.$$(container);
    const results = [];
    
    for (const element of elements) {
      const item = {};
      for (const field of fields) {
        const extractor = getExtractor(field.type);
        item[field.name] = await extractor.extract(element, field, context);
        if (field.transform) {
          item[field.name] = applyTransform(item[field.name], field.transform);
        }
      }
      results.push(item);
    }
    
    return multiple ? results : results[0];
  }
};
```

---

### Phase 3 : Workflows (Sprint 5-6)
> **Durée estimée : 2 semaines**

#### Sprint 3.1 : Orchestrateur de workflows
| Tâche | Détails | Fichiers |
|-------|---------|----------|
| **T3.1.1** Classe Workflow | Chargement et exécution | `src/core/workflow.js` |
| **T3.1.2** Exécution séquentielle | Steps en série | `src/core/workflow.js` |
| **T3.1.3** Contexte partagé | Variables entre steps | `src/core/workflow.js` |
| **T3.1.4** Templating | Variables {{variable}} | `src/utils/template.js` |
| **T3.1.5** Schéma workflow | Validation JSON Schema | `src/schemas/workflow.schema.json` |

```javascript
// Exemple T3.1.1 - src/core/workflow.js
class Workflow {
  constructor(config, context) {
    this.config = config;
    this.context = context;
    this.data = {};
  }

  async execute(page) {
    for (const step of this.config.steps) {
      this.context.logger.info(`Executing step: ${step.name || step.id}`);
      
      // Résolution des templates
      const resolvedConfig = this.resolveTemplates(step.config);
      
      // Exécution de l'action
      const result = await executeAction(page, { ...step, config: resolvedConfig }, this.context);
      
      // Stockage du résultat
      if (step.output) {
        this.data[step.output] = result;
      }
    }
    return this.data;
  }

  resolveTemplates(obj) {
    // Remplace {{variable}} par les valeurs du contexte
    return JSON.parse(
      JSON.stringify(obj).replace(/\{\{([^}]+)\}\}/g, (_, path) => {
        return get(this.context, path) || get(this.data, path) || '';
      })
    );
  }
}
```

#### Sprint 3.2 : Pagination
| Tâche | Détails | Fichiers |
|-------|---------|----------|
| **T3.2.1** Action pagination | Type click/scroll/url | `src/actions/pagination.js` |
| **T3.2.2** Pagination par clic | Bouton suivant | `src/actions/pagination.js` |
| **T3.2.3** Pagination par URL | Pattern d'URL | `src/actions/pagination.js` |
| **T3.2.4** Scroll infini | Détection de fin | `src/actions/pagination.js` |
| **T3.2.5** Limite de pages | maxPages, maxItems | `src/actions/pagination.js` |

```javascript
// Exemple T3.2.2 - Pagination par clic
async function paginateByClick(page, config, workflow) {
  const { nextSelector, maxPages, waitAfterClick, repeatSteps } = config;
  let currentPage = 1;
  
  while (currentPage < maxPages) {
    // Vérifier si le bouton suivant existe
    const nextButton = await page.$(nextSelector);
    if (!nextButton) {
      logger.info('No more pages available');
      break;
    }
    
    // Cliquer sur suivant
    await nextButton.click();
    await page.waitForTimeout(waitAfterClick);
    currentPage++;
    
    // Ré-exécuter les steps spécifiés
    for (const stepId of repeatSteps) {
      const step = workflow.getStep(stepId);
      await workflow.executeStep(step, page);
    }
  }
}
```

#### Sprint 3.3 : Multi-pages et sous-workflows
| Tâche | Détails | Fichiers |
|-------|---------|----------|
| **T3.3.1** Navigation multi-pages | Liste d'URLs | `src/core/workflow.js` |
| **T3.3.2** Sous-workflows | Définition et appel | `src/core/workflow.js` |
| **T3.3.3** Action loop | Boucle sur éléments | `src/actions/loop.js` |
| **T3.3.4** Action condition | Branchement if/else | `src/actions/condition.js` |
| **T3.3.5** Parallélisation | Exécution concurrente | `src/core/workflow.js` |

```javascript
// Exemple T3.3.2 - Sous-workflows
async executeSubWorkflow(name, params, page) {
  const subWorkflow = this.config.subWorkflows[name];
  if (!subWorkflow) {
    throw new Error(`SubWorkflow not found: ${name}`);
  }
  
  // Créer un nouveau contexte avec les paramètres
  const subContext = {
    ...this.context,
    item: params
  };
  
  const subRunner = new Workflow(subWorkflow, subContext);
  return await subRunner.execute(page);
}
```

---

### Phase 4 : Sortie et exports (Sprint 7)
> **Durée estimée : 1 semaine**

#### Sprint 4.1 : Gestionnaire de sortie
| Tâche | Détails | Fichiers |
|-------|---------|----------|
| **T4.1.1** Interface Output | Classe abstraite | `src/output/index.js` |
| **T4.1.2** Export JSON | Pretty print, streaming | `src/output/json-writer.js` |
| **T4.1.3** Export CSV | Headers, délimiteurs | `src/output/csv-writer.js` |
| **T4.1.4** Nommage fichiers | Templates {{date}}, {{time}} | `src/output/index.js` |
| **T4.1.5** Mode append | Ajout aux fichiers existants | `src/output/index.js` |
| **T4.1.6** Sélection colonnes | Filtrage et ordre | `src/output/index.js` |

```javascript
// Exemple T4.1.2 - src/output/json-writer.js
class JsonWriter {
  constructor(options) {
    this.options = options;
  }

  async write(data, filePath) {
    const content = this.options.pretty 
      ? JSON.stringify(data, null, 2)
      : JSON.stringify(data);
    
    if (this.options.append && fs.existsSync(filePath)) {
      const existing = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const merged = Array.isArray(existing) 
        ? [...existing, ...data]
        : { ...existing, ...data };
      fs.writeFileSync(filePath, JSON.stringify(merged, null, 2));
    } else {
      fs.writeFileSync(filePath, content);
    }
  }
}
```

```javascript
// Exemple T4.1.6 - Sélection et ordre des colonnes
function selectColumns(data, columns) {
  if (!columns) return data;
  
  return data.map(item => {
    const result = {};
    for (const col of columns) {
      if (typeof col === 'string') {
        result[col] = item[col];
      } else {
        // { source: 'oldName', target: 'newName' }
        result[col.target] = item[col.source];
      }
    }
    return result;
  });
}
```

---

### Phase 5 : Requêtes API (Sprint 8)
> **Durée estimée : 1 semaine**

#### Sprint 5.1 : Action API
| Tâche | Détails | Fichiers |
|-------|---------|----------|
| **T5.1.1** Action api-request | GET, POST, PUT, DELETE | `src/actions/api-request.js` |
| **T5.1.2** Headers dynamiques | Templates dans headers | `src/actions/api-request.js` |
| **T5.1.3** Body templates | Corps de requête dynamique | `src/actions/api-request.js` |
| **T5.1.4** Parsing réponse | JSON, texte, binaire | `src/actions/api-request.js` |
| **T5.1.5** Gestion cookies | Cookies de session | `src/actions/api-request.js` |

```javascript
// Exemple T5.1.1 - src/actions/api-request.js
module.exports = {
  name: 'api',
  async execute(page, config, context) {
    const { method = 'GET', url, headers = {}, body, responseType = 'json' } = config;
    
    // Utiliser le contexte du navigateur pour les cookies
    const response = await page.evaluate(async ({ method, url, headers, body }) => {
      const res = await fetch(url, { method, headers, body: JSON.stringify(body) });
      return {
        status: res.status,
        headers: Object.fromEntries(res.headers.entries()),
        body: await res.json()
      };
    }, { method, url, headers, body });
    
    context.logger.debug(`API ${method} ${url} -> ${response.status}`);
    return response.body;
  }
};
```

---

### Phase 6 : Robustesse (Sprint 9-10)
> **Durée estimée : 2 semaines**

#### Sprint 6.1 : Gestion des erreurs
| Tâche | Détails | Fichiers |
|-------|---------|----------|
| **T6.1.1** Retry mechanism | Exponential backoff | `src/utils/error-handler.js` |
| **T6.1.2** Timeouts configurables | Par action, global | `src/utils/error-handler.js` |
| **T6.1.3** Screenshots on error | Capture automatique | `src/utils/error-handler.js` |
| **T6.1.4** Mode continue-on-error | Ignorer les erreurs | `src/core/workflow.js` |
| **T6.1.5** Rapports d'erreurs | Logging détaillé | `src/utils/error-handler.js` |

```javascript
// Exemple T6.1.1 - Retry avec exponential backoff
async function withRetry(fn, options = {}) {
  const { retries = 3, delay = 1000, backoff = 2 } = options;
  let lastError;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      logger.warn(`Attempt ${attempt}/${retries} failed: ${error.message}`);
      
      if (attempt < retries) {
        const waitTime = delay * Math.pow(backoff, attempt - 1);
        await sleep(waitTime);
      }
    }
  }
  
  throw lastError;
}
```

#### Sprint 6.2 : Planification
| Tâche | Détails | Fichiers |
|-------|---------|----------|
| **T6.2.1** Scheduler | Exécution planifiée | `src/core/scheduler.js` |
| **T6.2.2** Expressions cron | Parsing et validation | `src/core/scheduler.js` |
| **T6.2.3** Timezone support | Fuseaux horaires | `src/core/scheduler.js` |
| **T6.2.4** Mode daemon | Exécution en arrière-plan | `src/core/scheduler.js` |
| **T6.2.5** Persistence état | Reprise après crash | `src/core/scheduler.js` |

```javascript
// Exemple T6.2.1 - src/core/scheduler.js
const cron = require('node-cron');

class Scheduler {
  constructor(config, scraper) {
    this.config = config;
    this.scraper = scraper;
  }

  start() {
    if (!this.config.scheduling?.enabled) return;
    
    const { cron: cronExpr, timezone } = this.config.scheduling;
    
    this.job = cron.schedule(cronExpr, async () => {
      logger.info('Scheduled execution started');
      try {
        await this.scraper.run();
        logger.info('Scheduled execution completed');
      } catch (error) {
        logger.error('Scheduled execution failed', error);
      }
    }, { timezone });
    
    logger.info(`Scheduler started: ${cronExpr} (${timezone})`);
  }

  stop() {
    this.job?.stop();
  }
}
```

---

### Phase 7 : Documentation (Sprint 11)
> **Durée estimée : 1 semaine**

#### Sprint 7.1 : Documentation
| Tâche | Détails | Fichiers |
|-------|---------|----------|
| **T7.1.1** README principal | Installation, usage | `README.md` |
| **T7.1.2** Doc configuration | Tous les paramètres | `documentation/configuration.md` |
| **T7.1.3** Exemples | Cas d'usage courants | `documentation/examples.md` |
| **T7.1.4** JSDoc | Documentation code | Tous les fichiers |
| **T7.1.5** Configs d'exemple | Templates prêts à l'emploi | `configs/examples/` |

---

### Phase 8 : Fonctionnalités avancées (Futur)
> **À implémenter plus tard selon les besoins**

#### Sprint 8.1 : Authentification (PLUS TARD)
| Tâche | Détails |
|-------|---------|
| **T8.1.1** Login basique | Username/password |
| **T8.1.2** OAuth | Flux OAuth2 |
| **T8.1.3** Tokens | Gestion des tokens |
| **T8.1.4** Session persistence | Sauvegarde des sessions |

#### Sprint 8.2 : Formulaires (PLUS TARD)
| Tâche | Détails |
|-------|---------|
| **T8.2.1** Remplissage auto | Mapping champs/valeurs |
| **T8.2.2** Upload fichiers | Gestion des uploads |
| **T8.2.3** Captcha | Intégration services anti-captcha |

#### Sprint 8.3 : Cookies et stockage (PLUS TARD)
| Tâche | Détails |
|-------|---------|
| **T8.3.1** Export cookies | Sauvegarde JSON |
| **T8.3.2** Import cookies | Chargement session |
| **T8.3.3** LocalStorage | Gestion stockage local |
| **T8.3.4** SessionStorage | Gestion stockage session |

---

## Détails techniques

### Dépendances npm

```json
{
  "dependencies": {
    "playwright": "^1.40.0",
    "minimist": "^1.2.8",
    "winston": "^3.11.0",
    "ajv": "^8.12.0",
    "json2csv": "^6.0.0",
    "node-cron": "^3.0.3",
    "lodash": "^4.17.21"
  },
  "devDependencies": {
    "eslint": "^8.56.0"
  }
}
```

### Scripts npm

```json
{
  "scripts": {
    "start": "node src/index.js",
    "start:config": "node src/index.js --config",
    "dev": "node src/index.js --config ./data/config.json",
    "lint": "eslint src/",
    "lint:fix": "eslint src/ --fix"
  }
}
```

### Variables d'environnement

| Variable | Description | Défaut |
|----------|-------------|--------|
| `SCRAPER_CONFIG` | Chemin vers la config | `./data/config.json` |
| `SCRAPER_LOG_LEVEL` | Niveau de log | `info` |
| `SCRAPER_HEADLESS` | Mode headless | `true` |
| `SCRAPER_DEBUG` | Mode debug | `false` |

---

## Résumé des sprints

| Phase | Sprint | Durée | Priorité | Dépendances |
|-------|--------|-------|----------|-------------|
| 1 | Setup projet | 3 jours | 🔴 Critique | - |
| 1 | CLI de base | 2 jours | 🔴 Critique | Setup |
| 1 | Logging | 1 jour | 🟡 Haute | CLI |
| 2 | Navigateur | 3 jours | 🔴 Critique | Phase 1 |
| 2 | Actions | 4 jours | 🔴 Critique | Navigateur |
| 2 | Extracteurs | 3 jours | 🔴 Critique | Actions |
| 3 | Workflows | 4 jours | 🔴 Critique | Phase 2 |
| 3 | Pagination | 2 jours | 🟡 Haute | Workflows |
| 3 | Multi-pages | 2 jours | 🟡 Haute | Workflows |
| 4 | Export | 3 jours | 🟡 Haute | Phase 3 |
| 5 | API | 3 jours | 🟢 Moyenne | Phase 3 |
| 6 | Erreurs | 3 jours | 🟡 Haute | Phase 4 |
| 6 | Scheduler | 2 jours | 🟢 Moyenne | Erreurs |
| 7 | Tests | 3 jours | 🟡 Haute | Phase 6 |
| 7 | Documentation | 2 jours | 🟢 Moyenne | Tests |

**Durée totale estimée : 8-10 semaines**

---

## Prochaines étapes

1. **Valider ce plan** avec les priorités business
2. **Créer le repo Git** avec la structure initiale
3. **Commencer Sprint 1.1** : Setup du projet
4. **Itérer** selon les retours et besoins

---

*Document généré le 19 janvier 2026*
*Version : 1.0.0*
