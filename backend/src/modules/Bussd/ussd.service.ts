import { Injectable } from '@nestjs/common';
import { UssdSessionService } from './ussd.session.service';
import { UssdMenuService } from './ussd.menu.service';
import { UssdValidator } from './ussd.validator';
import { UssdStep, UssdResponse, UssdSessionData } from './ussd.types';
import { PrismaService } from '../../config/prisma/prisma.service';

export interface UssdRequest {
  sessionId: string;
  phoneNumber: string;
  text: string;
}

@Injectable()
export class UssdService {
  constructor(
    private readonly sessionService: UssdSessionService,
    private readonly menuService: UssdMenuService,
    private readonly validator: UssdValidator,
    private readonly prisma: PrismaService,
  ) {}

  async handleUssdRequest(request: UssdRequest): Promise<UssdResponse> {
    const { sessionId, phoneNumber, text } = request;
    const input = text.trim();

    const session = await this.sessionService.getOrCreateSession(
      sessionId,
      phoneNumber,
    );

    const currentStep = session.currentStep as UssdStep;
    const data = session.data || {};
    const language = session.language || 'KIN';

    return this.processStep(currentStep, input, data, language, phoneNumber, sessionId);
  }

  private async processStep(
    currentStep: UssdStep,
    input: string,
    data: UssdSessionData,
    language: string,
    phoneNumber: string,
    sessionId: string,
  ): Promise<UssdResponse> {
    switch (currentStep) {
      case UssdStep.MAIN_MENU:
        return this.handleMainMenu(input, data, language, sessionId, phoneNumber);

      case UssdStep.ESCROW_ENTER_RECIPIENT:
        return this.handleEnterRecipient(input, data, language, sessionId, phoneNumber);

      case UssdStep.ESCROW_ENTER_AMOUNT:
        return this.handleEnterAmount(input, data, language, sessionId, phoneNumber);

      case UssdStep.ESCROW_CONFIRM:
        return this.handleConfirmEscrow(input, data, language, sessionId, phoneNumber);

      case UssdStep.WALLET_VIEW:
        return this.handleWalletView(input, language, sessionId, phoneNumber);

      case UssdStep.TRANSACTION_STATUS:
        return this.handleTransactionStatus(input, language, sessionId, phoneNumber);

      case UssdStep.DISPUTE:
        return this.handleDispute(input, language, sessionId, phoneNumber);

      default:
        await this.sessionService.clearSession(sessionId, phoneNumber);
        return this.menuService.getMainMenu(language);
    }
  }

  private async handleMainMenu(
    input: string,
    data: UssdSessionData,
    language: string,
    sessionId: string,
    phoneNumber: string,
  ): Promise<UssdResponse> {
    if (input === '' || input === '*') {
      await this.sessionService.updateSession(
        sessionId,
        phoneNumber,
        UssdStep.MAIN_MENU,
        {},
      );
      return this.menuService.getMainMenu(language);
    }

    switch (input) {
      case '1':
        await this.sessionService.updateSession(
          sessionId,
          phoneNumber,
          UssdStep.ESCROW_ENTER_RECIPIENT,
          {},
        );
        return this.menuService.getEnterRecipient(language);

      case '2':
        await this.sessionService.updateSession(
          sessionId,
          phoneNumber,
          UssdStep.WALLET_VIEW,
          {},
        );
        return this.handleWalletView('', language, sessionId, phoneNumber);

      case '3':
        await this.sessionService.updateSession(
          sessionId,
          phoneNumber,
          UssdStep.TRANSACTION_STATUS,
          {},
        );
        return this.menuService.getEnterTransactionRef(language);

      case '4':
        await this.sessionService.updateSession(
          sessionId,
          phoneNumber,
          UssdStep.DISPUTE,
          {},
        );
        return this.menuService.getEnterTransactionRef(language);

      case '0':
        await this.sessionService.endSession(sessionId, phoneNumber);
        return this.menuService.getExit(language);

      default:
        return this.menuService.getInvalidInput(language);
    }
  }

  private async handleEnterRecipient(
    input: string,
    data: UssdSessionData,
    language: string,
    sessionId: string,
    phoneNumber: string,
  ): Promise<UssdResponse> {
    const normalizedPhone = this.validator.normalizePhoneNumber(input);

    if (!this.validator.validatePhoneNumber(input)) {
      return this.menuService.getInvalidInput(language);
    }

    const updatedData: UssdSessionData = {
      ...data,
      escrow: {
        ...data.escrow,
        recipient: normalizedPhone,
      },
    };

    await this.sessionService.updateSession(
      sessionId,
      phoneNumber,
      UssdStep.ESCROW_ENTER_AMOUNT,
      updatedData,
    );

    return this.menuService.getEnterAmount(language);
  }

  private async handleEnterAmount(
    input: string,
    data: UssdSessionData,
    language: string,
    sessionId: string,
    phoneNumber: string,
  ): Promise<UssdResponse> {
    if (!this.validator.validateAmount(input)) {
      return this.menuService.getInvalidInput(language);
    }

    const amount = this.validator.parseAmount(input);
    const recipient = data.escrow?.recipient;

    if (!recipient) {
      await this.sessionService.clearSession(sessionId, phoneNumber);
      return this.menuService.getMainMenu(language);
    }

    const updatedData: UssdSessionData = {
      ...data,
      escrow: {
        ...data.escrow,
        amount: amount.toString(),
      },
    };

    await this.sessionService.updateSession(
      sessionId,
      phoneNumber,
      UssdStep.ESCROW_CONFIRM,
      updatedData,
    );

    return this.menuService.getConfirmEscrow(recipient, amount.toString(), language);
  }

  private async handleConfirmEscrow(
    input: string,
    data: UssdSessionData,
    language: string,
    sessionId: string,
    phoneNumber: string,
  ): Promise<UssdResponse> {
    if (input === '2') {
      await this.sessionService.clearSession(sessionId, phoneNumber);
      return this.menuService.getCancelled(language);
    }

    if (input !== '1') {
      return this.menuService.getInvalidInput(language);
    }

    const recipient = data.escrow?.recipient;
    const amountStr = data.escrow?.amount;

    if (!recipient || !amountStr) {
      await this.sessionService.clearSession(sessionId, phoneNumber);
      return this.menuService.getMainMenu(language);
    }

    const amount = this.validator.parseAmount(amountStr);

    try {
      const result = await this.createEscrow(phoneNumber, recipient, amount);

      if (!result.success) {
        await this.sessionService.clearSession(sessionId, phoneNumber);
        return this.menuService.getInsufficientBalance(language);
      }

      await this.sessionService.clearSession(sessionId, phoneNumber);
      return this.menuService.getEscrowSuccess(result.reference!, language);
    } catch (error) {
      await this.sessionService.clearSession(sessionId, phoneNumber);
      return this.menuService.getInvalidInput(language);
    }
  }

  private async createEscrow(
    senderPhone: string,
    recipientPhone: string,
    amount: number,
  ): Promise<{ success: boolean; reference?: string }> {
    const senderUser = await this.prisma.user.findUnique({
      where: { phone: senderPhone },
      include: { wallets: true },
    });

    if (!senderUser || senderUser.wallets.length === 0) {
      return { success: false };
    }

    const senderWallet = senderUser.wallets[0];

    const availableBalance = Number(senderWallet.balance);
    if (availableBalance < amount) {
      return { success: false };
    }

    const recipientUser = await this.prisma.user.findUnique({
      where: { phone: recipientPhone },
      include: { wallets: true },
    });

    const recipientWalletId = recipientUser?.wallets[0]?.id;

    const reference = 'ESC' + Date.now().toString(36).toUpperCase();

    const transaction = await this.prisma.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { id: senderWallet.id },
        data: {
          balance: {
            decrement: amount,
          },
        },
      });

      const newTransaction = await tx.transaction.create({
        data: {
          senderWalletId: senderWallet.id,
          receiverWalletId: recipientWalletId || null,
          amount,
          type: 'ESCROW',
          status: 'HELD',
          referenceId: reference,
          description: `Escrow to ${recipientPhone}`,
        },
      });

      await tx.escrow.create({
        data: {
          transactionId: newTransaction.id,
          heldAmount: amount,
          status: 'HELD',
        },
      });

      await tx.ledger.create({
        data: {
          transactionId: newTransaction.id,
          walletId: senderWallet.id,
          debit: amount,
          balanceBefore: availableBalance,
          balanceAfter: availableBalance - amount,
        },
      });

      return newTransaction;
    });

    return { success: true, reference: transaction.referenceId };
  }

  private async handleWalletView(
    input: string,
    language: string,
    sessionId: string,
    phoneNumber: string,
  ): Promise<UssdResponse> {
    if (input === '0') {
      await this.sessionService.clearSession(sessionId, phoneNumber);
      return this.menuService.getMainMenu(language);
    }

    const user = await this.prisma.user.findUnique({
      where: { phone: phoneNumber },
      include: { wallets: true },
    });

    if (!user || user.wallets.length === 0) {
      return this.menuService.getInvalidInput(language);
    }

    const wallet = user.wallets[0];
    const transactions = await this.prisma.transaction.findMany({
      where: {
        OR: [
          { senderWalletId: wallet.id },
          { receiverWalletId: wallet.id },
        ],
      },
      include: { escrow: true },
    });

    let heldAmount = 0;
    for (const tx of transactions) {
      if (tx.escrow && tx.escrow.status === 'HELD') {
        heldAmount += Number(tx.escrow.heldAmount);
      }
    }

    const balance = Number(wallet.balance);
    const available = balance - heldAmount;

    return this.menuService.getWalletInfo(balance, heldAmount, available, language);
  }

  private async handleTransactionStatus(
    input: string,
    language: string,
    sessionId: string,
    phoneNumber: string,
  ): Promise<UssdResponse> {
    if (input === '0') {
      await this.sessionService.clearSession(sessionId, phoneNumber);
      return this.menuService.getMainMenu(language);
    }

    const transaction = await this.prisma.transaction.findUnique({
      where: { referenceId: input },
      include: { escrow: true },
    });

    if (!transaction) {
      return this.menuService.getTransactionNotFound(language);
    }

    const status = transaction.escrow?.status || transaction.status;
    const amount = transaction.amount.toString();

    return this.menuService.getTransactionStatus(status, amount, language);
  }

  private async handleDispute(
    input: string,
    language: string,
    sessionId: string,
    phoneNumber: string,
  ): Promise<UssdResponse> {
    if (input === '0') {
      await this.sessionService.clearSession(sessionId, phoneNumber);
      return this.menuService.getMainMenu(language);
    }

    const user = await this.prisma.user.findUnique({
      where: { phone: phoneNumber },
    });

    if (!user) {
      return this.menuService.getInvalidInput(language);
    }

    const transaction = await this.prisma.transaction.findUnique({
      where: { referenceId: input },
      include: { escrow: true },
    });

    if (!transaction || !transaction.escrow) {
      return this.menuService.getTransactionNotFound(language);
    }

    await this.prisma.escrow.update({
      where: { id: transaction.escrow.id },
      data: { status: 'DISPUTED' },
    });

    await this.prisma.dispute.create({
      data: {
        escrowId: transaction.escrow.id,
        openedBy: user.id,
      },
    });

    await this.sessionService.clearSession(sessionId, phoneNumber);
    return this.menuService.getDisputeSuccess(language);
  }
}