# Script de Test de l'API WarstruckJS

Ce fichier contient des exemples de requêtes pour tester l'API.

## Créer une Nouvelle Partie

```bash
curl -X POST http://localhost:3001/game/create \
  -H "Content-Type: application/json" \
  -d '{}'
```

Réponse :
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "phase": "deck-selection",
  "board": [...],
  "players": {...},
  "currentPlayer": "player1",
  "turnNumber": 0,
  "actionsThisTurn": 0
}
```

## Liste des Parties

```bash
curl http://localhost:3001/game/list
```

## Récupérer une Partie

```bash
curl http://localhost:3001/game/{gameId}
```

## Sélectionner un Deck

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

## Configuration des Renforts

```bash
curl -X POST http://localhost:3001/game/{gameId}/setup-reinforcements \
  -H "Content-Type: application/json" \
  -d '{
    "playerId": "player1",
    "pieceIds": ["piece-id-1", "piece-id-2", "piece-id-3", "piece-id-4"]
  }'
```

## Placer le Général

```bash
curl -X POST http://localhost:3001/game/{gameId}/place-general \
  -H "Content-Type: application/json" \
  -d '{
    "playerId": "player1",
    "position": { "row": 7, "col": 3 }
  }'
```

## Démarrer la Partie

```bash
curl -X POST http://localhost:3001/game/{gameId}/start \
  -H "Content-Type: application/json"
```

## Exécuter une Action - Déplacement

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

## Exécuter une Action - Attaque

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

## Exécuter une Action - Fin de Tour

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

## Récupérer l'Historique

```bash
curl http://localhost:3001/game/{gameId}/history
```

Réponse :
```json
[
  {
    "id": "action-uuid-1",
    "timestamp": "2025-11-23T10:30:00.000Z",
    "turnNumber": 1,
    "playerId": "player1",
    "action": {
      "type": "move",
      "pieceId": "piece-123",
      "from": { "row": 7, "col": 3 },
      "to": { "row": 6, "col": 3 }
    },
    "gameStateBefore": {...},
    "gameStateAfter": {...}
  },
  ...
]
```

## Rejouer jusqu'à une Action

```bash
curl http://localhost:3001/game/{gameId}/replay/action/{actionId}
```

## Rejouer jusqu'à un Tour

```bash
curl http://localhost:3001/game/{gameId}/replay/turn/5
```

## Configuration du Jeu

```bash
curl http://localhost:3001/game/config
```

## Utilisation avec PowerShell

Pour Windows PowerShell, utilisez `Invoke-WebRequest` :

### Créer une Partie
```powershell
$response = Invoke-WebRequest -Uri "http://localhost:3001/game/create" -Method POST -ContentType "application/json" -Body "{}"
$game = $response.Content | ConvertFrom-Json
$gameId = $game.id
Write-Host "Game ID: $gameId"
```

### Récupérer une Partie
```powershell
$response = Invoke-WebRequest -Uri "http://localhost:3001/game/$gameId"
$response.Content | ConvertFrom-Json
```

### Sélectionner un Deck
```powershell
$body = @{
  playerId = "player1"
  selectedPieces = @(
    "colonel", "colonel",
    "infantryman", "infantryman", "infantryman", "infantryman", "infantryman",
    "infantryman", "infantryman", "infantryman", "infantryman", "infantryman",
    "scout", "scout", "scout", "scout", "scout", "scout", "scout", "scout"
  )
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3001/game/$gameId/select-deck" -Method POST -ContentType "application/json" -Body $body
```

## Test de Bout en Bout

Voici un script complet pour créer et jouer une partie :

### Bash
```bash
#!/bin/bash

# Créer une partie
echo "Creating game..."
RESPONSE=$(curl -s -X POST http://localhost:3001/game/create -H "Content-Type: application/json" -d '{}')
GAME_ID=$(echo $RESPONSE | jq -r '.id')
echo "Game created: $GAME_ID"

# Sélectionner le deck du joueur 1
echo "Selecting deck for player 1..."
curl -s -X POST http://localhost:3001/game/$GAME_ID/select-deck \
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

# Sélectionner le deck du joueur 2
echo "Selecting deck for player 2..."
curl -s -X POST http://localhost:3001/game/$GAME_ID/select-deck \
  -H "Content-Type: application/json" \
  -d '{
    "playerId": "player2",
    "selectedPieces": [
      "colonel", "colonel",
      "infantryman", "infantryman", "infantryman", "infantryman", "infantryman",
      "infantryman", "infantryman", "infantryman", "infantryman", "infantryman",
      "scout", "scout", "scout", "scout", "scout", "scout", "scout", "scout"
    ]
  }'

echo "Game is ready! ID: $GAME_ID"
echo "Open http://localhost:3000/game/$GAME_ID in your browser"
```

### PowerShell
```powershell
# Créer une partie
Write-Host "Creating game..."
$response = Invoke-WebRequest -Uri "http://localhost:3001/game/create" -Method POST -ContentType "application/json" -Body "{}"
$game = $response.Content | ConvertFrom-Json
$gameId = $game.id
Write-Host "Game created: $gameId"

# Sélectionner le deck du joueur 1
Write-Host "Selecting deck for player 1..."
$body1 = @{
  playerId = "player1"
  selectedPieces = @(
    "colonel", "colonel",
    "infantryman", "infantryman", "infantryman", "infantryman", "infantryman",
    "infantryman", "infantryman", "infantryman", "infantryman", "infantryman",
    "scout", "scout", "scout", "scout", "scout", "scout", "scout", "scout"
  )
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3001/game/$gameId/select-deck" -Method POST -ContentType "application/json" -Body $body1

# Sélectionner le deck du joueur 2
Write-Host "Selecting deck for player 2..."
$body2 = @{
  playerId = "player2"
  selectedPieces = @(
    "colonel", "colonel",
    "infantryman", "infantryman", "infantryman", "infantryman", "infantryman",
    "infantryman", "infantryman", "infantryman", "infantryman", "infantryman",
    "scout", "scout", "scout", "scout", "scout", "scout", "scout", "scout"
  )
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3001/game/$gameId/select-deck" -Method POST -ContentType "application/json" -Body $body2

Write-Host "Game is ready! ID: $gameId"
Write-Host "Open http://localhost:3000/game/$gameId in your browser"
```

## Notes

- Remplacez `{gameId}` par l'ID réel de votre partie
- Les IDs de pièces (`pieceId`) sont générés automatiquement lors de la sélection des decks
- Pour obtenir les IDs de pièces, faites un GET sur `/game/{gameId}` et examinez les decks des joueurs
