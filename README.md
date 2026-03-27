# Walter Tech Assessment

![app screenshot](https://github.com/user-attachments/assets/beb4f4a2-6dc8-4a51-8323-d1f88c63193d)

## Project structure

```
walter-tech-assessment/
├── backend/    # NestJS REST API - port 3000
└── frontend/   # React + Vite SPA - port 5173
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

| Script              | Description                             |
| ------------------- | --------------------------------------- |
| `pnpm dev`          | Start backend and frontend concurrently |
| `pnpm dev:backend`  | Backend only                            |
| `pnpm dev:frontend` | Frontend only                           |
| `pnpm build`        | Production build for both apps          |
| `pnpm lint`         | Run Biome across all packages           |
| `pnpm lint:fix`     | Auto-fix lint issues                    |
| `pnpm db:seed`      | Create DB and seed sample products      |
| `pnpm db:migrate`   | Apply pending migrations                |
| `pnpm db:push`      | Push schema changes directly (dev only) |

## API

All endpoints are prefixed with `/api`.

### Orders

| Method  | Path                           | Description                               |
| ------- | ------------------------------ | ----------------------------------------- |
| `GET`   | `/api/orders`                  | List all orders                           |
| `GET`   | `/api/orders/:orderId`         | Get a specific order                      |
| `POST`  | `/api/orders`                  | Create an order (idempotent by `orderId`) |
| `PATCH` | `/api/orders/:orderId/advance` | Advance order to the next state           |
| `PATCH` | `/api/orders/:orderId/fail`    | Mark a non-terminal order as failed       |

### Products

| Method | Path            | Description   |
| ------ | --------------- | ------------- |
| `GET`  | `/api/products` | List products |

### Create Order

```http
POST /api/orders
Content-Type: application/json

{
  "orderId": "ORD-001",
  "productSku": "TSHIRT-WHT-S",
  "quantity": 2,
  "autoProcess": false
}
```

| Field         | Type      | Required | Default | Description                                                               |
| ------------- | --------- | -------- | ------- | ------------------------------------------------------------------------- |
| `orderId`     | `string`  | yes      | -       | Unique identifier for the order                                           |
| `productSku`  | `string`  | yes      | -       | Must match an existing product SKU                                        |
| `quantity`    | `integer` | yes      | -       | Must be ≥ 1                                                               |
| `autoProcess` | `boolean` | no       | `false` | If `true`, the order advances through states automatically after creation |

- **201**: order created.
- **200**: `orderId` already exists; returns the existing order unchanged.

## Order Processing

Orders can advance through states manually (default) or automatically if `autoProcess: true` is set at creation time.

```
POST /api/orders
      │
      ▼
  [received]  ──────────────▶  [processing]  ──────────────▶  [delivered]
      │           manual or          │           manual or
      │          auto (~500ms)       │           auto (~300ms)
      │                              │
      │                              │ insufficient stock
      │                              │ or unexpected error
      │                              │
      ▼                              ▼
  [failed] ◀───────────────────── [failed]
  (manual)
```

With `autoProcess: false` (the default), orders stay in each state until manually advanced from the UI or via the API. With `autoProcess: true`, the processor advances them automatically with short delays to simulate async processing.

Order processing is event-driven (using `@nestjs/event-emitter`): the order creation endpoint returns immediately once created, then the status advances in the background if `autoProcess` is enabled.

The `processing → delivered` transition runs inside a SQLite transaction, where the product stock is checked and deducted atomically. If stock is insufficient, the transaction is rolled back and the order moves to `failed` with no stock deducted. Any unexpected error also results in `failed` status.

## Try It Out

### Manual flow: advance from the UI

Create an order without `autoProcess` (or with `autoProcess: false`). It will stay in `received` until you click **Advance** or **Fail** in the UI.

```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{"orderId": "ORD-001", "productSku": "TSHIRT-WHT-S", "quantity": 2}'
```

Open the UI at http://localhost:5173 and use the **Advance** button to move the order through `received → processing → delivered`, or **Fail** to mark it as failed at any point.

You can also do it via the API:

```bash
# Advance to next state
curl -X PATCH http://localhost:3000/api/orders/ORD-001/advance

# Or mark as failed
curl -X PATCH http://localhost:3000/api/orders/ORD-001/fail
```

### Auto-processing: order delivered automatically

Pass `autoProcess: true` to let the order advance on its own. `TSHIRT-WHT-S` has 42 units in stock after seeding so this will reach `delivered` and deduct 2 units.

```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{"orderId": "ORD-002", "productSku": "TSHIRT-WHT-S", "quantity": 2, "autoProcess": true}'
```

Wait ~1 second, then check the result:

```bash
curl http://localhost:3000/api/orders/ORD-002
# → { "status": "delivered", ... }
```

### Insufficient stock: order fails

`JACKET-BLK-L` has only 4 units. Requesting 10 will trigger the `failed` path with no stock deducted.

```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{"orderId": "ORD-003", "productSku": "JACKET-BLK-L", "quantity": 10, "autoProcess": true}'
```

```bash
curl http://localhost:3000/api/orders/ORD-003
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

`order_id` has a `UNIQUE` constraint so the `POST /api/orders` endpoint returns the existing order (HTTP 200) if the ID is already present. This approach provides a simple way of idempotency valid for this scope. In a production system, this could be improved using idempotency keys with persisted responses to guarantee full request/response consistency and detect payload mismatches.


### OrderFulfillmentService for the delivery transaction

The `processing → delivered` step needs to touch two tables atomically. Rather than leaking a transaction context (`tx`) through service and repository signatures, or coupling modules by exporting repositories, a dedicated `OrderFulfillmentService` owns the transaction. It injects the DB connection directly, what is a justified trade-off for a single and clearly scoped use case.

### Event-driven processing

`OrdersProcessor` listens to `order.received` and `order.processing` events, decoupling the HTTP layer from the processing logic. In the future, replacing the `sleep` delays with BullMQ (for example) would require changes only inside the processor, not in the service or controller.

## What Happens If the Server Crashes Mid-Processing?

The order processing flow has two steps:

1. `received → processing`: only a status update, no stock touched.
2. `processing → delivered`: stock check + deduction inside a SQLite transaction.

**Crash between step 1 and step 2:** the order stays in `processing` with no stock deducted. SQLite's WAL mode ensures no partial writes. The order could be manually advanced through an endpoint like `PATCH /api/orders/:orderId/advance` to re-run the stock-check transaction.

**Crash during step 2:** SQLite guarantees the transaction is either fully committed or fully rolled back. No inconsistent state is possible.

**Current gap:** orders left in `processing` after a crash are not automatically recovered on restart.

## What I'd do with more time

- **Stronger idempotency**: evolve the current `orderId` based approach into a dedicated idempotency key mechanism, ensuring exact replay of responses and better handling of concurrent requests.

- **Proper transaction management**: the current `OrderFulfillmentService` is a pragmatic workaround. It injects the DB connection directly to run a cross-table transaction, bypassing the repository layer. The cleaner solution would be using something like `nestjs-cls` (Continuation Local Storage): store the active transaction in the CLS context so repositories automatically use it when one is in progress, without leaking `tx` through method signatures. This enables a `@Transactional()` decorator pattern and keeps repositories fully unaware of transaction orchestration.

- **Startup recovery**: on boot, query all `processing` orders and re-emit their events to resume processing automatically after a crash.

- **Real job queue**: replace the current approach with BullMQ + Redis for retries with backoff, job visibility, and horizontal scaling. The processor interface is already isolated for this swap.

- **WebSockets**: replace TanStack Query polling with a WebSocket connection so the UI updates the instant an order's status changes.

- **Shared types package**: `packages/shared-types/` to eliminate the type duplication between `backend/src/database/schema.ts` and `frontend/src/types.ts`.

- **Tests**: unit tests for `OrdersService` (state transitions, idempotency) and `OrderFulfillmentService` (stock logic), plus integration tests for the API endpoints.

- **Pagination**: the orders list grows unbounded; cursor-based pagination and status/date filters would be needed in production.
