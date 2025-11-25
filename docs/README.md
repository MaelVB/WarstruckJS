# 📚 Documentation Warstruck JS

Bienvenue dans la documentation de Warstruck JS, un jeu de stratégie au tour par tour inspiré de Stratego.

## 🚀 Démarrage Rapide

**Nouveau développeur ?** Commencez ici :

1. **[QUICKSTART.md](./QUICKSTART.md)** - Installation et premier lancement (5 min)
2. **[IMPLEMENTATION.md](./IMPLEMENTATION.md)** - Comprendre les règles du jeu (10 min)
3. **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Structure du projet (15 min)

## 📖 Documentation Complète

### Pour les Développeurs

| Document | Description | Durée |
|----------|-------------|-------|
| **[QUICKSTART.md](./QUICKSTART.md)** | Installation, démarrage et premiers tests | 5-10 min |
| **[ARCHITECTURE.md](./ARCHITECTURE.md)** | Structure du projet, architecture, refactoring | 15 min |
| **[TECHNICAL_GUIDE.md](./TECHNICAL_GUIDE.md)** | Fonctionnalités avancées (1v1, historique, replay) | 20 min |
| **[BACKEND_SETUP.md](./BACKEND_SETUP.md)** | Configuration MongoDB et tests API | 10 min |
| **[IMPLEMENTATION.md](./IMPLEMENTATION.md)** | Règles complètes du jeu | 15 min |

### Parcours Recommandés

#### 🆕 Nouveau Développeur
```
README.md → QUICKSTART.md → ARCHITECTURE.md → IMPLEMENTATION.md
```

#### 🧪 Testeur / QA
```
QUICKSTART.md → IMPLEMENTATION.md → BACKEND_SETUP.md (section tests)
```

#### 🔧 Backend Developer
```
ARCHITECTURE.md → TECHNICAL_GUIDE.md → BACKEND_SETUP.md
```

#### 🎨 Frontend Developer
```
ARCHITECTURE.md → TECHNICAL_GUIDE.md → IMPLEMENTATION.md
```

## 🎯 Résumé du Projet

**Warstruck JS** est un jeu de stratégie multijoueur développé avec :

- **Backend** : NestJS + Socket.IO + MongoDB
- **Frontend** : Next.js 14 (App Router) + Mantine UI
- **Monorepo** : Turborepo + pnpm workspaces

### Fonctionnalités Principales

✅ **Système de jeu complet** : Plateau 8x8, 4 types de pièces, système de renforts  
✅ **Multijoueur en temps réel** : Matchmaking automatique via WebSocket  
✅ **Persistance des parties** : MongoDB avec historique complet  
✅ **Système de replay** : Rejouez n'importe quelle partie action par action  
✅ **Decks pré-enregistrés** : 4 decks disponibles (Défaut, Commandement, Assaut, Mobilité)  
✅ **Restrictions de déplacement** : Colonne H, renforts, déploiement  
✅ **Phase post-turn** : Gestion des renforts entre les tours

## � Structure Simplifiée

```
docs/
├── README.md (ce fichier)
│
├── modifications-v1.1.0/           # Modifications récentes
│   ├── QUICK_START_MODIFICATIONS.md
│   ├── RÉCAPITULATIF_FINAL.md
│   ├── RÈGLES_MODIFICATIONS.md
│   ├── MODIFICATIONS_SUMMARY.md
│   ├── POINTS_CLÉS_IMPLEMENTATION.md
│   ├── GUIDE_DE_TEST.md
│   └── GUIDE_DÉBOGAGE.md
│
├── API_TESTING.md                  # Tests API
├── GAME_MANAGEMENT.md              # Gestion des parties
├── IMPLEMENTATION.md               # Règles du jeu
├── MONGODB_MIGRATION.md            # Migration MongoDB
├── MONGODB_QUICKSTART.md           # Démarrage MongoDB
├── PROJECT_STRUCTURE.md            # Structure du projet
├── QUICKSTART_1VS1.md              # Guide 1v1
├── REALTIME_1VS1.md                # Temps réel 1v1
├── REFACTORING.md                  # Détails refactorisation
├── SUMMARY.md                      # Résumé refactorisation
└── USAGE_GUIDE.md                  # Guide utilisateur
```

---

## 🔍 Recherche Rapide

### Par Sujet

| Sujet | Fichier |
|-------|---------|
| Commencer rapidement | [QUICKSTART.md](../QUICKSTART.md) |
| Dernières modifications | [modifications-v1.1.0/](./modifications-v1.1.0/) |
| Règles du jeu | [IMPLEMENTATION.md](./IMPLEMENTATION.md) |
| Structure du code | [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) |
| Tests API | [API_TESTING.md](./API_TESTING.md) |
| Gestion parties | [GAME_MANAGEMENT.md](./GAME_MANAGEMENT.md) |
| Multijoueur | [REALTIME_1VS1.md](./REALTIME_1VS1.md) |
| MongoDB | [MONGODB_QUICKSTART.md](./MONGODB_QUICKSTART.md) |
| Débogage | [modifications-v1.1.0/GUIDE_DÉBOGAGE.md](./modifications-v1.1.0/GUIDE_DÉBOGAGE.md) |

### Par Public

| Public | Documents Recommandés |
|--------|----------------------|
| **Nouveau développeur** | QUICKSTART.md → PROJECT_STRUCTURE.md → IMPLEMENTATION.md |
| **Joueur/Testeur** | QUICKSTART_1VS1.md → RÈGLES_MODIFICATIONS.md → GUIDE_DE_TEST.md |
| **Développeur backend** | GAME_MANAGEMENT.md → API_TESTING.md → modifications-v1.1.0/ |
| **Développeur frontend** | USAGE_GUIDE.md → MODIFICATIONS_SUMMARY.md |
| **DevOps** | MONGODB_MIGRATION.md → REALTIME_1VS1.md |

---

## 📝 Historique des Versions

### Version 1.1.0 (25 Nov 2025)
- ✅ Decks pré-enregistrés
- ✅ Restrictions de déplacement colonne H
- ✅ Phase post-turn automatique

Voir [CHANGELOG.md](../CHANGELOG.md) pour l'historique complet.

---

## 🤝 Contribuer

Pour contribuer à la documentation :
1. Les guides utilisateurs vont dans `docs/`
2. Les modifications majeures dans `docs/modifications-vX.Y.Z/`
3. Mettez à jour cet index (README.md)
4. Ajoutez l'entrée dans CHANGELOG.md

---

## 📄 Licence

MIT - Voir [LICENSE](../LICENSE) pour les détails

---

**Documentation générée et maintenue avec ❤️ pour Warstruck JS**
