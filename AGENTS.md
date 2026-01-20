# Generic Scraper - Avancée du projet

## 📚 Documentation à lire

- **Plan V2** : `documentation/plan_v2.md` - Plan d'implémentation complet de la V2 (Interface graphique)
- **Plan V1** : `documentation/plan.md` - Fonctionnalités implémentées dans la V1
- **Changelog** : `CHANGELOG.md` - Historique des versions et modifications
- **Évolutions** : `EVOLUTIONS.md` - Roadmap des futures versions (V2, V3, V4, V5)
- **Structure** : `documentation/STRUCTURE.md` - Structure du projet V1

## 🎯 Version Actuelle

**Version** : 1.1.0 → 2.0.0 (en développement)  
**Status** : V1 Production Ready ✅ | V2 En cours de développement 🚧

## 🚀 V2 - Interface Utilisateur Graphique

### Architecture
Le backend V2 **réutilise le code scraper existant** (`src/`) via `child_process.spawn()`.  
Il agit comme une couche d'orchestration avec API REST + WebSocket.

### Progression

#### Phase 1 : Infrastructure & Backend API (3 semaines)
- ✅ **Sprint 1** : Configuration Docker & Structure Backend (PLANIFIÉ)
  - Plan d'implémentation créé
  - Architecture définie
  - Prêt pour l'implémentation
- ⏳ **Sprint 2** : API REST - Gestion des Configurations (À FAIRE)
- ⏳ **Sprint 3** : API REST - Exécution des Scrapers (À FAIRE)

#### Phase 2 : Communication Temps Réel & Frontend (3 semaines)
- ⏳ Sprint 4-6 : À planifier

#### Phase 3 : Éditeur Drag & Drop (4 semaines)
- ⏳ Sprint 7-10 : À planifier

#### Phase 4 : Visualisation & Finitions (2 semaines)
- ⏳ Sprint 11-12 : À planifier

---

*Dernière mise à jour : 2026-01-20*  
*Prochaine étape : Implémentation Sprint 1 - Backend*