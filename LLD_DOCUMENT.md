# Low-Level Design (LLD) Document: PayoutFlow

This document addresses the core design criteria for the PayoutFlow User Payout Management System.

## 1. Low-Level Design (LLD) Overview
PayoutFlow is a monolithic full-stack application built using Node.js (Express) on the backend and React (Vite) on the frontend. The system is designed around a unified `PayoutService` that handles the strict mathematical calculations for advance payouts, final payout adjustments (reconciliations), and withdrawal processing. 

Role-Based Access Control (RBAC) separates users (who generate sales and request withdrawals) from administrators (who approve/reject sales and finalize/fail withdrawal requests).

## 2. Database Schema(s) with Relationships
The database is managed using Prisma ORM with SQLite. The schema strictly enforces relationships between Users, Sales, and Transactions.

```prisma
model User {
  id               String        @id @default(uuid())
  email            String        @unique
  name             String
  role             String        @default("USER") // USER or ADMIN
  balance          Float         @default(0)
  lastWithdrawalAt DateTime?
  sales            Sale[]
  transactions     Transaction[]
}

model Sale {
  id           String        @id @default(uuid())
  userId       String
  user         User          @relation(fields: [userId], references: [id])
  productName  String
  customerName String
  brand        String?
  amount       Float
  status       String        @default("PENDING") // PENDING, APPROVED, REJECTED
  advancePaid  Boolean       @default(false)
  transactions Transaction[]
}

model Transaction {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  saleId    String?
  sale      Sale?    @relation(fields: [saleId], references: [id])
  amount    Float
  type      String   // ADVANCE_PAYOUT, FINAL_PAYOUT, ADJUSTMENT, WITHDRAWAL, WITHDRAWAL_REFUND
  status    String   @default("COMPLETED") // PENDING, COMPLETED, FAILED, CANCELLED
}
```

**Relationships:**
- **User (1) to (N) Sale**: A user can have many sales.
- **User (1) to (N) Transaction**: A user has a ledger of transactions.
- **Sale (1) to (N) Transaction**: A single sale triggers multiple transactions across its lifecycle (e.g., one for the 10% advance, another for the 90% final payout, or a negative adjustment).

## 3. Class Design / Services
Since the backend uses a functional TypeScript approach with Express, the core business logic is encapsulated within a central service class, `PayoutService`, utilizing Prisma's interactive transactions for atomicity.

### `PayoutService`
- `processAdvances()`: Immediately processes a 10% advance for any `PENDING` sale that has `advancePaid: false`. Creates an `ADVANCE_PAYOUT` transaction and updates the user's balance.
- `reconcileSale(saleId, newStatus)`: Handles the transition of a sale to `APPROVED` or `REJECTED`. Calculates the remaining 90% payout or the -10% deduction depending on whether the advance was already paid out.
- `requestWithdrawal(userId, amountToWithdraw)`: Enforces the 24-hour limit, deducts the balance immediately, and creates a `PENDING` `WITHDRAWAL` transaction.
- `updateWithdrawalStatus(transactionId, newStatus)`: Allows admins to fail a withdrawal, dynamically triggering a `WITHDRAWAL_REFUND` transaction and resetting the 24-hour withdrawal lock.

## 4. APIs / Endpoints

### Auth Routes
- `POST /api/auth/register` - Registers a new `USER`.
- `POST /api/auth/login` - Authenticates user and returns JWT.

### User Routes (Protected)
- `GET /api/users/dashboard` - Returns safe user data, populated with their `sales` and `transactions` histories.
- `POST /api/users/reset-timer` - (Test utility) Nullifies `lastWithdrawalAt` to bypass 24h limit.

### Sale Routes (Protected)
- `POST /api/sales` - Creates a new sale and immediately triggers `PayoutService.processAdvances()` for instant crediting.
- `GET /api/sales` - (Admin only) Returns all sales globally for reconciliation.
- `POST /api/sales/:id/reconcile` - (Admin only) Approves or rejects a sale.

### Withdrawal Routes (Protected)
- `POST /api/withdrawals` - Initiates a withdrawal request, starting the 24-hour timer.
- `GET /api/withdrawals` - (Admin only) Lists all pending and completed withdrawals.
- `POST /api/withdrawals/:id/status` - (Admin only) Transitions a withdrawal to `COMPLETED` or `FAILED`.

## 5. Handling Edge Cases & Failure Scenarios
- **Concurrency & Double Spending**: All monetary calculations (`balance: { increment: X }`) and state changes are wrapped inside `prisma.$transaction`. This guarantees atomicity. If a withdrawal request hits the database exactly when a sale is rejected, the transaction lock ensures the balance never goes out of sync.
- **Negative Balances**: If an advance payout is issued, and the user immediately withdraws their entire balance, the balance becomes $0. If the admin subsequently rejects the sale, the 10% deduction is still applied, putting the user into a mathematically correct **negative balance**. The frontend explicitly alerts the user why their balance is negative.
- **Failed Payout Recovery**: If a withdrawal process fails externally, the admin can mark it `FAILED`. The system automatically refunds the exact amount to the balance and lifts the 24-hour timer lock so the user can immediately try again without being penalized by the system timeout.
- **Stale JWTs / DB Wipes**: If the database is reset but the user retains a signed JWT, the `GET /api/users/dashboard` route checks if the user actually exists in the DB. If not, it gracefully returns a 404, prompting the frontend to purge the stale token and reload the login screen.

## 6. Key Design Decisions & Trade-Offs
- **Instant vs Scheduled Advances**: The original business rules implied advances were processed via a scheduled cron job ("even if the advance payout job runs multiple times"). I opted to shift this to an **instant, event-driven** model where `processAdvances()` is called sequentially inside the `POST /api/sales` endpoint. *Trade-off*: Slightly slower sale creation endpoint response time, but drastically improved User Experience (instant balance updates) and reduced infrastructure overhead (no need for Redis/BullMQ or cron workers).
- **Ledger Model via Transactions**: Instead of simply updating a `balance` float on the User model, every single mathematical change is rigidly recorded in a `Transaction` row. *Trade-off*: Higher storage footprint, but essential for auditing, transparency, and calculating exact refunds during the Failed Payout Recovery workflow.
- **Frontend Timer Validation**: The 24-hour withdrawal timer is visually rendered entirely on the frontend via state calculation, but the actual security enforcement relies on the backend checking `lastWithdrawalAt`. *Trade-off*: It prevents the user from making unnecessary API calls that will fail anyway, though testing requires a deliberate "bypass timer" endpoint.
