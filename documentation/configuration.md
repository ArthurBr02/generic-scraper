# Guide de configuration - Generic Scraper

Ce document décrit tous les paramètres de configuration disponibles pour Generic Scraper.

## Table des matières

1. [Structure générale](#structure-générale)
2. [Configuration principale](#configuration-principale)
3. [Configuration du navigateur](#configuration-du-navigateur)
4. [Configuration des workflows](#configuration-des-workflows)
5. [Actions disponibles](#actions-disponibles)
6. [Extracteurs](#extracteurs)
7. [Gestion des erreurs](#gestion-des-erreurs)
8. [Planification (Scheduler)](#planification-scheduler)
9. [Export des données](#export-des-données)
10. [Templating](#templating)

---

## Structure générale

Un fichier de configuration se compose de plusieurs sections :

```json
{
  "name": "nom-du-scraper",
  "version": "1.0.0",
  "target": { ... },
  "browser": { ... },
  "performance": { ... },
  "errorHandling": { ... },
  "logging": { ... },
  "scheduling": { ... },
  "workflow": { ... },
  "output": { ... }
}
```

---

## Configuration principale

### `name`
- **Type** : `string`
- **Obligatoire** : Oui
- **Description** : Nom unique du scraper
- **Exemple** : `"my-scraper"`

### `version`
- **Type** : `string`
- **Obligatoire** : Non
- **Défaut** : `"1.0.0"`
- **Description** : Version de la configuration

### `target`
- **Type** : `object`
- **Obligatoire** : Oui
- **Description** : Configuration de la cible de scraping

```json
{
  "target": {
    "url": "https://example.com",
    "baseUrl": "https://example.com"
  }
}
```

**Propriétés :**
- `url` (string) : URL principale à scraper
- `baseUrl` (string, optionnel) : URL de base pour les URLs relatives

---

## Configuration du navigateur

### `browser`

Configure le comportement du navigateur Playwright.

```json
{
  "browser": {
    "type": "chromium",
    "headless": true,
    "slowMo": 0,
    "timeout": 30000,
    "viewport": {
      "width": 1920,
      "height": 1080
    },
    "userAgent": null,
    "locale": "fr-FR",
    "timezone": "Europe/Paris",
    "proxy": null,
    "extraHTTPHeaders": {},
    "ignoreHTTPSErrors": false
  }
}
```

**Propriétés :**

| Propriété | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `type` | string | `"chromium"` | Type de navigateur : `chromium`, `firefox`, `webkit` |
| `headless` | boolean | `true` | Mode headless (sans interface graphique) |
| `slowMo` | number | `0` | Ralentissement en ms pour chaque action (debug) |
| `timeout` | number | `30000` | Timeout global en ms |
| `viewport.width` | number | `1920` | Largeur de la fenêtre |
| `viewport.height` | number | `1080` | Hauteur de la fenêtre |
| `userAgent` | string | `null` | User-Agent personnalisé |
| `locale` | string | `"fr-FR"` | Locale du navigateur |
| `timezone` | string | `"Europe/Paris"` | Fuseau horaire |
| `ignoreHTTPSErrors` | boolean | `false` | Ignorer les erreurs SSL |

**Proxy :**

```json
{
  "proxy": {
    "server": "http://proxy.example.com:8080",
    "username": "user",
    "password": "pass",
    "bypass": "localhost,127.0.0.1"
  }
}
```

**Headers HTTP personnalisés :**

```json
{
  "extraHTTPHeaders": {
    "Authorization": "Bearer token123",
    "X-Custom-Header": "value"
  }
}
```

---

## Configuration des workflows

### `workflow`

Définit la séquence d'actions à exécuter.

```json
{
  "workflow": {
    "name": "main-workflow",
    "description": "Description du workflow",
    "steps": [
      {
        "id": "step-1",
        "name": "Navigation",
        "type": "navigate",
        "config": { ... },
        "continueOnError": false,
        "retry": { ... },
        "timeout": 5000
      }
    ],
    "subWorkflows": {
      "extract-product": {
        "steps": [ ... ]
      }
    }
  }
}
```

**Propriétés d'un step :**

| Propriété | Type | Obligatoire | Description |
|-----------|------|-------------|-------------|
| `id` | string | Non | Identifiant unique du step |
| `name` | string | Non | Nom descriptif du step |
| `type` | string | Oui | Type d'action (voir section Actions) |
| `config` | object | Oui | Configuration spécifique à l'action |
| `continueOnError` | boolean | Non | Continuer si le step échoue |
| `retry` | object | Non | Configuration des retries |
| `timeout` | number | Non | Timeout spécifique au step |
| `saveAs` | string | Non | Nom de variable pour sauvegarder le résultat |

**Configuration des retries :**

```json
{
  "retry": {
    "retries": 3,
    "delay": 1000,
    "backoffMultiplier": 2,
    "screenshotOnError": true
  }
}
```

---

## Actions disponibles

### 1. `navigate` - Navigation

Navigue vers une URL.

```json
{
  "type": "navigate",
  "config": {
    "url": "https://example.com",
    "waitUntil": "networkidle",
    "timeout": 30000,
    "referer": null
  }
}
```

**Propriétés :**
- `url` (string, obligatoire) : URL cible (supporte templates)
- `waitUntil` (string) : Événement d'attente : `load`, `domcontentloaded`, `networkidle`, `commit`
- `timeout` (number) : Timeout en ms
- `referer` (string) : Referer HTTP

---

### 2. `click` - Clic

Clique sur un élément.

```json
{
  "type": "click",
  "config": {
    "selector": "#button",
    "button": "left",
    "clickCount": 1,
    "delay": 0,
    "force": false,
    "noWaitAfter": false,
    "position": null,
    "modifiers": []
  }
}
```

**Propriétés :**
- `selector` (string, obligatoire) : Sélecteur CSS de l'élément
- `button` (string) : Bouton de souris : `left`, `right`, `middle`
- `clickCount` (number) : Nombre de clics (1 = simple, 2 = double)
- `delay` (number) : Délai entre mousedown et mouseup (ms)
- `force` (boolean) : Forcer le clic même si l'élément n'est pas visible
- `noWaitAfter` (boolean) : Ne pas attendre après le clic
- `position` (object) : Position relative `{ x: 10, y: 20 }`
- `modifiers` (array) : Modificateurs : `Alt`, `Control`, `Meta`, `Shift`

---

### 3. `input` - Saisie

Remplit des champs de formulaire.

```json
{
  "type": "input",
  "config": {
    "selector": "#email",
    "value": "user@example.com",
    "method": "fill",
    "delay": 0,
    "clear": true
  }
}
```

**Méthodes disponibles :**

| Méthode | Description | Exemple |
|---------|-------------|---------|
| `fill` | Remplit rapidement | `{ "method": "fill", "value": "text" }` |
| `type` | Tape caractère par caractère | `{ "method": "type", "value": "text", "delay": 100 }` |
| `press` | Appuie sur une touche | `{ "method": "press", "key": "Enter" }` |
| `select` | Sélectionne dans une liste | `{ "method": "select", "values": ["option1"] }` |
| `check` | Coche une checkbox | `{ "method": "check" }` |
| `uncheck` | Décoche une checkbox | `{ "method": "uncheck" }` |
| `upload` | Upload de fichier | `{ "method": "upload", "files": ["path/to/file"] }` |

---

### 4. `extract` - Extraction

Extrait des données de la page.

```json
{
  "type": "extract",
  "config": {
    "selector": ".product",
    "type": "text",
    "multiple": false,
    "saveAs": "productName"
  }
}
```

**Types d'extraction (voir section Extracteurs) :**
- `text` : Texte de l'élément
- `attribute` : Attribut HTML
- `html` : Code HTML
- `list` : Liste d'éléments avec sous-champs

---

### 5. `wait` - Attente

Attend un événement ou un délai.

```json
{
  "type": "wait",
  "config": {
    "type": "timeout",
    "value": 1000
  }
}
```

**Types d'attente :**

| Type | Description | Exemple |
|------|-------------|---------|
| `timeout` | Délai fixe | `{ "type": "timeout", "value": 1000 }` |
| `selector` | Élément présent | `{ "type": "selector", "selector": "#element" }` |
| `navigation` | Navigation terminée | `{ "type": "navigation" }` |
| `networkidle` | Réseau inactif | `{ "type": "networkidle" }` |
| `function` | Fonction JS | `{ "type": "function", "function": "() => document.readyState === 'complete'" }` |
| `url` | URL correspond | `{ "type": "url", "pattern": "/dashboard" }` |

---

### 6. `scroll` - Défilement

Défile la page ou un élément.

```json
{
  "type": "scroll",
  "config": {
    "type": "bottom",
    "smooth": true,
    "delay": 500
  }
}
```

**Types de scroll :**

| Type | Description | Config |
|------|-------------|--------|
| `bottom` | Bas de page | `{ "type": "bottom" }` |
| `top` | Haut de page | `{ "type": "top" }` |
| `element` | Vers un élément | `{ "type": "element", "selector": "#target" }` |
| `into-view` | Élément visible | `{ "type": "into-view", "selector": "#target" }` |
| `page` | Pixels depuis le haut | `{ "type": "page", "x": 0, "y": 500 }` |

---

### 7. `pagination` - Pagination

Gère la pagination automatique.

```json
{
  "type": "pagination",
  "config": {
    "type": "click",
    "nextSelector": ".next-button",
    "maxPages": 10,
    "waitAfterClick": 1000,
    "repeatSteps": ["extract-data"]
  }
}
```

**Types de pagination :**

**Par clic :**
```json
{
  "type": "click",
  "nextSelector": ".next",
  "maxPages": 10,
  "waitAfterClick": 1000,
  "repeatSteps": ["step-id"]
}
```

**Par URL :**
```json
{
  "type": "url",
  "urlPattern": "https://example.com/page/{{pageNumber}}",
  "startPage": 1,
  "maxPages": 5,
  "repeatSteps": ["extract-data"]
}
```

**Par scroll :**
```json
{
  "type": "scroll",
  "scrollDelay": 1000,
  "maxScrolls": 10,
  "detectEnd": true,
  "detectEndSelector": ".no-more-items",
  "repeatSteps": ["extract-data"]
}
```

---

### 8. `api` - Requête API

Effectue des requêtes HTTP.

```json
{
  "type": "api",
  "config": {
    "method": "GET",
    "url": "https://api.example.com/data",
    "headers": {
      "Authorization": "Bearer {{token}}"
    },
    "body": null,
    "responseType": "json",
    "saveAs": "apiData",
    "timeout": 5000
  }
}
```

**Propriétés :**
- `method` (string) : `GET`, `POST`, `PUT`, `DELETE`, `PATCH`
- `url` (string) : URL de l'API (supporte templates)
- `headers` (object) : Headers HTTP (supporte templates)
- `body` (object/string) : Corps de la requête (supporte templates)
- `responseType` (string) : Type de réponse : `json`, `text`, `blob`, `arrayBuffer`
- `saveAs` (string) : Nom de variable pour le résultat
- `timeout` (number) : Timeout en ms

---

### 9. `loop` - Boucle

Itère sur des éléments ou un tableau.

```json
{
  "type": "loop",
  "config": {
    "selector": ".product-item",
    "maxIterations": 20,
    "steps": [
      {
        "type": "click",
        "config": { "selector": ".product-link" }
      },
      {
        "type": "extract",
        "config": { "selector": ".title", "type": "text", "saveAs": "title" }
      }
    ]
  }
}
```

**Boucle sur un tableau :**
```json
{
  "type": "loop",
  "config": {
    "array": "{{products}}",
    "itemName": "product",
    "steps": [
      {
        "type": "navigate",
        "config": { "url": "https://example.com/product/{{product.id}}" }
      }
    ]
  }
}
```

---

### 10. `condition` - Condition

Exécute des actions conditionnellement.

```json
{
  "type": "condition",
  "config": {
    "if": {
      "selector": ".logged-in",
      "exists": true
    },
    "then": [
      { "type": "click", "config": { "selector": ".profile" } }
    ],
    "else": [
      { "type": "navigate", "config": { "url": "/login" } }
    ]
  }
}
```

**Conditions disponibles :**

```json
// Élément existe
{ "selector": "#element", "exists": true }

// Texte correspond
{ "selector": "#element", "textContains": "Welcome" }

// Variable définie
{ "variable": "userData", "isDefined": true }

// Comparaison
{ "variable": "count", "greaterThan": 10 }
```

---

### 11. `subWorkflow` - Sous-workflow

Appelle un sous-workflow défini.

```json
{
  "type": "subWorkflow",
  "config": {
    "name": "extract-product",
    "params": {
      "productId": "{{currentProduct.id}}"
    }
  }
}
```

**Définition du sous-workflow :**
```json
{
  "workflow": {
    "subWorkflows": {
      "extract-product": {
        "steps": [
          {
            "type": "navigate",
            "config": { "url": "https://example.com/product/{{params.productId}}" }
          },
          {
            "type": "extract",
            "config": { "selector": ".title", "type": "text", "saveAs": "title" }
          }
        ]
      }
    }
  }
}
```

---

### 12. `login` - Authentification

Se connecte à un site web avec différentes méthodes d'authentification.

```json
{
  "type": "login",
  "config": {
    "type": "form",
    "credentials": {
      "username": "user@example.com",
      "password": "motdepasse"
    },
    "selectors": {
      "username": "#email",
      "password": "#password",
      "submit": "button[type='submit']",
      "timeout": 5000
    },
    "successSelector": ".user-dashboard",
    "waitAfterLogin": 2000
  }
}
```

**Types d'authentification :**

#### Login par formulaire (`form`)
```json
{
  "type": "form",
  "credentials": {
    "username": "user@example.com",
    "password": "motdepasse"
  },
  "selectors": {
    "username": "#email",
    "password": "#password",
    "submit": "button[type='submit']",
    "timeout": 5000
  },
  "waitForNavigation": true,
  "navigationTimeout": 10000
}
```

**Propriétés :**
- `credentials.username` (string) : Nom d'utilisateur ou email
- `credentials.password` (string) : Mot de passe
- `selectors.username` (string) : Sélecteur du champ username
- `selectors.password` (string) : Sélecteur du champ password
- `selectors.submit` (string, optionnel) : Sélecteur du bouton submit
- `selectors.timeout` (number) : Timeout pour trouver les éléments
- `waitForNavigation` (boolean) : Attendre la navigation après submit
- `navigationTimeout` (number) : Timeout pour la navigation

#### Login par token (`token`)
```json
{
  "type": "token",
  "credentials": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "type": "Bearer"
  },
  "storageType": "localStorage",
  "storageKey": "authToken"
}
```

**Propriétés :**
- `credentials.token` (string) : Token d'authentification
- `credentials.type` (string) : Type de token (`Bearer`, `JWT`, etc.)
- `storageType` (string) : Où stocker le token : `localStorage`, `sessionStorage`, `cookie`
- `storageKey` (string) : Clé de stockage
- `httpOnly` (boolean) : Pour cookie uniquement
- `secure` (boolean) : Pour cookie uniquement

#### Login par cookies (`cookie`)
```json
{
  "type": "cookie",
  "credentials": {
    "cookies": [
      {
        "name": "session_id",
        "value": "abc123",
        "domain": "example.com",
        "path": "/",
        "httpOnly": true,
        "secure": true
      }
    ]
  },
  "reloadAfterCookies": true
}
```

**Propriétés :**
- `credentials.cookies` (array) : Liste des cookies à définir
- `reloadAfterCookies` (boolean) : Recharger la page après avoir défini les cookies

**Propriétés communes :**
- `successSelector` (string, optionnel) : Sélecteur pour vérifier le succès du login
- `waitAfterLogin` (number) : Délai d'attente après le login (ms)

**Exemples d'utilisation :**

Voir les fichiers de configuration :
- `configs/examples/login-form-example.json` : Login par formulaire
- `configs/examples/login-token-example.json` : Login par token
- `configs/examples/login-cookies-example.json` : Login par cookies

---

## Gestion des sessions

### Configuration de session

```json
{
  "session": {
    "enabled": true,
    "name": "my-session",
    "persist": true,
    "restoreOnStart": true,
    "sessionDir": "./sessions"
  }
}
```

**Propriétés :**
- `enabled` (boolean) : Activer la gestion de session
- `name` (string) : Nom unique de la session
- `persist` (boolean) : Sauvegarder la session sur disque
- `restoreOnStart` (boolean) : Restaurer la session au démarrage
- `sessionDir` (string) : Dossier de stockage des sessions

### Utilisation dans les workflows

**Sauvegarder une session :**
```json
{
  "type": "extract",
  "config": {
    "type": "script",
    "script": "async (page, context) => { await context.sessionManager.saveSession('my-session', page); return { saved: true }; }"
  }
}
```

**Restaurer une session :**
```json
{
  "type": "extract",
  "config": {
    "type": "script",
    "script": "async (page, context) => { await context.sessionManager.restoreSession('my-session', page); return { restored: true }; }"
  }
}
```

Une session sauvegarde automatiquement :
- Les cookies
- Le localStorage
- Le sessionStorage
- L'URL actuelle
- Des métadonnées personnalisées

---

### 13. `form` - Remplissage de formulaire

Remplit automatiquement des formulaires complexes avec mapping intelligent des champs.

```json
{
  "type": "form",
  "config": {
    "formSelector": "#contact-form",
    "fields": {
      "firstName": {
        "selector": "#first-name",
        "value": "Jean",
        "type": "text"
      },
      "email": {
        "value": "jean@example.com",
        "type": "email"
      },
      "country": {
        "value": "FR",
        "type": "select"
      },
      "newsletter": {
        "value": true,
        "type": "checkbox"
      }
    },
    "submit": true,
    "submitSelector": "button[type='submit']",
    "waitAfterSubmit": 2000
  }
}
```

**Propriétés :**
- `formSelector` (string, optionnel) : Sélecteur du formulaire parent
- `fields` (object) : Map des champs à remplir
- `submit` (boolean) : Soumettre le formulaire après remplissage
- `submitSelector` (string) : Sélecteur du bouton submit
- `waitAfterSubmit` (number) : Délai après soumission (ms)
- `validateBefore` (boolean) : Valider avant submit

#### Configuration des champs

**Format simple (nom du champ = valeur) :**
```json
{
  "fields": {
    "username": "jean_dupont",
    "email": "jean@example.com",
    "age": "35"
  }
}
```

**Format détaillé avec options :**
```json
{
  "fields": {
    "username": {
      "selector": "[name='username']",
      "value": "jean_dupont",
      "type": "text",
      "wait": true,
      "timeout": 5000
    }
  }
}
```

**Propriétés de champ :**
- `selector` (string) : Sélecteur CSS (défaut: `[name="nom-du-champ"]`)
- `value` (any) : Valeur à remplir
- `type` (string) : Type de champ (défaut: `auto` = détection automatique)
- `wait` (boolean) : Attendre que le champ soit visible
- `timeout` (number) : Timeout d'attente

#### Types de champs supportés

| Type | Description | Exemple de valeur |
|------|-------------|-------------------|
| `text` | Champ texte | `"Bonjour"` |
| `email` | Email | `"user@example.com"` |
| `password` | Mot de passe | `"P@ssw0rd"` |
| `number` | Nombre | `"42"` |
| `tel` | Téléphone | `"0123456789"` |
| `url` | URL | `"https://example.com"` |
| `date` | Date | `"2026-01-20"` |
| `time` | Heure | `"14:30"` |
| `datetime-local` | Date et heure | `"2026-01-20T14:30"` |
| `textarea` | Zone de texte | `"Long texte..."` |
| `select` | Liste déroulante | `"option1"` ou `["opt1", "opt2"]` |
| `checkbox` | Case à cocher | `true` ou `false` |
| `radio` | Bouton radio | `"value"` |
| `file` | Upload fichier | `"./file.pdf"` ou `["file1.jpg", "file2.png"]` |

#### Exemples d'utilisation

**Formulaire de contact :**
```json
{
  "type": "form",
  "config": {
    "formSelector": "#contact-form",
    "fields": {
      "name": "Jean Dupont",
      "email": "jean@example.com",
      "subject": {
        "value": "Information",
        "type": "select"
      },
      "message": "Bonjour, je souhaite des informations.",
      "newsletter": {
        "value": true,
        "type": "checkbox"
      }
    },
    "submit": true,
    "waitAfterSubmit": 2000
  }
}
```

**Formulaire d'inscription avec upload :**
```json
{
  "type": "form",
  "config": {
    "fields": {
      "username": "jean_dupont",
      "email": "jean@example.com",
      "password": "SecureP@ss",
      "dateOfBirth": {
        "value": "1990-05-15",
        "type": "date"
      },
      "gender": {
        "selector": "input[name='gender']",
        "value": "male",
        "type": "radio"
      },
      "avatar": {
        "value": "./avatar.jpg",
        "type": "file"
      },
      "interests": {
        "selector": "input[name='interests[]']",
        "value": ["tech", "sports"],
        "type": "checkbox"
      }
    },
    "submit": true,
    "validateBefore": true
  }
}
```

**Sondage multi-pages :**
```json
{
  "type": "form",
  "config": {
    "fields": {
      "satisfaction": {
        "selector": "input[name='satisfaction']",
        "value": "5",
        "type": "radio"
      },
      "comments": {
        "value": "Très satisfait du service",
        "type": "textarea"
      }
    },
    "submit": true,
    "submitSelector": ".next-page-btn"
  }
}
```

**Voir aussi les exemples complets :**
- `configs/examples/form-contact-example.json`
- `configs/examples/form-registration-example.json`
- `configs/examples/form-survey-example.json`

---

## Extracteurs

### `text` - Texte

Extrait le texte d'un élément.

```json
{
  "type": "text",
  "selector": ".title",
  "method": "innerText",
  "trim": true,
  "saveAs": "title"
}
```

**Propriétés :**
- `method` (string) : `innerText` (visible) ou `textContent` (brut)
- `trim` (boolean) : Supprimer les espaces

---

### `attribute` - Attribut

Extrait un attribut HTML.

```json
{
  "type": "attribute",
  "selector": "a.link",
  "attribute": "href",
  "saveAs": "url"
}
```

---

### `html` - HTML

Extrait le code HTML.

```json
{
  "type": "html",
  "selector": ".content",
  "method": "innerHTML",
  "saveAs": "htmlContent"
}
```

**Méthodes :**
- `innerHTML` : Contenu interne
- `outerHTML` : Élément complet

---

### `list` - Liste

Extrait une liste d'éléments avec sous-champs.

```json
{
  "type": "list",
  "selector": ".product",
  "fields": [
    {
      "name": "title",
      "selector": ".title",
      "type": "text"
    },
    {
      "name": "price",
      "selector": ".price",
      "type": "text",
      "transform": {
        "type": "regex",
        "pattern": "\\d+\\.\\d+",
        "flags": "g"
      }
    },
    {
      "name": "url",
      "selector": "a",
      "type": "attribute",
      "attribute": "href"
    }
  ],
  "saveAs": "products"
}
```

**Transformations :**
- `regex` : Expression régulière
- `replace` : Remplacement de texte
- `split` : Découpage en tableau
- `trim` : Suppression des espaces

---

## Gestion des erreurs

### `errorHandling`

Configure la gestion des erreurs au niveau global.

```json
{
  "errorHandling": {
    "retries": 3,
    "retryDelay": 1000,
    "backoffMultiplier": 2,
    "continueOnError": false,
    "screenshotOnError": true,
    "screenshotPath": "./screenshots",
    "logErrors": true
  }
}
```

**Propriétés :**
- `retries` (number) : Nombre de tentatives
- `retryDelay` (number) : Délai initial entre tentatives (ms)
- `backoffMultiplier` (number) : Multiplicateur exponentiel du délai
- `continueOnError` (boolean) : Continuer si une action échoue
- `screenshotOnError` (boolean) : Capturer un screenshot lors des erreurs
- `screenshotPath` (string) : Dossier des screenshots
- `logErrors` (boolean) : Logger les erreurs

---

## Planification (Scheduler)

### `scheduling`

Configure l'exécution planifiée.

```json
{
  "scheduling": {
    "enabled": true,
    "cron": "0 */6 * * *",
    "timezone": "Europe/Paris",
    "runOnStart": false,
    "persistState": true,
    "stateFile": "./scheduler-state.json",
    "restartOnCrash": true,
    "maxHistorySize": 100
  }
}
```

**Propriétés :**
- `enabled` (boolean) : Activer le scheduler
- `cron` (string) : Expression cron (format standard)
- `timezone` (string) : Fuseau horaire (IANA timezone)
- `runOnStart` (boolean) : Exécuter immédiatement au démarrage
- `persistState` (boolean) : Sauvegarder l'état
- `stateFile` (string) : Fichier de sauvegarde
- `restartOnCrash` (boolean) : Redémarrer après un crash
- `maxHistorySize` (number) : Taille max de l'historique

**Exemples d'expressions cron :**
```
* * * * *          # Chaque minute
*/5 * * * *        # Toutes les 5 minutes
0 * * * *          # Chaque heure
0 */6 * * *        # Toutes les 6 heures
0 0 * * *          # Chaque jour à minuit
0 9 * * 1-5        # Jours ouvrés à 9h
0 0 1 * *          # Premier jour du mois à minuit
0 0 * * 0          # Chaque dimanche à minuit
```

---

## Export des données

### `output`

Configure l'export des données extraites.

```json
{
  "output": {
    "format": "json",
    "path": "./output/{{name}}-{{date}}.json",
    "append": false,
    "createPath": true,
    "columns": null
  }
}
```

**Propriétés :**
- `format` (string) : Format de sortie : `json` ou `csv`
- `path` (string) : Chemin du fichier (supporte templates)
- `append` (boolean) : Ajouter aux données existantes
- `createPath` (boolean) : Créer le dossier si inexistant
- `columns` (array) : Colonnes à exporter (pour filtrer/réordonner)

---

### Export JSON

```json
{
  "output": {
    "format": "json",
    "path": "./output/data.json",
    "pretty": true,
    "append": false
  }
}
```

**Propriétés :**
- `pretty` (boolean) : Formatage indenté (défaut: `true`)

---

### Export CSV

```json
{
  "output": {
    "format": "csv",
    "path": "./output/data.csv",
    "columns": ["title", "price", "url"],
    "csv": {
      "delimiter": ",",
      "quote": "\"",
      "escape": "\"",
      "includeHeaders": true,
      "encoding": "utf8"
    }
  }
}
```

**Propriétés CSV :**
- `delimiter` (string) : Délimiteur de colonnes (défaut: `,`)
- `quote` (string) : Caractère de quote (défaut: `"`)
- `escape` (string) : Caractère d'échappement (défaut: `"`)
- `includeHeaders` (boolean) : Inclure la ligne d'en-têtes (défaut: `true`)
- `encoding` (string) : Encodage du fichier (défaut: `utf8`)

**Sélection et réordonnancement de colonnes :**

```json
{
  "columns": [
    "title",
    "price",
    { "source": "productUrl", "target": "url" }
  ]
}
```

---

## Templating

Le système de templating permet d'utiliser des variables dynamiques dans les configurations.

### Syntaxe

```
{{variable}}
{{object.property}}
{{array[0]}}
{{nested.object.value}}
```

### Variables disponibles

| Variable | Description | Exemple |
|----------|-------------|---------|
| `{{target.url}}` | URL cible | `https://example.com` |
| `{{name}}` | Nom du scraper | `my-scraper` |
| `{{date}}` | Date actuelle (YYYY-MM-DD) | `2026-01-20` |
| `{{time}}` | Heure actuelle (HH-MM-SS) | `14-30-00` |
| `{{timestamp}}` | Timestamp Unix | `1737382200` |
| `{{datetime}}` | Date et heure (YYYY-MM-DD_HH-MM-SS) | `2026-01-20_14-30-00` |
| `{{pageNumber}}` | Numéro de page (pagination) | `1`, `2`, `3`... |

### Variables extraites

Toutes les données extraites avec `saveAs` sont accessibles :

```json
{
  "steps": [
    {
      "type": "extract",
      "config": {
        "selector": ".user-id",
        "type": "text",
        "saveAs": "userId"
      }
    },
    {
      "type": "navigate",
      "config": {
        "url": "https://example.com/user/{{userId}}"
      }
    }
  ]
}
```

### Exemples d'utilisation

**Nommage de fichiers :**
```json
{
  "output": {
    "path": "./output/{{name}}-{{date}}-{{time}}.json"
  }
}
```

**URLs dynamiques :**
```json
{
  "type": "navigate",
  "config": {
    "url": "{{target.baseUrl}}/page/{{pageNumber}}"
  }
}
```

**Headers API :**
```json
{
  "type": "api",
  "config": {
    "headers": {
      "Authorization": "Bearer {{authToken}}",
      "User-ID": "{{userId}}"
    }
  }
}
```

**Body de requête :**
```json
{
  "type": "api",
  "config": {
    "method": "POST",
    "body": {
      "userId": "{{userData.id}}",
      "action": "purchase",
      "items": "{{cart.items}}"
    }
  }
}
```

---

## Logging

### `logging`

Configure le système de logs.

```json
{
  "logging": {
    "level": "info",
    "console": true,
    "file": {
      "enabled": true,
      "path": "./logs/scraper.log",
      "maxSize": "10m",
      "maxFiles": 5,
      "compress": true
    },
    "format": "json",
    "colorize": true
  }
}
```

**Niveaux de log :**
- `error` : Erreurs seulement
- `warn` : Warnings et erreurs
- `info` : Informations générales (défaut)
- `debug` : Informations de débogage
- `verbose` : Très détaillé

**Propriétés :**
- `level` (string) : Niveau de log
- `console` (boolean) : Afficher dans la console
- `file.enabled` (boolean) : Logger dans un fichier
- `file.path` (string) : Chemin du fichier de log
- `file.maxSize` (string) : Taille max par fichier (`10m`, `1g`)
- `file.maxFiles` (number) : Nombre de fichiers à conserver
- `file.compress` (boolean) : Compresser les anciens logs
- `format` (string) : Format : `json` ou `text`
- `colorize` (boolean) : Couleurs dans la console

---

## Performance

### `performance`

Optimise les performances du scraping.

```json
{
  "performance": {
    "delayBetweenActions": 500,
    "maxConcurrency": 1,
    "resourceBlocking": {
      "enabled": true,
      "types": ["image", "font", "media", "stylesheet"]
    },
    "cacheEnabled": false,
    "javascriptEnabled": true
  }
}
```

**Propriétés :**
- `delayBetweenActions` (number) : Délai entre actions (ms)
- `maxConcurrency` (number) : Nombre de pages parallèles
- `resourceBlocking.enabled` (boolean) : Bloquer certaines ressources
- `resourceBlocking.types` (array) : Types à bloquer
- `cacheEnabled` (boolean) : Utiliser le cache du navigateur
- `javascriptEnabled` (boolean) : Activer JavaScript

**Types de ressources bloquables :**
- `image` : Images
- `font` : Polices
- `media` : Audio/vidéo
- `stylesheet` : CSS
- `script` : JavaScript
- `xhr` : Requêtes AJAX
- `fetch` : Fetch API
- `websocket` : WebSockets

---

## Validation JSON Schema

Tous les fichiers de configuration sont validés avec JSON Schema. Le schéma complet est disponible dans [`src/schemas/workflow.schema.json`](../src/schemas/workflow.schema.json).

Pour valider manuellement un fichier :

```javascript
const { validateConfig } = require('./src/utils/configLoader');

const config = require('./data/config.json');
const { valid, errors } = validateConfig(config);

if (!valid) {
  console.error('Erreurs de validation:', errors);
}
```

---

## Exemples complets

Consultez le dossier [`configs/examples/`](../configs/examples/) pour des exemples complets de configurations :

- `simple-navigation.json` - Navigation basique
- `pagination-click.json` - Pagination par clic
- `pagination-url.json` - Pagination par URL
- `pagination-scroll.json` - Scroll infini
- `api-request-example.json` - Requêtes API
- `workflow-with-loops.json` - Boucles
- `workflow-with-conditions.json` - Conditions
- `scheduled-config.json` - Exécution planifiée
- `error-handling-test.json` - Gestion d'erreurs

---

*Dernière mise à jour : 2026-01-20*
