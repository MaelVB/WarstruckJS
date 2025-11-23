# Guide de Démarrage Rapide - Système 1vs1

## 🎮 Ce qui a été implémenté

Un système complet de jeu 1vs1 en temps réel avec Socket.IO comprenant:

✅ **Matchmaking automatique** - File d'attente pour trouver un adversaire
✅ **Communication temps réel** - Synchronisation instantanée via WebSocket
✅ **Gestion complète du jeu** - Toutes les phases (deck, setup, jeu)
✅ **Chat intégré** - Communication entre joueurs
✅ **Gestion de déconnexion** - Détection et notification
✅ **Interface de démonstration** - Page complète de test

## 🚀 Démarrage

### Prérequis
- Node.js et pnpm installés
- MongoDB en cours d'exécution (ou Docker avec `docker-compose up -d`)

### Lancer l'application

Le monorepo utilise Turbo pour lancer serveur et client ensemble:

```powershell
pnpm dev
```

Cela démarre:
- **Serveur**: http://localhost:3001 (API REST + WebSocket)
- **Client**: http://localhost:3000

## 🎯 Tester le système 1vs1

### Option 1: Deux navigateurs (recommandé)

1. Ouvrir deux fenêtres de navigateur
2. Dans chaque fenêtre, aller sur http://localhost:3000/matchmaking
3. Entrer des noms différents (ex: "Joueur 1" et "Joueur 2")
4. Cliquer sur "Join Queue" dans les deux fenêtres
5. Le match se crée automatiquement!

### Option 2: Deux appareils

1. Trouver votre IP locale: `ipconfig` (Windows) ou `ifconfig` (Mac/Linux)
2. Sur le 1er appareil: http://localhost:3000/matchmaking
3. Sur le 2ème appareil: http://[VOTRE_IP]:3000/matchmaking
4. Rejoindre la queue sur les deux appareils

## 📋 Flux de jeu

1. **Matchmaking** → Les joueurs rejoignent la queue
2. **Match trouvé** → Affichage du gameId, rôle (attacker/defender), adversaire
3. **Deck Selection** → Cliquer sur "Select Deck (Auto)" (19 pièces)
4. **Setup Phase** → Cliquer sur "Setup Reinforcements (Auto)" (4 pièces)
5. **Start Game** → Un joueur clique sur "Start Game"
6. **Playing** → Tour par tour, utiliser "End Turn" pour passer au suivant
7. **Chat** → Envoyer des messages pendant la partie

## 📁 Nouveaux fichiers créés

### Backend
- `server/src/game/game.gateway.ts` - Gateway Socket.IO principal

### Frontend
- `web/lib/gameSocket.ts` - Client Socket.IO TypeScript
- `web/app/matchmaking/page.tsx` - Interface de démonstration

### Documentation
- `REALTIME_1VS1.md` - Documentation complète du système

## 🔧 Configuration

### Serveur (server/.env)
```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/warstruck
CORS_ORIGIN=http://localhost:3000
```

### Client (web/.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=http://localhost:3001
```

## 📊 Événements Socket.IO disponibles

### Client → Serveur
- `join-queue` - Rejoindre la file d'attente
- `leave-queue` - Quitter la file
- `select-deck` - Sélectionner son deck
- `place-general` - Placer son général
- `setup-reinforcements` - Configurer les renforts
- `start-game` - Démarrer la partie
- `execute-action` - Effectuer une action de jeu
- `send-message` - Envoyer un message de chat

### Serveur → Client
- `match-found` - Match trouvé
- `game-updated` - État du jeu mis à jour
- `game-started` - Partie démarrée
- `game-finished` - Partie terminée
- `player-disconnected` - Joueur déconnecté
- `chat-message` - Message de chat
- `error` - Erreur

## 🐛 Dépannage

### Le serveur ne démarre pas
```powershell
cd server
pnpm install
pnpm build
pnpm dev
```

### Le client ne se connecte pas
1. Vérifier que le serveur est démarré sur le port 3001
2. Vérifier la console du navigateur pour les erreurs
3. Vérifier que MongoDB est en cours d'exécution

### Les joueurs ne se matchent pas
1. Vérifier que les deux joueurs sont bien connectés (badge vert)
2. Regarder les logs du serveur pour les événements `join-queue`
3. Rafraîchir les pages si nécessaire

## 📚 Documentation détaillée

Voir `REALTIME_1VS1.md` pour:
- Architecture complète
- Structure des données
- Tous les événements Socket.IO
- Points d'amélioration futurs

## 🎨 Interface de démonstration

La page `/matchmaking` inclut:
- ✅ Statut de connexion
- ✅ File d'attente avec position
- ✅ Informations du match (ID, rôle, adversaire)
- ✅ État du jeu (phase, tour, joueur actuel)
- ✅ Actions automatiques pour test rapide
- ✅ Chat en temps réel
- ✅ Gestion des déconnexions

## 🔐 Notes de sécurité

⚠️ **Pour la production:**
- Ajouter une authentification (JWT, sessions)
- Configurer CORS correctement (pas `*`)
- Valider tous les inputs côté serveur
- Implémenter un rate limiting
- Sécuriser la connexion WebSocket (WSS)
- Ajouter des logs et monitoring

## 🚧 Prochaines étapes suggérées

1. **Validation des mouvements** - Implémenter les règles complètes
2. **UI du plateau** - Créer une interface visuelle du jeu
3. **Persistance** - Sauvegarder les parties pour reconnexion
4. **Timer** - Ajouter des limites de temps par tour
5. **Classement** - Système d'ELO et statistiques
6. **Replay** - Système de revue des parties

## 💡 Astuces

- **Dev rapide**: Utilisez les boutons "Auto" pour tester rapidement
- **Debug**: Regardez la console du navigateur et les logs du serveur
- **Chat**: Testez la communication entre joueurs
- **Déconnexion**: Fermez un navigateur pour tester la gestion de déconnexion

---

Bon jeu! 🎲
