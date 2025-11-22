# Test de l'API

Pour tester l'API, vous pouvez utiliser les commandes suivantes :

## PowerShell

```powershell
# Test de la configuration du jeu
Invoke-RestMethod -Uri "http://localhost:3001/game/config" -Method Get | ConvertTo-Json -Depth 10

# Créer une nouvelle partie
$body = @{
    player1Deck = @("general", "colonel", "infantryman", "scout") * 5
    player2Deck = @("general", "colonel", "infantryman", "scout") * 5
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/game/create" -Method Post -Body $body -ContentType "application/json"
```

## Curl (Git Bash / Linux / Mac)

```bash
# Test de la configuration du jeu
curl http://localhost:3001/game/config

# Créer une nouvelle partie
curl -X POST http://localhost:3001/game/create \
  -H "Content-Type: application/json" \
  -d '{
    "player1Deck": ["general","colonel","infantryman","scout","general","colonel","infantryman","scout","general","colonel","infantryman","scout","general","colonel","infantryman","scout","general","colonel","infantryman","scout"],
    "player2Deck": ["general","colonel","infantryman","scout","general","colonel","infantryman","scout","general","colonel","infantryman","scout","general","colonel","infantryman","scout","general","colonel","infantryman","scout"]
  }'
```

## Postman / Insomnia

1. **GET** `http://localhost:3001/game/config`
2. **POST** `http://localhost:3001/game/create`
   ```json
   {
     "player1Deck": ["general","colonel","infantryman","scout","general","colonel","infantryman","scout","general","colonel","infantryman","scout","general","colonel","infantryman","scout","general","colonel","infantryman","scout"],
     "player2Deck": ["general","colonel","infantryman","scout","general","colonel","infantryman","scout","general","colonel","infantryman","scout","general","colonel","infantryman","scout","general","colonel","infantryman","scout"]
   }
   ```

## Vérifier les logs

Les logs dans le terminal montrent :
- ✅ Toutes les routes mappées correctement
- ✅ L'application démarre sur le port 3001
- ✅ Logging automatique de chaque requête (grâce à l'interceptor)
