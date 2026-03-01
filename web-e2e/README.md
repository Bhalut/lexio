# Lexio Web E2E

This project validates the browser-facing legal workspace with Playwright. It runs against the built SSR application and a live API, not against mocked screens.

Spanish version: [docs/es/web-e2e/README.md](../docs/es/web-e2e/README.md)

## What It Covers

- session login
- case resolution from the landing page
- write restrictions for read-only users
- note creation for assigned users
- document delivery upload with legal metadata
- case-assignment restriction behavior after access changes

## Test Lifecycle

When you run the suite, it will:

1. run migrations and seed data for the API target database
2. build the API
3. start the API on a dedicated port
4. build the SSR web application
5. start the built SSR web server on a dedicated port
6. run the Playwright smoke suite against the browser flow

## Default Environment

| Variable | Default |
| --- | --- |
| `E2E_HOST` | `127.0.0.1` |
| `API_E2E_PORT` | `3100` |
| `WEB_E2E_PORT` | `4300` |
| `DATABASE_URL` | `postgresql://postgres:postgres@127.0.0.1:5432/lexio_e2e` |
| `LEXIO_SEED_PASSWORD` | `LexioDemo2026!` unless overridden |

## Command

```bash
pnpm nx e2e web-e2e
```

## Command Safety

- The suite exercises the real SSR build path.
- The suite reseeds the target database, so use a dedicated E2E database.
- The suite mutates notes, uploads, and case assignments during execution.
- The suite assumes the seeded local users created by `pnpm seed`.

## Troubleshooting

### The suite fails before the browser opens

Check the build and boot chain in this order:

- `pnpm nx build api`
- `pnpm nx build web`
- database migration and seed
- API health on the dedicated port
- SSR web boot on the dedicated port

### The browser opens but the login screen never proceeds

This usually means the web server cannot reach the API proxy target. Verify the API is healthy and that `LEXIO_API_PROXY_URL` points to the running API.

### The suite passes locally but fails after data changes

Reset the dedicated E2E database and rerun the suite from a clean state.

```bash
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/lexio_e2e pnpm migration:run
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/lexio_e2e pnpm seed
pnpm nx e2e web-e2e
```

## Related Documentation

- [Repository README](../README.md)
- [Web README](../web/README.md)
- [API README](../api/README.md)
- [Web workspace visual guide](../docs/web-workspace-guide.md)
