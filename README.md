# Cookie Ops

Phase 1 scaffold for cookie operations with Docker, Google Forms ingestion, fulfillment, inventory, and recipe tracking.

## Run with Docker
- `cd infra/docker`
- `docker compose up -d`

## API Surface (Phase 1)
- `GET /api/health`
- `GET /api/dashboard/summary`
- `GET /api/orders`
- `GET /api/orders/:id`
- `PATCH /api/orders/:id/status`
- `GET /api/inventory/items`
- `POST /api/ingredients`
- `POST /api/inventory/movements`
- `GET /api/recipes`
- `POST /api/recipes`
- `POST /api/integrations/google/forms/sync`
- `POST /api/availability/check`
- `GET /api/availability/latest`

## Google Forms Sync
1. Link Form -> Google Sheet.
2. Provide CSV export URL in `GOOGLE_FORMS_CSV_URL`.
3. Trigger sync endpoint.

Supported fields and aliases include:
- Order ID / Timestamp
- Name / Email
- Due Date
- Total
- Status
- Items (for order item parsing, e.g. `Chocolate Chip 12-pack x2; Snickerdoodle 12-pack x1`)

## Spark Box Integration Contract (v1)
Use these events from the API layer for dashboard integration:
- `order.created`
- `order.updated`
- `order.status_changed`
- `inventory.low_stock`

Payload shape recommendation:
- `eventId`, `eventType`, `occurredAt`, `entityId`, `data`

## Web Pages
- `/` Dashboard
- `/fulfillment` Fulfillment board with status actions
- `/inventory` Inventory levels
- `/recipes` Recipe BOM overview
- `/availability` Supplier watch (stock + price signal snapshots)
