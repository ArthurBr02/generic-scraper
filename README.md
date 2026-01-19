# Generic Scraper

Outil de scraping générique et configurable, basé sur Playwright.

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
  - `api` - Requêtes API
  - `pagination` - Gestion de la pagination
- 🚧 Workflows séquentiels et sous-workflows (en cours)
- 🚧 Extracteurs de données (en cours)
- 🚧 Export en `JSON` et `CSV` (en cours)
- ✅ Gestion des retries et timeouts

## Prérequis

- Node.js 18+ (recommandé)
- npm ou yarn

## Installation

```bash
npm install
npx playwright install chromium
```

**Notes :**
- `npx playwright install` télécharge les navigateurs Playwright nécessaires
- Sur Windows, utilisez le script `start.bat` pour démarrer rapidement

## Utilisation

### Lancement basique

Avec la config par défaut (`data/config.json`) :

```bash
npm run start
```

Ou sur Windows :

```bash
start.bat
```

### Avec une configuration spécifique

```bash
npm run start -- --config ./configs/examples/simple-scrape.json
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
│   │   └── browser.js        # ✅ Gestion du navigateur Playwright
│   ├── actions/
│   │   ├── index.js          # ✅ Registre d'actions (factory pattern)
│   │   ├── navigate.js       # ✅ Action de navigation
│   │   ├── click.js          # ✅ Action de clic
│   │   ├── wait.js           # ✅ Action d'attente
│   │   ├── scroll.js         # ✅ Action de défilement
│   │   ├── input.js          # ✅ Action de saisie
│   │   ├── api.js            # ✅ Requêtes API
│   │   └── pagination.js     # ✅ Gestion pagination
│   ├── extractors/           # 🚧 Extracteurs de données
│   ├── output/               # 🚧 Writers JSON/CSV
│   └── utils/
│       ├── logger.js         # ✅ Logging avec Winston
│       ├── configLoader.js   # ✅ Chargeur de configuration
│       ├── error-handler.js  # ✅ Gestion d'erreurs
│       └── retry.js          # ✅ Système de retries
├── configs/
│   └── examples/             # Exemples de configurations
├── data/
│   ├── config.json           # Configuration par défaut
│   └── schema.json           # Schéma JSON de validation
├── documentation/
│   └── plan.md               # Plan d'implémentation détaillé
├── logs/                     # Fichiers de logs (générés)
├── output/                   # Résultats du scraping (générés)
├── package.json
└── README.md
```

**Légende :**
- ✅ Implémenté et fonctionnel
- 🚧 En cours de développement

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

## Développement

### Phase actuelle : Sprint 2.2 ✅ (2026-01-19)

**Fonctionnalités implémentées :**

- **Sprint 1.1** : Structure de base, gestion des arguments CLI
- **Sprint 1.2** : Loader de configuration, schéma JSON, actions prototypes, retries
- **Sprint 1.3** : Système de logging avec Winston (rotation, formats, métadonnées)
- **Sprint 2.1** : Gestion du navigateur (pool de pages, blocage ressources, contexte)
- **Sprint 2.2** : Système d'actions complet (navigate, click, wait, scroll, input)

**Prochaines étapes :**

- **Sprint 2.3** : Système d'extraction de données
- **Sprint 3.1** : Orchestrateur de workflows
- **Sprint 3.2** : Export JSON/CSV

### Architecture

Le projet suit une architecture modulaire :

1. **Core** : Gestion du navigateur et orchestration
2. **Actions** : Pattern factory avec registre d'actions
3. **Utils** : Logging, configuration, gestion d'erreurs
4. **Configuration** : 100% JSON avec validation via schéma

### Contribuer

1. Consultez [documentation/plan.md](documentation/plan.md) pour comprendre l'architecture
2. Respectez le pattern des actions existantes dans `src/actions/`
3. Ajoutez des tests pour toute nouvelle fonctionnalité
4. Ouvrez une issue ou PR pour toute modification

## Fonctionnalités détaillées

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

*Dernière mise à jour : Sprint 2.2 (2026-01-19)*
