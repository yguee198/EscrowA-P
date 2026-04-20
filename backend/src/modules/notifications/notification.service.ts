import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../config/prisma/prisma.service';
import { SmsService } from '../sms/sms.service';

@Injectable()
export class NotificationService {
  constructor(
    private prisma: PrismaService,
    private smsService: SmsService,
  ) {}

  async sendTransactionNotification(
    userId: string,
    phone: string,
    message: string,
    transactionId?: string,
  ) {
    // FIX: Use 'notification' not 'notifications'
    await this.prisma.notification.create({
      data: {
        userId, // Use camelCase field names from Prisma client
        message,
        title: 'Transaction Alert',
        type: 'TRANSACTION',
        channel: 'SMS',
        status: 'UNREAD',
        transactionId, // camelCase
      },
    });

    await this.smsService.sendSMS(phone, message);
  }
}