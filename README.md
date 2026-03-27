# Walter Tech Assessment

## Project structure

```
walter-tech-assessment/
├── backend/    # NestJS REST API — port 3000
└── frontend/   # React + Vite SPA — port 5173
```

## Stack

- **Backend**: NestJS, Drizzle ORM, better-sqlite3
- **Frontend**: React, Vite, Tailwind CSS v4, TanStack Query
- **Database**: SQLite
- **Linting**: Biome (shared root config)
- **Package manager**: pnpm workspaces

## Getting Started

### Prerequisites

- Node.js ≥ 20
- pnpm ≥ 10

### Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Create .env file
cp .env.example .env

# 3. Apply migrations (adds the orders table or create the db if not exists)
pnpm db:migrate

# 4. Seed the database with the provided products
pnpm db:seed

# 5. Start both servers
pnpm dev
```

- API: http://localhost:3000/api
- UI: http://localhost:5173

The database file is created at `backend/db/sqlite.db` by default. Override with the `DATABASE_PATH` env var.

### Scripts

| Script             | Description                              |
|--------------------|------------------------------------------|
| `pnpm dev`         | Start backend and frontend concurrently  |
| `pnpm dev:backend` | Backend only                             |
| `pnpm dev:frontend`| Frontend only                            |
| `pnpm build`       | Production build for both apps           |
| `pnpm lint`        | Run Biome across all packages            |
| `pnpm lint:fix`    | Auto-fix lint issues                     |
| `pnpm db:seed`     | Create DB and seed sample products       |
| `pnpm db:migrate`  | Apply pending migrations                 |
| `pnpm db:push`     | Push schema changes directly (dev only)  |

## API

All endpoints are prefixed with `/api`.

### Orders

| Method | Path                  | Description                               |
|--------|-----------------------|-------------------------------------------|
| `GET`  | `/api/orders`         | List all orders                           |
| `GET`  | `/api/orders/:orderId`| Get a specific order                      |
| `POST` | `/api/orders`         | Create an order (idempotent by `orderId`) |

### Products

| Method | Path            | Description              |
|--------|-----------------|--------------------------|
| `GET`  | `/api/products` | List products            |

### Create Order

```http
POST /api/orders
Content-Type: application/json

{
  "orderId": "ORD-001",
  "productSku": "TSHIRT-WHT-S",
  "quantity": 2
}
```

- **201** — order created, processing starts automatically.
- **200** — `orderId` already exists; returns the existing order unchanged.

## Order Processing

Orders advance through states automatically after creation:

```
POST /api/orders
      │
      ▼
  [received]  ──(~500ms)──▶  [processing]  ──(~300ms)──▶  [delivered]
                                                 │
                                          insufficient stock
                                          or unexpected error
                                                 │
                                                 ▼
                                             [failed]
```

Order processing is event-driven (using `@nestjs/event-emitter`): the order creation endpoint returns immediately once created, then the status advances in the background. Now there are some delays to simulate async processing without requiring a real queue.

The `processing → delivered` transition runs inside a SQLite transaction, where the product stock is checked and deducted atomically. If stock is insufficient, the transaction is rolled back and the order moves to `failed` with no stock deducted. Any unexpected error also results in `failed` status.

## Try It Out

### Happy path: order delivered

`TSHIRT-WHT-S` has 42 units in stock after seeding. This order will advance automatically to `delivered` and deduct 2 units.

```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{"orderId": "ORD-001", "productSku": "TSHIRT-WHT-S", "quantity": 2}'
```

Wait ~1 second, then check the result:

```bash
curl http://localhost:3000/api/orders/ORD-001
# → { "status": "delivered", ... }
```

### Insufficient stock: order fails

`JACKET-BLK-L` has only 4 units. Requesting 10 will trigger the `failed` path with no stock deducted.

```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{"orderId": "ORD-002", "productSku": "JACKET-BLK-L", "quantity": 10}'
```

```bash
curl http://localhost:3000/api/orders/ORD-002
# → { "status": "failed", ... }
```

### Idempotency: duplicate order ID

Sending the same `orderId` a second time returns the existing order (HTTP 200) without creating a duplicate or restarting processing.

```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{"orderId": "ORD-001", "productSku": "TSHIRT-WHT-S", "quantity": 2}'
# → HTTP 200, same order as before
```

## Technical Decisions

### Idempotent order creation
`order_id` has a `UNIQUE` constraint so the `POST /api/orders` endpoint returns the existing order (HTTP 200) if the ID is already present, making it safe to call multiple times without side effects.

### OrderFulfillmentService for the delivery transaction
The `processing → delivered` step needs to touch two tables atomically. Rather than leaking a transaction context (`tx`) through service and repository signatures, or coupling modules by exporting repositories, a dedicated `OrderFulfillmentService` owns the transaction. It injects the DB connection directly, what is a justified trade-off for a single and clearly scoped use case.

### Event-driven processing
`OrdersProcessor` listens to `order.received` and `order.processing` events, decoupling the HTTP layer from the processing logic. In the future, replacing the `sleep` delays with BullMQ (for example) would require changes only inside the processor, not in the service or controller.

## What Happens If the Server Crashes Mid-Processing?

The order processing flow has two steps:

1. `received → processing` — only a status update, no stock touched.
2. `processing → delivered` — stock check + deduction inside a SQLite transaction.

**Crash between step 1 and step 2:** the order stays in `processing` with no stock deducted. SQLite's WAL mode ensures no partial writes. The order could be manually advanced through an endpoint like `PATCH /api/orders/:orderId/advance` to re-run the stock-check transaction.

**Crash during step 2:** SQLite guarantees the transaction is either fully committed or fully rolled back. No inconsistent state is possible.

**Current gap:** orders left in `processing` after a crash are not automatically recovered on restart.

## What I'd do with more time

- **Proper transaction management**: the current `OrderFulfillmentService` is a pragmatic workaround. It injects the DB connection directly to run a cross-table transaction, bypassing the repository layer. The cleaner solution would be using something like `nestjs-cls` (Continuation Local Storage): store the active transaction in the CLS context so repositories automatically use it when one is in progress, without leaking `tx` through method signatures. This enables a `@Transactional()` decorator pattern and keeps repositories fully unaware of transaction orchestration.
- **Startup recovery**: on boot, query all `processing` orders and re-emit their events to resume processing automatically after a crash.
- **Real job queue**: replace the current approach with BullMQ + Redis for retries with backoff, job visibility, and horizontal scaling. The processor interface is already isolated for this swap.
- **WebSockets**: replace TanStack Query polling with a WebSocket connection so the UI updates the instant an order's status changes.
- **Shared types package**: `packages/shared-types/` to eliminate the type duplication between `backend/src/database/schema.ts` and `frontend/src/types.ts`.
- **Tests**: unit tests for `OrdersService` (state transitions, idempotency) and `OrderFulfillmentService` (stock logic), plus integration tests for the API endpoints.
- **Pagination**: the orders list grows unbounded; cursor-based pagination and status/date filters would be needed in production.
