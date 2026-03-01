# Lexio UI/UX Redesign Spec

## Objective

Turn the current document screen into a legal case workspace with:

- lower click count,
- better contextual guidance,
- stronger legal-domain language,
- clearer information hierarchy,
- audit visibility without technical noise,
- premium visual direction with restrained motion.

This spec is aligned to the current implementation in:

- [`web/src/app/features/documents/page.component.ts`](/Users/bhalut/development/side/lexio/web/src/app/features/documents/page.component.ts)
- [`web/src/app/features/documents/components/case/header.component.ts`](/Users/bhalut/development/side/lexio/web/src/app/features/documents/components/case/header.component.ts)
- [`web/src/app/features/documents/components/upload/modal.component.ts`](/Users/bhalut/development/side/lexio/web/src/app/features/documents/components/upload/modal.component.ts)
- [`api/src/modules/cases/domain/case-file.entity.ts`](/Users/bhalut/development/side/lexio/api/src/modules/cases/domain/case-file.entity.ts)

## Product Principles

1. Context before interaction.
2. Files first, technical batch model second.
3. Guidance must be embedded in the workflow, not layered on top of it.
4. Legal users should recognize the vocabulary immediately.
5. Everything critical should be one interaction away.

## Main UX Problems Found

1. Too many concurrent interaction systems on the same screen.
2. Excessive exposure of future or disabled functionality.
3. Mixed language between business concepts and technical concepts.
4. Incomplete legal context in the header.
5. Guidance that depends on fragile UI state.
6. Upload state that can become inconsistent.

## Target Information Architecture

### Level 1

- `Expediente`
- `Documentos`
- `Notas`
- `Actividad`
- `Partes`

### Level 2 inside `Documentos`

- `Archivos` as the default workspace.
- `Historial de entregas` as a secondary audit layer.

### Primary Scan Order

1. Identify the case.
2. Understand the current procedural state.
3. See the next likely action.
4. Access documents immediately.
5. Expand into audit history only if needed.

## Screen Blueprint

### 1. Workspace Header

Purpose:

- establish legal context in a single scan,
- speak the user’s language,
- avoid forcing navigation before understanding.

Content:

- case number,
- client name,
- case type,
- court,
- stage,
- opposing party,
- responsible lawyer,
- next hearing,
- next action.

Implementation:

- [`case-header.component.ts`](/Users/bhalut/development/side/lexio/web/src/app/features/documents/components/case/header.component.ts)
- [`CaseHeader`](/Users/bhalut/development/side/lexio/web/src/app/shared/services/api.service.ts)
- [`CaseFile`](/Users/bhalut/development/side/lexio/api/src/modules/cases/domain/case-file.entity.ts)

### 2. Documents Workspace

Purpose:

- prioritize file retrieval and review,
- reduce cognitive load,
- keep filtering simple.

Content:

- search,
- sort,
- view toggle,
- file list or grid,
- simple metrics,
- one clear upload CTA.

Implementation:

- [`documents-page.component.ts`](/Users/bhalut/development/side/lexio/web/src/app/features/documents/page.component.ts)
- [`document-row.component.ts`](/Users/bhalut/development/side/lexio/web/src/app/features/documents/components/document/row.component.ts)
- [`document-grid-card.component.ts`](/Users/bhalut/development/side/lexio/web/src/app/features/documents/components/document/grid-card.component.ts)

### 3. Audit Layer

Purpose:

- preserve legal traceability without making it the default reading path.

Content:

- grouped deliveries,
- author,
- date,
- file count,
- file type distribution,
- document-level history.

Implementation:

- [`delivery/card.component.ts`](/Users/bhalut/development/side/lexio/web/src/app/features/documents/components/delivery/card.component.ts)
- [`document-detail-drawer.component.ts`](/Users/bhalut/development/side/lexio/web/src/app/features/documents/components/document/detail-drawer.component.ts)

## Language Model for the Interface

Use:

- `Expediente`
- `Entrega`
- `Historial de entregas`
- `Próximo paso`
- `Contraparte`
- `Responsable`
- `Auditoría`

Avoid exposing as primary copy:

- `delivery`
- `MIME`
- `storage`
- `checksum`

These can still appear in audit sections or advanced detail drawers.

## Upload Flow Spec

### Goal

Make upload feel reliable, guided, and legally meaningful.

### Form Fields

1. `Nombre de la entrega`
2. `Contexto jurídico`
3. `Archivos`

### Guidance Rules

- Explain what users should write in the context field.
- Clarify that files are the main view, while the delivery remains in history.
- Preserve multi-upload.
- Allow cancellation of in-flight uploads.

### States

- idle,
- validating,
- uploading,
- success,
- error,
- cancelled.

Implementation:

- [`upload-modal.component.ts`](/Users/bhalut/development/side/lexio/web/src/app/features/documents/components/upload/modal.component.ts)

## Visual Direction

### Tone

- editorial legal,
- premium but calm,
- warm rather than sterile,
- strong typography hierarchy.

### Palette

- Ink navy for authority.
- Brass/copper for emphasis.
- Warm paper neutrals for surfaces.
- Sage green for positive status.
- Controlled red for risk/error.

Implementation:

- [`web/src/styles.css`](/Users/bhalut/development/side/lexio/web/src/styles.css)

### Typography

- display: `Cormorant Garamond`
- UI/body: `Manrope`

### Rationale

- display type gives identity and legal gravitas,
- sans-serif keeps operational scanning fast.

## Motion System

### Principles

- use motion to orient, not entertain,
- never animate everything,
- prefer transform and opacity,
- remove persistent decorative motion.

### Timing

- page entrance: `220ms`
- panel entrance: `240-280ms`
- control hover/press: `140-160ms`
- drawer: `280-320ms`

### Curves

- primary: `cubic-bezier(0.16, 1, 0.3, 1)`
- panel emphasis: `cubic-bezier(0.22, 1, 0.36, 1)`

## Accessibility Rules

1. No fake buttons using clickable spans.
2. No hidden functionality only visible on hover.
3. Primary text should avoid ultra-small sizing for critical content.
4. Dialogs must have reliable keyboard escape behavior.
5. Search and upload should work on keyboard only.

## Data Model Requirements

Add or keep these fields for strong legal context:

- `caseType`
- `courtName`
- `opposingPartyName`
- `nextAction`
- `stage`
- `nextHearingDate`
- `responsibleUserName`

Recommended future fields:

- `jurisdiction`
- `riskLevel`
- `deadlineSummary`
- `documentCategory`
- `relatedPhase`
- `confidentiality`

## Next Implementation Steps

1. Replace remaining disabled “soon” controls in primary UI with passive roadmap hints.
2. Add a combined workspace endpoint so header and batches load together consistently.
3. Add legal document categories to the upload metadata.
4. Introduce proper download actions.
5. Replace remaining hardcoded sample data in parties and activity-related labels.
6. Add empty, loading, and error states consistently across all secondary tabs.

## Success Metrics

1. User understands the case context in under 5 seconds.
2. User can add a document delivery in one primary flow with no ambiguity.
3. User can find a document in 1 search or 2 taps.
4. Audit history is accessible without dominating the screen.
5. The screen feels premium without looking overloaded.
