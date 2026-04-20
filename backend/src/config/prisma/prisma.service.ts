import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import {Prisma, PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: ['query', 'info', 'warn', 'error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
    console.log('✅ Database connected successfully');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('❌ Database disconnected');
  }

  async executeTransaction<T>(
    fn: (prisma: Prisma.TransactionClient) => Promise<T>
  ): Promise<T> {
    return this.$transaction(fn);
  }

  // Helper method for transactions
  // async executeTransaction<T>(fn: (prisma: PrismaClient) => Promise<T>): Promise<T> {
  //   return this.$transaction(fn);
  // }
}
