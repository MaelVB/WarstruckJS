# 🚀 Guide de Démarrage Rapide

## Prérequis

- **Node.js** : v18+ recommandé
- **pnpm** : v9+ (gestionnaire de packages)

Installation de pnpm :
```bash
npm install -g pnpm@9
```

## Installation

```bash
# Cloner le projet
git clone <url-du-repo>
cd WarstruckJS

# Installer toutes les dépendances
pnpm install
```

## Lancement en Développement

```bash
# Depuis la racine, lancer les deux services :
pnpm dev
```

Cela démarre :
- ✅ **Frontend Next.js** sur http://localhost:3000
- ✅ **Backend NestJS** sur http://localhost:3001

## URLs

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | Interface utilisateur |
| Backend | http://localhost:3001 | API REST |
| API Game | http://localhost:3001/game | Endpoints du jeu |

## Commandes Principales

### Développement
```bash
pnpm dev          # Lance tout en dev
pnpm dev --filter warstruck-web    # Uniquement le frontend
pnpm dev --filter warstruck-server # Uniquement le backend
```

### Build
```bash
pnpm build        # Build tout
pnpm build --filter warstruck-web    # Build frontend
pnpm build --filter warstruck-server # Build backend
```

### Production
```bash
pnpm build        # Build d'abord
pnpm start        # Lance en production
```

## Structure des Packages

```
WarstruckJS/
├── server/       → warstruck-server (Backend NestJS)
└── web/          → warstruck-web (Frontend Next.js)
```

## Configuration

### Variables d'Environnement

Créer un fichier `.env` dans le dossier `server/` :

```bash
# server/.env
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

Voir `server/.env.example` pour plus de détails.

## Test de l'API

### Avec PowerShell
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/game/config" -Method Get
```

### Avec curl
```bash
curl http://localhost:3001/game/config
```

### Avec un client HTTP
- Postman
- Insomnia
- Thunder Client (VS Code)
- REST Client (VS Code)

Voir `server/API_TESTS.md` pour plus d'exemples.

## Documentation

| Fichier | Description |
|---------|-------------|
| [README.md](./README.md) | Vue d'ensemble |
| [IMPLEMENTATION.md](./IMPLEMENTATION.md) | Règles du jeu |
| [REFACTORING.md](./REFACTORING.md) | Changelog refactorisation |
| [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) | Structure complète |
| [server/README.md](./server/README.md) | Doc backend |
| [server/API_TESTS.md](./server/API_TESTS.md) | Tests API |

## Résolution de Problèmes

### Le serveur ne démarre pas
```bash
# Vérifier les dépendances
cd server
pnpm install

# Vérifier la compilation
pnpm build
```

### Port déjà utilisé
```bash
# Changer le port dans server/.env
PORT=3002
```

### Hot reload ne fonctionne pas
```bash
# Relancer avec --files
cd server
pnpm start:dev
```

### Erreur de dépendances peer
```bash
# Réinstaller toutes les dépendances
rm -rf node_modules server/node_modules web/node_modules
pnpm install
```

## Développement

### Créer une nouvelle route API

1. Ajouter dans `server/src/game/game.controller.ts` :
```typescript
@Get('new-endpoint')
newEndpoint(): string {
  return this.gameService.newMethod();
}
```

2. Ajouter dans `server/src/game/game.service.ts` :
```typescript
newMethod(): string {
  return 'Hello World';
}
```

3. Le serveur recharge automatiquement !

### Créer une nouvelle page

1. Créer `web/app/nouvelle-page/page.tsx` :
```typescript
export default function NouvellePage() {
  return <div>Nouvelle page</div>;
}
```

2. Accéder à http://localhost:3000/nouvelle-page

## Support

Pour toute question, consulter :
- Les fichiers de documentation
- Les commentaires dans le code
- Le fichier IMPLEMENTATION.md pour les règles du jeu

## Contributeurs

[Ajoutez vos contributeurs ici]

## Licence

MIT
