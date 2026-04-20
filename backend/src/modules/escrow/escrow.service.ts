import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { AuthService } from '../auth/auth.service';
import { HashingUtil } from '../../utils/hashing';
import { Decimal } from '@prisma/client/runtime/library';
import { CreateEscrowDto, ReleaseEscrowDto } from './dto';

@Injectable()
export class EscrowService {
  constructor(
    private prisma: PrismaService,
    private walletService: WalletService,
    private authService: AuthService,
  ) { }

  async createEscrow(userId: string, dto: CreateEscrowDto) {
    // Verify PIN
    const isPinValid = await this.authService.verifyPin(userId, { pin: dto.pin });
    if (!isPinValid) {
      throw new UnauthorizedException('Invalid PIN');
    }

    if (!process.env.SYSTEM_WALLET_ID) {
      throw new Error('System wallet not configured in. env')
    }

    // guaranteed to exist on system_wallets_ID 
    const SYSTEM_WALLET_ID = process.env.SYSTEM_WALLET_ID!;
    const FEE_PERCENTAGE = new Decimal(process.env.FEE_PERCENTAGE || 0.01)

    const senderWallet = await this.walletService.getWalletByUserId(userId);
    const amount = new Decimal(dto.amount);
    const feePercentage = new Decimal(0.01);
    const fee = amount.mul(feePercentage);
    const totalAmount = amount.add(fee);
    const receiverWallet = await this.walletService.getWalletByUserId(dto.receiverId);
    // Check balance
    const hasSufficientBalance = await this.walletService.checkSufficientBalance(
      senderWallet.id,
      totalAmount,
    );

    if (!hasSufficientBalance) {
      throw new BadRequestException('Insufficient balance');
    }

    const referenceId = HashingUtil.generateReferenceId('ESC');

    // Calculate release date (default 7 days)
    const releaseDate = new Date();
    releaseDate.setDate(releaseDate.getDate() + (dto.releaseDays || 7));

    // Create escrow transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create transaction
      const transaction = await tx.transaction.create({
        data: {
          senderWalletId: senderWallet.id,
          receiverWalletId: receiverWallet.id,
          amount,
          fee,
          type: 'ESCROW',
          status: 'HELD',
          referenceId,
          description: dto.description,
        },
      });

      // Create escrow record
      const escrow = await tx.escrow.create({
        data: {
          transactionId: transaction.id,
          heldAmount: amount,
          status: 'HELD',
          releaseDate,
          reason: dto.reason,
        },
      });

      // Deduct from sender wallet
      await tx.wallet.update({
        where: { id: senderWallet.id },
        data: { balance: { decrement: totalAmount } },
      });

      // Create ledger entry
      const currentWallet = await tx.wallet.findUnique({
        where: { id: senderWallet.id },
      });

      await tx.ledger.create({
        data: {
          transactionId: transaction.id,
          walletId: senderWallet.id,
          debit: totalAmount,
          credit: new Decimal(0),
          balanceBefore: currentWallet.balance.add(totalAmount),
          balanceAfter: currentWallet.balance,
        },
      });

      // ✅ SYSTEM TAKES FEE HERE
      const systemWallet = await tx.wallet.findUnique({
        where: { id: SYSTEM_WALLET_ID },
      });

      await tx.wallet.update({
        where: { id: SYSTEM_WALLET_ID },
        data: { balance: { increment: fee } },
      });

      await tx.ledger.create({
        data: {
          transactionId: transaction.id,
          walletId: SYSTEM_WALLET_ID,
          debit: new Decimal(0),
          credit: fee,
          balanceBefore: systemWallet.balance,
          balanceAfter: systemWallet.balance.add(fee),
        },
      });

      return { transaction, escrow };
    });

    return {
      escrowId: result.escrow.id,
      transactionId: result.transaction.id,
      receiverId: receiverWallet.userId,
      referenceId: result.transaction.referenceId,
      amount: result.escrow.heldAmount.toString(),
      status: result.escrow.status,
      releaseDate: result.escrow.releaseDate,
    };
  }

   async confirmEscrow(receiverId: string, escrowId: string) {
    await this.prisma.$transaction(async (tx) => {
      // Step 1: Fetch the escrow to verify existence, status, and receiver
      const escrow = await tx.escrow.findUnique({
        where: { id: escrowId },
        include: {
          transaction: {
            include: {
              receiverWallet: true,
            },
          },
        },
      });

      if (!escrow) {
        throw new BadRequestException('Escrow not found');
      }

      // Step 2: Validate escrow status
      if (escrow.status !== 'HELD') {
        throw new BadRequestException('Escrow is not in HELD status');
      }

      // Step 3: Verify that the caller is the intended receiver
      if (escrow.transaction.receiverWallet?.userId !== receiverId) {
        throw new UnauthorizedException('Not authorized to confirm this escrow');
      }

      // Step 4: Update escrow status to RELEASED (now that we've verified)
      // Use condition on status to prevent race double-update
      const escrowResult = await tx.escrow.updateMany({
        where: {
          id: escrowId,
          status: 'HELD',
        },
        data: {
          status: 'RELEASED',
          releasedAt: new Date(),
        },
      });

      if (escrowResult.count === 0) {
        // This means the status changed between our fetch and update (race condition)
        throw new BadRequestException('Escrow status changed; please try again');
      }

      // Step 5: Get receiver wallet (now that we've confirmed the escrow is ours)
      const receiverUser = await tx.user.findUnique({
        where: { id: receiverId },
        include: { wallets: true },
      });

      if (!receiverUser || receiverUser.wallets.length === 0) {
        throw new BadRequestException('Receiver wallet not found');
      }

      const receiverWallet = receiverUser.wallets[0];

      // Step 6: Update transaction status to COMPLETED
      await tx.transaction.update({
        where: { id: escrow.transactionId },
        data: {
          status: 'COMPLETED',
          receiverWalletId: receiverWallet.id,
        },
      });

      // Step 7: Credit receiver's wallet with the held amount
      await tx.wallet.update({
        where: { id: receiverWallet.id },
        data: { balance: { increment: escrow.heldAmount } },
      });

      // Step 8: Create ledger entry for the receiver (credit)
      const currentWallet = await tx.wallet.findUnique({
        where: { id: receiverWallet.id },
      });

      await tx.ledger.create({
        data: {
          transactionId: escrow.transactionId,
          walletId: receiverWallet.id,
          debit: new Decimal(0),
          credit: escrow.heldAmount,
          balanceBefore: currentWallet.balance.sub(escrow.heldAmount),
          balanceAfter: currentWallet.balance,
        },
      });
    });

    return { message: 'Escrow confirmed successfully' };
  }

  async getEscrowDetails(userId: string, escrowId: string) {
    const escrow = await this.prisma.escrow.findUnique({
      where: { id: escrowId },
      include: {
        transaction: {
          include: {
            senderWallet: {
              include: { user: { select: { phone: true } } },
            },
            receiverWallet: {
              include: { user: { select: { phone: true } } },
            },
          },
        },
      },
    });

    if (!escrow) {
      throw new BadRequestException('Escrow not found');
    }

    return {
      id: escrow.id,
      amount: escrow.heldAmount.toString(),
      status: escrow.status,
      releaseDate: escrow.releaseDate,
      releasedAt: escrow.releasedAt,
      reason: escrow.reason,
      transaction: {
        id: escrow.transaction.id,
        referenceId: escrow.transaction.referenceId,
        senderPhone: escrow.transaction.senderWallet?.user.phone,
        receiverPhone: escrow.transaction.receiverWallet?.user.phone,
      },
    };
  }

   async processExpiredEscrows() {
    const now = new Date();
    // Find all escrows that are HELD and releaseDate is past now
    const expiredEscrows = await this.prisma.escrow.findMany({
      where: {
        status: 'HELD',
        releaseDate: {
          lt: now,
        },
      },
      include: {
        transaction: {
          include: {
            senderWallet: true,
          },
        },
      },
    });

    for (const escrow of expiredEscrows) {
      // Refund the sender the heldAmount (the fee is already with the system)
      await this.prisma.$transaction(async (tx) => {
        // Update escrow status to CANCELLED and set cancelledAt
        await tx.escrow.update({
          where: { id: escrow.id },
          data: {
            status: 'CANCELLED',
            cancelledAt: now,
          },
        });

        // Update transaction status to CANCELLED
        await tx.transaction.update({
          where: { id: escrow.transactionId },
          data: {
            status: 'CANCELLED',
          },
        });

        // Credit the sender wallet with the heldAmount
        const senderWallet = await tx.wallet.findUnique({
          where: { id: escrow.transaction.senderWalletId },
        });

        await tx.wallet.update({
          where: { id: senderWallet.id },
          data: { balance: { increment: escrow.heldAmount } },
        });

        // Create ledger entry for the sender (credit)
        const currentWallet = await tx.wallet.findUnique({
          where: { id: senderWallet.id },
        });

        await tx.ledger.create({
          data: {
            transactionId: escrow.transactionId,
            walletId: senderWallet.id,
            debit: new Decimal(0),
            credit: escrow.heldAmount,
            balanceBefore: currentWallet.balance.sub(escrow.heldAmount),
            balanceAfter: currentWallet.balance,
          },
        });
      });
    }

    return { processed: expiredEscrows.length };
  }
}