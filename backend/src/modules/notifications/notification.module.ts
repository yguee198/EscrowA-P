import { Module } from '@nestjs/common';
import { PrismaService } from '../../config/prisma/prisma.service';
import { NotificationService } from './notification.service';
import { SmsModule } from '../sms/sms.module';

@Module({
  imports: [SmsModule],
  providers: [NotificationService, PrismaService],
  exports: [NotificationService],
})
export class NotificationModule {}