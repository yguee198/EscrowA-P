import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class WithdrawService {
  constructor(private prisma: PrismaService) { }

  async requestWithdrawal(
    userId: string,
    amount: number,
    _pin: string,
    currency: string,
    bankName: string,
    bankAccountNumber: string,
  ) {
    if (!amount || amount <= 0) {
      throw new BadRequestException('Invalid withdrawal amount');
    }

    return await this.prisma.$transaction(async (tx) => {
      const userWallet = await tx.wallet.findFirst({
        where: { userId },
      });

      if (!userWallet) {
        throw new BadRequestException('Wallet not found');
      }

      const amountDecimal = new Prisma.Decimal(amount);

      if (userWallet.balance.lt(amountDecimal)) {
        throw new BadRequestException('Insufficient balance');
      }

      const transaction = await tx.transaction.create({
        data: {
          senderWalletId: userWallet.id,
          amount: amountDecimal,
          type: 'WITHDRAW',
          status: 'PENDING',
          referenceId: `WD-${Date.now()}`,
          metadata: {
            currency,
            bankName,
            bankAccountNumber,
          },
        },
      });

      await tx.wallet.update({
        where: { id: userWallet.id },
        data: {
          balance: userWallet.balance.minus(amountDecimal),
        },
      });

      return {
        status: 'success',
        message: 'Withdrawal requested successfully',
        transaction_id: transaction.id,
        note: 'Please ensure your bank account details are correct. Incorrect details may result in delays or failed transactions.',
      };
    });
  }


  async getWithdrawalHistory(userId: string) {
    const userWallet = await this.prisma.wallet.findFirst({
      where: { userId },
    });

    if (!userWallet) {
      return { status: 'error', message: 'Wallet not found' };
    }

    const transactions = await this.prisma.transaction.findMany({
      where: {
        senderWalletId: userWallet.id,
        type: 'WITHDRAW',
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      status: 'success',
      data: transactions,
    };
  }

  async getPendingWithdrawals() {
    const transactions = await this.prisma.transaction.findMany({
      where: { type: 'WITHDRAW', status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    });

    return transactions.map((tx) => {
      // Type assertion kuri metadata
      const metadata = tx.metadata as {
        currency?: string;
        bankName?: string;
        bankAccountNumber?: string;
      };

      return {
        transaction_id: tx.id,
        userId: tx.senderWalletId,
        amount: tx.amount.toNumber(),
        currency: metadata?.currency || 'RWF',
        bank_name: metadata?.bankName || '',
        bank_account_number: metadata?.bankAccountNumber || '',
        status: tx.status,
        createdAt: tx.createdAt,
      };
    });
  }

  async approveWithdrawal(transactionId: string, adminId: string) {
    return await this.prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.findUnique({ where: { id: transactionId } });
      if (!transaction || transaction.type !== 'WITHDRAW') throw new NotFoundException('Transaction not found');
      if (transaction.status !== 'PENDING') throw new BadRequestException('Transaction is not pending');

      // Complete transaction
      await tx.transaction.update({ where: { id: transactionId }, data: { status: 'COMPLETED' } });

      // Ledger entry
      await tx.ledger.create({
        data: {
          transactionId,
          walletId: transaction.senderWalletId,
          debit: transaction.amount,
          credit: 0,
          balanceBefore: transaction.amount, // optional: real balance
          balanceAfter: transaction.amount,  // optional: real balance
        },
      });

      // Audit log
      await tx.auditLog.create({
        data: { userId: adminId, action: `Approved withdrawal ${transactionId}`, metadata: { transactionId } },
      });

      return { status: 'success', message: 'Withdrawal approved', transaction_id: transactionId };
    });
  }

  async rejectWithdrawal(transactionId: string, adminId: string) {
    return await this.prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.findUnique({ where: { id: transactionId } });
      if (!transaction || transaction.type !== 'WITHDRAW') throw new NotFoundException('Transaction not found');
      if (transaction.status !== 'PENDING') throw new BadRequestException('Transaction is not pending');

      // Refund wallet
      const wallet = await tx.wallet.findUnique({ where: { id: transaction.senderWalletId } });
      if (!wallet) throw new NotFoundException('Wallet not found');

      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: wallet.balance.plus(transaction.amount) },
      });

      // Update transaction to FAILED
      await tx.transaction.update({ where: { id: transactionId }, data: { status: 'FAILED' } });

      // Ledger entry for refund
      await tx.ledger.create({
        data: {
          transactionId,
          walletId: wallet.id,
          debit: 0,
          credit: transaction.amount,
          balanceBefore: wallet.balance.minus(transaction.amount),
          balanceAfter: wallet.balance,
        },
      });

      await tx.auditLog.create({
        data: { userId: adminId, action: `Rejected withdrawal ${transactionId}`, metadata: { transactionId } },
      });

      return { status: 'success', message: 'Withdrawal rejected and refunded', transaction_id: transactionId };
    });
  }
}