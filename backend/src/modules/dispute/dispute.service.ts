import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma/prisma.service';
import { randomUUID } from 'crypto';

@Injectable()
export class DisputeService {
  constructor(private prisma: PrismaService) {}

  // 🟡 OPEN DISPUTE
  async openDispute(userId: string, escrowId: string, reason: string) {
    return this.prisma.$transaction(async (tx) => {
      const escrow = await tx.escrow.findUnique({
        where: { id: escrowId },
        include: { transaction: true },
      });

      if (!escrow) throw new BadRequestException('Escrow not found');

      if (escrow.status !== 'HELD') {
        throw new BadRequestException('Only HELD escrow can be disputed');
      }

      const dispute = await tx.dispute.create({
        data: {
          id: randomUUID(),
          escrowId,
          openedBy: userId,
          reason,
          status: 'OPEN',
        },
      });

      await tx.escrow.update({
        where: { id: escrowId },
        data: { status: 'DISPUTED' },
      });

      return dispute;
    });
  }

  // 🟢 RESOLVE DISPUTE
  async resolveDispute(disputeId: string, resolution: 'REFUND' | 'RELEASE') {
    return this.prisma.$transaction(async (tx) => {
      const dispute = await tx.dispute.findUnique({
        where: { id: disputeId },
        include: {
          escrow: {
            include: { transaction: true },
          },
        },
      });

      if (!dispute) throw new BadRequestException('Dispute not found');

      if (dispute.status !== 'OPEN') {
        throw new BadRequestException('Already resolved');
      }

      const escrow = dispute.escrow;

      if (resolution === 'RELEASE') {
        await tx.wallet.update({
          where: { id: escrow.transaction.receiverWalletId },
          data: { balance: { increment: escrow.heldAmount } },
        });
      }

      if (resolution === 'REFUND') {
        await tx.wallet.update({
          where: { id: escrow.transaction.senderWalletId },
          data: { balance: { increment: escrow.heldAmount } },
        });
      }

      await tx.dispute.update({
        where: { id: disputeId },
        data: {
          status: 'RESOLVED',
          resolution,
        },
      });

      await tx.escrow.update({
        where: { id: escrow.id },
        data: {
          status: resolution === 'RELEASE' ? 'RELEASED' : 'REFUNDED',
        },
      });

      return { message: 'Dispute resolved successfully' };
    });
  }
}