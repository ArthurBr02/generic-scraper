# Changelog

Toutes les modifications notables de ce projet sont documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère à [Semantic Versioning](https://semver.org/lang/fr/).

## [1.0.0] - 2026-01-20

### ✨ Version initiale complète

#### Ajouté

**Core**
- Système de scraping configurable 100% JSON
- Gestion du navigateur avec Playwright (Chromium, Firefox, WebKit)
- Orchestrateur de workflows séquentiels
- Scheduler avec expressions cron et support des fuseaux horaires
- Système de logging avancé avec Winston (rotation, niveaux, métadonnées)

**Actions**
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

**Extracteurs**
- `text` - Extraction de texte (innerText, textContent)
- `attribute` - Extraction d'attributs HTML
- `html` - Extraction de code HTML (inner, outer)
- `list` - Extraction de listes avec sous-champs et transformations

**Workflows**
- Orchestration des étapes (steps)
- Contexte partagé entre steps
- Templating de variables `{{variable}}`
- Gestion des erreurs par step
- Validation JSON Schema
- Sous-workflows réutilisables
- Boucles et itérations
- Conditions et branchements

**Pagination**
- Pagination par clic (bouton suivant)
- Pagination par URL (pattern incrémental)
- Scroll infini avec détection de fin
- Limites configurables (maxPages, maxItems)
- Répétition d'étapes sur chaque page

**Requêtes API**
- Support méthodes HTTP (GET, POST, PUT, DELETE, PATCH)
- Headers dynamiques avec templates
- Body avec templating JSON/texte
- Types de réponse multiples (json, text, blob, arrayBuffer)
- Utilisation automatique des cookies de session du navigateur
- Timeouts configurables

**Gestion des erreurs**
- Système de retry avec exponential backoff
- Timeouts configurables (global et par action)
- Screenshots automatiques lors des erreurs
- Mode continue-on-error (ignorer les erreurs)
- Logging détaillé avec contexte complet

**Planification**
- Scheduler avec expressions cron
- Support des fuseaux horaires (IANA timezone)
- Mode daemon (exécution en arrière-plan)
- Persistence de l'état (reprise après crash)
- Historique des exécutions
- Gestion des signaux SIGINT/SIGTERM

**Export de données**
- Format JSON (pretty print, append mode)
- Format CSV (headers, délimiteurs, colonnes)
- Nommage avec templates (`{{date}}`, `{{time}}`, etc.)
- Sélection et réordonnancement de colonnes
- Mode append pour fichiers existants

**Utilitaires**
- Système de templates pour variables dynamiques
- Chargeur de configuration avec validation JSON Schema
- Gestionnaire d'erreurs avec retry
- Logger configurable avec rotation de fichiers

**Documentation**
- README complet avec démarrage rapide, exemples et FAQ
- Guide de configuration détaillé (configuration.md)
- Guide des exemples d'usage (examples.md)
- Plan d'implémentation technique (plan.md)
- JSDoc dans tous les fichiers source
- 17 configurations d'exemple prêtes à l'emploi

**Configurations d'exemple**
- `simple-navigation.json` - Navigation basique
- `extraction-example.json` - Extraction de données
- `pagination-click.json` - Pagination par clic
- `pagination-url.json` - Pagination par URL
- `pagination-scroll.json` - Scroll infini
- `api-request-example.json` - Requêtes API
- `api-test-config.json` - Tests d'API
- `workflow-with-loops.json` - Boucles
- `workflow-with-conditions.json` - Conditions
- `workflow-with-subworkflows.json` - Sous-workflows
- `complete-workflow.json` - Workflow complet
- `config-with-json-output.json` - Export JSON
- `config-with-csv-output.json` - Export CSV
- `error-handling-config.json` - Gestion d'erreurs
- `error-handling-test.json` - Tests d'erreurs
- `scheduled-config.json` - Exécution planifiée
- `scheduler-test-quick.json` - Tests rapides du scheduler

#### Performance
- Blocage de ressources configurable (images, fonts, media, etc.)
- Pool de pages pour exécution parallèle
- Gestion optimisée de la mémoire

#### Qualité du code
- Architecture modulaire avec pattern factory
- Validation JSON Schema pour toutes les configurations
- Gestion complète des erreurs avec contexte
- Logging structuré avec métadonnées

---

## Roadmap

### [1.1.0] - À venir
- Interface web de configuration (drag & drop)
- Support Docker
- Dashboard de monitoring

### [1.2.0] - À venir
- API REST pour déclencher des scrapings
- Webhooks pour notifications
- Export vers bases de données (MongoDB, PostgreSQL)

### [1.3.0] - À venir
- Système de plugins personnalisés
- Authentification avancée (OAuth, 2FA)
- Support de proxies rotatifs

---

## Notes de version

### Dépendances principales
- Node.js >= 18
- Playwright >= 1.40.0
- Winston >= 3.11.0
- node-cron >= 3.0.3
- ajv >= 8.12.0
- json2csv >= 6.0.0

### Migration depuis version bêta
Ce projet n'avait pas de versions précédentes. La version 1.0.0 est la première release stable.

---

*Pour plus d'informations, consultez le [README](README.md) et la [documentation](documentation/).*
