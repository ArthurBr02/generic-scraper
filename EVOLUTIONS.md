Il faut afficher la version en cours dans l'interface (ex: v1.0.0).

# V2 - Interface utilisateur graphique pour la gestion des tâches de scraping
## Ajouter une interface utilisateur graphique (GUI) pour faciliter la configuration et le suivi des tâches de scraping (web ou client lourd ?).
- Je veux une interface web avec possibilité de faire du drag and drop de blocs (comme n8n par exemple) pour créer des workflows de scraping. TOUS LES BLOCS DOIVENT ETRE PARAMETRABLES.
- L'interface doit être ergonomique et intuitive, avec des options de configuration claires pour chaque tâche de scraping.
- Il faut une interface pour gérer les configurations de scraping (ajouter, modifier, supprimer des tâches).
### Stack technique:
- Frontend: Vue.js avec TypeScript, utilisant des bibliothèques de composants et tailwind CSS pour le style.
- Backend: Node.js avec Express pour servir l'API et gérer les tâches de scraping.
- WebSocket pour la communication en temps réel entre le frontend et le backend.
- Les configurations seront stockées dans le dossier `config/` au format JSON (elles y sont actuellement).
- Les logs sont stockés dans le dossier `logs/`.
- Les outputs sont stockés dans le dossier `output/`.
- Pas d'authentification pour l'instant, l'utilisateur est supposé être unique.
- Tout doit tourner sous Docker (backend et frontend). Faire un docker-compose pour lancer les deux conteneurs.

### Améliorations futures possibles
Gestion d'utilisateurs et authentification (ex: OAuth, JWT).


## Intégrer des fonctionnalités d'analyse et de visualisation des données extraites directement dans l'outil (consultation JSON et CSV).
- Il faut une interface pour visualiser les logs en temps réel et l'état des tâches en cours.
- Il faut une interface pour visualiser les données extraites (avec possibilité de filtrer, trier, etc.).

# V3 - Optimisation du scraping et gestion des erreurs
## Implémenter un système de gestion des erreurs plus robuste avec des options de reprise automatique (ex: retries avec backoff exponentiel, alertes en cas d'échec répété).
- Ajouter des options de configuration pour gérer les erreurs (nombre de retries, délais entre les retries, etc.).
- Mettre en place un système de notifications (email, Slack, etc.) pour informer des erreurs critiques.
## Améliorer les performances du scraper en optimisant l'utilisation des ressources (ex: gestion de la mémoire, parallélisation des tâches).
- Analyser les goulots d'étranglement actuels et proposer des solutions pour les améliorer.
- Implémenter la parallélisation des tâches de scraping pour accélérer le processus.
## Améliorations ergonomie utilisateur 
- Ajouter assistant de création de config via LLM (mistral ai) 
- Implémenter génération LM depuis CV (choix de la langue, etc ...)
# V4 - Améliorations diverses
## Statistiques de données correctes (ex: nombre d'éléments extraits, taux de réussite des requêtes, temps moyen par page, etc.).
## Mettre en place un système de notifications (email, Slack, etc.) pour informer des résultats des tâches de scraping.
## Supporter l'exportation des données extraites vers des bases de données (SQL, NoSQL).
## Ajouter la possibilité de planifier des tâches de scraping récurrentes avec une interface conviviale.

# V5 - Extensibilité et personnalisation
## Mettre en place un système de plugins pour permettre aux utilisateurs d'étendre les fonctionnalités du scraper.