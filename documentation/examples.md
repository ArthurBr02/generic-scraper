# Exemples d'utilisation - Generic Scraper

Ce document présente des cas d'usage courants avec des exemples complets et commentés.

## Table des matières

1. [Scraping simple](#1-scraping-simple)
2. [Extraction de listes](#2-extraction-de-listes)
3. [Pagination](#3-pagination)
4. [Navigation multi-pages](#4-navigation-multi-pages)
5. [Formulaires et authentification](#5-formulaires-et-authentification)
6. [Requêtes API](#6-requêtes-api)
7. [Workflows avancés](#7-workflows-avancés)
8. [Gestion d'erreurs](#8-gestion-derreurs)
9. [Exécution planifiée](#9-exécution-planifiée)
10. [Export de données](#10-export-de-données)

---

## 1. Scraping simple

### Extraire le titre d'une page

**Cas d'usage :** Récupérer le titre principal d'une page web.

```json
{
  "name": "simple-title-scraper",
  "target": {
    "url": "https://example.com"
  },
  "browser": {
    "headless": true,
    "timeout": 30000
  },
  "workflow": {
    "steps": [
      {
        "id": "step-1",
        "name": "Navigation vers la page",
        "type": "navigate",
        "config": {
          "url": "{{target.url}}",
          "waitUntil": "networkidle"
        }
      },
      {
        "id": "step-2",
        "name": "Extraction du titre",
        "type": "extract",
        "config": {
          "selector": "h1",
          "type": "text",
          "saveAs": "pageTitle"
        }
      }
    ]
  },
  "output": {
    "format": "json",
    "path": "./output/title.json"
  }
}
```

**Résultat :**
```json
{
  "pageTitle": "Example Domain"
}
```

---

### Extraire plusieurs informations

**Cas d'usage :** Récupérer titre, description et image d'un article.

```json
{
  "name": "article-scraper",
  "target": {
    "url": "https://blog.example.com/article-123"
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
          "selector": ".article-title",
          "type": "text",
          "saveAs": "title"
        }
      },
      {
        "type": "extract",
        "config": {
          "selector": ".article-content",
          "type": "text",
          "saveAs": "content"
        }
      },
      {
        "type": "extract",
        "config": {
          "selector": ".article-image",
          "type": "attribute",
          "attribute": "src",
          "saveAs": "imageUrl"
        }
      },
      {
        "type": "extract",
        "config": {
          "selector": ".author-name",
          "type": "text",
          "saveAs": "author"
        }
      },
      {
        "type": "extract",
        "config": {
          "selector": ".publish-date",
          "type": "text",
          "saveAs": "publishDate"
        }
      }
    ]
  },
  "output": {
    "format": "json",
    "path": "./output/article.json"
  }
}
```

---

## 2. Extraction de listes

### Liste de produits

**Cas d'usage :** Scraper une liste de produits avec nom, prix et lien.

```json
{
  "name": "products-list-scraper",
  "target": {
    "url": "https://shop.example.com/products"
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
          "selector": ".product-card",
          "type": "list",
          "fields": [
            {
              "name": "name",
              "selector": ".product-name",
              "type": "text"
            },
            {
              "name": "price",
              "selector": ".product-price",
              "type": "text",
              "transform": {
                "type": "regex",
                "pattern": "[0-9]+\\.?[0-9]*",
                "flags": "g"
              }
            },
            {
              "name": "url",
              "selector": ".product-link",
              "type": "attribute",
              "attribute": "href"
            },
            {
              "name": "image",
              "selector": ".product-image",
              "type": "attribute",
              "attribute": "src"
            },
            {
              "name": "inStock",
              "selector": ".in-stock",
              "type": "text",
              "default": "false"
            }
          ],
          "saveAs": "products"
        }
      }
    ]
  },
  "output": {
    "format": "csv",
    "path": "./output/products-{{date}}.csv",
    "columns": ["name", "price", "url", "inStock"]
  }
}
```

**Résultat CSV :**
```csv
name,price,url,inStock
"Product 1",29.99,"https://shop.example.com/product-1",true
"Product 2",49.99,"https://shop.example.com/product-2",true
"Product 3",19.99,"https://shop.example.com/product-3",false
```

---

### Liste imbriquée (sous-listes)

**Cas d'usage :** Extraire des catégories avec leurs produits.

```json
{
  "workflow": {
    "steps": [
      {
        "type": "navigate",
        "config": {
          "url": "https://shop.example.com"
        }
      },
      {
        "type": "extract",
        "config": {
          "selector": ".category",
          "type": "list",
          "fields": [
            {
              "name": "categoryName",
              "selector": ".category-title",
              "type": "text"
            },
            {
              "name": "products",
              "selector": ".product",
              "type": "list",
              "fields": [
                {
                  "name": "name",
                  "selector": ".product-name",
                  "type": "text"
                },
                {
                  "name": "price",
                  "selector": ".product-price",
                  "type": "text"
                }
              ]
            }
          ],
          "saveAs": "categories"
        }
      }
    ]
  }
}
```

---

### Capturer l'URL de la page courante

**Cas d'usage :** Récupérer l'URL de la page visitée (utile dans les loops).

```json
{
  "name": "page-url-scraper",
  "workflow": {
    "steps": [
      {
        "type": "navigate",
        "config": {
          "url": "https://example.com/article-123"
        }
      },
      {
        "type": "extract",
        "config": {
          "fields": [
            {
              "name": "url",
              "type": "pageUrl"
            },
            {
              "name": "title",
              "selector": "h1",
              "type": "text"
            },
            {
              "name": "content",
              "selector": ".article-content",
              "type": "text"
            }
          ],
          "saveAs": "article"
        }
      }
    ]
  },
  "output": {
    "format": "json",
    "path": "./output/article-with-url.json"
  }
}
```

**Résultat :**
```json
{
  "article": {
    "url": "https://example.com/article-123",
    "title": "Mon Article",
    "content": "Contenu de l'article..."
  }
}
```

---

## 3. Pagination

### Pagination par clic (bouton "Suivant")

**Cas d'usage :** Parcourir toutes les pages en cliquant sur "Suivant".

```json
{
  "name": "pagination-click-scraper",
  "target": {
    "url": "https://books.toscrape.com"
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
        "id": "extract-books",
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
            },
            {
              "name": "availability",
              "selector": ".availability",
              "type": "text"
            }
          ],
          "saveAs": "books"
        }
      },
      {
        "type": "pagination",
        "config": {
          "type": "click",
          "nextSelector": ".next a",
          "maxPages": 10,
          "waitAfterClick": 2000,
          "repeatSteps": ["extract-books"]
        }
      }
    ]
  },
  "output": {
    "format": "json",
    "path": "./output/books-all-pages.json",
    "append": true
  }
}
```

---

### Pagination par URL

**Cas d'usage :** Parcourir des pages avec URLs numérotées.

```json
{
  "name": "pagination-url-scraper",
  "target": {
    "url": "https://example.com/products"
  },
  "workflow": {
    "steps": [
      {
        "id": "extract-products",
        "type": "extract",
        "config": {
          "selector": ".product",
          "type": "list",
          "fields": [
            {
              "name": "name",
              "selector": ".name",
              "type": "text"
            }
          ],
          "saveAs": "products"
        }
      },
      {
        "type": "pagination",
        "config": {
          "type": "url",
          "urlPattern": "https://example.com/products?page={{pageNumber}}",
          "startPage": 1,
          "maxPages": 20,
          "waitAfterNavigation": 1000,
          "repeatSteps": ["extract-products"]
        }
      }
    ]
  },
  "output": {
    "format": "json",
    "path": "./output/products-all.json",
    "append": true
  }
}
```

---

### Scroll infini

**Cas d'usage :** Scraper un site avec chargement infini (infinite scroll).

```json
{
  "name": "infinite-scroll-scraper",
  "target": {
    "url": "https://social-media.example.com/feed"
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
        "id": "extract-posts",
        "type": "extract",
        "config": {
          "selector": ".post",
          "type": "list",
          "fields": [
            {
              "name": "author",
              "selector": ".author-name",
              "type": "text"
            },
            {
              "name": "content",
              "selector": ".post-content",
              "type": "text"
            },
            {
              "name": "timestamp",
              "selector": ".post-time",
              "type": "text"
            }
          ],
          "saveAs": "posts"
        }
      },
      {
        "type": "pagination",
        "config": {
          "type": "scroll",
          "scrollDelay": 2000,
          "maxScrolls": 50,
          "detectEnd": true,
          "detectEndSelector": ".no-more-posts",
          "repeatSteps": ["extract-posts"]
        }
      }
    ]
  },
  "output": {
    "format": "json",
    "path": "./output/social-feed-{{datetime}}.json"
  }
}
```

---

### Pagination puis détails (pattern complet)

**Cas d'usage :** Parcourir une liste paginée, puis visiter chaque élément pour extraire les détails complets.

```json
{
  "name": "pagination-then-loop-scraper",
  "target": {
    "url": "https://jobs.example.com/listings"
  },
  "browser": {
    "headless": false,
    "timeout": 30000
  },
  "workflows": [
    {
      "name": "main-workflow",
      "steps": [
        {
          "type": "navigate",
          "config": {
            "url": "{{target.url}}",
            "waitUntil": "networkidle"
          }
        },
        {
          "name": "Accepter les cookies",
          "type": "click",
          "continueOnError": true,
          "config": {
            "selector": ".cookie-accept",
            "waitAfterClick": 1000
          }
        },
        {
          "id": "extract-urls",
          "type": "extract",
          "config": {
            "container": ".job-listing",
            "multiple": true,
            "fields": [
              {
                "name": "url",
                "selector": ".job-link",
                "type": "attribute",
                "attribute": "href"
              }
            ]
          }
        },
        {
          "type": "pagination",
          "output": "jobUrls",
          "config": {
            "type": "click",
            "nextSelector": ".pagination .next",
            "maxPages": 5,
            "waitAfterClick": 2000,
            "waitForSelector": ".job-listing",
            "repeatSteps": ["extract-urls"]
          }
        },
        {
          "type": "loop",
          "output": "jobDetails",
          "config": {
            "items": "jobUrls",
            "itemVar": "job",
            "steps": [
              {
                "type": "navigate",
                "config": {
                  "url": "https://jobs.example.com{{job.url}}",
                  "waitUntil": "load"
                }
              },
              {
                "type": "wait",
                "config": {
                  "type": "selector",
                  "selector": "h1.job-title"
                }
              },
              {
                "type": "extract",
                "output": "details",
                "config": {
                  "fields": [
                    {
                      "name": "url",
                      "type": "pageUrl"
                    },
                    {
                      "name": "title",
                      "selector": "h1.job-title",
                      "type": "text"
                    },
                    {
                      "name": "company",
                      "selector": ".company-name",
                      "type": "text"
                    },
                    {
                      "name": "location",
                      "selector": ".job-location",
                      "type": "text"
                    },
                    {
                      "name": "salary",
                      "selector": ".salary-range",
                      "type": "text"
                    },
                    {
                      "name": "description",
                      "selector": ".job-description",
                      "type": "text"
                    },
                    {
                      "name": "posted_date",
                      "selector": ".post-date",
                      "type": "text"
                    }
                  ]
                }
              }
            ]
          }
        }
      ]
    }
  ],
  "output": {
    "format": "json",
    "path": "./output/jobs-complete.json"
  }
}
```

**Résultat :**
```json
{
  "jobUrls": [
    { "url": "/job/123" },
    { "url": "/job/456" },
    { "url": "/job/789" }
  ],
  "jobDetails": [
    {
      "url": "https://jobs.example.com/job/123",
      "title": "Senior Developer",
      "company": "Tech Corp",
      "location": "Paris, France",
      "salary": "60-80k €",
      "description": "...",
      "posted_date": "2026-01-15"
    },
    {
      "url": "https://jobs.example.com/job/456",
      "title": "Frontend Engineer",
      "company": "Startup Inc",
      "location": "Lyon, France",
      "salary": "45-55k €",
      "description": "...",
      "posted_date": "2026-01-18"
    }
  ]
}
```

**Points clés :**
- La pagination collecte tous les URLs sur plusieurs pages
- La loop visite ensuite chaque URL individuellement
- Le type `pageUrl` capture l'URL complète de chaque page visitée
- L'`output: "details"` dans l'extraction permet de récupérer directement les données
- Le résultat est un tableau d'objets avec tous les détails

---

## 4. Navigation multi-pages

### Visiter chaque produit individuellement

**Cas d'usage :** Extraire une liste, puis visiter chaque élément pour plus de détails.

```json
{
  "name": "multi-page-product-scraper",
  "workflow": {
    "steps": [
      {
        "type": "navigate",
        "config": {
          "url": "https://shop.example.com/products"
        }
      },
      {
        "type": "extract",
        "config": {
          "selector": ".product-card a",
          "type": "list",
          "fields": [
            {
              "name": "url",
              "type": "attribute",
              "attribute": "href"
            }
          ],
          "saveAs": "productUrls"
        }
      },
      {
        "type": "loop",
        "config": {
          "array": "{{productUrls}}",
          "itemName": "product",
          "maxIterations": 50,
          "steps": [
            {
              "type": "navigate",
              "config": {
                "url": "{{product.url}}"
              }
            },
            {
              "type": "extract",
              "config": {
                "selector": ".product-title",
                "type": "text",
                "saveAs": "currentProduct.name"
              }
            },
            {
              "type": "extract",
              "config": {
                "selector": ".product-description",
                "type": "text",
                "saveAs": "currentProduct.description"
              }
            },
            {
              "type": "extract",
              "config": {
                "selector": ".product-price",
                "type": "text",
                "saveAs": "currentProduct.price"
              }
            }
          ]
        }
      }
    ]
  },
  "output": {
    "format": "json",
    "path": "./output/detailed-products.json"
  }
}
```

---

### Sous-workflow réutilisable

**Cas d'usage :** Définir un workflow réutilisable pour extraire des détails de produit.

```json
{
  "name": "subworkflow-example",
  "workflow": {
    "steps": [
      {
        "type": "navigate",
        "config": {
          "url": "https://shop.example.com/products"
        }
      },
      {
        "type": "extract",
        "config": {
          "selector": ".product-id",
          "type": "list",
          "fields": [
            {
              "name": "id",
              "selector": ".id",
              "type": "text"
            }
          ],
          "saveAs": "productIds"
        }
      },
      {
        "type": "loop",
        "config": {
          "array": "{{productIds}}",
          "itemName": "product",
          "steps": [
            {
              "type": "subWorkflow",
              "config": {
                "name": "extractProductDetails",
                "params": {
                  "productId": "{{product.id}}"
                }
              }
            }
          ]
        }
      }
    ],
    "subWorkflows": {
      "extractProductDetails": {
        "steps": [
          {
            "type": "navigate",
            "config": {
              "url": "https://shop.example.com/product/{{params.productId}}"
            }
          },
          {
            "type": "extract",
            "config": {
              "selector": ".product-name",
              "type": "text",
              "saveAs": "name"
            }
          },
          {
            "type": "extract",
            "config": {
              "selector": ".product-specs",
              "type": "html",
              "saveAs": "specs"
            }
          },
          {
            "type": "extract",
            "config": {
              "selector": ".reviews",
              "type": "list",
              "fields": [
                {
                  "name": "rating",
                  "selector": ".rating",
                  "type": "text"
                },
                {
                  "name": "comment",
                  "selector": ".comment",
                  "type": "text"
                }
              ],
              "saveAs": "reviews"
            }
          }
        ]
      }
    }
  }
}
```

---

## 5. Formulaires et authentification

### Connexion à un site

**Cas d'usage :** Se connecter avant de scraper des données protégées.

```json
{
  "name": "authenticated-scraper",
  "target": {
    "url": "https://example.com"
  },
  "workflow": {
    "steps": [
      {
        "name": "Aller à la page de connexion",
        "type": "navigate",
        "config": {
          "url": "https://example.com/login"
        }
      },
      {
        "name": "Remplir le formulaire de connexion",
        "type": "input",
        "config": {
          "selector": "#username",
          "value": "my-username",
          "method": "fill"
        }
      },
      {
        "type": "input",
        "config": {
          "selector": "#password",
          "value": "my-password",
          "method": "fill"
        }
      },
      {
        "name": "Soumettre le formulaire",
        "type": "click",
        "config": {
          "selector": "#login-button"
        }
      },
      {
        "name": "Attendre la redirection",
        "type": "wait",
        "config": {
          "type": "navigation"
        }
      },
      {
        "name": "Vérifier la connexion",
        "type": "wait",
        "config": {
          "type": "selector",
          "selector": ".logged-in-indicator",
          "timeout": 5000
        }
      },
      {
        "name": "Naviguer vers les données",
        "type": "navigate",
        "config": {
          "url": "https://example.com/dashboard"
        }
      },
      {
        "name": "Extraire les données",
        "type": "extract",
        "config": {
          "selector": ".user-data",
          "type": "text",
          "saveAs": "userData"
        }
      }
    ]
  }
}
```

---

### Remplir un formulaire de recherche

**Cas d'usage :** Effectuer une recherche et extraire les résultats.

```json
{
  "name": "search-scraper",
  "workflow": {
    "steps": [
      {
        "type": "navigate",
        "config": {
          "url": "https://example.com"
        }
      },
      {
        "name": "Accepter les cookies",
        "type": "click",
        "continueOnError": true,
        "config": {
          "selector": ".cookie-accept"
        }
      },
      {
        "name": "Saisir le terme de recherche",
        "type": "input",
        "config": {
          "selector": "#search-input",
          "value": "laptop",
          "method": "type",
          "delay": 50
        }
      },
      {
        "name": "Cliquer sur rechercher",
        "type": "click",
        "config": {
          "selector": "#search-button"
        }
      },
      {
        "name": "Attendre les résultats",
        "type": "wait",
        "config": {
          "type": "selector",
          "selector": ".search-results"
        }
      },
      {
        "name": "Extraire les résultats",
        "type": "extract",
        "config": {
          "selector": ".result-item",
          "type": "list",
          "fields": [
            {
              "name": "title",
              "selector": ".title",
              "type": "text"
            },
            {
              "name": "link",
              "selector": "a",
              "type": "attribute",
              "attribute": "href"
            }
          ],
          "saveAs": "searchResults"
        }
      }
    ]
  }
}
```

---

## 6. Requêtes API

### Combiner scraping et API

**Cas d'usage :** Récupérer un token via API, puis l'utiliser pour scraper.

```json
{
  "name": "api-then-scraping",
  "workflow": {
    "steps": [
      {
        "name": "Récupérer le token API",
        "type": "api",
        "config": {
          "method": "POST",
          "url": "https://api.example.com/auth/token",
          "headers": {
            "Content-Type": "application/json"
          },
          "body": {
            "username": "api-user",
            "password": "api-password"
          },
          "responseType": "json",
          "saveAs": "authResponse"
        }
      },
      {
        "name": "Récupérer les données utilisateur",
        "type": "api",
        "config": {
          "method": "GET",
          "url": "https://api.example.com/user/profile",
          "headers": {
            "Authorization": "Bearer {{authResponse.token}}"
          },
          "responseType": "json",
          "saveAs": "userProfile"
        }
      },
      {
        "name": "Naviguer vers la page du profil",
        "type": "navigate",
        "config": {
          "url": "https://example.com/user/{{userProfile.id}}"
        }
      },
      {
        "type": "extract",
        "config": {
          "selector": ".profile-details",
          "type": "text",
          "saveAs": "profileDetails"
        }
      }
    ]
  }
}
```

---

### API avec pagination

**Cas d'usage :** Paginer via API pour récupérer toutes les données.

```json
{
  "name": "api-pagination",
  "workflow": {
    "steps": [
      {
        "type": "loop",
        "config": {
          "array": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
          "itemName": "page",
          "steps": [
            {
              "type": "api",
              "config": {
                "method": "GET",
                "url": "https://api.example.com/items?page={{page}}&limit=100",
                "headers": {
                  "Accept": "application/json"
                },
                "responseType": "json",
                "saveAs": "pageData"
              }
            }
          ]
        }
      }
    ]
  },
  "output": {
    "format": "json",
    "path": "./output/api-all-pages.json",
    "append": true
  }
}
```

---

## 7. Workflows avancés

### Conditions (if/else)

**Cas d'usage :** Vérifier si un élément existe avant d'agir.

```json
{
  "workflow": {
    "steps": [
      {
        "type": "navigate",
        "config": {
          "url": "https://example.com"
        }
      },
      {
        "type": "condition",
        "config": {
          "if": {
            "selector": ".cookie-banner",
            "exists": true
          },
          "then": [
            {
              "type": "click",
              "config": {
                "selector": ".accept-cookies"
              }
            }
          ]
        }
      },
      {
        "type": "condition",
        "config": {
          "if": {
            "selector": ".logged-in",
            "exists": true
          },
          "then": [
            {
              "type": "navigate",
              "config": {
                "url": "/dashboard"
              }
            }
          ],
          "else": [
            {
              "type": "navigate",
              "config": {
                "url": "/login"
              }
            }
          ]
        }
      }
    ]
  }
}
```

---

### Boucles imbriquées

**Cas d'usage :** Parcourir des catégories, puis chaque produit.

```json
{
  "workflow": {
    "steps": [
      {
        "type": "navigate",
        "config": {
          "url": "https://shop.example.com"
        }
      },
      {
        "type": "extract",
        "config": {
          "selector": ".category-link",
          "type": "list",
          "fields": [
            {
              "name": "url",
              "type": "attribute",
              "attribute": "href"
            },
            {
              "name": "name",
              "type": "text"
            }
          ],
          "saveAs": "categories"
        }
      },
      {
        "type": "loop",
        "config": {
          "array": "{{categories}}",
          "itemName": "category",
          "steps": [
            {
              "type": "navigate",
              "config": {
                "url": "{{category.url}}"
              }
            },
            {
              "type": "extract",
              "config": {
                "selector": ".product",
                "type": "list",
                "fields": [
                  {
                    "name": "productUrl",
                    "selector": "a",
                    "type": "attribute",
                    "attribute": "href"
                  }
                ],
                "saveAs": "products"
              }
            },
            {
              "type": "loop",
              "config": {
                "array": "{{products}}",
                "itemName": "product",
                "maxIterations": 10,
                "steps": [
                  {
                    "type": "navigate",
                    "config": {
                      "url": "{{product.productUrl}}"
                    }
                  },
                  {
                    "type": "extract",
                    "config": {
                      "selector": ".product-name",
                      "type": "text",
                      "saveAs": "productDetails.name"
                    }
                  }
                ]
              }
            }
          ]
        }
      }
    ]
  }
}
```

---

## 8. Gestion d'erreurs

### Configuration avec retry et screenshots

**Cas d'usage :** Gérer les erreurs avec retry et capture d'écran.

```json
{
  "name": "error-handling-example",
  "errorHandling": {
    "retries": 5,
    "retryDelay": 2000,
    "backoffMultiplier": 2,
    "continueOnError": false,
    "screenshotOnError": true,
    "screenshotPath": "./screenshots"
  },
  "workflow": {
    "steps": [
      {
        "type": "navigate",
        "timeout": 60000,
        "retry": {
          "retries": 3,
          "delay": 5000,
          "screenshotOnError": true
        },
        "config": {
          "url": "https://slow-website.example.com"
        }
      },
      {
        "type": "click",
        "continueOnError": true,
        "config": {
          "selector": ".optional-popup-close"
        }
      },
      {
        "type": "extract",
        "timeout": 10000,
        "config": {
          "selector": ".data",
          "type": "text",
          "saveAs": "data"
        }
      }
    ]
  }
}
```

---

### Continue on error pour éléments optionnels

**Cas d'usage :** Ignorer les erreurs pour des éléments qui peuvent être absents.

```json
{
  "workflow": {
    "steps": [
      {
        "type": "navigate",
        "config": {
          "url": "https://example.com"
        }
      },
      {
        "name": "Fermer popup (optionnel)",
        "type": "click",
        "continueOnError": true,
        "config": {
          "selector": ".popup-close"
        }
      },
      {
        "name": "Accepter cookies (optionnel)",
        "type": "click",
        "continueOnError": true,
        "config": {
          "selector": ".cookie-accept"
        }
      },
      {
        "name": "Données obligatoires",
        "type": "extract",
        "continueOnError": false,
        "config": {
          "selector": ".required-data",
          "type": "text",
          "saveAs": "data"
        }
      }
    ]
  }
}
```

---

## 9. Exécution planifiée

### Scraping quotidien

**Cas d'usage :** Scraper automatiquement chaque jour à 9h.

```json
{
  "name": "daily-scraper",
  "scheduling": {
    "enabled": true,
    "cron": "0 9 * * *",
    "timezone": "Europe/Paris",
    "runOnStart": false,
    "persistState": true,
    "stateFile": "./scheduler-state.json"
  },
  "workflow": {
    "steps": [
      {
        "type": "navigate",
        "config": {
          "url": "https://news.example.com"
        }
      },
      {
        "type": "extract",
        "config": {
          "selector": ".article",
          "type": "list",
          "fields": [
            {
              "name": "title",
              "selector": ".title",
              "type": "text"
            },
            {
              "name": "url",
              "selector": "a",
              "type": "attribute",
              "attribute": "href"
            }
          ],
          "saveAs": "articles"
        }
      }
    ]
  },
  "output": {
    "format": "json",
    "path": "./output/news-{{date}}.json"
  }
}
```

**Lancement :**
```bash
npm run start -- --config daily-scraper.json --schedule
```

---

### Surveillance toutes les heures

**Cas d'usage :** Surveiller les prix toutes les heures.

```json
{
  "name": "price-monitor",
  "scheduling": {
    "enabled": true,
    "cron": "0 * * * *",
    "timezone": "Europe/Paris",
    "persistState": true,
    "restartOnCrash": true,
    "maxHistorySize": 100
  },
  "workflow": {
    "steps": [
      {
        "type": "navigate",
        "config": {
          "url": "https://shop.example.com/product-123"
        }
      },
      {
        "type": "extract",
        "config": {
          "selector": ".current-price",
          "type": "text",
          "saveAs": "price"
        }
      }
    ]
  },
  "output": {
    "format": "json",
    "path": "./output/price-history.json",
    "append": true
  }
}
```

---

## 10. Export de données

### Export CSV avec colonnes spécifiques

**Cas d'usage :** Exporter uniquement certaines colonnes dans un ordre précis.

```json
{
  "workflow": {
    "steps": [
      {
        "type": "extract",
        "config": {
          "selector": ".product",
          "type": "list",
          "fields": [
            { "name": "id", "selector": ".id", "type": "text" },
            { "name": "name", "selector": ".name", "type": "text" },
            { "name": "price", "selector": ".price", "type": "text" },
            { "name": "description", "selector": ".desc", "type": "text" },
            { "name": "category", "selector": ".cat", "type": "text" },
            { "name": "brand", "selector": ".brand", "type": "text" }
          ],
          "saveAs": "products"
        }
      }
    ]
  },
  "output": {
    "format": "csv",
    "path": "./output/products-{{date}}.csv",
    "columns": ["id", "name", "price", "brand"],
    "csv": {
      "delimiter": ";",
      "includeHeaders": true,
      "encoding": "utf8"
    }
  }
}
```

---

### Mode append (ajout aux données existantes)

**Cas d'usage :** Ajouter de nouvelles données à un fichier existant.

```json
{
  "output": {
    "format": "json",
    "path": "./output/cumulative-data.json",
    "append": true,
    "pretty": true
  }
}
```

---

### Nommage dynamique avec templates

**Cas d'usage :** Créer un fichier différent pour chaque exécution.

```json
{
  "output": {
    "format": "json",
    "path": "./output/{{name}}-{{date}}-{{time}}.json"
  }
}
```

**Résultat :** `output/my-scraper-2026-01-20-14-30-00.json`

---

### Exemple : Différence entre `saveAs` et `output` 💡

**Cas d'usage :** Comprendre quand utiliser `saveAs` (données intermédiaires) vs `output` (données finales).

#### ❌ Mauvais exemple : tout en `output`

```json
{
  "workflows": [
    {
      "name": "main",
      "steps": [
        {
          "id": "extract-urls",
          "type": "extract",
          "config": {
            "container": ".product",
            "multiple": true,
            "fields": [
              { "name": "url", "selector": "a", "type": "attribute", "attribute": "href" }
            ]
          }
        },
        {
          "type": "pagination",
          "config": {
            "type": "click",
            "nextSelector": ".next",
            "maxPages": 5,
            "repeatSteps": ["extract-urls"]
          },
          "output": "productUrls"  // ❌ Mauvais : URLs exportées inutilement
        },
        {
          "type": "loop",
          "config": {
            "items": "productUrls",
            "itemVar": "product",
            "steps": [
              {
                "type": "navigate",
                "config": { "url": "{{product.url}}" }
              },
              {
                "type": "extract",
                "config": {
                  "fields": [
                    { "name": "title", "selector": ".title", "type": "text" },
                    { "name": "price", "selector": ".price", "type": "text" }
                  ]
                },
                "output": "products"  // ✅ Bon : données finales
              }
            ]
          }
        }
      ]
    }
  ]
}
```

**Résultat dans `output/data.json` :**
```json
{
  "productUrls": [  // ❌ Polue le fichier avec des URLs inutiles
    { "url": "/product/1" },
    { "url": "/product/2" },
    { "url": "/product/3" }
  ],
  "products": [  // ✅ Les vraies données qu'on veut
    { "title": "Produit 1", "price": "29.99€" },
    { "title": "Produit 2", "price": "39.99€" },
    { "title": "Produit 3", "price": "49.99€" }
  ]
}
```

#### ✅ Bon exemple : `saveAs` pour intermédiaire, `output` pour final

```json
{
  "workflows": [
    {
      "name": "main",
      "steps": [
        {
          "id": "extract-urls",
          "type": "extract",
          "config": {
            "container": ".product",
            "multiple": true,
            "fields": [
              { "name": "url", "selector": "a", "type": "attribute", "attribute": "href" }
            ]
          }
        },
        {
          "type": "pagination",
          "config": {
            "type": "click",
            "nextSelector": ".next",
            "maxPages": 5,
            "repeatSteps": ["extract-urls"]
          },
          "saveAs": "productUrls"  // ✅ Bon : stocké en interne seulement
        },
        {
          "type": "loop",
          "config": {
            "items": "productUrls",
            "itemVar": "product",
            "steps": [
              {
                "type": "navigate",
                "config": { "url": "{{product.url}}" }
              },
              {
                "type": "extract",
                "config": {
                  "fields": [
                    { "name": "title", "selector": ".title", "type": "text" },
                    { "name": "price", "selector": ".price", "type": "text" }
                  ]
                },
                "output": "products"  // ✅ Bon : données finales exportées
              }
            ]
          }
        }
      ]
    }
  ]
}
```

**Résultat dans `output/data.json` :**
```json
{
  "products": [  // ✅ Seulement les données utiles
    { "title": "Produit 1", "price": "29.99€" },
    { "title": "Produit 2", "price": "39.99€" },
    { "title": "Produit 3", "price": "49.99€" }
  ]
}
```

**Avantages :**
- ✅ Fichier de sortie propre et concis
- ✅ Seulement les données utiles exportées
- ✅ URLs disponibles en interne pour le workflow
- ✅ Meilleure performance (moins de données à sérialiser)

---

### Exemple : Pagination avec `saveAs` et `output`

**Cas d'usage :** Collecter des URLs via pagination (non exportées) puis extraire les détails complets (exportés).

```json
{
  "name": "job-listings-scraper",
  "target": {
    "url": "https://jobs-site.com/listings"
  },
  "workflows": [
    {
      "name": "main",
      "steps": [
        {
          "type": "navigate",
          "config": {
            "url": "{{target.url}}"
          }
        },
        {
          "id": "extract-urls",
          "type": "extract",
          "config": {
            "container": ".job-item",
            "multiple": true,
            "fields": [
              {
                "name": "url",
                "selector": "a.job-link",
                "type": "attribute",
                "attribute": "href"
              }
            ]
          }
        },
        {
          "type": "pagination",
          "config": {
            "type": "click",
            "nextSelector": ".next-page",
            "maxPages": 5,
            "waitAfterClick": 2000,
            "repeatSteps": ["extract-urls"]
          },
          "saveAs": "jobUrls"
        },
        {
          "type": "loop",
          "config": {
            "items": "jobUrls",
            "itemVar": "job",
            "steps": [
              {
                "type": "navigate",
                "config": {
                  "url": "https://jobs-site.com{{job.url}}"
                }
              },
              {
                "type": "extract",
                "config": {
                  "fields": [
                    {
                      "name": "url",
                      "type": "pageUrl"
                    },
                    {
                      "name": "title",
                      "selector": ".job-title",
                      "type": "text"
                    },
                    {
                      "name": "company",
                      "selector": ".company-name",
                      "type": "text"
                    },
                    {
                      "name": "location",
                      "selector": ".location",
                      "type": "text"
                    },
                    {
                      "name": "salary",
                      "selector": ".salary",
                      "type": "text"
                    },
                    {
                      "name": "description",
                      "selector": ".description",
                      "type": "text"
                    }
                  ]
                }
              }
            ]
          },
          "output": "jobs"
        }
      ]
    }
  ],
  "output": {
    "format": "csv",
    "path": "./output/jobs-{{date}}.csv"
  }
}
```

**Résultat CSV :**
```csv
url,title,company,location,salary,description
https://jobs-site.com/job/123,Developer,Tech Corp,Paris,50k-60k,Full description...
https://jobs-site.com/job/124,Designer,Design Co,Lyon,45k-55k,Full description...
```

✅ Les URLs intermédiaires (`saveAs: "jobUrls"`) ne sont PAS exportées  
✅ Seuls les détails complets (`output: "jobs"`) sont dans le CSV

---

## Bonnes pratiques

### 1. Distinction entre `saveAs` et `output`

**Utilisez `saveAs` pour les données intermédiaires** (non exportées) :
- URLs collectées pour navigation ultérieure
- Tokens d'authentification
- IDs de pagination
- Données temporaires de calcul

```json
{
  "type": "pagination",
  "config": {
    "type": "click",
    "nextSelector": ".next",
    "repeatSteps": ["extract-urls"]
  },
  "saveAs": "productUrls"
}
```

**Utilisez `output` pour les données finales** (exportées) :
- Données principales à sauvegarder
- Résultats du scraping
- Contenu pour JSON/CSV

```json
{
  "type": "extract",
  "config": {
    "fields": [...]
  },
  "output": "products"
}
```

### 2. Gérer les pop-ups et cookies

Toujours ajouter un step pour fermer les pop-ups en début de workflow :

```json
{
  "type": "click",
  "continueOnError": true,
  "config": {
    "selector": ".cookie-accept, .popup-close, .modal-close"
  }
}
```

### 3. Attentes appropriées

Ajouter des attentes entre les actions pour la stabilité :

```json
{
  "type": "wait",
  "config": {
    "type": "networkidle"
  }
}
```

### 4. Logs pour le debug

Augmenter le niveau de log pendant le développement :

```json
{
  "logging": {
    "level": "debug",
    "console": true
  }
}
```

### 5. Mode headless=false pour tester

Désactiver headless pour voir ce qui se passe :

```json
{
  "browser": {
    "headless": false,
    "slowMo": 500
  }
}
```

### 6. Screenshots on error

Toujours activer les screenshots d'erreur :

```json
{
  "errorHandling": {
    "screenshotOnError": true,
    "screenshotPath": "./screenshots"
  }
}
```

---

## Ressources

- [Guide de configuration](configuration.md) - Documentation complète des paramètres
- [Plan d'implémentation](plan.md) - Architecture et détails techniques
- [Exemples configs](../configs/examples/) - Fichiers de configuration prêts à l'emploi

---

*Dernière mise à jour : 2026-01-20*
