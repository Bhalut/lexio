# Guía visual del workspace web de Lexio

Esta guía muestra el workspace legal tal como aparece en la aplicación SSR en ejecución con el dataset demo local.

![Vista general del workspace de Lexio](../assets/screenshots/workspace-overview.png)

## Qué estás viendo

1. **Shell de navegación**
   La barra lateral izquierda concentra navegación global, búsqueda de expedientes, acceso de soporte y controles de sesión en un punto estable.

2. **Encabezado del workspace**
   La franja superior identifica la pantalla como un workspace legal por expediente, no como un explorador genérico de archivos. Las acciones principales se mantienen visibles sin ocultar el contexto del caso.

3. **Centro del expediente**
   El resumen central agrupa cliente, tipo de asunto, juzgado, fase actual, próxima acción, responsable y fecha de audiencia en un único bloque de lectura rápida.

4. **Pestañas de contexto**
   `Documentos`, `Notas`, `Actividad` y `Partes` separan la información operativa por intención de uso en lugar de mezclar todo en una sola columna.

5. **Filtros y listado documental**
   Búsqueda, categoría, fase, orden y densidad viven justo encima del listado para que el usuario refine la evidencia visible sin abandonar la página.

6. **Acceso a historial y auditoría**
   El historial de entregas permanece colapsado al final para mantener disponible el detalle auditable sin competir con la ruta principal de lectura.

## Orden de lectura recomendado

Para una persona que entra por primera vez, el recorrido esperado es este:

1. confirmar expediente y fase actual
2. identificar la próxima acción sugerida
3. revisar los archivos visibles y su agrupación legal
4. entrar a notas, actividad o partes solo cuando se requiera más contexto
5. abrir el historial de entregas cuando importe la trazabilidad

## Notas sobre esta imagen

- Fue capturada desde el build SSR real, no desde una maqueta estática.
- Usa el dataset demo sembrado localmente.
- Los tiempos, autores y cantidades de documentos pueden variar después de cambios locales o corridas E2E.
