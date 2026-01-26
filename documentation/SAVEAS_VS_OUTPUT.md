# 💾 saveAs vs 📤 output - Guide Complet

## TL;DR - Résumé en 30 secondes

```
saveAs = "Garde-le pour plus tard dans le workflow"
output = "Mets-le dans mon fichier final"
```

**Règle d'or** : Si tu ne veux pas voir ces données dans ton résultat final, utilise `saveAs`.

---

## 🎯 Tableau de décision rapide

| Question | Réponse | Utilise |
|----------|---------|---------|
| Ces données seront-elles dans le fichier final ? | Non | `saveAs` |
| Ces données seront-elles dans le fichier final ? | Oui | `output` |
| J'ai juste besoin de ces URLs pour une boucle | → | `saveAs` |
| Ce sont mes résultats de scraping finaux | → | `output` |
| C'est temporaire / technique | → | `saveAs` |
| C'est le contenu que je veux récupérer | → | `output` |

---

## 📊 Comparaison détaillée

| Caractéristique | `saveAs` 💾 | `output` 📤 |
|----------------|-------------|-------------|
| **Stocké dans workflow.data** | ✅ Oui | ✅ Oui |
| **Exporté dans le fichier** | ❌ Non | ✅ Oui |
| **Réutilisable dans le workflow** | ✅ Oui | ✅ Oui |
| **Visible dans l'UI d'exécution** | ✅ Oui | ✅ Oui |
| **Type de données** | Intermédiaire | Finale |
| **Durée de vie** | Durée du workflow | Permanent (fichier) |

---

## 🎬 Exemples pratiques

### Exemple 1 : E-commerce - Liste de produits

**❌ MAUVAIS - Tout en output**

```json
{
  "steps": [
    {
      "type": "extract",
      "config": { "selector": ".product-link" },
      "output": "productUrls"  // ❌ Pollue le résultat
    },
    {
      "type": "loop",
      "config": {
        "items": "productUrls",
        "steps": [
          {
            "type": "extract",
            "output": "products"  // ✅ OK
          }
        ]
      }
    }
  ]
}
```

**Fichier de sortie (mauvais)** :
```json
{
  "productUrls": ["/product/1", "/product/2"],  // ❌ On ne veut pas ça
  "products": [{"title": "..."}, {"title": "..."}]  // ✅ C'est ça qu'on veut
}
```

---

**✅ BON - saveAs pour intermédiaire, output pour final**

```json
{
  "steps": [
    {
      "type": "extract",
      "config": { "selector": ".product-link" },
      "saveAs": "productUrls"  // ✅ Interne seulement
    },
    {
      "type": "loop",
      "config": {
        "items": "productUrls",
        "steps": [
          {
            "type": "extract",
            "output": "products"  // ✅ Export final
          }
        ]
      }
    }
  ]
}
```

**Fichier de sortie (bon)** :
```json
{
  "products": [{"title": "..."}, {"title": "..."}]  // ✅ Propre et clair
}
```

---

### Exemple 2 : API avec pagination

```json
{
  "steps": [
    {
      "type": "api",
      "config": {
        "url": "https://api.example.com/users?page=1"
      },
      "saveAs": "page1"  // 💾 Temporaire
    },
    {
      "type": "api",
      "config": {
        "url": "https://api.example.com/users?page=2"
      },
      "saveAs": "page2"  // 💾 Temporaire
    },
    {
      "type": "transform",
      "config": {
        "merge": ["{{page1}}", "{{page2}}"]
      },
      "output": "allUsers"  // 📤 Export final combiné
    }
  ]
}
```

**Résultat** : Le fichier contient seulement `allUsers`, pas `page1` ni `page2`.

---

### Exemple 3 : Login puis scraping

```json
{
  "steps": [
    {
      "type": "navigate",
      "config": { "url": "https://site.com/login" }
    },
    {
      "type": "form",
      "config": {
        "formSelector": "form",
        "fields": {
          "username": "{{env.USERNAME}}",
          "password": "{{env.PASSWORD}}"
        }
      }
    },
    {
      "type": "extract",
      "config": { "selector": ".auth-token" },
      "saveAs": "authToken"  // 💾 Token temporaire
    },
    {
      "type": "api",
      "config": {
        "url": "https://api.site.com/data",
        "headers": {
          "Authorization": "Bearer {{authToken}}"
        }
      },
      "output": "userData"  // 📤 Vraies données
    }
  ]
}
```

---

## 🔄 Workflow typique

```
1. Navigate → Page
2. Extract URLs → saveAs: "urls"
3. Loop sur "urls"
   ├─ Navigate → Détail
   └─ Extract → output: "results"
4. Fichier final contient seulement "results"
```

**Schéma** :
```
[Page liste] 
    ↓ extract
[URLs] (saveAs)
    ↓ loop
[Page détail 1, 2, 3...]
    ↓ extract
[Résultats] (output) → 📁 fichier final
```

---

## ❓ Questions fréquentes

### Q: Puis-je utiliser les deux en même temps ?

**R:** Non. Une step ne peut avoir qu'un seul des deux. Choisissez selon le besoin :
- Données temporaires → `saveAs`
- Données finales → `output`

### Q: Que se passe-t-il si j'utilise ni l'un ni l'autre ?

**R:** Les données sont perdues après l'exécution de la step. Utilisez toujours l'un ou l'autre si vous voulez garder les données.

### Q: Peut-on accéder aux données `saveAs` d'une autre configuration ?

**R:** Non. Les données `saveAs` et `output` sont limitées à l'exécution du workflow. Elles ne persistent pas entre différentes exécutions.

### Q: Comment voir les données `saveAs` pendant le debug ?

**R:** Activez le mode debug dans les logs :
```json
{
  "logging": {
    "level": "debug",
    "console": true
  }
}
```

Les logs afficheront le contenu de `workflow.data`.

### Q: Y a-t-il une limite de taille ?

**R:** Pas de limite technique, mais soyez raisonnable. Des données très volumineuses en `saveAs` consomment de la mémoire pendant l'exécution.

### Q: Le bloc `loop` peut-il avoir un `output` ?

**R:** Oui ! Le bloc `loop` peut avoir un `output` ou `saveAs` pour collecter **tous** les résultats de **toutes** les itérations :

```json
{
  "type": "loop",
  "config": {
    "items": "urls",
    "steps": [
      {
        "type": "extract",
        "output": "item_details"  // Résultat d'UNE itération
      }
    ]
  },
  "output": "all_details"  // Collection de TOUS les résultats
}
```

**Différence :**
- `output` sur un step dans le loop → Résultat d'une seule itération
- `output` sur le bloc loop → Tableau de tous les résultats combinés

---

## 🎓 Cas d'usage par type de données

### URLs et liens
```json
{ "type": "extract", "saveAs": "links" }  // ✅ Temporaire
```

### IDs / Références
```json
{ "type": "extract", "saveAs": "productIds" }  // ✅ Temporaire
```

### Tokens / Credentials
```json
{ "type": "extract", "saveAs": "csrfToken" }  // ✅ Temporaire + sécurité
```

### Produits / Articles
```json
{ "type": "extract", "output": "products" }  // ✅ Résultat final
```

### Données utilisateur
```json
{ "type": "extract", "output": "users" }  // ✅ Résultat final
```

### Statistiques / Métriques
```json
{ "type": "extract", "output": "metrics" }  // ✅ Résultat final
```

---

## 🚀 Bonnes pratiques

### ✅ DO

```json
// Pagination → saveAs
{ "type": "pagination", "saveAs": "allUrls" }

// Extract final → output
{ "type": "extract", "output": "products" }

// Noms descriptifs
{ "saveAs": "productUrls" }  // Clair
{ "output": "productDetails" }  // Clair
```

### ❌ DON'T

```json
// Ne pas exporter des URLs
{ "type": "pagination", "output": "urls" }  // ❌

// Noms vagues
{ "saveAs": "data" }  // ❌ Pas clair
{ "output": "results" }  // ❌ Trop générique
```

---

## 🎯 Checklist avant de lancer

- [ ] Mes données intermédiaires utilisent `saveAs`
- [ ] Mes résultats finaux utilisent `output`
- [ ] Aucune URL/ID n'est en `output`
- [ ] Tous mes extracts importants ont soit `saveAs` soit `output`
- [ ] Les noms de variables sont descriptifs

---

## 📚 Voir aussi

- [Configuration complète](configuration.md#-différence-entre-saveas-et-output)
- [Exemples d'utilisation](examples.md#exemple--différence-entre-saveas-et-output-)
- [Guide de démarrage rapide](QUICKSTART.md#saveas-vs-output---la-différence-importante)

---

**En résumé** : 
- 💾 `saveAs` = Données de travail
- 📤 `output` = Données finales

C'est aussi simple que ça ! 🎉
