# Lexio API E2E

This project validates the API contract from the outside. It runs the built API, applies migrations, seeds data, and exercises authenticated flows against the real HTTP surface.

Spanish version: [docs/es/api-e2e/README.md](../docs/es/api-e2e/README.md)

## What It Covers

- session creation and session deletion
- current-user resolution
- invalid and missing case handling
- document delivery upload validation
- successful single-file and multi-file uploads
- delivery listing order

## Test Lifecycle

When you run the suite, it will:

1. build the API bundle
2. run database migrations
3. seed demo data
4. start the built API on a dedicated port
5. wait for `/api/v1/health`
6. run the Jest-based E2E suite
7. stop the temporary API process

## Default Environment

| Variable | Default |
| --- | --- |
| `HOST` | `127.0.0.1` |
| `PORT` | `3102` |
| `DATABASE_URL` | `postgresql://postgres:postgres@127.0.0.1:5432/lexio_e2e` |
| `AUTH_MODE` | `LOCAL` |
| `LEXIO_SEED_PASSWORD` | `LexioDemo2026!` unless overridden |

## Command

```bash
pnpm nx e2e api-e2e
```

## Command Safety

- The suite is destructive for its target database because it runs the seed process.
- Use a dedicated database for API E2E. The default is `lexio_e2e`.
- If you override `DATABASE_URL`, make sure it does not point to your primary local development database unless that is intentional.

## Troubleshooting

### The suite cannot connect to PostgreSQL

Check that the container is running and the target database exists:

```bash
docker compose -f docker/docker-compose.yml ps
docker exec lexio-postgres psql -U postgres -lqt
```

### The suite fails before tests start

The startup chain depends on these steps succeeding in order:

- `pnpm nx build api`
- `pnpm migration:run`
- `pnpm seed`
- API boot on the dedicated E2E port

Check the first failed step instead of rerunning the whole suite blindly.

### The health check never becomes ready

Verify that the dedicated port is free and the API can boot with the current `DATABASE_URL`:

```bash
PORT=3102 DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/lexio_e2e node dist/api/main.js
```

## Related Documentation

- [Repository README](../README.md)
- [API README](../api/README.md)
- [OpenAPI specification](../docs/specs/openapi.yaml)
