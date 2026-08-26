# Design

## Domain Model & Architecture

### Entities:
1. `RegistryDefinition`:
   - `id`: INTEGER PK AUTOINCREMENT
   - `tenantId`: INTEGER NOT NULL FK(Tenants)
   - `name`: VARCHAR(255) NOT NULL (e.g. '顧客対応台帳', '重要契約台帳')
   - `code`: VARCHAR(50) NOT NULL (slug identifier per tenant)
   - `description`: TEXT
   - `icon`: VARCHAR(100) DEFAULT 'bi-journal-bookmark'
   - `status`: VARCHAR(20) DEFAULT 'active' CHECK ('active', 'archived')
   - `schema`: JSONB NOT NULL DEFAULT '{"fields": []}'
   - `layout`: JSONB DEFAULT '{}'
   - `displayOrder`: INTEGER DEFAULT 0

2. `RegistryEntry`:
   - `id`: INTEGER PK AUTOINCREMENT
   - `tenantId`: INTEGER NOT NULL FK(Tenants)
   - `registryDefinitionId`: INTEGER NOT NULL FK(RegistryDefinitions)
   - `code`: VARCHAR(50) (e.g. 'REC-0001')
   - `title`: VARCHAR(255) NOT NULL
   - `data`: JSONB NOT NULL DEFAULT '{}'
   - `companyId`: INTEGER NULL FK(Companies)
   - `userId`: INTEGER NULL FK(Users)
   - `status`: VARCHAR(50) DEFAULT 'open'
   - `createdById`: INTEGER NULL FK(Users)
   - `updatedById`: INTEGER NULL FK(Users)

3. `RegistryTimeline`:
   - `id`: INTEGER PK AUTOINCREMENT
   - `tenantId`: INTEGER NOT NULL FK(Tenants)
   - `registryEntryId`: INTEGER NOT NULL FK(RegistryEntries)
   - `action`: VARCHAR(50) NOT NULL (create, update, comment, contact_log, status_change)
   - `comment`: TEXT
   - `changes`: JSONB NULL
   - `authorId`: INTEGER NULL FK(Users)

## API Endpoints (`/api/registry`)
- `GET /api/registry/definitions`: List all definitions in active tenant
- `POST /api/registry/definitions`: Create definition
- `GET /api/registry/definitions/:id`: Get definition by ID
- `PUT /api/registry/definitions/:id`: Update definition & schema
- `DELETE /api/registry/definitions/:id`: Archive / delete definition
- `GET /api/registry/:defId/entries`: Query & search entries
- `POST /api/registry/:defId/entries`: Create entry with schema validation
- `GET /api/registry/:defId/entries/:id`: Get single entry with relations
- `PUT /api/registry/:defId/entries/:id`: Update entry & log timeline diff
- `DELETE /api/registry/:defId/entries/:id`: Delete entry
- `GET /api/registry/entries/:id/timeline`: Get entry timeline
- `POST /api/registry/entries/:id/timeline`: Add comment/activity note
- `GET /api/registry/:defId/export`: Export to CSV / JSON
