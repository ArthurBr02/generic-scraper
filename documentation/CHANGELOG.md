# Changelog

Toutes les modifications notables de ce projet sont documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère à [Semantic Versioning](https://semver.org/lang/fr/).

## [2.0.0-sprint4] - 2026-01-21

### 🎨 Phase 3 - Sprint 4 : Bibliothèque de blocs et composants de base

#### Ajouté

**Frontend - Types et Configuration**
- `types/blocks.ts` - Définition complète des types TypeScript pour les blocs :
  - `BlockDefinition` : Définition d'un type de bloc
  - `BlockInstance` : Instance d'un bloc dans le workflow
  - `BlockConnection` : Connexion entre deux blocs
  - `PortDefinition` : Définition d'un port (entrée/sortie)
  - `ConfigField` : Champ de configuration avec validation
  - Support des catégories : navigation, interaction, extraction, api, control, authentication

- `config/blocks.config.ts` - Configuration de tous les blocs disponibles :
  - **Navigation** : `navigate`, `wait`
  - **Interaction** : `click`, `input`, `scroll`
  - **Extraction** : `extract` (simple et multiple)
  - **API** : `api` (GET, POST, PUT, DELETE, PATCH)
  - **Contrôle** : `loop`, `condition`
  - **Authentification** : `login` (form, basic, token)
  - Schémas de configuration détaillés pour chaque bloc
  - Couleurs et icônes par catégorie

**Frontend - Composants Workflow**
- `components/workflow/InputPort.vue` :
  - Port d'entrée pour les blocs
  - Support des types flow et data
  - États visuels (connecté, hover)
  - Émission d'événements pour la gestion des connexions

- `components/workflow/OutputPort.vue` :
  - Port de sortie pour les blocs
  - Gestion du drag & drop pour créer des connexions
  - États visuels (connecté, hover, dragging)
  - Événements dragstart/dragend

- `components/workflow/Block.vue` :
  - Composant principal de bloc
  - Header avec icône, titre et bouton de suppression
  - Affichage des ports d'entrée et de sortie
  - Aperçu de la configuration
  - États visuels : sélectionné, en cours, succès, erreur
  - Indicateur de statut animé
  - Style adaptatif selon la catégorie

- `components/workflow/BlockLibrary.vue` :
  - Panneau latéral de bibliothèque de blocs
  - Organisation par catégories collapsibles
  - Recherche en temps réel (nom, description, type)
  - Drag & drop des blocs vers le canvas
  - Compteur de blocs par catégorie
  - Interface responsive avec scrollbar personnalisée

#### Technique
- Support complet du dark mode pour tous les composants
- Système de couleurs cohérent par catégorie de blocs
- Aperçu de configuration intelligent selon le type de bloc
- Validation des champs avec règles personnalisables
- Champs conditionnels (showIf)
- Support des types de champs : text, textarea, number, select, checkbox, code, keyvalue, array

## [2.0.0-sprint3] - 2026-01-21

### 🎨 Phase 2 - Sprint 3 : Vue liste des tâches et confirmations

#### Ajouté

**Frontend - Composants de confirmation**
- `ConfirmModal.vue` - Modal de confirmation réutilisable avec variantes (danger, warning, info)
  - Support de l'état de chargement
  - Personnalisation des textes de boutons
  - Icônes contextuelles selon la variante

**Frontend - Fonctionnalités TasksListView**
- ✅ Pagination côté client (9 tâches par page)
  - Contrôles de navigation (page précédente/suivante)
  - Affichage du numéro de page actuel
  - Réinitialisation automatique lors du changement de filtre
- ✅ Recherche en temps réel dans le nom et la description
- ✅ Filtrage par statut d'exécution (succès, erreur, en cours)
- ✅ Affichage des cartes de tâches avec :
  - Badge de statut coloré
  - Date de dernière exécution formatée
  - Boutons d'actions (Lancer, Dupliquer, Supprimer)

**Frontend - Système de confirmations**
- Confirmation de suppression de tâche (variante danger)
- Confirmation de lancement de tâche (variante info)
- Remplacement des `confirm()` natifs par des modales personnalisées

**Frontend - Intégration ToastContainer**
- Ajout du ToastContainer dans App.vue pour affichage global des notifications
- Notifications automatiques pour les actions CRUD

#### Modifié
- `TasksListView.vue` :
  - Ajout de la pagination avec état `currentPage` et `itemsPerPage`
  - Nouveau computed `paginatedTasks` pour gérer l'affichage paginé
  - Nouveau computed `totalPages` pour le calcul du nombre de pages
  - Watchers sur `searchQuery` et `filterStatus` pour réinitialiser la page
  - Remplacement des confirmations natives par le composant `ConfirmModal`
  - Gestion de l'état de chargement pour les confirmations

- `App.vue` :
  - Intégration du composant `ToastContainer` pour l'affichage des notifications

#### Technique
- Pattern de confirmation avec callback asynchrone stocké dans l'état
- Gestion de l'état de chargement pendant l'exécution des actions confirmées
- Réinitialisation automatique de la modale après confirmation

## [2.0.0-sprint2] - 2026-01-21

### 🎨 Phase 2 - Sprint 2 : Interface de base & Gestion des tâches

#### Ajouté

**Frontend - Composants UI**
- `Select.vue` - Composant de liste déroulante avec support dark mode
- `Badge.vue` - Badge de statut avec variantes (success, danger, warning, info)
- `Spinner.vue` - Indicateur de chargement avec plusieurs tailles
- `IconButton.vue` - Bouton avec icône pour actions rapides
- `Tooltip.vue` - Info-bulle avec positionnement configurable
- `Dropdown.vue` + `DropdownItem.vue` - Menu déroulant interactif
- `Tabs.vue` + `TabPanel.vue` - Système d'onglets avec variantes
- `Toast.vue` + `ToastContainer.vue` - Système de notifications toast

**Frontend - Layout**
- `MainLayout.vue` - Layout principal responsive
- `Header.vue` - En-tête avec logo, navigation et toggle dark mode
- Vue Router configuré avec routes de base

**Frontend - Vues**
- `TasksListView.vue` - Vue liste des tâches avec recherche et filtres
- `TaskEditorView.vue` - Vue d'édition de tâche (placeholder Phase 3)
- `TaskRunView.vue` - Vue d'exécution de tâche (placeholder Phase 4)

**Frontend - Stores Pinia**
- `tasks.ts` - Store pour la gestion des tâches (CRUD, exécution)
- `notification.ts` - Store pour le système de notifications toast

**Backend - Services**
- `ConfigService.ts` - Service de gestion des fichiers de configuration
  - CRUD complet sur les tâches
  - Métadonnées (créé le, modifié le, dernière exécution)
  - Validation des configurations
  - Duplication de tâches

**Backend - Routes API**
- `GET /api/tasks` - Lister toutes les tâches
- `GET /api/tasks/:id` - Récupérer une tâche
- `POST /api/tasks` - Créer une nouvelle tâche
- `PUT /api/tasks/:id` - Modifier une tâche
- `DELETE /api/tasks/:id` - Supprimer une tâche
- `POST /api/tasks/:id/run` - Lancer une tâche
- `POST /api/tasks/:id/duplicate` - Dupliquer une tâche

#### Modifié
- `App.vue` - Simplifié pour utiliser `<router-view />`
- `main.ts` - Ajout de Vue Router
- Version du projet passée à 2.0.0-sprint2

---

## [1.4.0] - 2026-01-21

### ✨ Intégration du moteur de scraping comme bibliothèque

#### Ajouté

**Bibliothèque (`src/lib.js`)**
- Point d'entrée pour utiliser le scraper comme bibliothèque Node.js
- API propre et documentée pour l'intégration dans des applications externes
- Fonction `execute(config, options)` pour exécuter des configurations
- Fonction `executeFromFile(configPath, options)` pour charger depuis un fichier
- Fonction `validateConfiguration(config)` pour valider les configurations
- Fonction `getAvailableActions()` pour lister les actions disponibles
- Fonction `getActionSchema(type)` pour récupérer les schémas d'actions
- Support des options d'exécution (headless, logLevel, callbacks)

**Backend - Service Layer**
- `ScraperService.ts` - Service qui encapsule l'utilisation de la bibliothèque
- Support de l'exécution de configurations (objet ou fichier)
- Validation de configurations
- Récupération des schémas d'actions
- Events pour le suivi en temps réel (start, progress, complete, error)

**Backend - API REST**
- `POST /api/scraper/execute` - Exécuter une configuration
- `POST /api/scraper/validate` - Valider une configuration
- `GET /api/scraper/actions` - Lister les actions disponibles
- `GET /api/scraper/actions/:type` - Récupérer le schéma d'une action
- `GET /api/scraper/actions/schemas/all` - Récupérer tous les schémas

**Types TypeScript**
- Interfaces complètes pour les configurations du scraper
- Types pour les résultats d'exécution
- Types pour les schémas d'actions
- Types pour la validation

**Documentation**
- `LIBRARY_INTEGRATION.md` - Guide d'utilisation de la bibliothèque
- Exemples d'utilisation programmatique
- Documentation de l'API REST
- Guide d'intégration dans le backend

**Tests**
- Script de test `test-lib-integration.js`
- Validation de l'intégration de la bibliothèque
- Tests de non-régression CLI

#### Garanti
- ✅ **CLI 100% fonctionnel** - Aucune régression du mode ligne de commande
- ✅ **Pas de breaking changes** - Toutes les fonctionnalités existantes préservées
- ✅ **Rétrocompatibilité** - Les anciennes configurations fonctionnent toujours
- ✅ **Architecture propre** - Séparation CLI / Bibliothèque / API
- ✅ **Pas de dépendances supplémentaires** - Utilise les modules existants

#### Technique
- Exposition des modules via `src/lib.js` sans modification du code existant
- Intégration TypeScript dans le backend
- Service pattern pour l'encapsulation
- Controller pattern pour les endpoints API
- Event-driven architecture pour le suivi en temps réel

---

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
