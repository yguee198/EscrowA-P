import { Module } from '@nestjs/common';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { TransactionCronService } from './transaction-cron.service';
import { WalletModule } from '../wallet/wallet.module';
import { AuthModule } from '../auth/auth.module';
import { NotificationModule } from '../notifications/notification.module';
import { OtpModule } from '../otp/otp.module';
import { BullModule } from '@nestjs/bull';
import { SmsProcessor } from '../sms/sms.processor';
import { SmsModule } from '../sms/sms.module';

@Module({
  imports: [WalletModule, AuthModule, OtpModule, NotificationModule,SmsModule,BullModule.registerQueue({
      name: 'sms-queue',  // must match @InjectQueue('sms-queue')
      redis: {
        host: 'localhost',
        port: 6379,
      },
    }),],
  controllers: [TransactionsController],
  providers: [
    TransactionsService, 
    TransactionCronService,
    SmsProcessor
  ],
  exports: [TransactionsService],
})
export class TransactionsModule {}