# Contributing to Generic Scraper

Merci de votre intérêt pour contribuer au projet Generic Scraper ! 🎉

## Table des matières

- [Code de conduite](#code-de-conduite)
- [Comment contribuer](#comment-contribuer)
- [Développement](#développement)
- [Soumettre une Pull Request](#soumettre-une-pull-request)
- [Style de code](#style-de-code)
- [Architecture](#architecture)

---

## Code de conduite

Ce projet suit un code de conduite simple :
- Soyez respectueux et professionnel
- Accueillez les nouveaux contributeurs
- Concentrez-vous sur le code, pas sur les personnes
- Acceptez les critiques constructives

---

## Comment contribuer

### Signaler un bug

Si vous trouvez un bug, ouvrez une issue avec :
1. Une description claire du problème
2. Les étapes pour reproduire le bug
3. Le comportement attendu vs. le comportement observé
4. Votre configuration (OS, Node.js version, etc.)
5. Les logs d'erreur si disponibles

### Proposer une fonctionnalité

Pour proposer une nouvelle fonctionnalité :
1. Vérifiez qu'elle n'existe pas déjà dans les issues
2. Ouvrez une issue décrivant :
   - Le cas d'usage
   - La valeur ajoutée
   - Une proposition d'implémentation (optionnel)

### Améliorer la documentation

Les améliorations de documentation sont toujours bienvenues :
- Corriger des typos
- Clarifier des explications
- Ajouter des exemples
- Traduire la documentation

---

## Développement

### Prérequis

- Node.js 18+
- npm ou yarn
- Git

### Setup

1. **Fork le projet**

```bash
git clone https://github.com/votre-username/generic-scraper.git
cd generic-scraper
```

2. **Installer les dépendances**

```bash
npm install
npx playwright install chromium
```

3. **Créer une branche**

```bash
git checkout -b feature/ma-fonctionnalite
# ou
git checkout -b fix/mon-bug
```

### Tester vos modifications

1. **Tester une configuration**

```bash
npm run start -- --config ./configs/examples/simple-navigation.json
```

2. **Tester avec votre propre config**

Créez un fichier de test dans `configs/test/` (ce dossier est dans `.gitignore`)

3. **Vérifier le code**

```bash
npm run lint
```

---

## Soumettre une Pull Request

1. **Commitez vos changements**

Utilisez des messages de commit clairs :

```bash
git commit -m "feat: ajouter action de screenshot"
git commit -m "fix: corriger le bug de pagination"
git commit -m "docs: améliorer le README"
```

**Format des commits** :
- `feat:` - Nouvelle fonctionnalité
- `fix:` - Correction de bug
- `docs:` - Documentation
- `refactor:` - Refactoring sans changement de fonctionnalité
- `test:` - Ajout ou modification de tests
- `chore:` - Tâches de maintenance

2. **Poussez votre branche**

```bash
git push origin feature/ma-fonctionnalite
```

3. **Ouvrez une Pull Request**

Sur GitHub, ouvrez une PR avec :
- Un titre clair
- Une description détaillée des changements
- Les issues liées (si applicable)
- Des captures d'écran (si pertinent)

4. **Checklist avant soumission**

- [ ] Le code suit le style du projet
- [ ] Les modifications ont été testées
- [ ] La documentation a été mise à jour si nécessaire
- [ ] Aucun warning ESLint
- [ ] Les logs sont appropriés

---

## Style de code

### JavaScript

Le projet utilise ESLint pour garantir la qualité du code.

**Principes généraux** :
- Indentation : 2 espaces
- Guillemets : simples `'`
- Point-virgule : obligatoires
- Nommage : camelCase pour variables/fonctions, PascalCase pour classes

**Exemple** :

```javascript
/**
 * Description de la fonction
 * @param {Type} param - Description du paramètre
 * @returns {Type} Description du retour
 */
async function maFonction(param) {
  const result = await operation(param);
  return result;
}
```

### JSDoc

Toutes les fonctions publiques doivent avoir une documentation JSDoc :

```javascript
/**
 * Exécute une action sur la page
 * @param {Page} page - Page Playwright
 * @param {Object} config - Configuration de l'action
 * @param {string} config.selector - Sélecteur CSS
 * @param {number} [config.timeout=5000] - Timeout en ms
 * @param {Object} context - Contexte d'exécution
 * @param {Logger} context.logger - Instance du logger
 * @returns {Promise<Object>} Résultat de l'action
 * @throws {Error} Si le sélecteur n'est pas trouvé
 */
async function execute(page, config, context) {
  // ...
}
```

---

## Architecture

### Structure du projet

```
src/
├── index.js              # Point d'entrée CLI
├── core/                 # Composants principaux
│   ├── browser.js        # Gestion du navigateur
│   ├── scraper.js        # Orchestrateur
│   ├── workflow.js       # Exécution des workflows
│   └── scheduler.js      # Planification
├── actions/              # Actions disponibles
│   ├── index.js          # Registre (factory)
│   └── *.js              # Actions individuelles
├── extractors/           # Extracteurs de données
├── output/               # Writers de sortie
└── utils/                # Utilitaires
```

### Ajouter une nouvelle action

1. **Créer le fichier d'action**

Créez `src/actions/mon-action.js` :

```javascript
/**
 * Mon action personnalisée
 * Description de ce que fait l'action
 */

const { getLogger } = require('../utils/logger');

/**
 * Exécute mon action
 * @param {Page} page - Page Playwright
 * @param {Object} config - Configuration
 * @param {string} config.param1 - Premier paramètre
 * @param {Object} context - Contexte d'exécution
 * @returns {Promise<any>} Résultat
 */
async function execute(page, config, context) {
  const logger = context.logger || getLogger();
  
  logger.debug('Executing mon-action', { config });
  
  try {
    // Logique de l'action
    const result = await doSomething(page, config);
    
    logger.info('mon-action completed successfully');
    return result;
  } catch (error) {
    logger.error('mon-action failed', { error: error.message });
    throw error;
  }
}

module.exports = {
  name: 'mon-action',
  description: 'Description courte de l\'action',
  execute
};
```

2. **Enregistrer l'action**

Dans `src/actions/index.js`, ajoutez :

```javascript
const monAction = require('./mon-action');

const actions = {
  // ... actions existantes
  'mon-action': monAction
};
```

3. **Documenter l'action**

Ajoutez la documentation dans `documentation/configuration.md` :

```markdown
### X. `mon-action` - Description

Description détaillée.

\`\`\`json
{
  "type": "mon-action",
  "config": {
    "param1": "valeur"
  }
}
\`\`\`

**Propriétés :**
- `param1` (string, obligatoire) : Description
```

4. **Créer un exemple**

Créez `configs/examples/mon-action-example.json` avec un exemple d'utilisation.

### Ajouter un extracteur

Similaire aux actions, créez un fichier dans `src/extractors/` et enregistrez-le dans `src/extractors/index.js`.

---

## Bonnes pratiques

### Logging

Utilisez le logger fourni :

```javascript
const logger = context.logger || getLogger();

logger.debug('Message de debug', { context });
logger.info('Message informatif');
logger.warn('Avertissement');
logger.error('Erreur', { error: error.message });
```

### Gestion des erreurs

```javascript
try {
  // Code potentiellement problématique
} catch (error) {
  logger.error('Description de l\'erreur', {
    error: error.message,
    stack: error.stack,
    context: { /* infos supplémentaires */ }
  });
  throw error; // Re-throw si nécessaire
}
```

### Timeouts

Toujours gérer les timeouts pour éviter les blocages :

```javascript
await page.waitForSelector(selector, { 
  timeout: config.timeout || 5000 
});
```

### Configuration

Toujours fournir des valeurs par défaut :

```javascript
const {
  param1,
  param2 = 'valeur-par-defaut',
  param3 = 1000
} = config;
```

---

## Questions ?

Si vous avez des questions :
- Consultez la [documentation](documentation/)
- Ouvrez une issue avec le tag `question`
- Contactez les mainteneurs

---

Merci pour votre contribution ! 🚀
