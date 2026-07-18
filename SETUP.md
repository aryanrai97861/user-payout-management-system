# PayoutFlow Setup Guide

Welcome to the PayoutFlow assignment! This guide will walk you through setting up the project locally from scratch so you can run, test, and evaluate the Low-Level Design (LLD).

## Prerequisites
Before you begin, ensure you have the following installed on your machine:
- **Node.js** (v18 or higher recommended)
- **npm** (comes bundled with Node.js)

## 1. Installation

The project is structured into two main directories: `backend` and `frontend`.

### Backend Setup
Open a terminal and navigate to the backend directory:
```bash
cd backend
npm install
```

### Frontend Setup
Open a second terminal window and navigate to the frontend directory:
```bash
cd frontend
npm install
```

## 2. Database Initialization & Seeding

PayoutFlow uses SQLite via Prisma, which means the database is just a local file (`dev.db`). You do not need to install PostgreSQL or MySQL!

In the **backend** terminal, run the following commands to generate the database schema and seed the initial Admin user:

```bash
# Push the schema to the SQLite database
npx prisma db push

# Generate the Prisma Client
npx prisma generate

# Seed the database (creates the Admin user and clears any old test data)
npx tsx src/clearDb.ts
```

> [!NOTE]
> The seed script automatically creates an administrator account for you to use during testing:
> **Email:** `admin@payoutflow.com`
> **Password:** `admin123`

## 3. Running the Application

You must run both the backend and frontend servers simultaneously.

**In the Backend Terminal:**
```bash
npm run dev
```
*(The backend server will start on `http://localhost:3000`)*

**In the Frontend Terminal:**
```bash
npm run dev
```
*(The frontend server will start on `http://localhost:5173`)*

## 4. Testing the Application

Once both servers are running, open your web browser and navigate to **`http://localhost:5173`**.

To manually test the mathematical flows (Advance Payouts, Reconciliations, and Failed Withdrawals), please refer to the step-by-step walkthrough in the **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** document!
