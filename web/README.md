# Lexio Web

The web application delivers the legal workspace for Lexio. It is an Angular SSR application focused on fast case access, guided document delivery, notes, parties, and audit-friendly interaction.

Spanish version: [docs/es/web/README.md](../docs/es/web/README.md)

## Main User Flows

- authenticate into the platform
- resolve the first accessible case from the landing page
- review case context before acting on files
- upload document deliveries with legal metadata
- add notes, review activity, and manage parties according to permissions
- open the user administration workspace when the current role allows it

## Main Routes

| Route | Purpose |
| --- | --- |
| `/` | session-aware case entry |
| `/cases/:caseId/documents` | legal workspace for a single case |

## Runtime Model

- Angular SSR is used for the production build.
- The browser app talks to the API through `/api/v1`.
- In local development, `pnpm nx serve web` uses `web/proxy.conf.json`.
- For built SSR runs, `web/src/server.ts` proxies `/api/v1` to the API server.

## Local Setup

Start the API first, then start the web application.

```bash
pnpm nx serve api
pnpm nx serve web
```

For a production-style SSR run:

```bash
pnpm nx build web
HOST=127.0.0.1 PORT=4300 node dist/web/server/server.mjs
```

## Common Commands

| Task | Command |
| --- | --- |
| Run in development | `pnpm nx serve web` |
| Build SSR bundle | `pnpm nx build web` |
| Unit tests | `pnpm nx test web` |
| Browser smoke tests | `pnpm nx e2e web-e2e` |

## Workspace Structure

| Area | Purpose |
| --- | --- |
| `features/cases` | landing and case resolution |
| `features/documents` | main legal workspace |
| `shared/layout` | persistent shell and session UI |
| `shared/admin` | user administration modal |
| `shared/services` | API client and auth state |

## Visual Guide

A screenshot-based walkthrough of the legal workspace is available in [docs/web-workspace-guide.md](../docs/web-workspace-guide.md).

## Command Safety

- `pnpm nx e2e web-e2e` runs against the real SSR build path and reseeds its target database.
- The web app depends on a live API. If the API is down, login, case resolution, and uploads will fail.
- The demo users shown in the UI come from `pnpm seed`.

## Troubleshooting

### The page loads but login never completes

Check the API first:

```bash
curl http://localhost:3000/api/v1/health
```

If the API is healthy, confirm the browser is reaching `/api/v1` through the configured dev proxy or SSR proxy.

### The built SSR server starts but the browser shows an API error

Set the upstream API explicitly when running the built server:

```bash
HOST=127.0.0.1 PORT=4300 LEXIO_API_PROXY_URL=http://127.0.0.1:3000 node dist/web/server/server.mjs
```

### A user logs in but sees no case

That user may not be assigned to any case in the current database. Re-seed the dataset or verify assignments in the admin workspace.

### Uploads fail from the browser

Check these first:

- the current session has write access to the case
- the API is reachable through `/api/v1`
- `STORAGE_LOCAL_PATH` is writable in the current environment

## Related Documentation

- [Repository README](../README.md)
- [Web workspace visual guide](../docs/web-workspace-guide.md)
- [UI guidelines](../docs/ui-guidelines.md)
- [Domain model](../docs/domain-model.md)
- [Web E2E README](../web-e2e/README.md)
