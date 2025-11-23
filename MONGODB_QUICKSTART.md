# 🚀 Guide de Démarrage Rapide - MongoDB

## Étape 1: Démarrer MongoDB avec Docker

```bash
# Dans le dossier racine du projet
docker-compose up -d
```

Attendez quelques secondes, puis vérifiez:
```bash
docker ps
```

Vous devriez voir deux conteneurs:
- `warstruck-mongodb` (port 27017)
- `warstruck-mongo-express` (port 8081)

## Étape 2: Vérifier MongoDB

Ouvrez votre navigateur: http://localhost:8081

Vous verrez l'interface Mongo Express. Cliquez sur la base `warstruck` (elle sera créée automatiquement au premier démarrage du serveur).

## Étape 3: Démarrer le Serveur NestJS

```bash
cd server
pnpm install  # Si pas encore fait
pnpm start:dev
```

Dans les logs, vous devriez voir:
```
[Nest] INFO [NestApplication] Nest application successfully started
```

## Étape 4: Créer une Partie de Test

### Avec curl (terminal):
```bash
curl -X POST http://localhost:3001/game/create -H "Content-Type: application/json" -d "{}"
```

### Avec le frontend:
```bash
cd ../web
pnpm install  # Si pas encore fait
pnpm dev
```

Puis ouvrez http://localhost:3000 et créez une partie.

## Étape 5: Vérifier dans MongoDB

Retournez sur http://localhost:8081
1. Cliquez sur `warstruck`
2. Cliquez sur `games`
3. Vous verrez votre partie avec tous les détails!

## 🎉 C'est Tout!

Votre jeu utilise maintenant MongoDB. Les parties sont persistées et survivent aux redémarrages.

### Test de Persistence

1. Créez une partie
2. Notez l'ID de la partie (ex: `abc-123-def`)
3. Arrêtez le serveur (Ctrl+C)
4. Redémarrez le serveur (`pnpm start:dev`)
5. Accédez à la partie: http://localhost:3000/game/abc-123-def
6. ✅ La partie est toujours là!

## 🐛 Problèmes?

### "Error: connect ECONNREFUSED 127.0.0.1:27017"
MongoDB n'est pas démarré. Lancez:
```bash
docker-compose up -d
```

### "Cannot read properties of null"
Le schéma MongoDB a peut-être un problème. Vérifiez les logs:
```bash
docker-compose logs -f mongodb
```

### Les parties n'apparaissent pas dans Mongo Express
Rafraîchissez la page (F5) dans Mongo Express après avoir créé une partie.

## 🧹 Nettoyage

Pour tout supprimer et repartir de zéro:
```bash
# Arrêter et supprimer les conteneurs + données
docker-compose down -v

# Redémarrer
docker-compose up -d
```

## 📚 Prochaines Étapes

- Testez la sélection de deck
- Testez le setup des renforts
- Testez le démarrage de partie (correction du bug 500)
- Vérifiez que chaque action est enregistrée dans l'historique
- Testez le replay d'une partie

Consultez `MONGODB_MIGRATION.md` pour plus de détails.
