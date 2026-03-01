# Lexio — Documentación en Español

Esta guía agrupa la documentación principal del repositorio desde una perspectiva práctica: cómo ejecutar la plataforma, qué cubre cada proyecto y dónde encontrar la referencia funcional más útil.

La documentación traducida se organiza por proyecto. El índice raíz en español se mantiene como punto de entrada general; cada carpeta interna contiene la documentación específica de API, web y suites E2E.

## Política de estructura

- Toda guía futura en español debe vivir bajo la carpeta del proyecto o dominio al que pertenece.
- Usa rutas como `docs/es/api/...`, `docs/es/web/...`, `docs/es/api-e2e/...`, `docs/es/web-e2e/...` y `docs/es/<dominio>/...` cuando el documento no sea un README.
- Evita volver al esquema plano con archivos como `API_README.md` o `WEB_README.md`.
- El índice `docs/es/README.md` debe mantenerse como punto de entrada, no como repositorio de documentos mezclados.

## Alcance de traducción

- La documentación operativa y funcional orientada a producto sí debe tener contraparte en español.
- Las ADR, notas de arquitectura internas, referencias profundas de implementación y material de bajo nivel permanecen en inglés por defecto.
- Solo se crean versiones en español de referencias técnicas profundas cuando exista un requerimiento explícito de entrega, auditoría o handoff.

## Alcance actual

Esta fase del producto incluye:

- autenticación por sesión
- resolución del primer expediente accesible
- workspace legal por expediente
- entregas documentales con metadatos legales
- notas, partes y actividad
- control de acceso por rol y por expediente
- cobertura E2E para API y web

## Inicio rápido

1. Instala dependencias.

```bash
pnpm install
```

2. Crea tu archivo de entorno.

```bash
cp .env.example .env
```

3. Levanta PostgreSQL.

```bash
docker compose -f docker/docker-compose.yml up -d
```

4. Ejecuta migraciones y datos demo.

```bash
pnpm migration:run
pnpm seed
```

5. Inicia API y web.

```bash
pnpm nx serve api
pnpm nx serve web
```

## Accesos locales

| Servicio | URL |
| --- | --- |
| Web | `http://localhost:4200` |
| API | `http://localhost:3000/api/v1` |
| Swagger | `http://localhost:3000/api/v1/swagger` |

## Usuarios demo

| Usuario | Perfil | Correo |
| --- | --- | --- |
| Carlos Mendoza | Administrador de plataforma | `carlos.mendoza@lexio.local` |
| Ana Ramírez | Operadora legal | `ana.ramirez@lexio.local` |
| Sofía Ortiz | Lectora legal | `sofia.ortiz@lexio.local` |

Contraseña por defecto:

- `LEXIO_SEED_PASSWORD` definido en `.env`
- valor alterno: `LexioDemo2026!`

## Seguridad de comandos

Lee esto antes de ejecutar comandos destructivos:

- `pnpm seed` trunca y recrea los datos de aplicación. No apuntes `DATABASE_URL` a una base que debas conservar.
- `pnpm nx e2e api-e2e` y `pnpm nx e2e web-e2e` vuelven a cargar la base objetivo. Usa una base dedicada como `lexio_e2e`.
- Los archivos cargados localmente se escriben en `var/storage`.
- Los mensajes de restablecimiento se escriben en `var/mail-outbox` cuando el modo de salida es por archivo.

## Solución de problemas

### `pnpm migration:run` falla en una base vacía

Verifica lo siguiente antes de reintentar:

- PostgreSQL está arriba: `docker compose -f docker/docker-compose.yml ps`
- `DATABASE_URL` apunta a una base existente
- el usuario de `DATABASE_URL` puede crear extensiones y tablas

### `pnpm seed` falla o borra los datos incorrectos

Revisa primero `DATABASE_URL`. El comando trunca las tablas de Lexio antes de reconstruir el dataset demo.

### La web carga pero el login o el expediente no resuelven

Valida primero la API:

```bash
curl http://localhost:3000/api/v1/health
```

Si la API está sana, revisa que la web esté llegando a `/api/v1` mediante el proxy de desarrollo o el proxy SSR.

### Los smoke tests de Playwright fallan después de cambios locales

Resetea la base E2E dedicada y vuelve a ejecutar:

```bash
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/lexio_e2e pnpm migration:run
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/lexio_e2e pnpm seed
pnpm nx e2e web-e2e
```

## Documentación disponible

- [README principal del repositorio](../../README.md)
- [Documentación de la API](./api/README.md)
- [Documentación de la web](./web/README.md)
- [Documentación de API E2E](./api-e2e/README.md)
- [Documentación de Web E2E](./web-e2e/README.md)
- [Guía visual del workspace web](./web/workspace-guide.md)
- [Modelo de dominio](../domain-model.md)
- [Guía de UI](../ui-guidelines.md)
- [Especificación OpenAPI](../specs/openapi.yaml)
