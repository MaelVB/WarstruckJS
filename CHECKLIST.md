# ✅ Checklist - Démarrage du Système de Gestion des Parties

## Avant de Commencer

### Prérequis
- [ ] Node.js 18+ installé
- [ ] pnpm installé (`npm install -g pnpm@9`)
- [ ] Git installé
- [ ] Éditeur de code (VS Code recommandé)
- [ ] Terminal/PowerShell ouvert

## Installation

### 1. Dépendances
```bash
cd C:\Users\AlphaSyne\Projets\DEV\NODEJS\WarstruckJS\WarstruckJS
pnpm install
```

- [ ] Les dépendances sont installées sans erreur
- [ ] Le dossier `node_modules` est créé
- [ ] Les workspaces (server, web) sont détectés

### 2. Vérification de la Structure
```bash
# Vérifier que les nouveaux fichiers existent
ls server/src/game/game-persistence.service.ts
ls server/src/game/interfaces/game-history.interface.ts
ls web/app/game/[gameId]/page.tsx
ls web/app/game/history/[gameId]/page.tsx
```

- [ ] Tous les fichiers backend sont présents
- [ ] Tous les fichiers frontend sont présents
- [ ] Les fichiers de documentation sont créés

## Démarrage

### 1. Backend (Terminal 1)
```bash
cd server
pnpm dev
```

**Vérifications** :
- [ ] Le serveur démarre sur le port 3001
- [ ] Message : "Nest application successfully started"
- [ ] Pas d'erreur de compilation TypeScript
- [ ] API accessible : http://localhost:3001

**Test rapide** :
```bash
# Dans un autre terminal
curl http://localhost:3001/game/config
```
- [ ] La requête retourne du JSON avec les règles du jeu

### 2. Frontend (Terminal 2)
```bash
cd web
pnpm dev
```

**Vérifications** :
- [ ] Le serveur démarre sur le port 3000
- [ ] Message : "Ready in XXXms"
- [ ] Pas d'erreur de compilation
- [ ] Application accessible : http://localhost:3000

**Test rapide** :
- [ ] Ouvrir http://localhost:3000/game
- [ ] La page d'accueil charge
- [ ] Le bouton "Nouvelle partie" est visible

## Test du Système Complet

### 1. Créer une Partie

**Actions** :
1. [ ] Aller sur http://localhost:3000/game
2. [ ] Cliquer sur "Nouvelle partie"
3. [ ] Vérifier la redirection vers `/game/{uuid}`
4. [ ] L'URL contient bien un UUID

**Vérifications** :
- [ ] La page de jeu charge
- [ ] Phase affichée : "deck-selection"
- [ ] Deux sections pour Joueur 1 et Joueur 2

### 2. Sélection des Decks

**Actions** :
1. [ ] Sélectionner 19 pièces pour Joueur 1
2. [ ] Cliquer "Confirmer la sélection"
3. [ ] Sélectionner 19 pièces pour Joueur 2
4. [ ] Cliquer "Confirmer la sélection"

**Vérifications** :
- [ ] Message : "Les deux joueurs ont sélectionné leur deck"
- [ ] Phase passe à "setup"
- [ ] Sections de configuration des renforts apparaissent

### 3. Configuration des Renforts

**Actions** :
1. [ ] Sélectionner 4 pièces pour Joueur 1
2. [ ] Cliquer "Confirmer"
3. [ ] Sélectionner 4 pièces pour Joueur 2
4. [ ] Cliquer "Confirmer"
5. [ ] Cliquer "Démarrer la partie"

**Vérifications** :
- [ ] Phase passe à "playing"
- [ ] Le plateau de jeu s'affiche (8x8)
- [ ] Les généraux sont placés
- [ ] Les renforts sont dans la colonne H
- [ ] Points d'action affichés

### 4. Jouer des Actions

**Actions** :
1. [ ] Cliquer sur une pièce du joueur actuel
2. [ ] Cliquer sur une case verte (mouvement valide)
3. [ ] La pièce se déplace
4. [ ] Les points d'action diminuent
5. [ ] Cliquer "Terminer le tour"

**Vérifications** :
- [ ] Les pièces se déplacent correctement
- [ ] Les points d'action se consomment
- [ ] Le tour passe au joueur suivant
- [ ] Le numéro de tour s'incrémente

### 5. Test du F5 (Persistance)

**Actions** :
1. [ ] Pendant une partie, noter l'URL : `/game/{uuid}`
2. [ ] Appuyer sur **F5** (rafraîchissement)
3. [ ] Attendre le rechargement

**Vérifications** :
- [ ] La page se recharge
- [ ] L'état de la partie est identique (même tour, mêmes pièces)
- [ ] Le jeu continue normalement
- [ ] Aucune donnée perdue

### 6. Liste des Parties

**Actions** :
1. [ ] Aller sur http://localhost:3000/game
2. [ ] Vérifier la liste des parties

**Vérifications** :
- [ ] La partie créée apparaît dans la liste
- [ ] Carte affiche : phase, tour, joueur actuel
- [ ] Badges colorés par phase
- [ ] Dates de création/mise à jour
- [ ] Boutons "Rejoindre" et "Historique"

### 7. Historique et Replay

**Actions** :
1. [ ] Depuis une partie en cours ou la liste
2. [ ] Cliquer "Voir l'historique" ou "Historique"
3. [ ] Redirection vers `/game/history/{uuid}`

**Vérifications** :
- [ ] Timeline des actions à gauche
- [ ] Plateau de jeu au centre
- [ ] Clic sur une action affiche l'état correspondant
- [ ] Filtrage par tour fonctionne
- [ ] Badge coloré par type d'action
- [ ] Timestamps affichés

### 8. Rejouer une Partie

**Actions** :
1. [ ] Dans l'historique, cliquer sur différentes actions
2. [ ] Observer le plateau changer
3. [ ] Utiliser le filtre par tour
4. [ ] Naviguer entre les actions

**Vérifications** :
- [ ] Le plateau se met à jour à chaque clic
- [ ] L'état correspond exactement à l'action
- [ ] Les informations de jeu sont correctes (tour, joueurs)
- [ ] Le filtrage par tour fonctionne
- [ ] Navigation fluide

## Test API (Optionnel)

### PowerShell

```powershell
# Test 1 : Créer une partie
$response = Invoke-WebRequest -Uri "http://localhost:3001/game/create" -Method POST -ContentType "application/json" -Body "{}"
$game = $response.Content | ConvertFrom-Json
$gameId = $game.id
Write-Host "✅ Partie créée : $gameId"

# Test 2 : Récupérer la partie
$response = Invoke-WebRequest -Uri "http://localhost:3001/game/$gameId"
Write-Host "✅ Partie récupérée"

# Test 3 : Lister les parties
$response = Invoke-WebRequest -Uri "http://localhost:3001/game/list"
$games = $response.Content | ConvertFrom-Json
Write-Host "✅ $($games.Count) partie(s) trouvée(s)"
```

**Résultats attendus** :
- [ ] La partie est créée avec un UUID
- [ ] La partie peut être récupérée
- [ ] La liste contient la partie créée

## Vérification des Logs

### Backend (Terminal 1)
Rechercher les messages suivants :
- [ ] `[NestApplication] Nest application successfully started`
- [ ] `Creating new game (deck selection phase)`
- [ ] `Game {uuid} saved`
- [ ] `Action {uuid} recorded for game {uuid}`

### Frontend (Terminal 2)
Rechercher les messages suivants :
- [ ] `✓ Ready in XXXms`
- [ ] Pas d'erreur de compilation
- [ ] Pas de warnings React

### Console Navigateur (F12)
- [ ] Pas d'erreurs JavaScript
- [ ] Requêtes API réussies (Status 200)
- [ ] Pas de warnings React

## Dépannage

### Problème : Le backend ne démarre pas
- [ ] Vérifier que le port 3001 est libre
- [ ] Vérifier les dépendances : `cd server && pnpm install`
- [ ] Vérifier les erreurs TypeScript : `cd server && pnpm run build`

### Problème : Le frontend ne démarre pas
- [ ] Vérifier que le port 3000 est libre
- [ ] Vérifier les dépendances : `cd web && pnpm install`
- [ ] Vérifier `.env.local` existe avec `NEXT_PUBLIC_API_URL=http://localhost:3001`

### Problème : Erreur "Partie introuvable" après F5
- [ ] Vérifier que le backend n'a pas été redémarré
- [ ] Vérifier que l'UUID dans l'URL est correct
- [ ] Vérifier les logs backend pour "Game {uuid} saved"

### Problème : L'historique est vide
- [ ] Vérifier que des actions ont été effectuées
- [ ] Vérifier les logs backend pour "Action {uuid} recorded"
- [ ] Vérifier l'API : `curl http://localhost:3001/game/{uuid}/history`

### Problème : Les actions ne fonctionnent pas
- [ ] Vérifier que c'est le bon joueur qui joue
- [ ] Vérifier qu'il reste des points d'action
- [ ] Vérifier la console navigateur (F12) pour les erreurs
- [ ] Vérifier les logs backend pour les erreurs

## Documentation

### Lire en priorité :
1. [ ] [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - Vue d'ensemble rapide
2. [ ] [USAGE_GUIDE.md](./USAGE_GUIDE.md) - Guide utilisateur complet
3. [ ] [GAME_MANAGEMENT.md](./GAME_MANAGEMENT.md) - Documentation technique

### Pour aller plus loin :
- [ ] [API_TESTING.md](./API_TESTING.md) - Tests API avec curl/PowerShell
- [ ] [CHANGELOG.md](./CHANGELOG.md) - Liste détaillée des changements
- [ ] [QUICKSTART.md](./QUICKSTART.md) - Guide de démarrage rapide

## ✅ Système Opérationnel

Si toutes les cases sont cochées, félicitations ! 🎉

Votre système de gestion des parties WarstruckJS est complètement opérationnel avec :
- ✅ UUID uniques pour chaque partie
- ✅ Persistance complète (F5 fonctionne)
- ✅ Historique complet de toutes les actions
- ✅ Système de replay fonctionnel
- ✅ Interface utilisateur intuitive
- ✅ API REST complète
- ✅ Documentation exhaustive

**Prochaines étapes recommandées** :
1. Jouer quelques parties complètes
2. Tester le replay sur une partie terminée
3. Explorer l'API avec les exemples dans `API_TESTING.md`
4. Lire `GAME_MANAGEMENT.md` pour comprendre l'architecture
5. Commencer à implémenter les améliorations futures

**Bon jeu !** 🎮

## Support

En cas de problème :
1. Consulter la section Dépannage ci-dessus
2. Vérifier les logs (backend + frontend + navigateur)
3. Consulter `USAGE_GUIDE.md` section "Dépannage"
4. Vérifier que tous les fichiers sont bien créés
