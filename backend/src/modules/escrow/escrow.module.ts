import { Module } from '@nestjs/common';
import { EscrowController } from './escrow.controller';
import { EscrowService } from './escrow.service';
import { WalletModule } from '../wallet/wallet.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [WalletModule, AuthModule],
  controllers: [EscrowController],
  providers: [EscrowService],

  exports: [EscrowService],
})
export class EscrowModule {}