import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class WalletService {
  constructor(private prisma: PrismaService) { }

  async getWalletByUserId(userId: string, includeUser = false) {
    const wallet = await this.prisma.wallet.findFirst({
      where: { userId },
      include: includeUser ? { user: true } : undefined,
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    return wallet;
  }

  async getBalance(userId: string) {
    const wallet = await this.getWalletByUserId(userId);
    return {
      balance: wallet.balance.toString(),
      currency: wallet.currency,
    };
  }

  async deposit(userId: string, amount: number) {
    const wallet = await this.getWalletByUserId(userId);

    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than zero');
    }

    const decimalAmount = new Decimal(amount);

    return this.prisma.$transaction(async (tx) => {
      // 1. Get latest wallet (avoid stale balance)
      const currentWallet = await tx.wallet.findUnique({
        where: { id: wallet.id },
      });

      if (!currentWallet) {
        throw new NotFoundException('Wallet not found');
      }

      // 2. CREATE TRANSACTION (REQUIRED 🔥)
      const newTransaction = await tx.transaction.create({
        data: {
          senderWalletId: wallet.id,
          receiverWalletId: wallet.id,
          amount: decimalAmount,
          fee: new Decimal(0),
          type: 'DEPOSIT',
          status: 'COMPLETED',
          referenceId: `DEP-${Date.now()}`,
          description: 'Wallet deposit',
        },
      });

      // 3. UPDATE WALLET
      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: { increment: decimalAmount },
        },
      });

      // 4. CREATE LEDGER (FINAL FIX 🔥🔥🔥)
      await tx.ledger.create({
        data: {
          walletId: wallet.id,
          transactionId: newTransaction.id,
          debit: new Decimal(0),
          credit: decimalAmount,
          balanceBefore: currentWallet.balance,
          balanceAfter: currentWallet.balance.add(decimalAmount),
        },
      });

      return {
        message: 'Deposit successful',
        transactionId: newTransaction.id,
        amount: decimalAmount.toString(),
      };
    });
  }

  async withdraw(userId: string, amount: number) {
    const wallet = await this.getWalletByUserId(userId);

    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than zero');
    }

    const decimalAmount = new Decimal(amount);

    return this.prisma.$transaction(async (tx) => {
      // 1. Get latest wallet
      const currentWallet = await tx.wallet.findUnique({
        where: { id: wallet.id },
      });

      if (!currentWallet) {
        throw new NotFoundException('Wallet not found');
      }

      // 2. CHECK BALANCE 🔥
      if (currentWallet.balance.lt(decimalAmount)) {
        throw new BadRequestException('Insufficient balance');
      }

      // 3. CREATE TRANSACTION
      const newTransaction = await tx.transaction.create({
        data: {
          senderWalletId: wallet.id,
          receiverWalletId: wallet.id,
          amount: decimalAmount,
          fee: new Decimal(0),
          type: 'WITHDRAW', // 🔥 important
          status: 'COMPLETED',
          referenceId: `WDR-${Date.now()}`,
          description: 'Wallet withdrawal',
        },
      });

      // 4. UPDATE WALLET (DECREMENT)
      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: { decrement: decimalAmount },
        },
      });

      // 5. LEDGER ENTRY
      await tx.ledger.create({
        data: {
          walletId: wallet.id,
          transactionId: newTransaction.id,
          debit: decimalAmount, // 🔥 money going out
          credit: new Decimal(0),
          balanceBefore: currentWallet.balance,
          balanceAfter: currentWallet.balance.sub(decimalAmount),
        },
      });

      return {
        message: 'Withdraw successful',
        transactionId: newTransaction.id,
        amount: decimalAmount.toString(),
      };
    });
  }

  async getTransactions(userId: string, limit: number = 20, offset: number = 0) {
    const wallet = await this.getWalletByUserId(userId);

    const transactions = await this.prisma.transaction.findMany({
      where: {
        OR: [
          { senderWalletId: wallet.id },
          { receiverWalletId: wallet.id },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        senderWallet: {
          include: {
            user: {
              select: {
                phone: true,
              },
            },
          },
        },
        receiverWallet: {
          include: {
            user: {
              select: {
                phone: true,
              },
            },
          },
        },
      },
    });

    return transactions.map(tx => ({
      id: tx.id,
      amount: tx.amount.toString(),
      fee: tx.fee.toString(),
      type: tx.type,
      status: tx.status,
      referenceId: tx.referenceId,
      description: tx.description,
      senderPhone: tx.senderWallet?.user.phone,
      receiverPhone: tx.receiverWallet?.user.phone,
      createdAt: tx.createdAt,
    }));
  }



  async checkSufficientBalance(walletId: string, amount: Decimal): Promise<boolean> {
    const wallet = await this.prisma.wallet.findUnique({
      where: { id: walletId },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    return wallet.balance.gte(amount);
  }
}