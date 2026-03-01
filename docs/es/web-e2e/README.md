# Lexio Web E2E

Este proyecto valida el workspace legal desde el navegador con Playwright. La suite se ejecuta sobre el build SSR real y una API viva.

Versión principal: [web-e2e/README.md](../../../web-e2e/README.md)

## Cobertura actual

- login
- resolución del expediente desde la portada
- restricciones de escritura para perfiles de solo lectura
- creación de notas por usuarios asignados
- carga de entregas documentales con metadatos legales
- restricciones por cambios de asignación

## Ciclo de la suite

La suite hace lo siguiente:

1. ejecuta migraciones y seed para la API
2. construye la API
3. inicia la API en un puerto dedicado
4. construye la aplicación SSR
5. inicia el servidor SSR construido
6. ejecuta la suite smoke de Playwright

## Valores por defecto

| Variable | Valor |
| --- | --- |
| `E2E_HOST` | `127.0.0.1` |
| `API_E2E_PORT` | `3100` |
| `WEB_E2E_PORT` | `4300` |
| `DATABASE_URL` | `postgresql://postgres:postgres@127.0.0.1:5432/lexio_e2e` |
| `LEXIO_SEED_PASSWORD` | `LexioDemo2026!` si no se define otro |

## Comando

```bash
pnpm nx e2e web-e2e
```

## Seguridad de comandos

- La suite corre contra el build SSR real.
- La suite vuelve a cargar la base objetivo, así que usa una base E2E dedicada.
- La suite modifica notas, uploads y asignaciones de expediente durante la ejecución.
- La suite asume los usuarios demo creados por `pnpm seed`.

## Solución de problemas

### La suite falla antes de abrir el navegador

Revisa la cadena de build y arranque en este orden:

- `pnpm nx build api`
- `pnpm nx build web`
- migración y seed de la base
- health de la API en el puerto dedicado
- arranque del SSR web en el puerto dedicado

### El navegador abre pero el login no avanza

Normalmente significa que el servidor web no logra alcanzar el proxy hacia la API. Verifica que la API esté sana y que `LEXIO_API_PROXY_URL` apunte al proceso correcto.

### La suite pasaba y empezó a fallar después de cambios locales

Resetea la base E2E dedicada y ejecuta nuevamente desde un estado limpio.

```bash
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/lexio_e2e pnpm migration:run
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/lexio_e2e pnpm seed
pnpm nx e2e web-e2e
```
