# Système 1vs1 en Temps Réel avec Socket.IO

## Vue d'ensemble

Le système de jeu 1vs1 permet à deux joueurs de s'affronter en temps réel via WebSocket (Socket.IO). Le système comprend:

- **Matchmaking automatique**: File d'attente pour trouver un adversaire
- **Communication en temps réel**: Synchronisation instantanée des actions de jeu
- **Chat intégré**: Communication entre joueurs
- **Gestion de déconnexion**: Notification et gestion des déconnexions

## Architecture

### Backend (NestJS)

#### GameGateway (`server/src/game/game.gateway.ts`)

Le `GameGateway` est le point central de communication WebSocket. Il gère:

**Matchmaking:**
- `join-queue`: Rejoindre la file d'attente
- `leave-queue`: Quitter la file d'attente
- Création automatique d'un match quand 2 joueurs sont disponibles

**Actions de jeu:**
- `select-deck`: Sélectionner son deck de 19 pièces
- `place-general`: Placer son général (phase setup)
- `setup-reinforcements`: Choisir 4 pièces pour les renforts
- `start-game`: Démarrer la partie
- `execute-action`: Exécuter une action (déplacement, attaque, etc.)
- `get-game-state`: Récupérer l'état actuel du jeu

**Communication:**
- `send-message`: Envoyer un message de chat
- Émission automatique de `game-updated` à tous les joueurs de la room

**Gestion des connexions:**
- Détection automatique des déconnexions
- Notification aux autres joueurs
- Nettoyage des rooms inactives

### Frontend (Next.js + React)

#### GameSocketClient (`web/lib/gameSocket.ts`)

Client TypeScript pour interagir avec le serveur Socket.IO:

```typescript
import { GameSocketClient } from '@/lib/gameSocket';

const socket = new GameSocketClient('http://localhost:3001');
await socket.connect();

// Rejoindre la file d'attente
socket.joinQueue('PlayerName');

// Écouter les événements
socket.onMatchFound((data) => {
  console.log('Match trouvé!', data);
});

socket.onGameUpdated((gameState) => {
  console.log('État du jeu mis à jour', gameState);
});
```

#### Page de Matchmaking (`web/app/matchmaking/page.tsx`)

Interface utilisateur complète pour:
- Rejoindre/quitter la file d'attente
- Afficher l'état de la partie
- Sélectionner le deck (mode automatique pour démo)
- Effectuer des actions de jeu
- Communiquer via chat

## Flux de jeu

### 1. Matchmaking

```
Joueur 1 → join-queue → Serveur (file d'attente)
Joueur 2 → join-queue → Serveur
Serveur → Crée une partie → Émet match-found aux 2 joueurs
```

### 2. Sélection de deck (phase: deck-selection)

```
Joueur 1 → select-deck (19 pièces)
Joueur 2 → select-deck (19 pièces)
Serveur → Émet game-updated + phase-changed (setup)
```

### 3. Setup (phase: setup)

```
Joueurs → place-general (optionnel, fait automatiquement sinon)
Joueurs → setup-reinforcements (4 pièces)
Un joueur → start-game
Serveur → Placement automatique sur le plateau
Serveur → Émet game-started
```

### 4. Jeu (phase: playing)

```
Joueur actif → execute-action (move/attack/etc.)
Serveur → Valide l'action
Serveur → Met à jour l'état
Serveur → Émet game-updated à tous
Joueur actif → execute-action { type: 'endTurn' }
Serveur → Change de joueur
```

### 5. Fin (phase: finished)

```
Serveur → Détecte élimination du général
Serveur → Émet game-finished { winner: 'player1' }
```

## Événements Socket.IO

### Événements émis par le client

| Événement | Payload | Description |
|-----------|---------|-------------|
| `join-queue` | `{ playerName: string }` | Rejoindre la file d'attente |
| `leave-queue` | - | Quitter la file d'attente |
| `select-deck` | `{ gameId, playerId, selectedPieces }` | Sélectionner son deck |
| `place-general` | `{ gameId, playerId, position }` | Placer son général |
| `setup-reinforcements` | `{ gameId, playerId, pieceIds }` | Choisir les renforts |
| `start-game` | `{ gameId }` | Démarrer la partie |
| `execute-action` | `{ gameId, playerId, action }` | Effectuer une action |
| `get-game-state` | `{ gameId }` | Récupérer l'état |
| `send-message` | `{ gameId, message }` | Envoyer un message |

### Événements reçus par le client

| Événement | Payload | Description |
|-----------|---------|-------------|
| `queue-joined` | `{ position: number }` | Confirmation d'entrée en queue |
| `queue-left` | - | Confirmation de sortie |
| `match-found` | `{ gameId, playerId, role, opponent }` | Match trouvé |
| `game-updated` | `GameState` | État du jeu mis à jour |
| `game-started` | `GameState` | Partie démarrée |
| `game-finished` | `{ winner: string }` | Partie terminée |
| `phase-changed` | `{ phase: string }` | Changement de phase |
| `game-state` | `GameState` | État du jeu (réponse) |
| `player-disconnected` | `{ playerId, playerName }` | Joueur déconnecté |
| `chat-message` | `{ playerName, message, timestamp }` | Message de chat |
| `error` | `{ message: string }` | Erreur serveur |

## Structure GameState

```typescript
interface GameState {
  id: string;                      // ID unique de la partie
  phase: string;                   // deck-selection | setup | playing | finished
  board: (BoardPiece | null)[][];  // Plateau 8x8
  players: {
    player1: Player;
    player2: Player;
  };
  currentPlayer: 'player1' | 'player2';
  turnNumber: number;
  actionsThisTurn: number;
  winner?: 'player1' | 'player2';
}

interface Player {
  id: PlayerId;
  role: 'attacker' | 'defender';
  deck: ReservePiece[];           // Pièces en réserve (face cachée)
  reinforcements: ReinforcementPiece[]; // Colonne des renforts
  actionPoints: number;
  generalAdvanced: boolean;
  deckSelected: boolean;
  hasDeployedThisTurn: boolean;
}
```

## Tester le système

### 1. Démarrer le serveur

```powershell
cd server
pnpm dev
```

Le serveur démarre sur `http://localhost:3001`

### 2. Démarrer le client web

```powershell
cd web
pnpm dev
```

Le client démarre sur `http://localhost:3000`

### 3. Ouvrir 2 navigateurs

- Navigateur 1: `http://localhost:3000/matchmaking`
- Navigateur 2: `http://localhost:3000/matchmaking`

### 4. Créer un match

1. Dans chaque navigateur, entrer un nom différent
2. Cliquer sur "Join Queue" dans les deux
3. Un match est automatiquement créé
4. Suivre les étapes: sélection deck → setup → jeu

### 5. Tester les actions

- Utiliser les boutons "Select Deck (Auto)" et "Setup Reinforcements (Auto)" pour la démo
- Cliquer sur "Start Game" pour démarrer
- Utiliser "End Turn" pour passer au joueur suivant
- Tester le chat en envoyant des messages

## Points d'amélioration futurs

1. **Validation des mouvements**: Ajouter la validation complète des zones de déplacement/attaque
2. **Persistance**: Sauvegarder les parties en cours pour reconnexion
3. **Spectateurs**: Permettre aux spectateurs de regarder les parties
4. **Replay**: Système de replay des parties
5. **Classement**: Système de ranking et d'ELO
6. **Tournois**: Organisation de tournois automatisés
7. **Timer**: Limites de temps par tour
8. **Reconnexion**: Gestion avancée des reconnexions

## Dépendances

### Backend
- `@nestjs/websockets`: ^11.1.9
- `@nestjs/platform-socket.io`: ^11.1.9
- `socket.io`: ^4.8.1

### Frontend
- `socket.io-client`: ^4.8.1

## Remarques importantes

1. **CORS**: Le serveur accepte toutes les origines (`*`) en développement. À configurer pour la production.
2. **Sécurité**: Aucune authentification n'est implémentée. À ajouter pour la production.
3. **Scalabilité**: Pour plusieurs parties simultanées, considérer Redis pour la gestion des rooms.
4. **Performance**: Les états de jeu complets sont envoyés à chaque mise à jour. Optimiser avec des deltas pour la production.
