# Système de Gestion des Parties avec Historique

Ce document décrit le nouveau système de gestion des parties implémenté dans WarstruckJS.

## Fonctionnalités Implémentées

### 1. Gestion des Parties avec UUID

Chaque partie possède maintenant un identifiant unique (UUID v4) qui permet de :
- Accéder à une partie via une URL unique : `/game/{uuid}`
- Partager le lien de la partie avec d'autres joueurs
- Retrouver une partie après un rafraîchissement (F5)

### 2. Persistance des Parties

Le système de persistance (`GamePersistenceService`) permet de :
- Sauvegarder automatiquement l'état de chaque partie
- Récupérer une partie existante via son UUID
- Lister toutes les parties en cours ou terminées

**Note**: Dans cette version prototype, les parties sont stockées en mémoire. Pour une application de production, il faudrait utiliser une base de données (PostgreSQL, MongoDB, etc.).

### 3. Historique Complet des Actions

Chaque action effectuée dans une partie est enregistrée avec :
- Un ID unique (UUID)
- Un timestamp précis
- Le numéro du tour
- L'identifiant du joueur
- L'action effectuée (déplacement, attaque, etc.)
- L'état du jeu AVANT l'action
- L'état du jeu APRÈS l'action

Cela permet de :
- Suivre toutes les actions d'une partie
- Comprendre comment une partie s'est déroulée
- Déboguer plus facilement
- Analyser les stratégies des joueurs

### 4. Système de Replay

Le système de replay permet de :
- **Rejouer une partie action par action** : Visualiser l'état du plateau après chaque action
- **Rejouer jusqu'à un tour spécifique** : Voir l'état du jeu à la fin d'un tour donné
- **Filtrer les actions par tour** : Naviguer facilement dans l'historique

## Architecture Backend

### Nouveaux Fichiers

#### `game-history.interface.ts`
Définit les interfaces TypeScript pour :
- `GameActionRecord` : Enregistrement d'une action
- `GameMetadata` : Métadonnées d'une partie
- `PersistedGame` : Structure complète d'une partie persistée

#### `game-persistence.service.ts`
Service de persistance qui gère :
- Sauvegarde des nouvelles parties
- Enregistrement des actions dans l'historique
- Récupération des parties
- Système de replay
- Gestion de la liste des parties

### Modifications

#### `game-board.service.ts`
- Utilise maintenant `GamePersistenceService` au lieu d'une simple `Map`
- Enregistre automatiquement chaque action dans l'historique
- Sauvegarde l'état avant et après chaque action

#### `game.controller.ts`
Nouveaux endpoints :
- `GET /game/list` : Liste toutes les parties
- `GET /game/:gameId/history` : Récupère l'historique d'une partie
- `GET /game/:gameId/replay/action/:actionId` : Rejoue jusqu'à une action
- `GET /game/:gameId/replay/turn/:turnNumber` : Rejoue jusqu'à un tour

## Architecture Frontend

### Nouvelles Pages

#### `/game/page.tsx` (Page d'accueil)
- Liste toutes les parties disponibles
- Affiche les métadonnées de chaque partie (phase, tour, joueurs, etc.)
- Permet de créer une nouvelle partie
- Permet de rejoindre une partie existante
- Permet d'accéder à l'historique d'une partie

#### `/game/[gameId]/page.tsx` (Page de jeu)
- Charge automatiquement la partie via son UUID
- Persiste l'état lors d'un rafraîchissement (F5)
- Communique avec le backend pour chaque action
- Permet de voir l'historique de la partie en cours
- Supporte toutes les phases : sélection des decks, setup, jeu, fin

#### `/game/history/[gameId]/page.tsx` (Page d'historique)
- Affiche une timeline de toutes les actions
- Permet de cliquer sur une action pour voir l'état du plateau à ce moment
- Affiche le plateau en mode lecture seule
- Permet de filtrer les actions par tour
- Montre les métadonnées de chaque action (joueur, type, timestamp)

### Configuration

#### `.env.local`
Fichier de configuration contenant :
- `NEXT_PUBLIC_API_URL` : URL du backend (défaut: http://localhost:3001)

## Flux de Jeu

### 1. Créer une Nouvelle Partie

```
Page d'accueil (/game)
  ↓ Clic sur "Nouvelle partie"
  ↓ API: POST /game/create
  ↓ Redirection vers /game/{uuid}
  ↓ Phase: deck-selection
```

### 2. Jouer une Partie

```
Page de jeu (/game/{uuid})
  ↓ Sélection des decks (Player 1 & Player 2)
  ↓ API: POST /game/{uuid}/select-deck
  ↓ Phase: setup
  ↓ Configuration des renforts
  ↓ API: POST /game/{uuid}/setup-reinforcements
  ↓ Démarrage
  ↓ API: POST /game/{uuid}/start
  ↓ Phase: playing
  ↓ Actions de jeu
  ↓ API: POST /game/{uuid}/action
  ↓ Enregistrement automatique dans l'historique
```

### 3. Rafraîchissement (F5)

```
Page de jeu (/game/{uuid})
  ↓ Rechargement de la page
  ↓ API: GET /game/{uuid}
  ↓ Récupération de l'état actuel
  ↓ Continuation de la partie
```

### 4. Consulter l'Historique

```
Page d'historique (/game/history/{uuid})
  ↓ API: GET /game/{uuid}/history
  ↓ Affichage de la timeline
  ↓ Clic sur une action
  ↓ API: GET /game/{uuid}/replay/action/{actionId}
  ↓ Affichage de l'état du plateau
```

## API Endpoints

### Parties

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/game/config` | Configuration du jeu |
| POST | `/game/create` | Créer une nouvelle partie |
| GET | `/game/list` | Liste toutes les parties |
| GET | `/game/:gameId` | Récupérer une partie |

### Actions de Jeu

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/game/:gameId/select-deck` | Sélectionner le deck |
| POST | `/game/:gameId/place-general` | Placer le général |
| POST | `/game/:gameId/setup-reinforcements` | Configurer les renforts |
| POST | `/game/:gameId/start` | Démarrer la partie |
| POST | `/game/:gameId/action` | Exécuter une action |

### Historique et Replay

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/game/:gameId/history` | Historique complet |
| GET | `/game/:gameId/replay/action/:actionId` | Rejouer jusqu'à une action |
| GET | `/game/:gameId/replay/turn/:turnNumber` | Rejouer jusqu'à un tour |

## Types d'Actions Enregistrées

- `move` : Déplacement d'une pièce
- `attack` : Attaque d'une pièce ennemie
- `deployFromReinforcements` : Déploiement depuis les renforts
- `addToReinforcements` : Ajout d'une pièce aux renforts
- `useAbility` : Utilisation d'une capacité
- `endTurn` : Fin de tour

## Améliorations Futures

### Base de Données
Remplacer le stockage en mémoire par une vraie base de données :
- PostgreSQL avec TypeORM
- MongoDB avec Mongoose
- Ajouter des migrations pour la structure de données

### Authentification
- Système d'authentification des joueurs
- Identification unique des joueurs
- Gestion des permissions (un joueur ne peut jouer que pour son camp)

### Multijoueur en Temps Réel
- WebSockets pour la synchronisation en temps réel
- Notification quand c'est son tour
- Spectateurs en direct

### Analyse Avancée
- Statistiques par joueur
- Graphiques de progression
- Export de l'historique en différents formats (JSON, PDF, etc.)
- Notation des parties (ELO, etc.)

### Interface de Replay Améliorée
- Contrôles de lecture (play, pause, vitesse)
- Animation des actions
- Vue miniature du plateau
- Commentaires sur les actions

## Notes Techniques

### Clonage Profond
Le service de persistance utilise `JSON.parse(JSON.stringify())` pour cloner les états de jeu. Pour une application plus complexe, il faudrait utiliser une bibliothèque comme `lodash.cloneDeep` ou `structuredClone`.

### Performance
Avec un grand nombre de parties et d'actions, le stockage en mémoire peut devenir problématique. Il est recommandé de :
- Implémenter une pagination pour la liste des parties
- Limiter la taille de l'historique ou l'archiver
- Utiliser un système de cache (Redis) pour les parties actives

### CORS
Assurez-vous que le backend autorise les requêtes du frontend en configurant correctement CORS dans NestJS.

## Démarrage

### Backend
```bash
cd server
pnpm install
pnpm run dev
```
Le serveur démarre sur http://localhost:3001

### Frontend
```bash
cd web
pnpm install
pnpm run dev
```
L'application démarre sur http://localhost:3000

### Accéder à l'Application
1. Ouvrir http://localhost:3000/game
2. Cliquer sur "Nouvelle partie"
3. Jouer !
4. Rafraîchir la page (F5) : la partie continue
5. Consulter l'historique à tout moment
