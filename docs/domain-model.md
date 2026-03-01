# Lexio Domain Model

## Core Concepts

### Expediente (Case File)
The root aggregate of the legal domain. It represents a single legal matter or lawsuit.
- **Identified by**: Case Number (e.g., `EXP-2026-001`).
- **Context**: Contains court information, opposing parties, current stage, and next steps.

### Entrega (Document Delivery / Batch)
A logical grouping of documents uploaded at a single point in time.
- **Purpose**: Provides auditability and legal context (why were these files uploaded?).
- **Metadata**: Title, Description, Category, related Procedural Phase.

### Documento (Document)
A single file associated with an Entrega.
- **Metadata**: Original name, MIME type, size, storage key, and checksum for integrity.

### Nota (Case Note)
Observations or internal comments added by legal professionals to a case. Can be pinned for high visibility.

### Parte (Party)
A person or entity involved in the case (Client, Counterparty, Court, Responsible Lawyer).

## Bounded Contexts (DDD)

1. **Cases**: Manages the lifecycle and metadata of legal files.
2. **Documents**: Handles file storage, batching, and document metadata.
3. **Activity**: Tracks the audit trail and timeline of actions within a case.
4. **Parties**: Manages roles and relationships between actors and cases.
5. **Notes**: Handles internal collaboration and case observations.

## UI Language Mapping

| Technical Term | User-Facing Term (ES) |
| --- | --- |
| CaseBatch / Batch | Entrega |
| Archive / File | Documento |
| Timeline / Audit | Actividad |
| Participants | Partes |
| Sticky / Pinned | Fijada |
