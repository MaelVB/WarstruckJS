# Warstruck Server

Backend NestJS pour le jeu de plateau tactique Warstruck.

## 🏗️ Structure du Projet

```
server/
├── src/
│   ├── common/                 # Modules partagés
│   │   ├── filters/           # Filtres d'exception globaux
│   │   └── interceptors/      # Intercepteurs (logging, transformation)
│   ├── config/                # Configuration de l'application
│   ├── game/                  # Module de jeu principal
│   │   ├── dto/              # Data Transfer Objects (validation)
│   │   ├── entities/         # Entités du domaine
│   │   ├── interfaces/       # Interfaces TypeScript
│   │   ├── game.controller.ts
│   │   ├── game.service.ts
│   │   ├── game-board.service.ts
│   │   └── game.module.ts
│   ├── app.module.ts         # Module racine
│   └── main.ts               # Point d'entrée
├── package.json
└── tsconfig.json
```

## 🚀 Démarrage

### Développement

```bash
# Installer les dépendances
pnpm install

# Démarrer en mode développement
pnpm dev
```

### Production

```bash
# Build
pnpm build

# Démarrer
pnpm start
```

## 📡 API Endpoints

### Configuration du Jeu

- `GET /game/config` - Récupérer la configuration du jeu (règles, pièces, etc.)

### Gestion des Parties

- `POST /game/create` - Créer une nouvelle partie
- `GET /game/:gameId` - Récupérer l'état d'une partie
- `POST /game/:gameId/place-general` - Placer le général (phase setup)
- `POST /game/:gameId/setup-reinforcements` - Configurer les renforts (phase setup)
- `POST /game/:gameId/start` - Démarrer la partie
- `POST /game/:gameId/action` - Exécuter une action de jeu

## 🛠️ Technologies

- **NestJS** - Framework Node.js progressif
- **TypeScript** - Typage statique
- **class-validator** - Validation des DTOs
- **class-transformer** - Transformation des données
- **uuid** - Génération d'identifiants uniques

## 🔧 Configuration

Variables d'environnement disponibles :

- `PORT` - Port du serveur (défaut: 3001)
- `NODE_ENV` - Environnement (development/production)
- `CORS_ORIGIN` - Origine CORS autorisée (défaut: http://localhost:3000)

## 📝 Conventions de Code

- **Controllers** : Gestion des routes HTTP
- **Services** : Logique métier
- **DTOs** : Validation des entrées
- **Interfaces** : Typage des données
- **Filters** : Gestion des exceptions
- **Interceptors** : Logging et transformation des réponses

## 🧪 Tests

```bash
# Tests unitaires
pnpm test

# Tests e2e
pnpm test:e2e

# Coverage
pnpm test:cov
```

## 📖 Documentation

Pour plus d'informations sur les règles du jeu, consultez le fichier `IMPLEMENTATION.md` à la racine du monorepo.
