# 📚 Index de la documentation - Generic Scraper

Guide complet pour naviguer dans toute la documentation du projet.

---

## 🚀 Pour commencer

### Nouveaux utilisateurs

1. **[README.md](../README.md)** - Commencez ici !
   - Vue d'ensemble du projet
   - Installation rapide
   - Exemples de base
   - FAQ

2. **[QUICKSTART.md](QUICKSTART.md)** - Guide visuel en 5 minutes
   - Installation en 3 étapes
   - Premier scraping
   - Scénarios courants
   - Astuces et commandes

3. **[examples.md](examples.md)** - Exemples détaillés
   - 10 cas d'usage complets
   - Scraping simple à complexe
   - Bonnes pratiques

### 💡 Concepts clés

4. **[SAVEAS_VS_OUTPUT.md](SAVEAS_VS_OUTPUT.md)** - 💾 saveAs vs 📤 output
   - **⭐ IMPORTANT** : Comprendre la différence
   - Tableau de décision rapide
   - Exemples pratiques
   - Cas d'usage détaillés
   - Bonnes pratiques

---

## ⚙️ Configuration

### Guides de référence

1. **[configuration.md](configuration.md)** - Guide complet de configuration
   - Tous les paramètres disponibles
   - Valeurs par défaut
   - Exemples pour chaque option
   - **Consultez ce fichier pour :**
     - Configurer le navigateur
     - Créer des workflows
     - Utiliser les actions
     - Configurer les extracteurs
     - Paramétrer l'export
     - Gérer les erreurs
     - Planifier des exécutions

2. **[config.template.json](../config.template.json)** - Template de configuration
   - Configuration complète commentée
   - Prêt à copier/modifier

---

## 📝 Historique et changelog

1. **[CHANGELOG.md](CHANGELOG.md)** - Historique des versions
   - Version 1.0.0 (actuelle)
   - Roadmap future
   - Notes de migration

2. **[AGENTS.md](../AGENTS.md)** - Suivi du projet
   - Historique des sprints
   - État actuel
   - Fonctionnalités implémentées

3. **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)** - Résumé du projet
   - Vue d'ensemble complète
   - Statistiques
   - Objectifs atteints
   - Cas d'usage

---

## 📖 Documentation par sujet

### Actions

Pour chaque action, consultez [configuration.md](configuration.md) :

| Action | Section | Page |
|--------|---------|------|
| `navigate` | Actions disponibles > 1. navigate | configuration.md#1-navigate---navigation |
| `click` | Actions disponibles > 2. click | configuration.md#2-click---clic |
| `input` | Actions disponibles > 3. input | configuration.md#3-input---saisie |
| `extract` | Actions disponibles > 4. extract | configuration.md#4-extract---extraction |
| `wait` | Actions disponibles > 5. wait | configuration.md#5-wait---attente |
| `scroll` | Actions disponibles > 6. scroll | configuration.md#6-scroll---défilement |
| `pagination` | Actions disponibles > 7. pagination | configuration.md#7-pagination---pagination |
| `api` | Actions disponibles > 8. api | configuration.md#8-api---requête-api |
| `loop` | Actions disponibles > 9. loop | configuration.md#9-loop---boucle |
| `condition` | Actions disponibles > 10. condition | configuration.md#10-condition---condition |
| `subWorkflow` | Actions disponibles > 11. subWorkflow | configuration.md#11-subworkflow---sous-workflow |

### Extracteurs

| Extracteur | Section | Documentation |
|------------|---------|---------------|
| `text` | Extracteurs > text | configuration.md#text---texte |
| `attribute` | Extracteurs > attribute | configuration.md#attribute---attribut |
| `html` | Extracteurs > html | configuration.md#html---html |
| `list` | Extracteurs > list | configuration.md#list---liste |

### Cas d'usage

Consultez [examples.md](examples.md) :

| Cas d'usage | Section |
|-------------|---------|
| Scraping simple | 1. Scraping simple |
| Listes de produits | 2. Extraction de listes |
| Pagination | 3. Pagination |
| Multi-pages | 4. Navigation multi-pages |
| Authentification | 5. Formulaires et authentification |
| Requêtes API | 6. Requêtes API |
| Workflows avancés | 7. Workflows avancés |
| Gestion d'erreurs | 8. Gestion d'erreurs |
| Exécution planifiée | 9. Exécution planifiée |
| Export de données | 10. Export de données |

---

## 🎯 Trouver rapidement

### Par besoin

| Besoin | Document | Section |
|--------|----------|---------|
| Installer le projet | README.md | Installation |
| Premier scraping | QUICKSTART.md | Installation en 3 étapes |
| Configurer le navigateur | configuration.md | Configuration du navigateur |
| Créer un workflow | configuration.md | Configuration des workflows |
| Gérer la pagination | examples.md | 3. Pagination |
| Appeler une API | examples.md | 6. Requêtes API |
| Planifier un scraping | configuration.md | Planification (Scheduler) |
| Gérer les erreurs | configuration.md | Gestion des erreurs |
| Exporter en CSV | configuration.md | Export des données |
| Utiliser des templates | configuration.md | Templating |
| Comprendre l'architecture | STRUCTURE.md | Vue d'ensemble |

### Par niveau

**Débutant** - Je découvre le projet
1. [README.md](../README.md)
2. [QUICKSTART.md](QUICKSTART.md)
3. Exemples : [simple-navigation.json](../configs/examples/simple-navigation.json)

**Intermédiaire** - Je crée mes configs
1. [configuration.md](configuration.md)
2. [examples.md](examples.md)
3. [config.template.json](../config.template.json)

**Avancé** - Je veux tout comprendre
1. [STRUCTURE.md](STRUCTURE.md)
2. [plan.md](plan.md)
3. Code source dans `src/`

---

## 📂 Configurations d'exemple

Tous les exemples sont dans [`configs/examples/`](../configs/examples/) :

### Par niveau de difficulté

**🟢 Débutant**
- `simple-navigation.json` - Navigation basique
- `extraction-example.json` - Extraction simple
- `config-with-json-output.json` - Export JSON

**🟡 Intermédiaire**
- `pagination-click.json` - Pagination par clic
- `pagination-url.json` - Pagination par URL
- `pagination-scroll.json` - Scroll infini
- `api-request-example.json` - Requêtes API
- `workflow-with-conditions.json` - Conditions

**🔴 Avancé**
- `complete-workflow.json` - Workflow complet
- `workflow-with-loops.json` - Boucles
- `workflow-with-subworkflows.json` - Sous-workflows
- `error-handling-test.json` - Gestion d'erreurs
- `scheduled-config.json` - Exécution planifiée

### Par cas d'usage

| Cas d'usage | Fichier |
|-------------|---------|
| Navigation simple | `simple-navigation.json` |
| Extraction de données | `extraction-example.json` |
| Pagination par clic | `pagination-click.json` |
| Pagination par URL | `pagination-url.json` |
| Scroll infini | `pagination-scroll.json` |
| Requêtes API | `api-request-example.json` |
| Tests API | `api-test-config.json` |
| Boucles | `workflow-with-loops.json` |
| Conditions | `workflow-with-conditions.json` |
| Sous-workflows | `workflow-with-subworkflows.json` |
| Workflow complet | `complete-workflow.json` |
| Export JSON | `config-with-json-output.json` |
| Export CSV | `config-with-csv-output.json` |
| Gestion d'erreurs | `error-handling-config.json` |
| Tests d'erreurs | `error-handling-test.json` |
| Planification | `scheduled-config.json` |
| Tests scheduler | `scheduler-test-quick.json` |

---

## 🔍 Recherche rapide

### Mots-clés

| Mot-clé | Document | Section |
|---------|----------|---------|
| cron | configuration.md | Planification |
| retry | configuration.md | Gestion des erreurs |
| template | configuration.md | Templating |
| CSV | configuration.md | Export CSV |
| JSON | configuration.md | Export JSON |
| headless | configuration.md | Configuration du navigateur |
| timeout | configuration.md | Browser / Actions |
| selector | configuration.md | Actions / Extracteurs |
| pagination | configuration.md + examples.md | Pagination |
| API | configuration.md + examples.md | Requêtes API |
| loop | configuration.md + examples.md | Boucles |
| condition | configuration.md + examples.md | Conditions |
| subWorkflow | configuration.md | Sous-workflows |

---

## 🆘 Aide et support

### J'ai un problème

1. **Consultez la FAQ** dans [README.md](../README.md#faq)
2. **Vérifiez les erreurs courantes** dans [QUICKSTART.md](../QUICKSTART.md#-problèmes-courants)
3. **Cherchez dans les issues** : [GitHub Issues](https://github.com/ArthurBr02/generic-scraper/issues)
4. **Ouvrez une issue** avec le tag `question`

---

## 📊 Statistiques de la documentation

| Métrique | Valeur |
|----------|--------|
| **Fichiers de documentation** | 11 |
| **Lignes de documentation** | ~8000 |
| **Exemples de configuration** | 17 |
| **Actions documentées** | 11 |
| **Extracteurs documentés** | 4 |
| **Cas d'usage détaillés** | 10 |

---

## 🎓 Parcours d'apprentissage recommandé

### Jour 1 - Découverte (30 min)
1. Lire [README.md](../README.md) (10 min)
2. Suivre [QUICKSTART.md](../QUICKSTART.md) (15 min)
3. Tester `simple-navigation.json` (5 min)

### Jour 2 - Configuration (1h)
1. Parcourir [configuration.md](configuration.md) (30 min)
2. Tester 3 exemples différents (30 min)

### Jour 3 - Cas d'usage (1h)
1. Lire [examples.md](examples.md) (30 min)
2. Créer sa première config personnalisée (30 min)

### Jour 4 - Avancé (2h)
1. Étudier les workflows complexes (30 min)
2. Tester pagination + API (30 min)
3. Configurer le scheduler (30 min)
4. Expérimenter (30 min)

---

## ✅ Checklist complète

Pour maîtriser Generic Scraper :

**Basique**
- [ ] Installation réussie
- [ ] Premier exemple testé
- [ ] Configuration JSON comprise
- [ ] Extraction de données simple

**Intermédiaire**
- [ ] Pagination maîtrisée
- [ ] Requêtes API testées
- [ ] Export CSV/JSON utilisé
- [ ] Gestion d'erreurs comprise

**Avancé**
- [ ] Workflows complexes créés
- [ ] Scheduler configuré
- [ ] Templates utilisés
- [ ] Sous-workflows implémentés

---

**Bonne lecture ! 📖**

*Pour toute question, consultez d'abord cet index, puis la FAQ dans le README.*
