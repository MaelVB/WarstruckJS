# 🔧 Guide Technique - Warstruck JS

Ce document décrit les fonctionnalités avancées du projet : système multijoueur, gestion de l'historique, et système de replay.

## 📑 Table des Matières

1. [Système 1v1 en Temps Réel](#système-1v1-en-temps-réel)
2. [Gestion des Parties avec UUID](#gestion-des-parties)
3. [Historique et Replay](#historique-et-replay)
4. [Guide d'Utilisation](#guide-dutilisation)

---

## 🎮 Système 1v1 en Temps Réel

### Vue d'Ensemble

Le système multijoueur utilise **Socket.IO** pour synchroniser deux joueurs en temps réel.

**Fonctionnalités** :
- ✅ Matchmaking automatique avec file d'attente
- ✅ Communication instantanée via WebSocket
- ✅ Chat intégré entre joueurs
- ✅ Gestion des déconnexions
- ✅ Synchronisation automatique de l'état du jeu

### Architecture WebSocket

#### Backend : GameGateway

**Fichier** : `server/src/game/game.gateway.ts`

Le `GameGateway` gère toutes les communications WebSocket :

```typescript
@WebSocketGateway({ cors: { origin: 'http://localhost:3000' } })
export class GameGateway {
  @WebSocketServer()
  server: Server;

  // File d'attente pour le matchmaking
  private matchmakingQueue: Map<string, QueuedPlayer>;
  
  // Associations socket <-> joueur
  private connectedPlayers: Map<string, PlayerConnection>;
}
```

**Événements gérés** :
- `join-queue` - Rejoindre la file d'attente
- `leave-queue` - Quitter la file
- `select-deck` - Sélectionner son deck
- `setup-reinforcements` - Configurer les renforts
- `start-game` - Démarrer la partie
- `execute-action` - Effectuer une action de jeu
- `send-message` - Envoyer un message de chat

#### Frontend : GameSocketClient

**Fichier** : `web/lib/gameSocket.ts`

Client TypeScript pour communiquer avec le serveur :

```typescript
import { GameSocketClient } from '@/lib/gameSocket';

// Connexion
const socket = new GameSocketClient('http://localhost:3001');
await socket.connect();

// Rejoindre la file d'attente
socket.joinQueue('PlayerName');

// Écouter les événements
socket.onMatchFound((data) => {
  console.log('Match trouvé!', data.gameId);
});

socket.onGameUpdated((state) => {
  console.log('Jeu mis à jour', state);
});

// Exécuter une action
socket.executeAction({
  gameId: 'abc-123',
  playerId: 'player1',
  action: {
    type: 'move',
    from: { row: 7, col: 3 },
    to: { row: 6, col: 3 }
  }
});
```

### Flux de Jeu Multijoueur

#### 1. Matchmaking

```
Joueur 1                  Serveur                Joueur 2
   |                         |                        |
   |---join-queue----------->|                        |
   |                    [Queue: J1]                   |
   |<--queue-joined----------|                        |
   |                         |<------join-queue-------|
   |                    [Queue: J1, J2]               |
   |                         |-------queue-joined---->|
   |                         |                        |
   |                   [Create Game]                  |
   |                         |                        |
   |<--match-found-----------|-------match-found----->|
   |    {gameId, playerId}   |   {gameId, playerId}  |
```

#### 2. Sélection des Decks

```
Joueur 1                  Serveur                Joueur 2
   |                         |                        |
   |---select-deck---------->|                        |
   |   [19 pièces]           |                        |
   |<--game-updated----------|                        |
   |                         |<------select-deck------|
   |                         |       [19 pièces]      |
   |<--game-updated----------|-------game-updated---->|
   |    [Phase: setup]       |       [Phase: setup]   |
```

#### 3. Phase de Jeu

```
Joueur 1                  Serveur                Joueur 2
   |                         |                        |
   |---execute-action------->|                        |
   |   {type: 'move'}        |                        |
   |                    [Valide action]               |
   |                    [Update état]                 |
   |<--game-updated----------|-------game-updated---->|
   |                         |                        |
```

### Événements Socket.IO

#### Événements Client → Serveur

| Événement | Payload | Description |
|-----------|---------|-------------|
| `join-queue` | `{ playerName: string }` | Rejoindre le matchmaking |
| `leave-queue` | - | Quitter le matchmaking |
| `select-deck` | `{ gameId, playerId, selectedPieces }` | Choisir son deck |
| `setup-reinforcements` | `{ gameId, playerId, pieceIds }` | Configurer les renforts |
| `start-game` | `{ gameId }` | Démarrer la partie |
| `execute-action` | `{ gameId, playerId, action }` | Effectuer une action |
| `send-message` | `{ gameId, message }` | Envoyer un message |

#### Événements Serveur → Client

| Événement | Payload | Description |
|-----------|---------|-------------|
| `queue-joined` | `{ position: number }` | Confirmation d'entrée en queue |
| `match-found` | `{ gameId, playerId, role, opponent }` | Match trouvé |
| `game-updated` | `GameState` | État du jeu mis à jour |
| `phase-changed` | `{ phase: string }` | Changement de phase |
| `game-started` | `GameState` | Partie démarrée |
| `game-finished` | `{ winner: string }` | Partie terminée |
| `player-disconnected` | `{ playerId }` | Joueur déconnecté |
| `message-received` | `{ from, message }` | Message reçu |

---

## 🗃️ Gestion des Parties

### UUID Uniques

Chaque partie possède un identifiant unique (UUID v4) généré automatiquement :

```typescript
import { v4 as uuidv4 } from 'uuid';

const gameId = uuidv4(); // ex: "550e8400-e29b-41d4-a716-446655440000"
```

**Avantages** :
- URL unique pour chaque partie : `/game/{uuid}`
- Partage de lien facile entre joueurs
- Persistance après rafraîchissement (F5)

### Persistance MongoDB

**Fichier** : `server/src/game/game-persistence.service.ts`

```typescript
@Injectable()
export class GamePersistenceService {
  // Sauvegarder une partie
  async saveGame(gameId: string, gameState: GameState): Promise<void> {
    await this.gameModel.findOneAndUpdate(
      { gameId },
      { currentState: gameState, updatedAt: new Date() },
      { upsert: true }
    );
  }

  // Récupérer une partie
  async getGame(gameId: string): Promise<GameState | null> {
    const game = await this.gameModel.findOne({ gameId });
    return game?.currentState || null;
  }

  // Lister toutes les parties
  async listGames(): Promise<GameInfo[]> {
    const games = await this.gameModel.find().sort({ createdAt: -1 });
    return games.map(game => ({
      gameId: game.gameId,
      phase: game.phase,
      turnNumber: game.turnNumber,
      createdAt: game.createdAt
    }));
  }
}
```

### Schéma MongoDB

**Fichier** : `server/src/game/schemas/game.schema.ts`

```typescript
@Schema()
export class Game {
  @Prop({ required: true, unique: true })
  gameId: string;

  @Prop({ type: Object, required: true })
  currentState: GameState;

  @Prop({ type: [Object], default: [] })
  history: GameActionRecord[];

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;

  @Prop()
  phase: string;

  @Prop()
  winner?: string;
}
```

---

## 📜 Historique et Replay

### Enregistrement des Actions

Chaque action effectuée est enregistrée avec :
- **ID unique** (UUID)
- **Timestamp** précis
- **Numéro du tour**
- **Joueur** ayant effectué l'action
- **Type d'action** (move, attack, deploy, etc.)
- **État AVANT** l'action
- **État APRÈS** l'action

```typescript
interface GameActionRecord {
  actionId: string;
  timestamp: Date;
  turnNumber: number;
  playerId: PlayerId;
  action: GameAction;
  stateBefore: GameState;
  stateAfter: GameState;
}
```

### Enregistrement Automatique

**Dans `GameService`** :

```typescript
async executeAction(
  gameId: string,
  playerId: PlayerId,
  action: GameAction
): Promise<GameState> {
  const stateBefore = await this.getGame(gameId);
  
  // Exécuter l'action
  const stateAfter = this.gameBoardService.executeAction(
    stateBefore,
    playerId,
    action
  );
  
  // Enregistrer dans l'historique
  await this.persistenceService.addActionToHistory(gameId, {
    actionId: uuidv4(),
    timestamp: new Date(),
    turnNumber: stateBefore.turnNumber,
    playerId,
    action,
    stateBefore,
    stateAfter
  });
  
  return stateAfter;
}
```

### Système de Replay

#### Backend API

**Endpoints** :

```typescript
// Récupérer l'historique complet
GET /game/:gameId/history
→ Response: GameActionRecord[]

// Récupérer l'historique filtré par tour
GET /game/:gameId/history?turn=5
→ Response: GameActionRecord[]

// Récupérer une action spécifique
GET /game/:gameId/history/:actionId
→ Response: GameActionRecord
```

#### Frontend

**Page d'historique** : `web/app/game/history/[gameId]/page.tsx`

```typescript
export default function HistoryPage({ params }: { params: { gameId: string } }) {
  const [history, setHistory] = useState<GameActionRecord[]>([]);
  const [selectedAction, setSelectedAction] = useState<GameActionRecord | null>(null);
  const [turnFilter, setTurnFilter] = useState<number | null>(null);

  // Charger l'historique
  useEffect(() => {
    fetch(`/api/game/${params.gameId}/history`)
      .then(res => res.json())
      .then(data => setHistory(data));
  }, [params.gameId]);

  return (
    <div>
      {/* Timeline des actions */}
      <ActionTimeline
        actions={history}
        onSelectAction={setSelectedAction}
        turnFilter={turnFilter}
      />

      {/* Plateau en mode lecture seule */}
      <GameBoard
        gameState={selectedAction?.stateAfter}
        readOnly
      />
    </div>
  );
}
```

---

## 📘 Guide d'Utilisation

### Créer une Partie

**Méthode 1 : Interface Web**
1. Aller sur http://localhost:3000
2. Cliquer sur "Nouvelle partie"
3. Vous êtes redirigé vers `/game/{uuid}`

**Méthode 2 : API REST**
```powershell
curl -X POST http://localhost:3001/game/create -H "Content-Type: application/json" -d "{}"
```

### Rejoindre une Partie

**Méthode 1 : URL Directe**
```
http://localhost:3000/game/550e8400-e29b-41d4-a716-446655440000
```

**Méthode 2 : Matchmaking**
1. Aller sur http://localhost:3000/matchmaking
2. Entrer votre nom
3. Cliquer sur "Join Queue"
4. Attendre qu'un adversaire rejoigne

### Reprendre après F5

1. Vous jouez sur `/game/{uuid}`
2. Appuyez sur **F5** (rafraîchissement)
3. La page se recharge
4. L'état est automatiquement récupéré depuis MongoDB
5. Continuez à jouer !

### Consulter l'Historique

**Depuis la liste des parties** :
1. Aller sur http://localhost:3000/game
2. Trouver la partie dans la liste
3. Cliquer sur "Historique"

**Depuis une partie en cours** :
1. Dans `/game/{uuid}`
2. Cliquer sur "Voir l'historique"

**Navigation** :
- Cliquez sur une action dans la timeline
- Le plateau affiche l'état à ce moment précis
- Utilisez le filtre par tour pour navigation rapide

### Rejouer une Partie

1. Ouvrir l'historique : `/game/history/{uuid}`
2. Voir toutes les actions dans la colonne de gauche
3. Cliquer sur n'importe quelle action
4. Le plateau affiche l'état correspondant
5. Naviguez librement entre les actions

**Filtrage** :
- Sélecteur "Filtrer par tour"
- Choisir un tour (1, 2, 3, etc.)
- Voir uniquement les actions de ce tour

---

## 🔍 Débogage

### WebSocket

**Voir les événements dans la console** :

```typescript
// Activer les logs détaillés
const socket = new GameSocketClient('http://localhost:3001', {
  debug: true
});
```

**Vérifier la connexion** :

```typescript
socket.on('connect', () => {
  console.log('✅ Connecté au serveur WebSocket');
});

socket.on('disconnect', () => {
  console.log('❌ Déconnecté du serveur');
});
```

### MongoDB

**Voir les parties dans Mongo Express** :
1. Ouvrir http://localhost:8081
2. Cliquer sur la base `warstruck`
3. Cliquer sur la collection `games`
4. Voir toutes les parties avec leur historique

**Requête directe** :

```javascript
// Dans le shell MongoDB
db.games.find({ gameId: "550e8400-..." }).pretty()
```

### Logs Serveur

**Backend NestJS** :

Les logs sont automatiquement affichés dans le terminal :

```
[GameService] Creating new game
[GameService] Game created with ID: 550e8400-...
[GameGateway] Player joined queue: PlayerName
[GameGateway] Match found! Creating game...
```

---

## 📊 Statistiques

### Métriques Disponibles

- Nombre total de parties créées
- Nombre de parties en cours
- Nombre de parties terminées
- Durée moyenne d'une partie
- Nombre d'actions par partie
- Taux de victoire par rôle (attaquant/défenseur)

### Récupérer les Statistiques

```typescript
// API endpoint (à implémenter)
GET /game/stats

Response:
{
  totalGames: 125,
  activeGames: 8,
  finishedGames: 117,
  avgDuration: "18:23",
  avgActionsPerGame: 42,
  winRate: {
    attacker: 0.52,
    defender: 0.48
  }
}
```

---

**Documentation technique maintenue pour Warstruck JS** 🔧
