import { Module } from '@nestjs/common';
import { WithdrawController } from './withdraw.controller';
import { WithdrawService } from './withdraw.service';
import { WalletModule } from '../wallet/wallet.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [WalletModule, AuthModule],
  controllers: [WithdrawController],
  providers: [WithdrawService],
})
export class WithdrawModule {}