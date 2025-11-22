# 🎮 Warstruck - Structure du Projet

## 📁 Structure Complète

```
WarstruckJS/
├── 📄 package.json              # Configuration monorepo
├── 📄 pnpm-workspace.yaml       # Configuration pnpm workspace
├── 📄 turbo.json                # Configuration Turborepo
├── 📄 IMPLEMENTATION.md         # Règles du jeu
├── 📄 README.md                 # Documentation principale
├── 📄 REFACTORING.md           # 🆕 Récapitulatif de la refactorisation
│
├── 📁 server/                   # Backend NestJS
│   ├── 📄 package.json          # ✨ Scripts mis à jour (dev, build, start)
│   ├── 📄 tsconfig.json         # Configuration TypeScript
│   ├── 📄 README.md             # 🆕 Documentation du serveur
│   ├── 📄 API_TESTS.md          # 🆕 Guide de test de l'API
│   ├── 📄 .env.example          # 🆕 Variables d'environnement
│   │
│   └── 📁 src/
│       ├── 📄 main.ts           # ✨ Point d'entrée (pipes, filters, interceptors)
│       ├── 📄 app.module.ts     # ✨ Module racine (ConfigModule ajouté)
│       │
│       ├── 📁 common/           # 🆕 Modules partagés
│       │   ├── 📁 filters/
│       │   │   └── 📄 http-exception.filter.ts
│       │   └── 📁 interceptors/
│       │       ├── 📄 logging.interceptor.ts
│       │       └── 📄 transform.interceptor.ts
│       │
│       ├── 📁 config/           # 🆕 Configuration
│       │   └── 📄 app.config.ts
│       │
│       └── 📁 game/             # Module de jeu
│           ├── 📄 game.module.ts
│           ├── 📄 game.controller.ts      # ✨ Amélioré avec DTOs
│           ├── 📄 game.service.ts         # ✨ Logger ajouté
│           ├── 📄 game-board.service.ts   # ✨ Logger ajouté
│           │
│           ├── 📁 dto/          # 🆕 Data Transfer Objects
│           │   └── 📄 game.dto.ts
│           │
│           ├── 📁 entities/     # 🆕 Entités (préparées pour DB)
│           │
│           └── 📁 interfaces/   # 🆕 Interfaces TypeScript
│               └── 📄 game.interface.ts
│
└── 📁 web/                      # Frontend Next.js
    ├── 📄 package.json
    ├── 📄 next.config.mjs
    ├── 📄 tsconfig.json
    ├── 📄 postcss.config.cjs
    │
    └── 📁 app/
        ├── 📄 layout.tsx
        ├── 📄 page.tsx
        ├── 📄 globals.css
        │
        ├── 📁 components/
        │   ├── 📄 GameBoard.tsx
        │   ├── 📄 PieceCard.tsx
        │   └── 📄 PlayerInfo.tsx
        │
        ├── 📁 game/
        │   └── 📄 page.tsx
        │
        └── 📁 lib/
            ├── 📄 gameData.ts
            └── 📄 gameTypes.ts
```

## 🎯 Rôle de chaque dossier

### Backend (server/)

#### `src/common/`
Contient les modules partagés utilisés dans toute l'application :
- **filters/** : Gestion globale des erreurs et exceptions
- **interceptors/** : Logging, transformation des réponses, etc.

#### `src/config/`
Configuration centralisée de l'application :
- Port du serveur
- Configuration CORS
- Variables d'environnement

#### `src/game/`
Module principal du jeu :
- **dto/** : Validation des données entrantes (DTOs)
- **entities/** : Modèles de données (prêt pour base de données)
- **interfaces/** : Types TypeScript
- **Controllers** : Gestion des routes HTTP
- **Services** : Logique métier

### Frontend (web/)

#### `app/`
Application Next.js 14 avec App Router :
- **components/** : Composants React réutilisables
- **game/** : Page du jeu
- **lib/** : Utilitaires et types

## 🔄 Flux de développement

### 1. Démarrage
```bash
# À la racine
pnpm dev
```
Lance automatiquement :
- ✅ Backend NestJS sur http://localhost:3001
- ✅ Frontend Next.js sur http://localhost:3000

### 2. Architecture

```
┌─────────────────────┐
│   Browser (3000)    │
│   Next.js App       │
└──────────┬──────────┘
           │
           │ HTTP Requests
           ▼
┌─────────────────────┐
│   Server (3001)     │
│   NestJS API        │
├─────────────────────┤
│  Controllers        │ ← Routes HTTP
│  ↓                  │
│  Services           │ ← Logique métier
│  ↓                  │
│  In-Memory Store    │ ← Stockage temporaire
└─────────────────────┘
```

### 3. Requêtes API

```
Frontend (Next.js)
    ↓
    fetch('/api/game/...')
    ↓
Backend (NestJS)
    ↓
    ValidationPipe (valide les DTOs)
    ↓
    Controller (route la requête)
    ↓
    Service (traite la logique)
    ↓
    LoggingInterceptor (log la requête)
    ↓
    Response (JSON)
```

## 🛠️ Technologies

### Backend
- **NestJS** : Framework Node.js progressif
- **TypeScript** : Typage statique
- **class-validator** : Validation des données
- **class-transformer** : Transformation des objets
- **@nestjs/config** : Gestion de la configuration
- **uuid** : Génération d'identifiants uniques

### Frontend
- **Next.js 14** : Framework React avec App Router
- **React 18** : Interface utilisateur
- **TypeScript** : Typage statique
- **Tailwind CSS** : Styling

### DevOps
- **pnpm** : Gestionnaire de packages
- **Turborepo** : Orchestration du monorepo
- **ts-node** : Exécution TypeScript
- **node --watch** : Hot reload

## 📚 Documentation

- **README.md** : Vue d'ensemble du projet
- **IMPLEMENTATION.md** : Règles détaillées du jeu
- **REFACTORING.md** : Changelog de la refactorisation
- **server/README.md** : Documentation du backend
- **server/API_TESTS.md** : Guide de test de l'API

## 🚀 Commandes disponibles

### Monorepo (racine)
| Commande | Description |
|----------|-------------|
| `pnpm dev` | Lance web + server en développement |
| `pnpm build` | Build les deux projets |
| `pnpm start` | Lance en production |
| `pnpm lint` | Lint tous les projets |

### Server
| Commande | Description |
|----------|-------------|
| `pnpm dev` | Mode développement avec hot reload |
| `pnpm build` | Compilation TypeScript → JavaScript |
| `pnpm start` | Démarre l'API compilée |
| `pnpm start:dev` | Alternative au mode dev |

### Web
| Commande | Description |
|----------|-------------|
| `pnpm dev` | Next.js en mode développement |
| `pnpm build` | Build optimisé pour production |
| `pnpm start` | Démarre le build production |

## ✨ Points clés de la refactorisation

1. ✅ **Séparation des préoccupations** : DTOs, Services, Controllers séparés
2. ✅ **Validation automatique** : class-validator sur toutes les entrées
3. ✅ **Logging structuré** : Intercepteur pour tracer toutes les requêtes
4. ✅ **Gestion d'erreurs** : Filtre global pour formater les erreurs
5. ✅ **Configuration centralisée** : Variables d'environnement et config
6. ✅ **Hot reload** : Développement rapide avec rechargement automatique
7. ✅ **Scripts optimisés** : dev, build, start pour tous les environnements
8. ✅ **Documentation complète** : README pour chaque partie du projet
