# 🏗️ Architecture - Warstruck JS

Ce document présente la structure complète du projet, l'architecture technique et les détails de la refactorisation.

## 📁 Structure du Projet

```
WarstruckJS/
├── 📄 package.json              # Configuration monorepo (Turborepo + pnpm)
├── 📄 pnpm-workspace.yaml       # Configuration workspace
├── 📄 turbo.json                # Configuration Turborepo
├── 📄 docker-compose.yml        # MongoDB + Mongo Express
│
├── 📁 server/                   # Backend NestJS + Socket.IO
│   ├── 📄 package.json          # Scripts: dev, build, start
│   ├── 📄 tsconfig.json         # Configuration TypeScript
│   ├── 📄 nest-cli.json         # Configuration NestJS
│   │
│   └── 📁 src/
│       ├── 📄 main.ts           # Point d'entrée (CORS, pipes, filters)
│       ├── 📄 app.module.ts     # Module racine (imports globaux)
│       ├── 📄 health.controller.ts  # Health check endpoint
│       │
│       ├── 📁 config/           # Configuration
│       │   └── 📄 app.config.ts # Variables d'environnement
│       │
│       ├── 📁 common/           # Modules partagés
│       │   ├── 📁 filters/
│       │   │   └── 📄 http-exception.filter.ts  # Gestion erreurs
│       │   └── 📁 interceptors/
│       │       ├── 📄 logging.interceptor.ts    # Logging requêtes
│       │       └── 📄 transform.interceptor.ts  # Transformation réponses
│       │
│       └── 📁 game/             # Module de jeu
│           ├── 📄 game.module.ts
│           ├── 📄 game.controller.ts      # API REST
│           ├── 📄 game.service.ts         # Logique métier
│           ├── 📄 game-board.service.ts   # Logique plateau
│           ├── 📄 game-persistence.service.ts  # MongoDB
│           ├── 📄 game.gateway.ts         # WebSocket (Socket.IO)
│           │
│           ├── 📁 dto/                    # Data Transfer Objects
│           │   └── 📄 game.dto.ts
│           │
│           ├── 📁 interfaces/             # Types TypeScript
│           │   ├── 📄 game.interface.ts
│           │   └── 📄 game-history.interface.ts
│           │
│           └── 📁 schemas/                # MongoDB Schemas
│               └── 📄 game.schema.ts
│
├── 📁 web/                      # Frontend Next.js 14
│   ├── 📄 package.json
│   ├── 📄 next.config.mjs
│   ├── 📄 tsconfig.json
│   ├── 📄 postcss.config.cjs
│   │
│   ├── 📁 app/                  # App Router Next.js
│   │   ├── 📄 layout.tsx        # Layout principal
│   │   ├── 📄 page.tsx          # Page d'accueil
│   │   ├── 📄 globals.css
│   │   │
│   │   ├── 📁 components/       # Composants React
│   │   │   ├── 📄 GameBoard.tsx
│   │   │   ├── 📄 PieceCard.tsx
│   │   │   ├── 📄 PlayerInfo.tsx
│   │   │   ├── 📄 DeckSelection.tsx
│   │   │   ├── 📄 ReserveZone.tsx
│   │   │   └── 📄 SetupReinforcements.tsx
│   │   │
│   │   ├── 📁 game/             # Pages de jeu
│   │   │   ├── 📄 page.tsx      # Liste des parties
│   │   │   ├── 📁 [gameId]/
│   │   │   │   └── 📄 page.tsx  # Partie spécifique
│   │   │   └── 📁 history/
│   │   │       └── 📁 [gameId]/
│   │   │           └── 📄 page.tsx  # Historique/Replay
│   │   │
│   │   └── 📁 matchmaking/      # Matchmaking 1v1
│   │       └── 📄 page.tsx
│   │
│   └── 📁 lib/                  # Utilitaires
│       ├── 📄 gameData.ts       # Données des pièces/decks
│       ├── 📄 gameTypes.ts      # Types TypeScript
│       └── 📄 gameSocket.ts     # Client Socket.IO
│
└── 📁 docs/                     # Documentation
    ├── 📄 README.md             # Index principal
    ├── 📄 QUICKSTART.md         # Guide démarrage
    ├── 📄 ARCHITECTURE.md       # (ce fichier)
    ├── 📄 TECHNICAL_GUIDE.md    # Guide technique
    ├── 📄 BACKEND_SETUP.md      # Configuration backend
    └── 📄 IMPLEMENTATION.md     # Règles du jeu
```

## 🎯 Stack Technique

### Backend
- **Framework** : NestJS 10
- **WebSocket** : Socket.IO
- **Base de données** : MongoDB + Mongoose
- **Validation** : class-validator + class-transformer
- **Configuration** : @nestjs/config

### Frontend
- **Framework** : Next.js 14 (App Router)
- **UI** : Mantine UI v7
- **WebSocket Client** : Socket.IO Client
- **Styling** : CSS Modules + PostCSS

### DevOps
- **Monorepo** : Turborepo + pnpm workspaces
- **Conteneurisation** : Docker + Docker Compose (MongoDB)
- **TypeScript** : Strict mode activé

## 🔄 Refactorisation NestJS

### Objectifs Accomplis

✅ **Résolution du problème de démarrage** : L'API démarre avec `pnpm dev`  
✅ **Architecture professionnelle** : Structure selon les conventions NestJS  
✅ **Validation des données** : DTOs avec class-validator  
✅ **Gestion d'erreurs** : Filtre global d'exceptions  
✅ **Logging structuré** : Intercepteur de logging  
✅ **Configuration centralisée** : Variables d'environnement

### Avant / Après

#### Avant ❌
```
server/src/
├── main.ts (minimal)
├── app.module.ts (basique)
└── game/
    ├── game.controller.ts
    ├── game.service.ts
    ├── game-board.service.ts
    └── game.types.ts (tout mélangé)
```

#### Après ✅
```
server/src/
├── main.ts (pipes, filters, interceptors)
├── app.module.ts (ConfigModule)
├── health.controller.ts
├── common/ (filtres, intercepteurs)
├── config/ (configuration)
└── game/
    ├── dto/ (validation)
    ├── interfaces/ (types)
    ├── schemas/ (MongoDB)
    ├── *.controller.ts
    ├── *.service.ts
    └── *.gateway.ts (WebSocket)
```

### Améliorations Clés

#### 1. Validation Automatique

```typescript
// Avant
@Post('create')
createGame(@Body() body: any) { ... }

// Après
@Post('create')
createGame(@Body() createGameDto: CreateGameDto) { ... }
```

#### 2. Logging Structuré

```typescript
// Avant
console.log('Creating game...');

// Après
this.logger.log('Creating new game', 'GameService');
this.logger.error('Error creating game', error.stack, 'GameService');
```

#### 3. Gestion d'Erreurs

```typescript
// Filtre global qui formate toutes les erreurs
{
  "statusCode": 400,
  "timestamp": "2025-11-25T...",
  "path": "/game/create",
  "method": "POST",
  "message": "Validation failed"
}
```

## 🧩 Modules Principaux

### GameModule

**Responsabilité** : Gestion complète du jeu

**Composants** :
- `GameController` : API REST (HTTP)
- `GameGateway` : WebSocket (Socket.IO)
- `GameService` : Logique métier principale
- `GameBoardService` : Logique du plateau de jeu
- `GamePersistenceService` : Persistance MongoDB

**Endpoints REST** :
- `POST /game/create` - Créer une partie
- `GET /game/list` - Lister les parties
- `GET /game/:id` - Récupérer une partie
- `POST /game/:id/select-deck` - Sélectionner un deck
- `POST /game/:id/action` - Exécuter une action
- `GET /game/:id/history` - Historique complet

**Événements WebSocket** :
- `join-queue` - Rejoindre le matchmaking
- `match-found` - Match trouvé
- `game-updated` - État du jeu mis à jour
- `execute-action` - Exécuter une action
- `player-disconnected` - Joueur déconnecté

### CommonModule

**Responsabilité** : Fonctionnalités partagées

**Composants** :
- `HttpExceptionFilter` : Gestion globale des erreurs
- `LoggingInterceptor` : Log toutes les requêtes HTTP
- `TransformInterceptor` : Transforme les réponses

### ConfigModule

**Responsabilité** : Configuration centralisée

**Variables** :
```typescript
PORT=3001
MONGODB_URI=mongodb://localhost:27017/warstruck
NODE_ENV=development
```

## 🌊 Flux de Données

### Création et Jeu d'une Partie

```
Frontend                Backend                   MongoDB
   |                       |                         |
   |--POST /game/create--->|                         |
   |                       |--save game------------->|
   |<---{gameId}-----------|                         |
   |                       |                         |
   |--WS: join room------->|                         |
   |                       |                         |
   |--WS: select-deck----->|                         |
   |                       |--update game----------->|
   |<--WS: game-updated----|                         |
   |                       |                         |
   |--WS: execute-action-->|                         |
   |                       |--save action history--->|
   |<--WS: game-updated----|                         |
```

### Matchmaking 1v1

```
Joueur 1                Backend               Joueur 2
   |                       |                      |
   |--join-queue---------->|                      |
   |                    [Queue: J1]               |
   |                       |<-----join-queue------|
   |                  [Queue: J1, J2]             |
   |                       |                      |
   |                [Create Game]                 |
   |                       |                      |
   |<--match-found---------|------match-found---->|
```

## 🔐 Patterns et Bonnes Pratiques

### 1. Dependency Injection

```typescript
@Injectable()
export class GameService {
  constructor(
    private readonly gameBoardService: GameBoardService,
    private readonly persistenceService: GamePersistenceService,
  ) {}
}
```

### 2. DTOs pour Validation

```typescript
export class CreateGameDto {
  @IsOptional()
  @IsString()
  player1Name?: string;

  @IsOptional()
  @IsString()
  player2Name?: string;
}
```

### 3. Interfaces TypeScript Strictes

```typescript
export interface GameState {
  phase: GamePhase;
  board: BoardPiece[][];
  players: Record<PlayerId, Player>;
  currentPlayer: PlayerId;
  turnNumber: number;
}
```

### 4. Services Séparés par Responsabilité

- `GameService` : Orchestration
- `GameBoardService` : Logique métier du plateau
- `GamePersistenceService` : Base de données

## 📊 Base de Données MongoDB

### Schéma Game

```typescript
{
  gameId: string,           // UUID unique
  currentState: GameState,  // État complet actuel
  history: GameActionRecord[], // Historique des actions
  createdAt: Date,
  updatedAt: Date,
  phase: string,
  currentPlayer: string,
  turnNumber: number,
  winner?: string
}
```

### Index

```typescript
// Index sur gameId pour recherche rapide
gameSchema.index({ gameId: 1 }, { unique: true });

// Index sur phase pour filtrer les parties
gameSchema.index({ phase: 1 });

// Index sur createdAt pour tri
gameSchema.index({ createdAt: -1 });
```

## 🚀 Scripts Disponibles

### Monorepo (racine)

```powershell
pnpm dev           # Lance serveur + client en parallèle
pnpm build         # Build les deux projets
pnpm start         # Lance en production
```

### Backend (server/)

```powershell
pnpm dev           # Mode développement avec hot-reload
pnpm build         # Compilation TypeScript
pnpm start         # Production
pnpm test          # Tests unitaires
pnpm test:e2e      # Tests end-to-end
```

### Frontend (web/)

```powershell
pnpm dev           # Mode développement Next.js
pnpm build         # Build production
pnpm start         # Serveur production
pnpm lint          # ESLint
```

## 🔧 Configuration

### Variables d'Environnement

**Backend** (`server/.env`) :
```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/warstruck
NODE_ENV=development
```

**Frontend** (`web/.env.local`) :
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=http://localhost:3001
```

### CORS

Le backend autorise les requêtes depuis `http://localhost:3000` :

```typescript
app.enableCors({
  origin: 'http://localhost:3000',
  credentials: true,
});
```

## 📈 Évolutions Futures

### Court Terme
- [ ] Tests unitaires (Jest)
- [ ] Tests e2e (Playwright)
- [ ] CI/CD (GitHub Actions)
- [ ] Logging avancé (Winston)

### Moyen Terme
- [ ] Authentification (JWT)
- [ ] Système de classement
- [ ] Replay avec contrôles vidéo
- [ ] Mode spectateur

### Long Terme
- [ ] IA pour jouer contre l'ordinateur
- [ ] Tournois automatiques
- [ ] Statistiques avancées
- [ ] Mode mobile (React Native)

---

**Architecture maintenue et documentée pour Warstruck JS** 🏗️
