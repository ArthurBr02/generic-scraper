# 🐳 Guide de déploiement Docker - Generic Scraper V2

Ce guide explique comment déployer Generic Scraper V2 avec Docker et Docker Compose.

## 📋 Prérequis

- Docker Engine 20.10+
- Docker Compose 2.0+
- 2 GB RAM minimum
- 5 GB espace disque

## 🚀 Démarrage rapide

### 1. Cloner le projet

```bash
git clone <repository-url>
cd generic-scraper
```

### 2. Configuration des variables d'environnement (optionnel)

```bash
# Copier le fichier d'exemple
cp .env.example .env

# Éditer si nécessaire
# Les valeurs par défaut fonctionnent pour un déploiement local
```

### 3. Lancer l'application

```bash
# Construire et démarrer tous les services
docker-compose up -d

# Voir les logs
docker-compose logs -f

# Arrêter les services
docker-compose down
```

### 4. Accéder à l'application

- **Frontend** : http://localhost:3000
- **Backend API** : http://localhost:4000
- **Health Check** : http://localhost:4000/api/health

## 📦 Services

### Frontend (Vue.js)
- **Port** : 3000
- **Image** : Node.js 20 Alpine + Nginx Alpine
- **Build** : Multi-stage (build + production)

### Backend (Express)
- **Port** : 4000
- **Image** : Node.js 20 Alpine
- **Build** : Multi-stage (build + production)
- **Volumes** :
  - `./configs` → `/app/configs` (Configurations de scraping)
  - `./logs` → `/app/logs` (Logs d'exécution)
  - `./output` → `/app/output` (Données extraites)
  - `./data` → `/app/data` (Base de données SQLite)
  - `./src` → `/app/src` (Moteur de scraping)

## 🔧 Commandes utiles

### Gestion des services

```bash
# Démarrer les services
docker-compose up -d

# Arrêter les services
docker-compose down

# Redémarrer un service
docker-compose restart backend
docker-compose restart frontend

# Voir les logs
docker-compose logs -f
docker-compose logs -f backend
docker-compose logs -f frontend

# Voir le statut
docker-compose ps
```

### Rebuild et mise à jour

```bash
# Reconstruire les images
docker-compose build

# Reconstruire sans cache
docker-compose build --no-cache

# Reconstruire et redémarrer
docker-compose up -d --build
```

### Accès aux conteneurs

```bash
# Shell dans le backend
docker-compose exec backend sh

# Shell dans le frontend
docker-compose exec frontend sh

# Exécuter une commande dans le backend
docker-compose exec backend npm run lint
```

### Gestion des volumes

```bash
# Lister les volumes
docker volume ls

# Inspecter un volume
docker volume inspect generic-scraper_data

# Supprimer les volumes (⚠️ perte de données)
docker-compose down -v
```

## 🔍 Debugging

### Vérifier la santé des services

```bash
# Health check du backend
curl http://localhost:4000/api/health

# Informations de l'API
curl http://localhost:4000/api/info
```

### Logs détaillés

```bash
# Logs avec timestamps
docker-compose logs -f --timestamps

# Dernières 100 lignes
docker-compose logs --tail=100
```

### Problèmes courants

#### Le frontend ne se connecte pas au backend

1. Vérifier que le backend est démarré :
   ```bash
   docker-compose ps
   ```

2. Vérifier les variables d'environnement :
   ```bash
   docker-compose exec frontend env | grep VITE
   ```

3. Vérifier la configuration CORS du backend

#### Erreur de build

```bash
# Nettoyer et reconstruire
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

#### Problème de permissions sur les volumes

```bash
# Sur Linux/Mac, ajuster les permissions
sudo chown -R $USER:$USER ./configs ./logs ./output ./data
```

## 🌐 Déploiement en production

### 1. Modifier les variables d'environnement

```bash
# .env
NODE_ENV=production
VITE_API_URL=https://api.votre-domaine.com
VITE_WS_URL=wss://api.votre-domaine.com
CORS_ORIGIN=https://votre-domaine.com
LOG_LEVEL=warn
```

### 2. Utiliser un reverse proxy (Nginx/Traefik)

Exemple de configuration Nginx :

```nginx
server {
    listen 80;
    server_name votre-domaine.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

server {
    listen 80;
    server_name api.votre-domaine.com;

    location / {
        proxy_pass http://localhost:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /socket.io {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### 3. Sauvegardes automatiques

```bash
# Script de backup (backup.sh)
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
tar -czf backup_$DATE.tar.gz ./data ./configs ./output
```

## 📊 Monitoring

### Ressources utilisées

```bash
# Statistiques en temps réel
docker stats

# Espace disque des images
docker system df
```

### Health checks

Les services incluent des health checks automatiques :
- Backend : vérifie `/api/health` toutes les 30s
- Frontend : vérifie la disponibilité de nginx toutes les 30s

## 🧹 Nettoyage

```bash
# Arrêter et supprimer les conteneurs
docker-compose down

# Supprimer aussi les volumes (⚠️ perte de données)
docker-compose down -v

# Nettoyer les images non utilisées
docker image prune -a

# Nettoyage complet du système Docker
docker system prune -a --volumes
```

## 📝 Notes

- Les volumes sont persistants et conservent les données entre les redémarrages
- Le moteur de scraping existant (`./src`) est monté en volume pour permettre les modifications à chaud
- Les logs sont accessibles dans `./logs` même après l'arrêt des conteneurs
- La base de données SQLite est dans `./data/scraper.db`

## 🆘 Support

Pour plus d'informations :
- Documentation complète : `./documentation/plan_v2.md`
- Backend README : `./backend/README.md`
- Frontend README : `./frontend/README.md`
