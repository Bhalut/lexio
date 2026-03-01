# Lexio Web

La aplicación web entrega el workspace legal de Lexio. Está construida con Angular SSR y prioriza acceso rápido al expediente, contexto visible, autoría real y acciones guiadas.

Versión principal: [web/README.md](../../../web/README.md)

## Flujos principales

- iniciar sesión
- resolver el primer expediente accesible desde la portada
- revisar contexto del expediente antes de operar con archivos
- registrar entregas documentales con metadatos legales
- crear notas, revisar actividad y gestionar partes según permisos
- abrir la administración de usuarios cuando el rol lo permite

## Rutas principales

| Ruta | Uso |
| --- | --- |
| `/` | entrada con resolución de expediente |
| `/cases/:caseId/documents` | workspace legal del expediente |

## Modelo de ejecución

- La aplicación usa Angular SSR en el build de producción.
- El navegador consume la API mediante `/api/v1`.
- En desarrollo, `pnpm nx serve web` usa `web/proxy.conf.json`.
- En SSR construido, `web/src/server.ts` hace proxy de `/api/v1` hacia la API.

## Puesta en marcha local

```bash
pnpm nx serve api
pnpm nx serve web
```

SSR construido:

```bash
pnpm nx build web
HOST=127.0.0.1 PORT=4300 node dist/web/server/server.mjs
```

## Comandos

| Tarea | Comando |
| --- | --- |
| Desarrollo | `pnpm nx serve web` |
| Build SSR | `pnpm nx build web` |
| Unit tests | `pnpm nx test web` |
| Smoke E2E | `pnpm nx e2e web-e2e` |

## Estructura funcional

| Área | Uso |
| --- | --- |
| `features/cases` | entrada y resolución de expediente |
| `features/documents` | workspace legal principal |
| `shared/layout` | shell persistente y sesión |
| `shared/admin` | modal de administración de usuarios |
| `shared/services` | cliente API y estado de autenticación |

## Guía visual

Existe un recorrido con captura real del workspace en [workspace-guide.md](./workspace-guide.md).

## Seguridad de comandos

- `pnpm nx e2e web-e2e` corre sobre el build SSR real y vuelve a cargar la base objetivo.
- La web depende de una API viva. Si la API está caída, el login, la resolución del expediente y los uploads fallarán.
- Los usuarios demo que ves en la UI provienen de `pnpm seed`.

## Solución de problemas

### La página carga pero el login no termina

Valida primero la API:

```bash
curl http://localhost:3000/api/v1/health
```

Si la API está sana, confirma que el navegador está llegando a `/api/v1` mediante el proxy de desarrollo o el proxy SSR.

### El servidor SSR construido inicia pero el navegador muestra error de API

Define explícitamente el upstream de la API:

```bash
HOST=127.0.0.1 PORT=4300 LEXIO_API_PROXY_URL=http://127.0.0.1:3000 node dist/web/server/server.mjs
```

### Un usuario inicia sesión pero no ve ningún expediente

Ese usuario puede no estar asignado a ningún expediente en la base actual. Vuelve a ejecutar seed o revisa las asignaciones desde la administración.

### Los uploads fallan desde el navegador

Revisa primero:

- la sesión actual tiene acceso de escritura al expediente
- la API está disponible mediante `/api/v1`
- `STORAGE_LOCAL_PATH` es escribible en el entorno actual
