# 🎮 WarstruckJS

Jeu de plateau tactique Warstruck implémenté avec **NestJS** (serveur) et **Next.js** (client web). Ce prototype inclut un plateau de jeu interactif 8x8 avec système de tours, gestion des pièces, et mécaniques de jeu complètes.

> ✨ **Nouveau** : Gestion complète des parties avec UUID, **persistance MongoDB**, historique et système de replay !

> 🎯 **Dernières Modifications (v1.1.0)** : 
> - **Decks pré-enregistrés** avec deck par défaut (2 Colonels, 10 Fantassins, 7 Éclaireurs)
> - **Restrictions de déplacement** dans la colonne des renforts (seules H8/H1 déployables)
> - **Phase post-turn** avec déplacement automatique des renforts et ajout optionnel
> 
> 📖 Voir **[docs/modifications-v1.1.0/](./docs/modifications-v1.1.0/)** pour la documentation complète.
> 
> 📚 **Documentation Organisée** : Tous les guides sont maintenant dans **[docs/](./docs/)** - Consultez **[docs/README.md](./docs/README.md)** pour l'index complet.

## 🎮 Fonctionnalités Principales

### ✅ Implémenté
- **Plateau de jeu 8x8** avec zones spéciales (renforts, frontière, déploiement)
- **Système de tours** avec gestion des points d'action
- **4 types de pièces** : Général, Colonel, Fantassin, Éclaireur (avec capacités)
- **Mécanique de jeu complète** : déplacement, attaque, destruction, déploiement
- **Renforts et réserve** : système de file avec pièces face cachée
- **Condition de victoire** : élimination du général adverse
- **Interface interactive** : sélection et déplacement de pièces en temps réel
- **🆕 Gestion des parties** : UUID unique, URLs persistantes, rechargement (F5) sans perte
- **🆕 Historique complet** : Chaque action est enregistrée avec timestamp
- **🆕 Système de replay** : Rejouer une partie action par action ou par tour
- **🆕 Liste des parties** : Vue d'ensemble de toutes les parties en cours et terminées

### 🚧 À Venir
- Grilles de déplacement spécifiques par pièce
- Zones d'influence des hauts gradés
- Effets des capacités actives
- Système de combos d'unités
- Authentification des joueurs
- WebSockets pour multijoueur en temps réel
- Statistiques et analyse de parties

Voir [IMPLEMENTATION.md](./IMPLEMENTATION.md) et [GAME_MANAGEMENT.md](./GAME_MANAGEMENT.md) pour les détails complets.

## 📁 Structure

### Backend (`server/`)
Service NestJS professionnel avec :
- ✅ **Architecture modulaire** : common, config, game
- ✅ **DTOs** pour validation des données
- ✅ **Intercepteurs** pour logging automatique
- ✅ **Filtres** pour gestion des erreurs
- ✅ **Configuration** externalisée avec @nestjs/config
- 📚 Documentation : [server/README.md](./server/README.md)

### Frontend (`web/`)
Client Next.js avec App Router :
- Interface de jeu interactive
- Composants React réutilisables
- Intégration API REST

### Monorepo
Le repository utilise **Turborepo** avec **pnpm workspaces** pour une gestion optimisée des dépendances et des builds.

## 🚀 Démarrage Rapide

> 📖 **Guide complet** : Voir [QUICKSTART.md](./QUICKSTART.md)

### Installation
```bash
# Installer pnpm si nécessaire
npm install -g pnpm@9

# Installer toutes les dépendances
pnpm install
```

### Lancer en Développement
```bash
# Lance le backend (3001) + frontend (3000)
pnpm dev
```

Cela démarre :
- **Backend API** : http://localhost:3001 (NestJS)
- **Frontend Web** : http://localhost:3000 (Next.js)

### Jouer au Mode Démo
1. Ouvrir http://localhost:3000
2. Cliquer sur "🎮 Jouer (Mode Démo)"
3. Cliquer sur "Configurer la partie de démo"
4. Sélectionner une pièce et la déplacer sur une case verte
5. Terminer le tour quand les points d'action sont épuisés

### Commandes Individuelles
```bash
# Backend uniquement
cd server && pnpm dev

# Frontend uniquement
cd web && pnpm dev

# Build tout
pnpm build
```

## 📖 Règles du Jeu

### Plateau
- **Échiquier 8x8** avec notation standard (A-H, 1-8)
- **Colonne H** : colonne des renforts
- **Lignes 4-5** : frontière
- **Lignes 1 et 8** : lignes de déploiement
- **Réserve** : zone hors plateau (pièces face cachée)

### Déroulement
1. Chaque joueur prépare un deck de 20 pièces
2. Jet de pièce pour déterminer attaquant/défenseur
3. Placement du général et 4 pièces en renforts (face cachée sauf la 1ère)
4. Le défenseur joue en premier, l'attaquant avance son général d'une case
5. À chaque tour : actions selon les points disponibles
6. Victoire : éliminer le général adverse

### Actions (1 point d'action chacune)
- **Déplacer** une pièce
- **Attaquer** une pièce adverse
- **Utiliser** une capacité
- **Déployer** depuis les renforts (sur ligne de déploiement)
- **Ajouter** une pièce de la réserve aux renforts

### Points d'Action
- **1 de base** par tour
- **+2** par Général sur le plateau
- **+1** par Colonel sur le plateau

## 🎯 API Endpoints

### Configuration
- `GET /game/config` - Obtenir les règles et pièces du jeu

### Gestion de Partie
- `POST /game/create` - Créer une nouvelle partie
- `GET /game/list` - **🆕** Liste de toutes les parties
- `GET /game/:gameId` - Obtenir l'état d'une partie
- `POST /game/:gameId/select-deck` - Sélectionner le deck (20 pièces)
- `POST /game/:gameId/place-general` - Placer le général (setup)
- `POST /game/:gameId/setup-reinforcements` - Configurer les renforts (setup)
- `POST /game/:gameId/start` - Démarrer la partie
- `POST /game/:gameId/action` - Exécuter une action

### Historique et Replay
- `GET /game/:gameId/history` - **🆕** Historique complet d'une partie
- `GET /game/:gameId/replay/action/:actionId` - **🆕** Rejouer jusqu'à une action
- `GET /game/:gameId/replay/turn/:turnNumber` - **🆕** Rejouer jusqu'à un tour

## 🛠️ Technologies

### Backend
- **NestJS 11** : Framework Node.js progressif
- **TypeScript** : Typage statique
- **@nestjs/config** : Configuration centralisée
- **class-validator** : Validation des DTOs
- **uuid** : Identifiants uniques

### Frontend
- **Next.js 14** : Framework React avec App Router
- **React 18** : Interface utilisateur
- **Mantine UI** : Composants UI
- **TypeScript** : Typage statique

### DevOps
- **Turborepo** : Orchestration monorepo
- **pnpm** : Gestionnaire de packages rapide
- **ts-node** : Exécution TypeScript
- **node --watch** : Hot reload

### À venir
- MongoDB pour persistence
- WebSockets / Socket.io pour temps réel
- Docker pour déploiement

## 📚 Documentation

### 📖 Documentation Complète
Toute la documentation est organisée dans le dossier **[docs/](./docs/)** :

| Document | Description |
|----------|-------------|
| **[docs/README.md](./docs/README.md)** | 📚 **Index complet** de toute la documentation |
| [QUICKSTART.md](./QUICKSTART.md) | 🚀 Guide de démarrage rapide |
| [CHANGELOG.md](./CHANGELOG.md) | � Historique des changements |
| [CHECKLIST.md](./CHECKLIST.md) | ✅ Checklist de développement |

### 🎯 Modifications Récentes (v1.1.0)
Les dernières modifications sont dans **[docs/modifications-v1.1.0/](./docs/modifications-v1.1.0/)** :

- **[QUICK_START](./docs/modifications-v1.1.0/QUICK_START_MODIFICATIONS.md)** ⚡ - Résumé en 30 secondes
- **[RÉCAPITULATIF](./docs/modifications-v1.1.0/RÉCAPITULATIF_FINAL.md)** - Vue d'ensemble complète
- **[RÈGLES](./docs/modifications-v1.1.0/RÈGLES_MODIFICATIONS.md)** - Nouvelles règles du jeu
- **[TESTS](./docs/modifications-v1.1.0/GUIDE_DE_TEST.md)** - Guide de test
- **[DÉBOGAGE](./docs/modifications-v1.1.0/GUIDE_DÉBOGAGE.md)** - Aide au débogage

### 📑 Documentation par Thème

| Thème | Documents |
|-------|-----------|
| **Architecture** | [PROJECT_STRUCTURE](./docs/PROJECT_STRUCTURE.md), [SUMMARY](./docs/SUMMARY.md), [REFACTORING](./docs/REFACTORING.md) |
| **Règles du Jeu** | [IMPLEMENTATION](./docs/IMPLEMENTATION.md), [RÈGLES_MODIFICATIONS](./docs/modifications-v1.1.0/RÈGLES_MODIFICATIONS.md) |
| **API** | [API_TESTING](./docs/API_TESTING.md), [server/README.md](./server/README.md) |
| **Parties** | [GAME_MANAGEMENT](./docs/GAME_MANAGEMENT.md), [USAGE_GUIDE](./docs/USAGE_GUIDE.md) |
| **Multijoueur** | [REALTIME_1VS1](./docs/REALTIME_1VS1.md), [QUICKSTART_1VS1](./docs/QUICKSTART_1VS1.md) |
| **Base de Données** | [MONGODB_QUICKSTART](./docs/MONGODB_QUICKSTART.md), [MONGODB_MIGRATION](./docs/MONGODB_MIGRATION.md) |

## 📝 Contribuer

Voir [IMPLEMENTATION.md](./IMPLEMENTATION.md) pour les fonctionnalités manquantes et les prochaines étapes.

## 📄 Licence

MIT
