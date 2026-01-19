# Generic Scraper

Outil de scraping générique et configurable, basé sur Playwright.

Fonctionnalités principales
- Configuration 100% via fichiers JSON
- Workflows séquentiels et sous-workflows
- Actions configurables : `navigate`, `click`, `scroll`, `wait`, `input`, `extract`, `api`, `pagination`, etc.
- Export en `JSON` et `CSV`
- Gestion des retries, timeouts et logs

Prérequis
- Node.js 18+

Installation

```bash
npm install
npx playwright install chromium
```

Utilisation (exemples)

Lancer avec la config par défaut (`data/config.json`):

```bash
node src/index.js
```

Lancer en précisant un fichier de configuration :

```bash
node src/index.js --config ./configs/examples/simple-scrape.json
```

Vous pouvez aussi définir la variable d'environnement `SCRAPER_CONFIG` :

```bash
export SCRAPER_CONFIG=./configs/examples/simple-scrape.json
node src/index.js
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
````markdown
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

Scripts utiles (exemples)

```json
{
    "scripts": {
        "start": "node src/index.js",
        "dev": "node src/index.js --config ./data/config.json",
        "lint": "eslint src/"
    }
}
```

Développement

- Sprint 1.2 — Terminé (2026-01-19) : loader de configuration (`src/utils/configLoader.js`) et schéma JSON, point d'entrée CLI (`src/index.js`), gestion d'erreurs (`src/utils/error-handler.js`), actions prototypes `pagination`, `api`, `scroll`, utilitaire de retries, configuration ESLint.

Contribuer

Ouvrez une issue ou une PR pour toute modification. Respectez l'architecture décrite dans `documentation/plan.md`.

---

Document généré automatiquement à partir de `documentation/plan.md`.

````
