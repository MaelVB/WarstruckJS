# Guide d'Utilisation - Système de Gestion des Parties

## Vue d'Ensemble

Le système de gestion des parties de WarstruckJS permet maintenant de :
- ✅ Créer des parties avec des UUID uniques
- ✅ Accéder à une partie via `/game/{uuid}`
- ✅ Conserver sa partie après un F5 (rafraîchissement)
- ✅ Enregistrer automatiquement chaque action
- ✅ Consulter l'historique complet d'une partie
- ✅ Rejouer une partie action par action

## Démarrage Rapide

### 1. Lancer le Backend

```bash
cd server
pnpm install  # Si ce n'est pas déjà fait
pnpm run dev
```

Le serveur API démarre sur **http://localhost:3001**

### 2. Lancer le Frontend

```bash
cd web
pnpm install  # Si ce n'est pas déjà fait
pnpm run dev
```

L'application web démarre sur **http://localhost:3000**

### 3. Commencer à Jouer

1. Ouvrir votre navigateur : http://localhost:3000/game
2. Cliquer sur **"Nouvelle partie"**
3. Vous êtes redirigé vers `/game/{uuid}` où uuid est l'identifiant unique de votre partie
4. Commencer la sélection des decks !

## Scénarios d'Utilisation

### Créer et Jouer une Partie Complète

1. **Page d'accueil** (`/game`)
   - Liste des parties en cours et terminées
   - Bouton "Nouvelle partie" pour créer une partie

2. **Phase de Sélection des Decks** (`/game/{uuid}`)
   - Chaque joueur sélectionne 19 pièces (le Général est ajouté automatiquement)
   - Une fois les deux decks sélectionnés → Phase de Setup

3. **Phase de Setup**
   - Chaque joueur choisit 4 pièces pour sa colonne de renforts
   - Placement des généraux (automatique dans la version actuelle)
   - Bouton "Démarrer la partie"

4. **Phase de Jeu**
   - Les joueurs jouent tour par tour
   - Chaque action consomme un point d'action
   - Bouton "Terminer le tour" pour passer au joueur suivant
   - Toutes les actions sont enregistrées automatiquement

5. **Fin de Partie**
   - La partie se termine quand un général est éliminé
   - Possibilité de consulter l'historique

### Reprendre une Partie après un F5

1. Vous êtes sur `/game/{uuid}` en train de jouer
2. Vous faites un **F5** (rafraîchissement)
3. La page se recharge
4. L'état de la partie est automatiquement récupéré depuis le serveur
5. Vous pouvez continuer à jouer exactement où vous en étiez !

**Astuce** : Vous pouvez même copier l'URL et l'ouvrir dans un autre onglet ou navigateur.

### Consulter l'Historique d'une Partie

#### Depuis la Page d'Accueil
1. Aller sur `/game`
2. Trouver la partie dans la liste
3. Cliquer sur le bouton **"Historique"**

#### Depuis une Partie en Cours
1. Dans `/game/{uuid}`
2. Cliquer sur le bouton **"Voir l'historique"**

#### Sur la Page d'Historique
- **Timeline** : Liste chronologique de toutes les actions
- **Filtrage** : Sélecteur pour filtrer par tour
- **Navigation** : Cliquez sur une action pour voir l'état du plateau à ce moment
- **Visualisation** : Le plateau s'affiche en mode lecture seule
- **Informations** : Type d'action, joueur, timestamp, tour

### Rejouer une Partie

La page d'historique permet de "voyager dans le temps" :

1. Ouvrir l'historique d'une partie
2. Voir la timeline des actions dans la colonne de gauche
3. Cliquer sur n'importe quelle action
4. Le plateau s'affiche tel qu'il était après cette action
5. Naviguer librement entre les différentes actions

**Filtrage par tour** :
- Utilisez le sélecteur "Filtrer par tour"
- Sélectionnez un tour spécifique
- Le plateau affiche l'état à la fin de ce tour

## Interface Utilisateur

### Page d'Accueil (`/game`)

```
┌─────────────────────────────────────────────────┐
│  Warstruck - Parties       [Nouvelle partie]    │
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌─────────────┐  ┌─────────────┐              │
│  │ Partie 1    │  │ Partie 2    │              │
│  │ [En cours]  │  │ [Terminée]  │              │
│  │ Tour: 5     │  │ Tour: 12    │              │
│  │             │  │             │              │
│  │ [Rejoindre] │  │ [Voir]      │              │
│  │ [Historique]│  │ [Historique]│              │
│  └─────────────┘  └─────────────┘              │
│                                                  │
└─────────────────────────────────────────────────┘
```

### Page de Jeu (`/game/{uuid}`)

```
┌───────────────────────────────────────────────────────────┐
│  Warstruck - Partie 12abc...    Tour 3    Phase: En jeu  │
├───────────────────────────────────────────────────────────┤
│                                                            │
│  ┌──────────┐   ┌──────────────────┐   ┌──────────┐     │
│  │ Joueur 1 │   │    PLATEAU       │   │ Réserve  │     │
│  │ PA: 3/3  │   │                  │   │ 15 pièces│     │
│  │          │   │   [Grille 8x8]   │   │          │     │
│  └──────────┘   └──────────────────┘   └──────────┘     │
│                                                            │
│        [Terminer le tour]  [Voir l'historique]           │
│                                                            │
└───────────────────────────────────────────────────────────┘
```

### Page d'Historique (`/game/history/{uuid}`)

```
┌─────────────────────────────────────────────────────────────┐
│  Historique de la partie              [Retour à la partie] │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────┐  ┌────────────────────────────────┐    │
│  │ Timeline (35)  │  │ État du jeu - Tour 3           │    │
│  │ [Filtrer ▼]    │  │                                │    │
│  │                │  │ ┌────────────────────────┐     │    │
│  │ ○ 1. Move      │  │ │      PLATEAU          │     │    │
│  │ │   Tour 1     │  │ │                       │     │    │
│  │ │   [Voir]     │  │ │    [Grille 8x8]       │     │    │
│  │ │              │  │ │                       │     │    │
│  │ ○ 2. Attack    │  │ └────────────────────────┘     │    │
│  │ │   Tour 1     │  │                                │    │
│  │ │   [Voir]     │  │ Joueur 1: 2 PA | Joueur 2: 3 PA│    │
│  │ │              │  │                                │    │
│  │ ● 3. EndTurn   │  │                                │    │
│  │     Tour 1     │  │                                │    │
│  │     [Voir] ←   │  │                                │    │
│  └────────────────┘  └────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Structure des URLs

| URL | Description |
|-----|-------------|
| `/game` | Page d'accueil - Liste des parties |
| `/game/{uuid}` | Jouer à une partie spécifique |
| `/game/history/{uuid}` | Consulter l'historique d'une partie |

## API Backend

Les endpoints utilisés par le frontend :

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/game/create` | POST | Créer une nouvelle partie |
| `/game/list` | GET | Liste toutes les parties |
| `/game/{uuid}` | GET | Récupérer l'état d'une partie |
| `/game/{uuid}/select-deck` | POST | Sélectionner le deck |
| `/game/{uuid}/setup-reinforcements` | POST | Configurer les renforts |
| `/game/{uuid}/start` | POST | Démarrer la partie |
| `/game/{uuid}/action` | POST | Exécuter une action |
| `/game/{uuid}/history` | GET | Historique complet |
| `/game/{uuid}/replay/action/{actionId}` | GET | État après une action |
| `/game/{uuid}/replay/turn/{turn}` | GET | État à la fin d'un tour |

## Données Enregistrées

### Pour Chaque Partie
- ID unique (UUID)
- Date de création
- Date de dernière mise à jour
- Phase actuelle
- Joueur actuel
- Numéro de tour
- Gagnant (si terminée)
- État complet du plateau
- Decks des joueurs
- Renforts des joueurs

### Pour Chaque Action
- ID unique (UUID)
- Timestamp précis
- Numéro du tour
- Joueur qui a effectué l'action
- Type d'action (move, attack, etc.)
- Détails de l'action (positions, pièces, etc.)
- État du jeu AVANT l'action
- État du jeu APRÈS l'action

## Conseils et Astuces

### Partage de Partie
Pour jouer avec quelqu'un d'autre :
1. Créez une partie
2. Copiez l'URL `/game/{uuid}`
3. Envoyez-la à l'autre joueur
4. Les deux joueurs peuvent accéder à la même partie

**Note** : Dans la version actuelle, il n'y a pas d'authentification, donc n'importe qui peut jouer pour n'importe quel joueur.

### Sauvegarde
Les parties sont automatiquement sauvegardées à chaque action. Vous pouvez :
- Fermer votre navigateur
- Revenir plus tard
- Reprendre exactement où vous en étiez

**Important** : Les parties sont stockées en mémoire, donc si vous redémarrez le serveur, elles seront perdues.

### Analyse de Parties
L'historique est parfait pour :
- Comprendre pourquoi vous avez perdu/gagné
- Étudier les stratégies adverses
- Apprendre de vos erreurs
- Partager des parties intéressantes

### Performance
- Les parties sont chargées à la demande
- Seule la partie active est en mémoire côté client
- L'historique est chargé uniquement quand vous le consultez

## Prochaines Étapes

Pour améliorer l'expérience :

1. **Base de données** : Implémenter une vraie persistance
2. **Authentification** : Identification des joueurs
3. **WebSockets** : Mises à jour en temps réel
4. **Notifications** : Alertes quand c'est votre tour
5. **Export** : Télécharger l'historique en JSON/PDF
6. **Statistiques** : Analyser vos performances

## Dépannage

### La partie ne se charge pas
- Vérifiez que le backend est démarré
- Vérifiez que l'URL est correcte
- Vérifiez la console du navigateur pour les erreurs

### L'état n'est pas sauvegardé après F5
- Vérifiez que vous utilisez bien l'URL avec l'UUID
- Vérifiez que le backend n'a pas été redémarré

### Les actions ne fonctionnent pas
- Vérifiez que c'est votre tour
- Vérifiez que vous avez des points d'action
- Vérifiez la console pour les messages d'erreur

## Support

Pour toute question ou problème :
- Consultez `GAME_MANAGEMENT.md` pour les détails techniques
- Vérifiez les logs du serveur (terminal backend)
- Vérifiez la console du navigateur (F12)

Bon jeu ! 🎮
