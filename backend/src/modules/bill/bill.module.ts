import { Module } from '@nestjs/common';
import { BillService } from './bill.service';

@Module({
  providers: [BillService],
  exports: [BillService],
})
export class BillModule {} 