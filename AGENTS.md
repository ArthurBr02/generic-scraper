mets à jour le fichier AGENTS.md pour refléter l'avancée actuelle du projet.
Ne conserve que la dernière étape terminée sans les détails.
File: AGENTS.md
mets à jour le fichier README.md pour refléter les modifications apportées aux instructions d'installation et d'utilisation.
File: README.md

# Generic Scraper
Outil de scraping générique et configurable, basé sur Playwright.

## Fonctionnalités principales
- Configuration 100% via fichiers JSON
- Workflows séquentiels et sous-workflows
- Actions configurables : `navigate`, `click`, `scroll`, `wait`, `input`, `extract`, `api`, `pagination`, etc.
- Export en `JSON` et `CSV`
- Gestion des retries, timeouts et logs

# Avancée actuelle
Sprint 1.1 — Terminé (2026-01-19)

Tâches réalisées pendant le Sprint 1.1 :
- Mise en place du dépôt et structure initiale (`src/`, `data/`, `documentation/`).
- Prototype de configuration via JSON (`data/config.json`) et exemples de workflows.
- Intégration initiale de Playwright (scripts d'installation et notes d'utilisation).
- Implémentation/prototype des actions de base : `navigate`, `click`, `extract`.
- Export de résultats en `JSON` et `CSV` (writer de base).
- Ajout de `start.bat` pour démarrage rapide sous Windows et scripts CLI basiques.
- Mise à jour de la documentation initiale et du `README.md` (installation et usage).

Prochaines étapes (Sprint 1.2):
- Finaliser le loader de configuration et le schéma JSON.
- Ajouter plus d'actions (pagination, api, scroll avancé).
- Renforcer la gestion des erreurs, retries et tests automatisés.
- Mettre en place CI basique et linting/formatting.