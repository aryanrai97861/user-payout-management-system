import { prisma } from '../db';

export class PayoutService {
  // 1. Process Advances Job
  static async processAdvances() {
    // Fetch pending sales that haven't been advance paid
    const pendingSales = await prisma.sale.findMany({
      where: {
        status: 'PENDING',
        advancePaid: false,
      },
    });

    let processedCount = 0;

    for (const sale of pendingSales) {
      // Use interactive transaction to ensure atomicity for each sale
      await prisma.$transaction(async (tx) => {
        // Double check condition within transaction (concurrency safeguard)
        const currentSale = await tx.sale.findUnique({ where: { id: sale.id } });
        if (!currentSale || currentSale.status !== 'PENDING' || currentSale.advancePaid) {
          return;
        }

        const advanceAmount = currentSale.amount * 0.10; // 10%

        // 1. Mark as advance paid
        await tx.sale.update({
          where: { id: sale.id },
          data: { advancePaid: true },
        });

        // 2. Create Transaction
        await tx.transaction.create({
          data: {
            userId: sale.userId,
            saleId: sale.id,
            amount: advanceAmount,
            type: 'ADVANCE_PAYOUT',
          },
        });

        // 3. Update User Balance
        await tx.user.update({
          where: { id: sale.userId },
          data: { balance: { increment: advanceAmount } },
        });

        processedCount++;
      });
    }

    return { processedCount };
  }

  // 2. Reconcile Sale (Admin)
  static async reconcileSale(saleId: string, newStatus: 'APPROVED' | 'REJECTED') {
    return await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findUnique({ where: { id: saleId } });
      if (!sale) throw new Error("Sale not found");
      if (sale.status !== 'PENDING') throw new Error("Sale already reconciled");

      let amountToAdjust = 0;
      let transactionType = '';

      if (newStatus === 'APPROVED') {
        if (sale.advancePaid) {
          amountToAdjust = sale.amount * 0.90; // Remaining 90%
        } else {
          amountToAdjust = sale.amount; // Full amount if advance wasn't paid for some reason
        }
        transactionType = 'FINAL_PAYOUT';
      } else if (newStatus === 'REJECTED') {
        if (sale.advancePaid) {
          // Take back the advance payout
          amountToAdjust = -(sale.amount * 0.10);
        } else {
          amountToAdjust = 0;
        }
        transactionType = 'ADJUSTMENT';
      }

      // Update sale status
      await tx.sale.update({
        where: { id: sale.id },
        data: { status: newStatus },
      });

      if (amountToAdjust !== 0) {
        // Create transaction
        await tx.transaction.create({
          data: {
            userId: sale.userId,
            saleId: sale.id,
            amount: amountToAdjust,
            type: transactionType,
          },
        });

        // Update user balance (allow negative per requirements)
        await tx.user.update({
          where: { id: sale.userId },
          data: { balance: { increment: amountToAdjust } },
        });
      }

      return { message: `Sale ${newStatus}`, amountToAdjust };
    });
  }

  // 3. Request Withdrawal (User)
  static async requestWithdrawal(userId: string, amountToWithdraw: number) {
    return await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new Error("User not found");
      if (user.balance <= 0) throw new Error("No positive balance to withdraw");
      if (amountToWithdraw > user.balance) throw new Error("Insufficient balance");
      if (amountToWithdraw <= 0) throw new Error("Invalid withdrawal amount");

      // Check 24 hour restriction
      if (user.lastWithdrawalAt) {
        const timeDiffMs = new Date().getTime() - new Date(user.lastWithdrawalAt).getTime();
        const hoursPassed = timeDiffMs / (1000 * 60 * 60);
        if (hoursPassed < 24) {
          throw new Error("Withdrawal allowed only once every 24 hours");
        }
      }

      // Process withdrawal
      await tx.user.update({
        where: { id: user.id },
        data: {
          balance: { decrement: amountToWithdraw },
          lastWithdrawalAt: new Date(),
        },
      });

      await tx.transaction.create({
        data: {
          userId: user.id,
          amount: -amountToWithdraw, // Negative amount to represent outgoing
          type: 'WITHDRAWAL',
        },
      });

      return { message: "Withdrawal successful", amount: amountToWithdraw };
    });
  }
}
