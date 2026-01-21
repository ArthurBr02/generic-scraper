# Intégration de la bibliothèque Scraper

## Vue d'ensemble

Le moteur de scraping dans `src/` peut désormais être utilisé de deux façons :
1. **CLI** (mode existant) : `npm run start -- --config config.json`
2. **Bibliothèque** (nouveau) : Importé et utilisé programmatiquement

## Architecture

```
src/
├── index.js           # Point d'entrée CLI (inchangé)
├── lib.js             # Point d'entrée bibliothèque (nouveau)
├── core/              # Modules du moteur de scraping
├── actions/           # Actions disponibles
├── utils/             # Utilitaires
└── ...

backend/
└── src/
    ├── services/
    │   └── ScraperService.ts    # Service qui utilise src/lib.js
    ├── controllers/
    │   └── ScraperController.ts # Endpoints API
    ├── routes/
    │   └── scraper.ts           # Routes /api/scraper/*
    └── types/
        └── scraper.types.ts     # Types TypeScript
```

## Utilisation comme bibliothèque

### Import

```javascript
const scraperLib = require('./src/lib');
```

### API disponible

#### `execute(config, options)`
Exécute une configuration de scraping.

```javascript
const result = await scraperLib.execute({
  name: 'Mon scraper',
  target: { url: 'https://example.com' },
  workflow: { steps: [...] }
}, {
  headless: true,
  logLevel: 'info'
});
```

#### `executeFromFile(configPath, options)`
Exécute une configuration depuis un fichier.

```javascript
const result = await scraperLib.executeFromFile(
  './configs/my-config.json',
  { headless: true }
);
```

#### `validateConfiguration(config)`
Valide une configuration.

```javascript
const validation = scraperLib.validateConfiguration(config);
if (!validation.valid) {
  console.error('Erreurs:', validation.errors);
}
```

#### `getAvailableActions()`
Liste toutes les actions disponibles.

```javascript
const actions = scraperLib.getAvailableActions();
// ['navigate', 'click', 'extract', 'wait', ...]
```

#### `getActionSchema(actionType)`
Récupère le schéma d'une action.

```javascript
const schema = scraperLib.getActionSchema('navigate');
// { type: 'navigate', description: '...', schema: {...} }
```

## Backend API

### Endpoints disponibles

#### POST `/api/scraper/execute`
Exécute une configuration.

**Request:**
```json
{
  "config": {
    "name": "Test",
    "target": { "url": "https://example.com" },
    "workflow": { "steps": [...] }
  },
  "options": {
    "headless": true,
    "logLevel": "info"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "data": {...},
    "duration": 5234,
    "itemsExtracted": 10
  }
}
```

#### POST `/api/scraper/validate`
Valide une configuration.

**Request:**
```json
{
  "config": { ... }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "errors": []
  }
}
```

#### GET `/api/scraper/actions`
Liste toutes les actions disponibles.

**Response:**
```json
{
  "success": true,
  "data": ["navigate", "click", "extract", "wait", ...]
}
```

#### GET `/api/scraper/actions/:type`
Récupère le schéma d'une action spécifique.

**Response:**
```json
{
  "success": true,
  "data": {
    "type": "navigate",
    "description": "Navigate to a URL",
    "schema": {...}
  }
}
```

#### GET `/api/scraper/actions/schemas/all`
Récupère tous les schémas d'actions.

## Service Backend

### ScraperService

Le service `ScraperService` dans le backend encapsule l'utilisation de la bibliothèque :

```typescript
import { scraperService } from './services/ScraperService';

// Exécuter une configuration
const result = await scraperService.execute(config, options);

// Charger et valider
const config = scraperService.loadConfig('my-config');
const validation = scraperService.validateConfig(config);

// Actions disponibles
const actions = scraperService.getAvailableActions();
const schema = scraperService.getActionSchema('navigate');
```

### Events

Le service émet des événements pour le suivi en temps réel :

```typescript
scraperService.on('execution:start', (event) => {
  console.log('Scraping started');
});

scraperService.on('execution:progress', (event) => {
  console.log('Progress:', event);
});

scraperService.on('execution:complete', (event) => {
  console.log('Scraping completed:', event.result);
});

scraperService.on('execution:error', (event) => {
  console.error('Scraping failed:', event.error);
});
```

## Tests

### Test de l'intégration

Un script de test est disponible pour vérifier que l'intégration fonctionne :

```bash
node test-lib-integration.js
```

Ce test vérifie :
- ✅ La récupération des actions disponibles
- ✅ L'accès aux schémas d'actions
- ✅ La validation de configurations
- ✅ Le chargement de fichiers de configuration

### Test de non-régression CLI

Le CLI doit toujours fonctionner comme avant :

```bash
npm run start -- --config ./configs/examples/simple-navigation.json
```

## Garanties de compatibilité

⚠️ **Important** : Cette intégration respecte les règles suivantes :

1. ❌ **Aucune modification** des signatures de fonctions existantes
2. ❌ **Aucune suppression** ou renommage de fichiers dans `src/`
3. ✅ **Ajout uniquement** de nouveaux exports et du fichier `lib.js`
4. ✅ **CLI 100% fonctionnel** - peut toujours être utilisé comme avant
5. ✅ **Pas de dépendances supplémentaires** - utilise les modules existants

## Migration

Pour utiliser le scraper dans votre backend :

1. Importer la bibliothèque : `const scraperLib = require('./src/lib')`
2. Utiliser les fonctions exposées selon vos besoins
3. Le CLI reste disponible pour les tests et l'utilisation autonome

## Prochaines étapes

- [ ] Ajouter des tests unitaires pour `src/lib.js`
- [ ] Documenter les schémas d'actions
- [ ] Ajouter le support WebSocket pour le suivi en temps réel
- [ ] Créer des exemples d'utilisation avancée
