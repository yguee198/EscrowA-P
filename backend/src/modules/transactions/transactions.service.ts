import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma/prisma.service';
import { RedisService } from '../../config/redis/redis.service';
import { WalletService } from '../wallet/wallet.service';
import { AuthService } from '../auth/auth.service';
import { HashingUtil } from '../../utils/hashing';
import { Decimal } from '@prisma/client/runtime/library';
import { SendMoneyDto } from './dto/send-money.dto';
import { RequestMoneyDto } from './dto/request-money.dto';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { ConfirmTransactionDto } from './dto/confirm-transaction.dto';
import { NotificationService } from '../notifications/notification.service';
import { OtpService } from '../otp/otp.service';
import { OtpPurpose } from '@prisma/client';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { SmsService } from '../sms/sms.service';

@Injectable()
export class TransactionsService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private walletService: WalletService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private otpService: OtpService,
    private readonly smsService: SmsService,

    @InjectQueue('sms-queue') private smsQueue: Queue,
  ) { }

  calculateFee(amount: Decimal): Decimal {
    // placeholder, later use: return amount.mul(0.01);
    return new Decimal(0);
  }

  async sendTransactionSms(phone: string, message: string) {
    // add job to Bull queue
    await this.smsQueue.add('send-sms', { phone, message });

    // optionally also send immediately via service
    // await this.smsService.sendSms(phone, message);
  }

  async sendMoney(userId: string, dto: SendMoneyDto) {
    // Verify PIN
    const isPinValid = await this.authService.verifyPin(userId, { pin: dto.pin });
    if (!isPinValid) {
      throw new UnauthorizedException('Invalid PIN');
    }

    // Get sender wallet
    const senderWallet = await this.walletService.getWalletByUserId(userId, true);

    // Get receiver wallet
    const receiverUser = await this.prisma.user.findUnique({
      where: { phone: dto.receiverPhone },
      include: { wallets: true },
    });
    //  if we chose to meeting to someOne only expected One we need to handle ?..
    if (!receiverUser || receiverUser.wallets.length === 0) {
      throw new BadRequestException('Receiver not found');
    }

    const receiverWallet = receiverUser.wallets[0];

    // Calculate total amount (amount + fee)
    const amount = new Decimal(dto.amount);
    const fee = this.calculateFee(amount);
    const totalAmount = amount.add(fee);

    // Check balance
    const hasSufficientBalance = await this.walletService.checkSufficientBalance(
      senderWallet.id,
      totalAmount,
    );

    if (!hasSufficientBalance) {
      throw new BadRequestException('Insufficient balance');
    }

    // Generate reference ID
    const referenceId = HashingUtil.generateReferenceId('TXN');

    // Check idempotency
    const idempotencyKey = `${userId}-${dto.receiverPhone}-${amount.toString()}-${Date.now()}`;
    const isNewTransaction = await this.redis.setIdempotencyKey(idempotencyKey, referenceId);

    if (!isNewTransaction) {
      const existingResult = await this.redis.getIdempotencyResult(idempotencyKey);
      throw new BadRequestException('Duplicate transaction detected');
    }

    // Execute transaction with double-entry accounting
    const transaction = await this.prisma.$transaction(async (tx) => {
      // Create transaction record
      const newTransaction = await tx.transaction.create({
        data: {
          senderWalletId: senderWallet.id,
          receiverWalletId: receiverWallet.id,
          amount,
          fee,
          type: 'SEND',
          status: 'PENDING',
          referenceId,
          description: dto.description,
        },
      });

      // Get current balances
      const currentSenderWallet = await tx.wallet.findUnique({
        where: { id: senderWallet.id },
      });
      const currentReceiverWallet = await tx.wallet.findUnique({
        where: { id: receiverWallet.id },
      });

      // Debit sender (debit = money out)
      await tx.ledger.create({
        data: {
          transactionId: newTransaction.id,
          walletId: senderWallet.id,
          debit: totalAmount,
          credit: new Decimal(0),
          balanceBefore: currentSenderWallet.balance,
          balanceAfter: currentSenderWallet.balance.sub(totalAmount),
        },
      });

      // Credit receiver (credit = money in)
      await tx.ledger.create({
        data: {
          transactionId: newTransaction.id,
          walletId: receiverWallet.id,
          debit: new Decimal(0),
          credit: amount,
          balanceBefore: currentReceiverWallet.balance,
          balanceAfter: currentReceiverWallet.balance.add(amount),
        },
      });

      // Update wallet balances
      await tx.wallet.update({
        where: { id: senderWallet.id },
        data: { balance: { decrement: totalAmount } },
      });

      await tx.wallet.update({
        where: { id: receiverWallet.id },
        data: { balance: { increment: amount } },
      });

      // Update transaction status
      await tx.transaction.update({
        where: { id: newTransaction.id },
        data: { status: 'COMPLETED' },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId,
          action: 'SEND_MONEY',
          metadata: {
            transactionId: newTransaction.id,
            amount: amount.toString(),
            receiver: dto.receiverPhone,
          },
        },
      });

      return newTransaction;
    });

    // generate opt after transactions create.
    const otpCode = await this.otpService.createOTP(
      userId,
      senderWallet.user.phone,
      'TRANSACTION',      // purpose
      undefined,          // ip
      undefined,          // device
      transaction.id,     // transactionId
      'SMS',              // channel
    );

    // 4. Send OTP via queue
    await this.smsQueue.add('send-otp', {
      phone: senderWallet.user.phone,
      message: `Your OTP is ${otpCode}. Do not share it.`,
    });

    //  Send notifications should be here (optional, can be done asyn)
    await this.notificationService.sendTransactionNotification(
      userId,
      senderWallet.user?.phone || dto.receiverPhone,
      `You sent ${amount} RWF to ${dto.receiverPhone}. Ref: ${referenceId}`,
      transaction.id
    );

    await this.notificationService.sendTransactionNotification(
      receiverUser.id,
      dto.receiverPhone,
      `You received ${amount} RWF from ${senderWallet.user?.phone}. Ref: ${referenceId}`,
      transaction.id
    );

    return {
      transactionId: transaction.id,
      referenceId: transaction.referenceId,
      amount: transaction.amount.toString(),
      status: transaction.status,
      createdAt: transaction.createdAt,
    };
  }

  async getTransactionById(userId: string, transactionId: string) {
    const wallet = await this.walletService.getWalletByUserId(userId);

    const transaction = await this.prisma.transaction.findFirst({
      where: {
        id: transactionId,
        OR: [
          { senderWalletId: wallet.id },
          { receiverWalletId: wallet.id },
        ],
      },
      include: {
        senderWallet: {
          include: { user: { select: { phone: true } } },
        },
        receiverWallet: {
          include: { user: { select: { phone: true } } },
        },
      },
    });

    if (!transaction) {
      throw new BadRequestException('Transaction not found');
    }

    return {
      id: transaction.id,
      amount: transaction.amount.toString(),
      fee: transaction.fee.toString(),
      type: transaction.type,
      status: transaction.status,
      referenceId: transaction.referenceId,
      description: transaction.description,
      senderPhone: transaction.senderWallet?.user.phone,
      receiverPhone: transaction.receiverWallet?.user.phone,
      createdAt: transaction.createdAt,
    };
  }

  async requestMoney(userId: string, dto: RequestMoneyDto) {
    const requesterWallet = await this.prisma.wallet.findFirst({
      where: { userId },
    });

    if (!requesterWallet) {
      throw new BadRequestException('Requester wallet not found');
    }

    const receiver = await this.prisma.user.findUnique({
      where: { phone: dto.receiverPhone },
    });

    if (!receiver) {
      throw new BadRequestException('Receiver not found');
    }

    const receiverWallet = await this.prisma.wallet.findFirst({
      where: { userId: receiver.id },
    });

    if (!receiverWallet) {
      throw new BadRequestException('Receiver wallet not found');
    }

    const referenceId = HashingUtil.generateReferenceId('REQ');

    const transaction = await this.prisma.transaction.create({
      data: {
        referenceId,

        senderWallet: {
          connect: { id: requesterWallet.id },
        },
        receiverWallet: {
          connect: { id: receiverWallet.id },
        },

        amount: new Decimal(dto.amount),
        fee: new Decimal(0),
        type: 'REQUEST',
        status: 'PENDING',
        description: dto.description || '',
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'REQUEST_MONEY',
        metadata: {
          transactionId: transaction.id,
          receiver: dto.receiverPhone,
          amount: dto.amount,
        },
      },
    });

    return {
      message: 'Request created successfully',
      transactionId: transaction.id,
      referenceId: transaction.referenceId,
      status: transaction.status,
    };
  }

  async initiateTransaction(userId: string, dto: CreateTransactionDto) {
    const { receiverPhone, amount, description } = dto;
    const amountDecimal = new Decimal(amount);
    // 1. Get sender wallet + user
    const senderWallet = await this.walletService.getWalletByUserId(userId, true);

    if (!senderWallet) {
      throw new BadRequestException('Sender wallet not found');
    }

    // 2. Check balance!  we update balance after OTP verification, but we can do a pre-check here to save resources
    // if (Number(senderWallet.balance) < amount) {
    //   throw new BadRequestException('Insufficient balance');
    // }

    if (senderWallet.balance.lt(amountDecimal)) {
      throw new BadRequestException('Insufficient balance');
    }

    // 3. Get receiver user
    const receiverUser = await this.prisma.user.findUnique({
      where: { phone: receiverPhone },
      include: { wallets: true },
    });

    if (!receiverUser || receiverUser.wallets.length === 0) {
      throw new BadRequestException('Receiver not found');
    }

    const receiverWallet = receiverUser.wallets[0];

    // 4. Create transaction (PENDING)
    const transaction = await this.prisma.transaction.create({
      data: {
        senderWalletId: senderWallet.id,
        receiverWalletId: receiverWallet.id,
        amount,
        type: 'TRANSFER',
        status: 'PENDING',
        // referenceId: `TX-${Date.now()}`,  // FIX: Use proper reference ID generator by hashing userId 
        referenceId: HashingUtil.generateReferenceId('TXN'),
        description,
      },
    });

    // 5. Create OTP
    const otpCode = await this.otpService.createOTP(
      userId,
      senderWallet.user.phone,
      'TRANSACTION',
      transaction.id,
    );

    // 6. Send notification (SMS)
    await this.notificationService.sendTransactionNotification(
      userId,
      senderWallet.user.phone,
      `Your OTP is ${otpCode}. Do not share it.`,
      transaction.id,
    );

    return {
      message: 'OTP sent. Please confirm transaction.',
      transactionId: transaction.id,
    };
  }

  
  async confirmTransaction(userId: string, dto: ConfirmTransactionDto) {
    const { transactionId, otp } = dto;

    // 1. Find transaction
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new BadRequestException('Transaction not found');
    }

    if (transaction.status !== 'PENDING') {
      throw new BadRequestException('Transaction already processed');
    }

    // 2. Get sender wallet + user
    const senderWallet = await this.prisma.wallet.findUnique({
      where: { id: transaction.senderWalletId },
      include: { user: true },
    });

    if (!senderWallet) {
      throw new BadRequestException('Sender wallet not found');
    }

    // 3. VERIFY OTP 🔐
    await this.otpService.verifyOTP(
      senderWallet.user.id,
      senderWallet.user.phone,
      otp,
      transaction.id,
      OtpPurpose.TRANSACTION,
    );

    // 4. Get receiver wallet
    const receiverWallet = await this.prisma.wallet.findUnique({
      where: { id: transaction.receiverWalletId },
      include: { user: true },
    });

    if (!receiverWallet) {
      throw new BadRequestException('Receiver wallet not found');
    }

    // 5. CHECK BALANCE AGAIN (IMPORTANT)
    if (Number(senderWallet.balance) < Number(transaction.amount)) {
      throw new BadRequestException('Insufficient balance');
    }

    // 6. EXECUTE TRANSACTION (DB TRANSACTION 🔥)
    await this.prisma.$transaction(async (tx) => {

      // debit sender
      await tx.wallet.update({
        where: { id: senderWallet.id },
        data: {
          balance: {
            decrement: transaction.amount,
          },
        },
      });

      // credit receiver
      await tx.wallet.update({
        where: { id: receiverWallet.id },
        data: {
          balance: {
            increment: transaction.amount,
          },
        },
      });

      // update transaction status
      await tx.transaction.update({
        where: { id: transaction.id },
        data: {
          status: 'COMPLETED',
        },
      });

      // ledger - sender
      await tx.ledger.create({
        data: {
          transactionId: transaction.id,
          walletId: senderWallet.id,
          debit: transaction.amount,
          credit: 0,
          balanceBefore: senderWallet.balance,
          balanceAfter:
            Number(senderWallet.balance) - Number(transaction.amount),
        },
      });

      // ledger - receiver
      await tx.ledger.create({
        data: {
          transactionId: transaction.id,
          walletId: receiverWallet.id,
          debit: 0,
          credit: transaction.amount,
          balanceBefore: receiverWallet.balance,
          balanceAfter:
            Number(receiverWallet.balance) + Number(transaction.amount),
        },
      });
    });

    // 7. SEND NOTIFICATIONS 📲

    await this.notificationService.sendTransactionNotification(
      senderWallet.user.id,
      senderWallet.user.phone,
      `You sent ${transaction.amount} successfully.`,
      transaction.id,
    );

    await this.notificationService.sendTransactionNotification(
      receiverWallet.user.id,
      receiverWallet.user.phone,
      `You received ${transaction.amount}.`,
      transaction.id,
    );

    return {
      message: 'Transaction completed successfully',
    };
  }

  async checkDailyLimit(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const total = await this.prisma.transaction.aggregate({
      where: {
        senderWalletId: userId,
        createdAt: { gte: today },
      },
      _sum: { amount: true },
    });

    const totalAmount = new Decimal(total._sum.amount || 0);

    if (totalAmount.gt(new Decimal(1000))) {
      throw new BadRequestException('Daily limit exceeded');
    }
  }

  async cancelExpiredTransactions() {
    await this.prisma.transaction.updateMany({
      where: {
        status: 'PENDING',
        createdAt: {
          lt: new Date(Date.now() - 5 * 60 * 1000),
        },
      },
      data: {
        status: 'CANCELLED',
      },
    });
  }

}