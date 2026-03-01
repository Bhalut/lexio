# API Routing Conventions

## Goals

- Keep the public API stable and readable.
- Use business language at the HTTP boundary.
- Prevent route drift between controllers, OpenAPI, frontend calls, and tests.

## Rules

1. All public endpoints live under `/api/v1`.
2. Collection routes use plural nouns.
3. Multi-word path segments use kebab-case.
4. Route names use public business terms, not internal implementation terms.
5. Controllers own one route root whenever possible.
6. Prefer resource nouns over RPC-style verbs.

## Examples

- `GET /api/v1/users/me`
- `POST /api/v1/auth/sessions`
- `DELETE /api/v1/auth/sessions/current`
- `POST /api/v1/auth/password-resets`
- `GET /api/v1/cases/:caseId/document-deliveries`
- `GET /api/v1/cases/:caseId/activities`
- `GET /api/v1/users/:userId/case-assignments/events`

## Naming Guidance

- Good: `document-deliveries`
- Avoid on the public API: `document-batches`

- Good: `activities`
- Avoid: `activity`

- Good: `users/:userId/password`
- Avoid: `reset-password`

- Good: `auth/password-resets`
- Avoid: `auth/password-reset/request`

## Contract Discipline

Every route change must be propagated in the same change set to:

1. NestJS controllers
2. `docs/specs/openapi.yaml`
3. Angular `ApiService`
4. Contract tests
5. E2E coverage where the route is user-facing
