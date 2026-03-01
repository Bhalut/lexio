# Lexio API

The API exposes the legal workspace backend for Lexio. It is responsible for authentication, case access, document deliveries, notes, parties, activity, user administration, and audit records.

Spanish version: [docs/es/api/README.md](../docs/es/api/README.md)

## Base URL

All public endpoints are versioned under:

```text
/api/v1
```

Interactive API documentation is available at:

```text
http://localhost:3000/api/v1/swagger
```

## Current Responsibilities

- create and destroy authenticated sessions
- resolve the current user
- list visible cases and case details
- create and list document deliveries
- create and list case notes
- create, edit, delete, and reorder case parties
- list case activity
- manage user accounts and case assignments
- persist audit events for access and administrative actions

## Local Setup

1. Ensure PostgreSQL is available.
2. Copy `.env.example` to `.env` at repository root.
3. Apply migrations.
4. Seed local data if needed.
5. Start the API.

```bash
pnpm migration:run
pnpm seed
pnpm nx serve api
```

## Key Environment Variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `PORT` | API port, default `3000` |
| `AUTH_MODE` | `LOCAL`, `HYBRID`, or `OIDC_ONLY` |
| `AUTH_APP_URL` | public web URL used by auth flows |
| `AUTH_POST_LOGIN_URL` | redirect after local or OIDC login |
| `AUTH_POST_LOGOUT_URL` | redirect after logout |
| `STORAGE_LOCAL_PATH` | local upload directory |
| `AUTH_EMAIL_OUTBOX_PATH` | local password reset outbox |

## Common Commands

| Task | Command |
| --- | --- |
| Run in development | `pnpm nx serve api` |
| Build production bundle | `pnpm nx build api` |
| Unit tests | `pnpm nx test api --runInBand` |
| API E2E | `pnpm nx e2e api-e2e` |
| Seed local data | `pnpm seed` |
| Apply migrations | `pnpm migration:run` |

## Command Safety

- `pnpm seed` truncates Lexio application tables before recreating the demo dataset.
- `pnpm nx e2e api-e2e` migrates and seeds its target database automatically.
- Use a dedicated database for E2E work. The default is `lexio_e2e`.
- Local uploads are written to `var/storage` by default.
- Password reset messages are written to `var/mail-outbox` when file delivery mode is active.

## Main Route Surface

| Method | Route | Purpose |
| --- | --- | --- |
| `POST` | `/api/v1/auth/sessions` | start local session |
| `DELETE` | `/api/v1/auth/sessions/current` | close current session |
| `GET` | `/api/v1/users/me` | current authenticated user |
| `GET` | `/api/v1/cases` | cases visible to the current user |
| `GET` | `/api/v1/cases/:caseId` | case header and access level |
| `GET` | `/api/v1/cases/:caseId/document-deliveries` | list document deliveries |
| `POST` | `/api/v1/cases/:caseId/document-deliveries` | create document delivery |
| `GET` | `/api/v1/cases/:caseId/notes` | list notes |
| `POST` | `/api/v1/cases/:caseId/notes` | create note |
| `GET` | `/api/v1/cases/:caseId/parties` | list parties |
| `PATCH` | `/api/v1/cases/:caseId/parties/order` | reorder parties |
| `GET` | `/api/v1/cases/:caseId/activities` | list activity |

## Request and Response Examples

### 1. Create a local session

Request:

```bash
curl -i -X POST http://localhost:3000/api/v1/auth/sessions \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "carlos.mendoza@lexio.local",
    "password": "LexioDemo2026!"
  }'
```

Response excerpt:

```json
{
  "success": true,
  "expiresAt": "2026-03-08T22:17:26.444Z",
  "user": {
    "id": "508de3b7-b82e-49b6-aee8-19225f8b23c7",
    "fullName": "Dr. Carlos Mendoza",
    "roleTitle": "Abogado Senior",
    "email": "carlos.mendoza@lexio.local",
    "authProvider": "LOCAL",
    "roleKey": "PLATFORM_ADMIN",
    "isAdmin": true,
    "isActive": true
  }
}
```

### 2. Resolve visible cases for the current session

Request:

```bash
curl -b cookies.txt http://localhost:3000/api/v1/cases
```

Response excerpt:

```json
[
  {
    "id": "f0e8935a-1cfd-425f-beb3-fc191c011dee",
    "caseNumber": "EXP-2026-001",
    "clientName": "María González Rodríguez",
    "status": "ACTIVE",
    "stage": "Fase probatoria",
    "responsibleUserName": "Dr. Carlos Mendoza",
    "caseType": "Civil · Arrendamiento",
    "courtName": "Juzgado 3.º Civil del Distrito Judicial",
    "opposingPartyName": "Inmobiliaria Horizonte S.A. de C.V.",
    "nextAction": "Preparar escrito de ofrecimiento de pruebas y validar anexos",
    "nextHearingDate": "2026-03-15T15:00:00.000Z",
    "currentUserAccessLevel": "OWNER"
  }
]
```

### 3. List document deliveries for a case

Request:

```bash
curl -b cookies.txt \
  http://localhost:3000/api/v1/cases/f0e8935a-1cfd-425f-beb3-fc191c011dee/document-deliveries
```

Response excerpt:

```json
[
  {
    "id": "0ad8bd6d-0cea-4219-8046-952089bc207a",
    "caseId": "f0e8935a-1cfd-425f-beb3-fc191c011dee",
    "title": "Pruebas Documentales",
    "description": "Evidencia documental recopilada durante la investigación preliminar del caso.",
    "category": "Pruebas documentales",
    "relatedPhase": "Fase probatoria",
    "createdByUserId": "508de3b7-b82e-49b6-aee8-19225f8b23c7",
    "createdByName": "Dr. Carlos Mendoza",
    "documents": [
      {
        "id": "198aec46-2902-442c-8b97-e4315d9b13fd",
        "deliveryId": "0ad8bd6d-0cea-4219-8046-952089bc207a",
        "originalName": "estados_cuenta_2025.xlsx",
        "mimeType": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "sizeBytes": 1048576,
        "uploadedAt": "2026-02-28T16:23:16.497Z"
      }
    ]
  }
]
```

### 4. Create a note

Request:

```bash
curl -X POST \
  -H 'Content-Type: application/json' \
  -b cookies.txt \
  -d '{"content":"Nota de ejemplo para documentación."}' \
  http://localhost:3000/api/v1/cases/f0e8935a-1cfd-425f-beb3-fc191c011dee/notes
```

Response:

```json
{
  "caseId": "f0e8935a-1cfd-425f-beb3-fc191c011dee",
  "content": "Nota de ejemplo para documentación.",
  "authorName": "Lic. Ana Ramírez",
  "authorUserId": "92031e64-8a0a-49c8-ae4f-8e89e6fb28c3",
  "isPinned": false,
  "authorAvatar": null,
  "id": "3e2f3f2e-9507-48ad-b1e1-1e5ec83b50c9",
  "createdAt": "2026-02-28T16:29:57.315Z",
  "updatedAt": "2026-02-28T16:29:57.315Z"
}
```

### 5. Upload a document delivery with multipart form data

Request:

```bash
curl -X POST \
  -b cookies.txt \
  -F 'title=Entrega de ejemplo para documentación' \
  -F 'description=Entrega creada solo para documentar la respuesta multipart.' \
  -F 'category=Pruebas documentales' \
  -F 'relatedPhase=Fase probatoria' \
  -F 'files=@web-e2e/src/fixtures/smoke-evidence.pdf;type=application/pdf' \
  http://localhost:3000/api/v1/cases/f0e8935a-1cfd-425f-beb3-fc191c011dee/document-deliveries
```

Response excerpt:

```json
{
  "id": "45cacc1a-d99f-4c1e-86cd-3f4811bb6325",
  "caseId": "f0e8935a-1cfd-425f-beb3-fc191c011dee",
  "title": "Entrega de ejemplo para documentación",
  "description": "Entrega creada solo para documentar la respuesta multipart.",
  "category": "Pruebas documentales",
  "relatedPhase": "Fase probatoria",
  "createdByUserId": "508de3b7-b82e-49b6-aee8-19225f8b23c7",
  "createdByName": "Dr. Carlos Mendoza",
  "documents": [
    {
      "originalName": "smoke-evidence.pdf",
      "mimeType": "application/pdf",
      "sizeBytes": 596,
      "checksum": "a085f6f3e34dc9cd01e53d4935cdd050902bbbd0fc453c89e4ecf7ebfb20cfad"
    }
  ]
}
```

## Troubleshooting

### `pnpm migration:run` fails on a clean database

Common causes:

- PostgreSQL is not running
- `DATABASE_URL` points to a database that does not exist yet
- the configured user lacks permissions for schema creation or extensions

### `401 Unauthorized` after login

Confirm all of the following:

- the session was created with `POST /api/v1/auth/sessions`
- your client is sending cookies back to the API
- `AUTH_APP_URL` and browser origin are aligned for the current environment

### `403 Forbidden` when listing notes, activity, or deliveries

This is expected when the session user is not assigned to the case or lacks the required access level.

### Invalid `caseId` returns `400`

This is expected and intentional. Routes validate malformed UUIDs before case access is evaluated.

### Password reset emails do not appear locally

If `AUTH_EMAIL_DELIVERY_MODE=file`, check `var/mail-outbox`. If you are using another delivery mode, verify the corresponding environment variables in `.env`.

## Related Documentation

- [Repository README](../README.md)
- [API routing conventions](../docs/api-routing-conventions.md)
- [OpenAPI specification](../docs/specs/openapi.yaml)
