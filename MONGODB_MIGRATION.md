# Migration vers MongoDB

## 🚀 Installation de MongoDB

### Option 1: Docker (Recommandé - Plus Simple)

**Prérequis**: Avoir Docker Desktop installé (https://www.docker.com/products/docker-desktop/)

```bash
# Démarrer MongoDB + Mongo Express (interface web)
docker-compose up -d

# Vérifier que les conteneurs fonctionnent
docker ps

# Accéder à l'interface web
# http://localhost:8081
```

**Avantages**:
- ✅ Installation en 1 commande
- ✅ Interface web incluse (Mongo Express)
- ✅ Données persistées dans un volume Docker
- ✅ Facile à supprimer/recréer

**Commandes utiles**:
```bash
# Arrêter MongoDB
docker-compose down

# Supprimer les données ET les conteneurs
docker-compose down -v

# Voir les logs
docker-compose logs -f mongodb
```

### Option 2: MongoDB Local (Développement)

#### Windows
1. Téléchargez MongoDB Community Server: https://www.mongodb.com/try/download/community
2. Installez avec les options par défaut
3. MongoDB démarre automatiquement comme service Windows

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

### Option 2: MongoDB Atlas (Cloud - Production)

1. Créez un compte gratuit sur https://www.mongodb.com/cloud/atlas
2. Créez un cluster gratuit (M0)
3. Créez un utilisateur avec accès en lecture/écriture
4. Whitelistez votre IP (ou 0.0.0.0/0 pour tout autoriser)
5. Copiez la connection string
6. Remplacez dans `.env`:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/warstruck?retryWrites=true&w=majority
   ```

## ⚙️ Configuration

Le fichier `server/.env` a été créé avec:
```
MONGODB_URI=mongodb://localhost:27017/warstruck
PORT=3001
```

Pour MongoDB Atlas, modifiez `MONGODB_URI` avec votre connection string.

## 📊 Schéma de Données

### Collection: `games`

```typescript
{
  gameId: string,           // UUID v4 unique
  currentState: GameState,  // État complet du jeu
  history: GameActionRecord[], // Historique des actions
  createdAt: Date,
  updatedAt: Date,
  phase: string,           // Phase actuelle (deck-selection, setup, playing, finished)
  currentPlayer: string,   // player1 ou player2
  turnNumber: number,
  winner?: string,
  player1Id: string,
  player2Id: string
}
```

### Index
- `gameId`: Index unique pour recherche rapide
- `createdAt`: Pour trier par date
- `phase`: Pour filtrer par état

## 🔄 Migration des Données Existantes

Les parties actuellement en mémoire seront perdues. Pour les sauvegarder:

1. **Option Manuelle**: Exportez les parties avant redémarrage (pas implémenté)
2. **Option Auto**: Les nouvelles parties seront automatiquement sauvegardées en MongoDB

## ✅ Vérification

### Test de Connexion
```bash
# Démarrer le serveur
cd server
pnpm install
pnpm start:dev
```

Si MongoDB est bien connecté, vous verrez dans les logs:
```
[Nest] INFO [MongooseModule] Mongoose connection created
```

### Test avec MongoDB Shell
```bash
mongosh

use warstruck
db.games.find().pretty()  # Voir toutes les parties
db.games.countDocuments() # Compter les parties
```

### Test avec MongoDB Compass (GUI)
1. Téléchargez: https://www.mongodb.com/try/download/compass
2. Connectez-vous à: `mongodb://localhost:27017`
3. Naviguez vers la base `warstruck` > collection `games`

## 🆕 Changements dans l'API

Toutes les méthodes sont maintenant asynchrones:

```typescript
// Avant
const game = gameBoardService.createGame();

// Après
const game = await gameBoardService.createGame();
```

Le contrôleur gère automatiquement les Promises, pas de changement côté frontend.

## 🎯 Avantages de MongoDB

1. **Persistence vraie**: Les parties survivent aux redémarrages
2. **F5 friendly**: Rafraîchir la page charge depuis la DB
3. **Scalabilité**: Prêt pour la production
4. **Historique complet**: Toutes les actions sont enregistrées
5. **Replay**: Rejouez n'importe quelle partie action par action
6. **Backups**: Possibilité de sauvegarder/restaurer facilement

## 🔧 Commandes Utiles

```bash
# Voir les logs MongoDB (Windows)
Get-EventLog -LogName Application -Source MongoDB

# Redémarrer MongoDB (Windows)
net stop MongoDB
net start MongoDB

# Backup d'une partie
mongodump --db warstruck --collection games --out ./backup

# Restore
mongorestore --db warstruck ./backup/warstruck

# Supprimer toutes les parties (ATTENTION!)
mongosh warstruck --eval "db.games.deleteMany({})"
```

## 🐛 Dépannage

### Erreur: "MongooseServerSelectionError"
- MongoDB n'est pas démarré
- Vérifiez: `mongosh` dans un terminal
- Windows: Vérifiez le service dans Services.msc

### Erreur: "Authentication failed"
- Mauvais username/password dans MONGODB_URI
- Pour MongoDB local, pas d'auth par défaut

### Erreur: "Connection timeout"
- Firewall bloque MongoDB (port 27017)
- IP non whitelistée (MongoDB Atlas)

### Base de données vide après migration
- Normal! Les données en mémoire ne sont pas migrées
- Créez une nouvelle partie pour tester

## 📝 Notes

- La base `warstruck` et la collection `games` sont créées automatiquement
- Les index sont créés automatiquement par Mongoose
- Pas besoin de créer la structure manuellement
- Les timestamps (createdAt, updatedAt) sont gérés automatiquement

## 🚀 Prêt!

Lancez une nouvelle partie et vérifiez qu'elle apparaît dans MongoDB:

```bash
mongosh
use warstruck
db.games.find().pretty()
```

Vous devriez voir votre partie avec tous les détails!
