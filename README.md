# Lexio

Lexio is a legal workspace focused on case execution. This repository contains the current delivery of the platform: authenticated access, case-scoped permissions, document deliveries, notes, parties, activity, SSR web delivery, and automated validation for API and browser flows.

Spanish documentation is available in [docs/es/README.md](docs/es/README.md).

Translation policy:

- Spanish project guides mirror the repository structure under `docs/es/<project>/...`.
- Product-facing operational documentation is translated when it helps local delivery and handoff.
- ADRs and deep technical references remain English-only unless a concrete delivery requirement justifies a maintained Spanish counterpart.

## Repository Scope

This phase of the product includes:

- session-based access to the platform
- case entry and case-scoped permissions
- legal document deliveries with metadata and auditability
- case notes, parties, and activity tracking
- Angular SSR web application
- NestJS API with OpenAPI documentation
- API end-to-end coverage and browser smoke coverage
- UI validation through unit tests and Playwright smoke coverage, without Storybook in the supported delivery toolchain

## Repository Structure

| Path       | Purpose                                             |
| ---------- | --------------------------------------------------- |
| `api/`     | NestJS API, persistence, auth, legal domain modules |
| `web/`     | Angular SSR application for the legal workspace     |
| `api-e2e/` | API end-to-end tests                                |
| `web-e2e/` | Browser smoke tests with Playwright                 |
| `docs/`    | Product-facing engineering documentation            |
| `docker/`  | Local PostgreSQL container definition               |

## Production Commit Scope

- Production-ready changes usually live under `api/`, `web/`, `libs/`, `docs/`, and root configuration that affects supported workflows.
- Keep local-only artifacts out of deploy commits, including `.vscode/`, ad-hoc `scripts/`, generated screenshots, Playwright reports, and similar workspace residue.
- Promote a local helper script only after it becomes part of the supported workflow and is documented in the relevant README.

## Requirements

| Tool       | Version used in this repository |
| ---------- | ------------------------------- |
| Node.js    | 24.x                            |
| pnpm       | 10.x                            |
| Docker     | Current stable release          |
| PostgreSQL | 16.x via Docker Compose         |

## Quick Start

1. Install dependencies.

```bash
pnpm install
```

2. Copy the environment template.

```bash
cp .env.example .env
```

3. Start PostgreSQL.

```bash
docker compose -f docker/docker-compose.yml up -d
```

4. Apply database migrations.

```bash
pnpm migration:run
```

5. Seed local demo data.

```bash
pnpm seed
```

6. Start the API.

```bash
pnpm nx serve api
```

7. Start the web application.

```bash
pnpm nx serve web
```

## Local URLs

| Service         | URL                                    |
| --------------- | -------------------------------------- |
| Web application | `http://localhost:4200`                |
| API base URL    | `http://localhost:3000/api/v1`         |
| Swagger UI      | `http://localhost:3000/api/v1/swagger` |

## Demo Users

The seed process creates these local users:

| User           | Role           | Email                        |
| -------------- | -------------- | ---------------------------- |
| Carlos Mendoza | Platform admin | `carlos.mendoza@lexio.local` |
| Ana Ramirez    | Legal operator | `ana.ramirez@lexio.local`    |
| Sofia Ortiz    | Legal viewer   | `sofia.ortiz@lexio.local`    |

Default password:

- `LEXIO_SEED_PASSWORD` from `.env`
- fallback: `LexioDemo2026!`

## Useful Commands

| Task                | Command                        |
| ------------------- | ------------------------------ |
| Run API             | `pnpm nx serve api`            |
| Run web             | `pnpm nx serve web`            |
| Build API           | `pnpm nx build api`            |
| Build web           | `pnpm nx build web`            |
| Run API unit tests  | `pnpm nx test api --runInBand` |
| Run web unit tests  | `pnpm nx test web`             |
| Run API E2E         | `pnpm nx e2e api-e2e`          |
| Run web smoke tests | `pnpm nx e2e web-e2e`          |
| Lint API            | `pnpm nx lint api`             |
| Lint web            | `pnpm nx lint web`             |

## Command Safety

Read this before running destructive commands:

- `pnpm seed` truncates and recreates application data. Do not point `DATABASE_URL` at a database you want to preserve.
- `pnpm nx e2e api-e2e` and `pnpm nx e2e web-e2e` reseed their target database. Use a dedicated database such as `lexio_e2e`.
- Local uploaded files are written under `var/storage`.
- Password reset messages are written under `var/mail-outbox` when file delivery mode is enabled.

## Troubleshooting

### `pnpm migration:run` fails on a fresh database

Verify all of the following before rerunning:

- PostgreSQL is up: `docker compose -f docker/docker-compose.yml ps`
- `DATABASE_URL` points to an existing database
- the user in `DATABASE_URL` can create extensions and tables

### `pnpm seed` fails or wipes the wrong data

Check `DATABASE_URL` first. The command truncates Lexio tables before re-creating the demo dataset.

### The web app loads but login or case data never resolves

Check the API first:

```bash
curl http://localhost:3000/api/v1/health
```

If the API is healthy, verify that the web app is pointing to `/api/v1` through the local proxy or SSR proxy.

### Playwright smoke tests fail after a local data change

Reset the dedicated E2E database and rerun:

```bash
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/lexio_e2e pnpm migration:run
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/lexio_e2e pnpm seed
pnpm nx e2e web-e2e
```

## Documentation Map

Primary entry points:

- [API README](api/README.md)
- [Web README](web/README.md)
- [API E2E README](api-e2e/README.md)
- [Web E2E README](web-e2e/README.md)
- [Web workspace visual guide](docs/web-workspace-guide.md)
- [Domain model](docs/domain-model.md)
- [UI guidelines](docs/ui-guidelines.md)
- [OpenAPI specification](docs/specs/openapi.yaml)
- [Spanish documentation index](docs/es/README.md)
