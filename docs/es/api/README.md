# Lexio API

La API expone el backend del workspace legal de Lexio. Su responsabilidad es resolver autenticación, acceso por expediente, entregas documentales, notas, partes, actividad, administración de usuarios y auditoría.

Versión principal: [api/README.md](../../../api/README.md)

## URL base pública

```text
/api/v1
```

Swagger local:

```text
http://localhost:3000/api/v1/swagger
```

## Responsabilidades actuales

- iniciar y cerrar sesiones
- resolver el usuario autenticado actual
- listar expedientes visibles para la sesión actual
- devolver el encabezado de un expediente y el nivel de acceso del usuario
- crear y listar entregas documentales
- crear y listar notas del expediente
- crear, editar, eliminar y reordenar partes
- listar actividad del expediente
- administrar usuarios y asignaciones de expediente
- registrar eventos de auditoría

## Puesta en marcha local

```bash
pnpm migration:run
pnpm seed
pnpm nx serve api
```

## Variables importantes

| Variable                  | Uso                                                                                            |
| ------------------------- | ---------------------------------------------------------------------------------------------- |
| `DATABASE_URL`            | cadena de conexión PostgreSQL                                                                  |
| `PORT`                    | puerto de la API                                                                               |
| `AUTH_MODE`               | modo de autenticación                                                                          |
| `AUTH_APP_URL`            | URL pública de la web                                                                          |
| `AUTH_POST_LOGIN_URL`     | redirección después del login                                                                  |
| `AUTH_POST_LOGOUT_URL`    | redirección después del logout                                                                 |
| `STORAGE_LOCAL_PATH`      | carpeta local de archivos                                                                      |
| `STORAGE_PUBLIC_BASE_URL` | URL base absoluta que se antepone a los archivos cuando se publican fuera del origen de la API |
| `AUTH_EMAIL_OUTBOX_PATH`  | carpeta local de restablecimiento                                                              |

## Comandos

| Tarea       | Comando                        |
| ----------- | ------------------------------ |
| Desarrollo  | `pnpm nx serve api`            |
| Build       | `pnpm nx build api`            |
| Unit tests  | `pnpm nx test api --runInBand` |
| API E2E     | `pnpm nx e2e api-e2e`          |
| Migraciones | `pnpm migration:run`           |
| Seed        | `pnpm seed`                    |

## Despliegue

- `docker/railway/api.Dockerfile` es la definición de contenedor soportada para despliegues tipo Railway.
- Define `STORAGE_PUBLIC_BASE_URL` cuando los archivos subidos se sirvan detrás de un CDN o un dominio dedicado distinto al origen de la API.
- Mantén los helpers locales dentro de `scripts/` fuera de los commits de despliegue salvo que pasen a formar parte del flujo documentado de producción.

## Seguridad de comandos

- `pnpm seed` trunca las tablas de aplicación de Lexio antes de recrear el dataset demo.
- `pnpm nx e2e api-e2e` migra y ejecuta seed sobre su base objetivo.
- Usa una base dedicada para E2E. El valor por defecto es `lexio_e2e`.
- Los uploads locales se guardan en `var/storage`.
- Los mensajes de restablecimiento se escriben en `var/mail-outbox` cuando el modo de entrega es por archivo.

## Rutas principales

| Método   | Ruta                                        | Descripción            |
| -------- | ------------------------------------------- | ---------------------- |
| `POST`   | `/api/v1/auth/sessions`                     | iniciar sesión local   |
| `DELETE` | `/api/v1/auth/sessions/current`             | cerrar sesión actual   |
| `GET`    | `/api/v1/users/me`                          | usuario autenticado    |
| `GET`    | `/api/v1/cases`                             | expedientes visibles   |
| `GET`    | `/api/v1/cases/:caseId`                     | resumen del expediente |
| `GET`    | `/api/v1/cases/:caseId/document-deliveries` | listar entregas        |
| `POST`   | `/api/v1/cases/:caseId/document-deliveries` | crear entrega          |
| `GET`    | `/api/v1/cases/:caseId/notes`               | listar notas           |
| `POST`   | `/api/v1/cases/:caseId/notes`               | crear nota             |
| `GET`    | `/api/v1/cases/:caseId/parties`             | listar partes          |
| `PATCH`  | `/api/v1/cases/:caseId/parties/order`       | reordenar partes       |
| `GET`    | `/api/v1/cases/:caseId/activities`          | listar actividad       |

## Ejemplos de request y response

### 1. Crear una sesión local

Request:

```bash
curl -i -X POST http://localhost:3000/api/v1/auth/sessions \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "carlos.mendoza@lexio.local",
    "password": "LexioDemo2026!"
  }'
```

Response resumido:

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

### 2. Resolver expedientes visibles para la sesión actual

Request:

```bash
curl -b cookies.txt http://localhost:3000/api/v1/cases
```

Response resumido:

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

### 3. Listar entregas documentales de un expediente

Request:

```bash
curl -b cookies.txt \
  http://localhost:3000/api/v1/cases/f0e8935a-1cfd-425f-beb3-fc191c011dee/document-deliveries
```

Response resumido:

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

### 4. Crear una nota

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

### 5. Cargar una entrega documental con multipart form data

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

Response resumido:

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

## Solución de problemas

### `pnpm migration:run` falla en una base limpia

Causas comunes:

- PostgreSQL no está corriendo
- `DATABASE_URL` apunta a una base que no existe todavía
- el usuario configurado no tiene permisos para crear esquema o extensiones

### `401 Unauthorized` después del login

Confirma todo lo siguiente:

- la sesión se creó con `POST /api/v1/auth/sessions`
- tu cliente está devolviendo cookies a la API
- `AUTH_APP_URL` y el origen del navegador coinciden con el entorno actual

### `403 Forbidden` al listar notas, actividad o entregas

Es el comportamiento esperado cuando el usuario no está asignado al expediente o no tiene el nivel de acceso requerido.

### Un `caseId` inválido responde `400`

Es intencional. Las rutas validan UUID malformados antes de evaluar acceso por expediente.

### Los correos de restablecimiento no aparecen localmente

Si `AUTH_EMAIL_DELIVERY_MODE=file`, revisa `var/mail-outbox`. Si usas otro modo de entrega, valida las variables correspondientes en `.env`.
