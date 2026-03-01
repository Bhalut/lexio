# Lexio API E2E

Este proyecto valida el contrato HTTP de la API desde fuera. Ejecuta la API construida, aplica migraciones, carga datos demo y prueba flujos autenticados contra endpoints reales.

Versión principal: [api-e2e/README.md](../../../api-e2e/README.md)

## Cobertura actual

- creación y cierre de sesión
- resolución del usuario actual
- manejo de `caseId` inválidos o inexistentes
- validación de uploads sin archivos o con tipos no soportados
- carga correcta de entregas documentales
- orden de listado de entregas

## Ciclo de la suite

La suite hace lo siguiente:

1. construye la API
2. ejecuta migraciones
3. ejecuta seed
4. inicia la API construida en un puerto dedicado
5. espera `GET /api/v1/health`
6. ejecuta la suite E2E con Jest
7. apaga el proceso temporal

## Valores por defecto

| Variable | Valor |
| --- | --- |
| `HOST` | `127.0.0.1` |
| `PORT` | `3102` |
| `DATABASE_URL` | `postgresql://postgres:postgres@127.0.0.1:5432/lexio_e2e` |
| `AUTH_MODE` | `LOCAL` |
| `LEXIO_SEED_PASSWORD` | `LexioDemo2026!` si no se define otro |

## Comando

```bash
pnpm nx e2e api-e2e
```

## Seguridad de comandos

- La suite es destructiva sobre su base objetivo porque ejecuta `seed`.
- Usa una base de datos dedicada para API E2E. El valor por defecto es `lexio_e2e`.
- Si sobrescribes `DATABASE_URL`, confirma que no apunte a tu base local principal salvo que eso sea intencional.

## Solución de problemas

### La suite no logra conectarse a PostgreSQL

Comprueba que el contenedor esté corriendo y que la base exista:

```bash
docker compose -f docker/docker-compose.yml ps
docker exec lexio-postgres psql -U postgres -lqt
```

### La suite falla antes de empezar a probar

La cadena de arranque depende de que estas etapas pasen en orden:

- `pnpm nx build api`
- `pnpm migration:run`
- `pnpm seed`
- arranque de la API en el puerto E2E dedicado

Atiende la primera etapa que falla en lugar de repetir toda la suite sin aislar el problema.

### El health check nunca queda listo

Verifica que el puerto dedicado esté libre y que la API arranque con el `DATABASE_URL` actual:

```bash
PORT=3102 DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/lexio_e2e node dist/api/main.js
```
