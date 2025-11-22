# WarstruckJS

Prototype monorepo for the Warstruck tactical board game using NestJS (server) and Next.js + Mantine (web client). MongoDB integration is planned for persistence in a future iteration.

## Structure
- `server/`: Minimal NestJS service exposing the initial game configuration and unit abilities.
- `web/`: Next.js App Router client with Mantine components to browse board terminology, turn flow, and the first four units.

The repository uses Turborepo with pnpm workspaces for orchestration.

## Getting started
Install dependencies with pnpm at the repo root (network access required):

```bash
pnpm install
```

```bash
pnpm dev
```

To run individual apps without Turborepo’s pipeline, you can `cd` into `server` or `web` and use the local scripts (e.g., `pnpm dev`, `pnpm build`). The web client expects the server on `http://localhost:3001` for future API calls; the current version uses local static data.
