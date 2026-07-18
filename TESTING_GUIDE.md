# Testing & Walkthrough Guide

Follow this guide to manually test the mathematical flows and Role-Based Access Control (RBAC) built into PayoutFlow.

## 1. Starting the Application
1. Open two terminal windows.
2. In the first terminal, navigate to `/backend` and run `npm run dev`.
3. In the second terminal, navigate to `/frontend` and run `npm run dev`.
4. Open your browser to `http://localhost:5173`.

## 2. Setting Up a Test Account
1. On the login screen, click **Sign up**.
2. Enter your Name, Email, and Password to create a standard User account.
3. You will be redirected to your User Dashboard. Notice your **Available Balance** is exactly `$0.00`.

## 3. Testing the Instant Advance (10%)
1. In the **New Sale** form, enter a Product Name, Customer Name, Brand (e.g., `brand_1`), and an Amount of **$100.00**.
2. Click **Record Sale**.
3. **Observe**: 
   - Your Available Balance instantly jumps to **$10.00** (10% of $100).
   - In the **Your Sales** list, the sale is marked `PENDING` with a pulsing "10% Advance Paid" badge.
   - In the **Transactions** list, you see an `ADVANCE_PAYOUT` of `+$10.00`.

## 4. Testing an Approved Sale (Remaining 90%)
1. Click **Logout** in the top right corner.
2. Log in using the seeded Admin credentials:
   - **Email:** `admin@payoutflow.com`
   - **Password:** `admin123`
3. You are now in the **System Administration** panel. You can see the $100 sale you just created.
4. Click the green **Approve** button next to the sale.
5. Log out, and log back in to your standard User account.
6. **Observe**:
   - Your Available Balance is now **$100.00** (the initial $10 + the remaining $90).
   - In the **Transactions** list, you see a `FINAL_PAYOUT` of `+$90.00`.

## 5. Testing a Rejected Sale (Negative Deduction)
1. Still logged in as the User, create a second sale for **$50.00**.
2. **Observe**: Your balance instantly increases by $5.00 (10% advance), bringing your total balance to **$105.00**.
3. Log out and log back in as the Admin (`admin@payoutflow.com`).
4. Locate the new $50.00 sale and click the red **Reject** button.
5. Log out, and log back in to your User account.
6. **Observe**:
   - Your Available Balance has dropped back to **$100.00**.
   - Under the rejected sale in **Your Sales**, a red warning explicitly states: *"Sale rejected! A -10% deduction was explicitly applied to your balance to recover the advance."*
   - In the **Transactions** list, a red `ADJUSTMENT` of `-$5.00` is recorded for "Advance recovery charge".
   *(Note: If your balance was $0 prior to the deduction, your balance will correctly show as negative, e.g., `-$5.00`)*.

## 6. Testing Failed Payout Recovery (Withdrawals)
1. Still logged in as the User, request a withdrawal of **$20.00** in the Request Withdrawal section.
2. **Observe**:
   - Your Available Balance drops to **$80.00**.
   - The Withdraw Funds button turns into a **Locked (23h 59m 59s)** timer. (Clicking it will show a warning popup).
   - In the Transactions list, you see a `WITHDRAWAL` of `-$20.00` with a yellow `PENDING` badge.
3. Log out and log back in as the Admin (`admin@payoutflow.com`).
4. Scroll down to the **Withdrawal Requests** section. You will see the user's $20.00 pending withdrawal.
5. Click the red **Fail** button next to the withdrawal.
6. Log out, and log back in to your User account.
7. **Observe**:
   - Your Available Balance is restored back to **$100.00**.
   - In the Transactions list, the original withdrawal now has a red `FAILED` badge and is crossed out (struck-through).
   - A new green `WITHDRAWAL_REFUND` transaction of `+$20.00` is visible, explicitly recovering the failed amount.
   - The Withdrawal timer is completely gone, and the button is unlocked, allowing you to instantly withdraw again!
