# ⚙️ Configuration Backend - Warstruck JS

Ce document couvre la configuration MongoDB et les tests de l'API.

## 📑 Table des Matières

1. [Installation MongoDB](#installation-mongodb)
2. [Configuration](#configuration)
3. [Tests API](#tests-api)

---

## 🗄️ Installation MongoDB

### Option 1 : Docker (Recommandé)

**Prérequis** : Docker Desktop installé

```powershell
# Démarrer MongoDB + Mongo Express (interface web)
docker-compose up -d

# Vérifier que les conteneurs fonctionnent
docker ps
```

**Résultat attendu** :
```
CONTAINER ID   IMAGE           PORTS                      STATUS
abc123...      mongo:7        0.0.0.0:27017->27017/tcp   Up
def456...      mongo-express  0.0.0.0:8081->8081/tcp     Up
```

**Accès** :
- **MongoDB** : `mongodb://localhost:27017`
- **Mongo Express** (interface web) : http://localhost:8081

**Avantages** :
- ✅ Installation en 1 commande
- ✅ Interface web incluse
- ✅ Données persistées automatiquement
- ✅ Facile à supprimer/recréer

**Commandes utiles** :

```powershell
# Arrêter MongoDB
docker-compose down

# Supprimer les données ET les conteneurs
docker-compose down -v

# Voir les logs
docker-compose logs -f mongodb

# Redémarrer
docker-compose restart mongodb
```

### Option 2 : MongoDB Local

#### Windows

1. Télécharger : https://www.mongodb.com/try/download/community
2. Installer avec les options par défaut
3. MongoDB démarre automatiquement comme service Windows
4. Vérifier : `services.msc` → Chercher "MongoDB"

#### macOS (avec Homebrew)

```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

#### Linux (Ubuntu/Debian)

```bash
sudo apt-get install -y mongodb
sudo systemctl start mongodb
sudo systemctl enable mongodb
```

### Option 3 : MongoDB Atlas (Cloud)

1. Créer un compte gratuit sur https://www.mongodb.com/cloud/atlas
2. Créer un cluster gratuit (M0 Sandbox)
3. Créer un utilisateur avec accès lecture/écriture
4. Autoriser votre IP (ou `0.0.0.0/0` pour développement)
5. Copier la connection string
6. Mettre à jour `.env` :

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/warstruck?retryWrites=true&w=majority
```

---

## ⚙️ Configuration

### Fichier .env

Créer `server/.env` :

```env
# Port du serveur NestJS
PORT=3001

# MongoDB
MONGODB_URI=mongodb://localhost:27017/warstruck

# Environnement
NODE_ENV=development
```

### Fichier docker-compose.yml

Déjà présent à la racine du projet :

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:7
    container_name: warstruck-mongodb
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_DATABASE: warstruck
    volumes:
      - mongodb_data:/data/db
    networks:
      - warstruck-network

  mongo-express:
    image: mongo-express
    container_name: warstruck-mongo-express
    ports:
      - "8081:8081"
    environment:
      ME_CONFIG_MONGODB_URL: mongodb://mongodb:27017
      ME_CONFIG_BASICAUTH: false
    depends_on:
      - mongodb
    networks:
      - warstruck-network

volumes:
  mongodb_data:

networks:
  warstruck-network:
    driver: bridge
```

### Vérifier la Configuration

```powershell
# 1. MongoDB est accessible
mongosh mongodb://localhost:27017

# 2. Le serveur se connecte à MongoDB
cd server
pnpm dev

# Dans les logs, chercher :
# [MongooseModule] Database connected successfully
```

### Schéma MongoDB

**Collection** : `games`

```typescript
{
  _id: ObjectId,
  gameId: string,              // UUID unique
  currentState: {              // État complet du jeu
    phase: string,
    board: Array,
    players: Object,
    currentPlayer: string,
    turnNumber: number
  },
  history: [                   // Historique des actions
    {
      actionId: string,
      timestamp: Date,
      turnNumber: number,
      playerId: string,
      action: Object,
      stateBefore: Object,
      stateAfter: Object
    }
  ],
  createdAt: Date,
  updatedAt: Date,
  phase: string,
  currentPlayer: string,
  turnNumber: number,
  winner?: string
}
```

**Index** :

```javascript
// Recherche rapide par gameId
db.games.createIndex({ gameId: 1 }, { unique: true });

// Filtrage par phase
db.games.createIndex({ phase: 1 });

// Tri par date
db.games.createIndex({ createdAt: -1 });
```

---

## 🧪 Tests API

### Endpoints Disponibles

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `POST` | `/game/create` | Créer une nouvelle partie |
| `GET` | `/game/list` | Lister toutes les parties |
| `GET` | `/game/:id` | Récupérer une partie |
| `POST` | `/game/:id/select-deck` | Sélectionner un deck |
| `POST` | `/game/:id/setup-reinforcements` | Configurer les renforts |
| `POST` | `/game/:id/place-general` | Placer le général |
| `POST` | `/game/:id/start` | Démarrer la partie |
| `POST` | `/game/:id/action` | Exécuter une action |
| `GET` | `/game/:id/history` | Récupérer l'historique |
| `GET` | `/game/config` | Configuration du jeu |
| `GET` | `/health` | Health check |

### Tests avec cURL

#### 1. Créer une Partie

```bash
curl -X POST http://localhost:3001/game/create \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Réponse** :
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "phase": "deck-selection",
  "board": [...],
  "players": {...},
  "currentPlayer": "player1",
  "turnNumber": 0
}
```

#### 2. Lister les Parties

```bash
curl http://localhost:3001/game/list
```

#### 3. Récupérer une Partie

```bash
# Remplacer {gameId} par l'ID de votre partie
curl http://localhost:3001/game/{gameId}
```

#### 4. Sélectionner un Deck

```bash
curl -X POST http://localhost:3001/game/{gameId}/select-deck \
  -H "Content-Type: application/json" \
  -d '{
    "playerId": "player1",
    "selectedPieces": [
      "colonel", "colonel",
      "infantryman", "infantryman", "infantryman", "infantryman", "infantryman",
      "infantryman", "infantryman", "infantryman", "infantryman", "infantryman",
      "scout", "scout", "scout", "scout", "scout", "scout", "scout", "scout"
    ]
  }'
```

#### 5. Configurer les Renforts

```bash
curl -X POST http://localhost:3001/game/{gameId}/setup-reinforcements \
  -H "Content-Type: application/json" \
  -d '{
    "playerId": "player1",
    "pieceIds": ["piece-id-1", "piece-id-2", "piece-id-3", "piece-id-4"]
  }'
```

#### 6. Démarrer la Partie

```bash
curl -X POST http://localhost:3001/game/{gameId}/start \
  -H "Content-Type: application/json"
```

#### 7. Exécuter une Action - Déplacement

```bash
curl -X POST http://localhost:3001/game/{gameId}/action \
  -H "Content-Type: application/json" \
  -d '{
    "playerId": "player1",
    "action": {
      "type": "move",
      "pieceId": "piece-123",
      "from": { "row": 7, "col": 3 },
      "to": { "row": 6, "col": 3 }
    }
  }'
```

#### 8. Exécuter une Action - Attaque

```bash
curl -X POST http://localhost:3001/game/{gameId}/action \
  -H "Content-Type: application/json" \
  -d '{
    "playerId": "player1",
    "action": {
      "type": "attack",
      "pieceId": "piece-123",
      "targetPieceId": "piece-456"
    }
  }'
```

#### 9. Exécuter une Action - Fin de Tour

```bash
curl -X POST http://localhost:3001/game/{gameId}/action \
  -H "Content-Type: application/json" \
  -d '{
    "playerId": "player1",
    "action": {
      "type": "endTurn"
    }
  }'
```

#### 10. Récupérer l'Historique

```bash
curl http://localhost:3001/game/{gameId}/history
```

**Réponse** :
```json
[
  {
    "actionId": "action-uuid-1",
    "timestamp": "2025-11-25T10:30:00.000Z",
    "turnNumber": 1,
    "playerId": "player1",
    "action": { "type": "move", ... },
    "stateBefore": {...},
    "stateAfter": {...}
  }
]
```

### Tests avec PowerShell

#### Créer une Partie

```powershell
$response = Invoke-WebRequest -Uri "http://localhost:3001/game/create" `
  -Method POST `
  -ContentType "application/json" `
  -Body "{}"

$game = $response.Content | ConvertFrom-Json
$gameId = $game.id
Write-Host "Game ID: $gameId"
```

#### Récupérer une Partie

```powershell
$response = Invoke-WebRequest -Uri "http://localhost:3001/game/$gameId"
$response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

#### Sélectionner un Deck

```powershell
$body = @{
  playerId = "player1"
  selectedPieces = @(
    "colonel", "colonel",
    "infantryman", "infantryman", "infantryman", "infantryman",
    "infantryman", "infantryman", "infantryman", "infantryman",
    "infantryman", "infantryman",
    "scout", "scout", "scout", "scout", "scout", "scout", "scout", "scout"
  )
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3001/game/$gameId/select-deck" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

#### Exécuter une Action

```powershell
$body = @{
  playerId = "player1"
  action = @{
    type = "move"
    pieceId = "piece-123"
    from = @{ row = 7; col = 3 }
    to = @{ row = 6; col = 3 }
  }
} | ConvertTo-Json -Depth 10

Invoke-WebRequest -Uri "http://localhost:3001/game/$gameId/action" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

### Script de Test Complet

**Fichier** : `test-api.ps1`

```powershell
# Test complet de l'API

# 1. Créer une partie
Write-Host "1. Creating game..." -ForegroundColor Green
$response = Invoke-WebRequest -Uri "http://localhost:3001/game/create" -Method POST -ContentType "application/json" -Body "{}"
$game = $response.Content | ConvertFrom-Json
$gameId = $game.id
Write-Host "   Game ID: $gameId" -ForegroundColor Yellow

# 2. Vérifier que la partie existe
Write-Host "2. Fetching game..." -ForegroundColor Green
$response = Invoke-WebRequest -Uri "http://localhost:3001/game/$gameId"
Write-Host "   Phase: $($game.phase)" -ForegroundColor Yellow

# 3. Sélectionner les decks
Write-Host "3. Selecting decks..." -ForegroundColor Green
$deckBody = @{
  playerId = "player1"
  selectedPieces = @("colonel", "colonel", "infantryman", "infantryman", "infantryman", "infantryman", "infantryman", "infantryman", "infantryman", "infantryman", "infantryman", "infantryman", "scout", "scout", "scout", "scout", "scout", "scout", "scout", "scout")
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3001/game/$gameId/select-deck" -Method POST -ContentType "application/json" -Body $deckBody | Out-Null
Write-Host "   Player 1 deck selected" -ForegroundColor Yellow

# 4. Lister les parties
Write-Host "4. Listing all games..." -ForegroundColor Green
$response = Invoke-WebRequest -Uri "http://localhost:3001/game/list"
$games = $response.Content | ConvertFrom-Json
Write-Host "   Total games: $($games.Count)" -ForegroundColor Yellow

Write-Host "`nTests completed successfully!" -ForegroundColor Green
```

**Exécution** :

```powershell
.\test-api.ps1
```

---

## 🐛 Dépannage

### MongoDB ne se connecte pas

**Erreur** : `MongooseError: connect ECONNREFUSED 127.0.0.1:27017`

**Solutions** :

1. Vérifier que Docker tourne :
```powershell
docker ps
```

2. Si pas de conteneurs, démarrer MongoDB :
```powershell
docker-compose up -d
```

3. Vérifier les logs :
```powershell
docker-compose logs -f mongodb
```

### Port déjà utilisé

**Erreur** : `Error: listen EADDRINUSE: address already in use :::3001`

**Solution** :

```powershell
# Trouver le processus
netstat -ano | findstr :3001

# Tuer le processus (remplacer <PID>)
taskkill /PID <PID> /F
```

### Données corrompues

**Solution** : Réinitialiser la base de données

```powershell
# Supprimer toutes les données
docker-compose down -v

# Redémarrer
docker-compose up -d
```

### API ne répond pas

**Vérifications** :

1. Le serveur tourne bien :
```powershell
cd server
pnpm dev
```

2. Le port est correct (3001) :
```powershell
curl http://localhost:3001/health
```

3. Les logs du serveur pour voir les erreurs

---

## 📊 Monitoring

### Mongo Express

Interface web pour MongoDB : http://localhost:8081

**Fonctionnalités** :
- Voir toutes les bases de données
- Explorer les collections
- Exécuter des requêtes
- Modifier les documents
- Supprimer des données

### Logs du Serveur

Les logs NestJS affichent automatiquement :
- Connexions MongoDB
- Requêtes HTTP
- Erreurs
- Actions de jeu

**Activer les logs détaillés** :

```typescript
// Dans main.ts
app.useLogger(['log', 'error', 'warn', 'debug', 'verbose']);
```

---

**Configuration backend maintenue pour Warstruck JS** ⚙️
