# PayoutFlow - User Payout Management System

A comprehensive Low-Level Design (LLD) and full-stack implementation for managing user payouts for affiliate sales.

## Architecture

- **Frontend**: React, Vite, TypeScript, Tailwind CSS (Dark Magenta Theme)
- **Backend**: Node.js, Express, TypeScript
- **Database**: SQLite (via Prisma ORM)
- **Authentication**: Custom JWT with Role-Based Access Control (Admin/User)

## Business Logic Implemented
1. **Instant Advance Payout**: When a user records a sale, they instantly receive a 10% advance payout credited to their balance.
2. **Reconciliation (Approval)**: An administrator can approve a sale. The remaining 90% of the sale amount is then credited to the user's balance.
3. **Reconciliation (Rejection)**: An administrator can reject a sale. Since the user already received a 10% advance, this amount is deducted from their balance (resulting in a negative balance if they have no other funds).
4. **Withdrawal Limits**: Users can only withdraw funds once every 24 hours (a bypass button is included for testing).

## Setup & Testing
Please see the [TESTING_GUIDE.md](./TESTING_GUIDE.md) for a detailed, step-by-step tutorial on how to manually test all mathematical flows and edge cases.
