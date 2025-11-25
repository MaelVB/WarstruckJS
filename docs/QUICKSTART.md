# 🚀 Guide de Démarrage Rapide - Warstruck JS

Ce guide vous permettra de lancer le projet en moins de 5 minutes.

## 📋 Prérequis

- **Node.js** v18+ installé
- **pnpm** installé (`npm install -g pnpm`)
- **Docker Desktop** (pour MongoDB)

## ⚡ Démarrage en 3 Étapes

### 1. Installer les dépendances

```powershell
# À la racine du projet
pnpm install
```

### 2. Démarrer MongoDB

```powershell
# Démarre MongoDB dans Docker
docker-compose up -d

# Vérifier que c'est démarré
docker ps
```

Vous devriez voir deux conteneurs :
- `warstruck-mongodb` (port 27017)
- `warstruck-mongo-express` (port 8081)

### 3. Lancer l'application

```powershell
# Lance serveur + client en parallèle
pnpm dev
```

Le monorepo Turbo va démarrer :
- **Backend** : http://localhost:3001
- **Frontend** : http://localhost:3000
- **Mongo Express** : http://localhost:8081

## 🎮 Tester le Jeu

### Option A : Mode Solo (Démo)

1. Ouvrir http://localhost:3000
2. Cliquer sur "Jouer (Mode Démo)"
3. Une partie se crée automatiquement en mode local

### Option B : Mode Multijoueur 1v1

1. **Première fenêtre** : http://localhost:3000/matchmaking
   - Entrer un nom (ex: "Joueur 1")
   - Cliquer sur "Join Queue"

2. **Deuxième fenêtre** (nouveau navigateur ou onglet incognito) : http://localhost:3000/matchmaking
   - Entrer un nom différent (ex: "Joueur 2")
   - Cliquer sur "Join Queue"

3. **Match automatique** : Les deux joueurs sont connectés !

4. **Jouer** :
   - Phase 1 : Sélection du deck (automatique en mode démo)
   - Phase 2 : Setup des renforts
   - Phase 3 : Partie commence !

## 📊 Vérifier MongoDB

Ouvrir http://localhost:8081 (Mongo Express)
- Cliquer sur la base `warstruck`
- Cliquer sur la collection `games`
- Voir toutes les parties créées !

## 🧪 Tester l'API

### Créer une partie

```powershell
curl -X POST http://localhost:3001/game/create -H "Content-Type: application/json" -d "{}"
```

### Lister les parties

```powershell
curl http://localhost:3001/game/list
```

### Récupérer une partie

```powershell
# Remplacer {gameId} par l'ID de la partie
curl http://localhost:3001/game/{gameId}
```

## 🔧 Commandes Utiles

### Développement

```powershell
# Lancer tout (serveur + client)
pnpm dev

# Lancer uniquement le serveur
cd server
pnpm dev

# Lancer uniquement le client
cd web
pnpm dev
```

### MongoDB

```powershell
# Démarrer MongoDB
docker-compose up -d

# Arrêter MongoDB
docker-compose down

# Supprimer toutes les données
docker-compose down -v

# Voir les logs MongoDB
docker-compose logs -f mongodb
```

### Build et Production

```powershell
# Build tout
pnpm build

# Lancer en production
pnpm start
```

## 🐛 Problèmes Courants

### Port déjà utilisé

**Erreur** : `Error: listen EADDRINUSE: address already in use :::3001`

**Solution** :
```powershell
# Windows : Trouver le processus
netstat -ano | findstr :3001

# Tuer le processus (remplacer PID)
taskkill /PID <PID> /F
```

### MongoDB ne se connecte pas

**Erreur** : `MongooseError: connect ECONNREFUSED 127.0.0.1:27017`

**Solution** :
```powershell
# Vérifier que Docker tourne
docker ps

# Si pas de conteneurs, relancer
docker-compose up -d
```

### pnpm command not found

**Solution** :
```powershell
npm install -g pnpm
```

## 📖 Prochaines Étapes

Maintenant que le projet fonctionne, consultez :

1. **[IMPLEMENTATION.md](./IMPLEMENTATION.md)** - Comprendre les règles du jeu
2. **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Explorer la structure du code
3. **[TECHNICAL_GUIDE.md](./TECHNICAL_GUIDE.md)** - Fonctionnalités avancées

## 💡 Astuces

### Rechargement Automatique

Les deux serveurs (backend/frontend) ont le hot-reload activé :
- Modifiez un fichier `.ts` dans `server/src/` → le serveur redémarre
- Modifiez un fichier `.tsx` dans `web/app/` → le client se recharge

### Travailler sur une seule partie

```powershell
# Backend uniquement
cd server
pnpm dev

# Frontend uniquement (nécessite le backend actif)
cd web
pnpm dev
```

### Réinitialiser tout

```powershell
# Supprimer node_modules et reconstruire
pnpm clean
pnpm install

# Réinitialiser la base de données
docker-compose down -v
docker-compose up -d
```

---

**Prêt à jouer ! 🎮** Si vous rencontrez des problèmes, consultez le [README principal](./README.md) ou les autres guides de documentation.
