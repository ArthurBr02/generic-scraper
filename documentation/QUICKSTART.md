# 🚀 Démarrage Rapide - Generic Scraper

Guide visuel pour démarrer en 5 minutes.

---

## ⚡ Installation en 3 étapes

### 1️⃣ Cloner et installer

```bash
git clone https://github.com/ArthurBr02/generic-scraper.git
cd generic-scraper
npm install
npx playwright install chromium
```

⏱️ **Temps estimé** : 2-3 minutes

---

### 2️⃣ Tester avec un exemple

```bash
npm run start -- --config ./configs/examples/simple-navigation.json
```

✅ **Résultat attendu** : Le scraper visite example.com et affiche "Success!"

---

### 3️⃣ Créer votre première configuration

Créez `my-first-scraper.json` :

```json
{
  "name": "my-first-scraper",
  "target": {
    "url": "https://books.toscrape.com"
  },
  "browser": {
    "headless": true
  },
  "workflow": {
    "steps": [
      {
        "type": "navigate",
        "config": {
          "url": "{{target.url}}"
        }
      },
      {
        "type": "extract",
        "config": {
          "selector": ".product_pod",
          "type": "list",
          "fields": [
            {
              "name": "title",
              "selector": "h3 a",
              "type": "attribute",
              "attribute": "title"
            },
            {
              "name": "price",
              "selector": ".price_color",
              "type": "text"
            }
          ],
          "saveAs": "books"
        }
      }
    ]
  },
  "output": {
    "format": "json",
    "path": "./output/my-books.json"
  }
}
```

Lancez-le :

```bash
npm run start -- --config my-first-scraper.json
```

📁 **Vos données** sont maintenant dans `output/my-books.json` !

---

## 📊 Cas d'usage courants

### 🔄 Scraping avec pagination

```json
{
  "workflow": {
    "steps": [
      {
        "type": "navigate",
        "config": { "url": "https://example.com/products" }
      },
      {
        "id": "extract-data",
        "type": "extract",
        "config": {
          "selector": ".product",
          "type": "list",
          "fields": [
            { "name": "name", "selector": ".name", "type": "text" }
          ],
          "saveAs": "products"
        }
      },
      {
        "type": "pagination",
        "config": {
          "type": "click",
          "nextSelector": ".next-page",
          "maxPages": 5,
          "repeatSteps": ["extract-data"]
        }
      }
    ]
  }
}
```

---

### 🌐 Intégration API

```json
{
  "workflow": {
    "steps": [
      {
        "type": "api",
        "config": {
          "method": "GET",
          "url": "https://api.github.com/users/torvalds",
          "responseType": "json",
          "saveAs": "userData"
        }
      },
      {
        "type": "navigate",
        "config": {
          "url": "https://github.com/{{userData.login}}"
        }
      }
    ]
  }
}
```

---

### ⏰ Exécution planifiée

Ajoutez dans votre config :

```json
{
  "scheduling": {
    "enabled": true,
    "cron": "0 9 * * *",
    "timezone": "Europe/Paris"
  }
}
```

Lancez en mode scheduler :

```bash
npm run start -- --config ma-config.json --schedule
```

**Expression cron** : `0 9 * * *` = Tous les jours à 9h00

---

## 🎯 Scénarios prêts à l'emploi

### 1. E-commerce : Scraper les prix

```bash
npm run start -- --config ./configs/examples/pagination-click.json
```

**Ce qu'il fait** : Parcourt plusieurs pages de produits et extrait noms + prix

---

### 2. Job Board : Extraire les offres

```json
{
  "target": { "url": "https://jobs.example.com" },
  "workflow": {
    "steps": [
      {
        "type": "navigate",
        "config": { "url": "{{target.url}}/search?q=developer" }
      },
      {
        "type": "extract",
        "config": {
          "selector": ".job-listing",
          "type": "list",
          "fields": [
            { "name": "title", "selector": ".job-title", "type": "text" },
            { "name": "company", "selector": ".company", "type": "text" },
            { "name": "location", "selector": ".location", "type": "text" },
            { "name": "url", "selector": "a", "type": "attribute", "attribute": "href" }
          ],
          "saveAs": "jobs"
        }
      }
    ]
  },
  "output": {
    "format": "csv",
    "path": "./output/jobs-{{date}}.csv"
  }
}
```

---

### 3. Social Media : Surveiller des mentions

```json
{
  "scheduling": {
    "enabled": true,
    "cron": "*/30 * * * *"
  },
  "workflow": {
    "steps": [
      {
        "type": "api",
        "config": {
          "method": "GET",
          "url": "https://api.twitter.com/search?q=mon-produit",
          "headers": {
            "Authorization": "Bearer {{env.TWITTER_TOKEN}}"
          },
          "saveAs": "tweets"
        }
      }
    ]
  },
  "output": {
    "format": "json",
    "path": "./output/mentions-{{datetime}}.json",
    "append": true
  }
}
```

**Exécution** : Toutes les 30 minutes

---

## 🛠️ Commandes utiles

### Lancement

```bash
# Config par défaut
npm run start

# Config spécifique
npm run start -- --config ma-config.json

# Mode non-headless (voir le navigateur)
npm run start -- --config ma-config.json --headless false

# Mode scheduler
npm run start -- --schedule --config ma-config.json
```

### Validation

```bash
# Vérifier la syntaxe du code
npm run lint

# Corriger automatiquement
npm run lint:fix

# Valider une config
npm run test:config
```

### Debug

```bash
# Augmenter le niveau de logs
# Dans votre config.json :
{
  "logging": {
    "level": "debug",
    "console": true
  }
}
```

---

## 📚 Apprendre par l'exemple

### Parcours recommandé

1. **Débutant** : Commencez par `simple-navigation.json`
2. **Intermédiaire** : Testez `pagination-click.json`
3. **Avancé** : Explorez `workflow-with-subworkflows.json`
4. **Expert** : Créez votre propre workflow complexe

### 17 exemples disponibles

```
configs/examples/
├── 🟢 Niveau débutant
│   ├── simple-navigation.json
│   ├── extraction-example.json
│   └── config-with-json-output.json
│
├── 🟡 Niveau intermédiaire
│   ├── pagination-click.json
│   ├── pagination-url.json
│   ├── pagination-scroll.json
│   ├── api-request-example.json
│   └── workflow-with-conditions.json
│
└── 🔴 Niveau avancé
    ├── complete-workflow.json
    ├── workflow-with-loops.json
    ├── workflow-with-subworkflows.json
    ├── error-handling-test.json
    └── scheduled-config.json
```

---

## 🎓 Ressources d'apprentissage

| Ressource | Description | Lien |
|-----------|-------------|------|
| **README** | Vue d'ensemble et installation | [README.md](README.md) |
| **Configuration** | Tous les paramètres disponibles | [configuration.md](documentation/configuration.md) |
| **Exemples** | Cas d'usage détaillés | [examples.md](documentation/examples.md) |
| **Structure** | Architecture du projet | [STRUCTURE.md](STRUCTURE.md) |

---

## 💡 Astuces

### 1. Voir ce qui se passe

Désactivez le mode headless pour observer le navigateur :

```json
{
  "browser": {
    "headless": false,
    "slowMo": 500
  }
}
```

### 2. Gérer les pop-ups

Ajoutez toujours cette action au début :

```json
{
  "type": "click",
  "continueOnError": true,
  "config": {
    "selector": ".cookie-accept, .popup-close"
  }
}
```

### 3. Debug des sélecteurs

Utilisez les DevTools du navigateur pour tester vos sélecteurs CSS :

```javascript
// Dans la console du navigateur
document.querySelectorAll('.mon-selecteur')
```

### 4. Templates dynamiques

Utilisez des variables pour rendre vos configs réutilisables :

```json
{
  "target": {
    "url": "https://example.com",
    "keyword": "laptop"
  },
  "workflow": {
    "steps": [
      {
        "type": "navigate",
        "config": {
          "url": "{{target.url}}/search?q={{target.keyword}}"
        }
      }
    ]
  }
}
```

### 5. Export intelligent

Nommez vos fichiers avec des templates :

```json
{
  "output": {
    "path": "./output/{{name}}-{{date}}-{{time}}.json"
  }
}
```

Résultat : `my-scraper-2026-01-20-14-30-00.json`

---

## 💡 Concepts clés à retenir

### `saveAs` vs `output` - La différence importante

**Question** : Quand utiliser `saveAs` ou `output` dans vos extractions ?

| Situation | Utilisez | Exemple |
|-----------|----------|---------|
| "Je veux ces URLs pour les visiter ensuite" | `saveAs` | Pagination → URLs de produits |
| "Ce sont mes résultats finaux à exporter" | `output` | Détails complets des produits |
| "J'ai besoin de ces IDs temporairement" | `saveAs` | IDs à passer à une API |
| "C'est ce que je veux dans mon fichier CSV" | `output` | Liste de prix |

**Exemple concret** :

```json
{
  "workflow": {
    "steps": [
      {
        "type": "extract",
        "config": {
          "selector": ".product-link",
          "type": "list",
          "fields": [
            { "name": "url", "selector": "a", "type": "attribute", "attribute": "href" }
          ]
        },
        "saveAs": "productUrls"  // 💾 Usage interne (pas exporté)
      },
      {
        "type": "loop",
        "config": {
          "items": "productUrls",
          "steps": [
            {
              "type": "extract",
              "config": {
                "fields": [
                  { "name": "title", "selector": ".title", "type": "text" },
                  { "name": "price", "selector": ".price", "type": "text" }
                ]
              },
              "output": "products"  // 📤 Export final
            }
          ]
        }
      }
    ]
  }
}
```

**Résultat** : Votre fichier contiendra seulement `products`, pas `productUrls` !

[➡️ En savoir plus sur saveAs vs output](configuration.md#-différence-entre-saveas-et-output)

---

## 🆘 Problèmes courants

### Le navigateur ne démarre pas

```bash
# Réinstallez Playwright
npx playwright install chromium
```

### Les sélecteurs ne trouvent rien

1. Vérifiez que le site est complètement chargé
2. Ajoutez un `wait` avant l'extraction
3. Testez le sélecteur dans DevTools

### Les données sont incorrectes

1. Vérifiez le type d'extracteur (`text` vs `textContent`)
2. Utilisez `headless: false` pour voir la page
3. Ajoutez des logs debug

---

## 🎉 Prêt à scraper !

Vous avez maintenant tout ce qu'il faut pour :
- ✅ Installer le projet
- ✅ Lancer vos premiers scrapings
- ✅ Créer vos propres configurations
- ✅ Automatiser vos extractions

**Prochaine étape** : Explorez les [exemples détaillés](documentation/examples.md) !

---

**Besoin d'aide ?**
- 📖 Consultez la [documentation complète](documentation/)
- 🐛 Signalez un bug dans les [issues](https://github.com/ArthurBr02/generic-scraper/issues)
- 💬 Posez vos questions en ouvrant une issue avec le tag `question`

---

*Happy scraping! 🚀*
