import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { TransactionsService } from './transactions.service';

@Injectable()
export class TransactionCronService {
  constructor(private transactionsService: TransactionsService) {}

  @Cron('*/5 * * * *') // buri minota 5
  async handleExpiredTransactions() {
    await this.transactionsService.cancelExpiredTransactions();
  }
}