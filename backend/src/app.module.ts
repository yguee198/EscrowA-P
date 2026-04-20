import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './config/prisma/prisma.module';
import { RedisModule } from './config/redis/redis.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { EscrowModule } from './modules/escrow/escrow.module';
import { WithdrawModule } from './modules/withdraw/withdraw.module';
// import { UssdModule } from './modules/ussd/ussd.module';
import { UssdModule } from './modules/Bussd/ussd.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 seconds
        limit: 10, // 10 requests per minute
      },
    ]),

    // Database and Cache
    PrismaModule,
    RedisModule,

    // Feature modules
    AuthModule,
    UsersModule,
    WalletModule,
    TransactionsModule,
    EscrowModule,
    WithdrawModule,
    UssdModule,
    ScheduleModule.forRoot(),
  ],
})
export class AppModule {}
