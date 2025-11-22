# WarstruckJS

Prototype monorepo for the Warstruck tactical board game using NestJS (server) and Next.js + Mantine (web client). MongoDB integration is planned for persistence in a future iteration.

## Structure
- `server/`: Minimal NestJS service exposing the initial game configuration and unit abilities.
- `web/`: Next.js App Router client with Mantine components to browse board terminology, turn flow, and the first four units.

## Getting started
Install dependencies in each workspace (network access required):

```bash
cd server
npm install
npm run start
```

```bash
cd web
npm install
npm run dev
```

The web client expects the server on `http://localhost:3001` for future API calls; the current version uses local static data.
