# Generic Scraper Backend

Backend API pour Generic Scraper V2

## 🚀 Démarrage rapide

### Installation

```bash
npm install
```

### Configuration

Copier le fichier `.env.example` vers `.env` et ajuster les valeurs :

```bash
cp .env.example .env
```

### Développement

```bash
npm run dev
```

Le serveur démarre sur `http://localhost:4000`

### Production

```bash
# Build
npm run build

# Start
npm start
```

## 📁 Structure du projet

```
backend/
├── src/
│   ├── routes/              # Routes API REST
│   ├── controllers/         # Logique métier
│   ├── services/            # Services (scraper, config...)
│   ├── middlewares/         # Middlewares Express
│   ├── websocket/           # Gestion WebSocket
│   ├── types/               # Types TypeScript
│   ├── utils/               # Utilitaires
│   ├── app.ts               # Configuration Express
│   ├── config.ts            # Configuration de l'application
│   └── index.ts             # Point d'entrée
├── dist/                    # Fichiers compilés
├── package.json
├── tsconfig.json
├── Dockerfile
└── .env.example
```

## 🔌 API Endpoints

### Health Check

```
GET /api/health
```

Retourne le statut du serveur.

### Info

```
GET /api/info
```

Retourne les informations de l'API.

## 🐳 Docker

### Build

```bash
docker build -t generic-scraper-backend .
```

### Run

```bash
docker run -p 4000:4000 \
  -v $(pwd)/../configs:/app/configs \
  -v $(pwd)/../logs:/app/logs \
  -v $(pwd)/../output:/app/output \
  -v $(pwd)/../data:/app/data \
  generic-scraper-backend
```

## 📝 Variables d'environnement

| Variable | Description | Défaut |
|----------|-------------|--------|
| `NODE_ENV` | Environnement (development/production) | `development` |
| `PORT` | Port du serveur | `4000` |
| `HOST` | Host du serveur | `0.0.0.0` |
| `DATABASE_PATH` | Chemin de la base SQLite | `../data/scraper.db` |
| `CORS_ORIGIN` | Origine CORS autorisée | `http://localhost:3000` |
| `LOG_LEVEL` | Niveau de log (debug/info/warn/error) | `info` |

## 🧪 Tests

```bash
npm test
```

## 📄 License

MIT
