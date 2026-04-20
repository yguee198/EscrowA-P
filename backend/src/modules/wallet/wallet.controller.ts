import { Controller, Get, Query, UseGuards, Request, Post, Body } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('wallet')
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(private walletService: WalletService) {}

  @Get('balance')
  async getBalance(@Request() req) {
    return this.walletService.getBalance(req.user.id);
  }
  
  @Post('deposit')
  async deposit(@Request() req, @Body() body: { amount: number }) {
    return this.walletService.deposit(req.user.id, body.amount);
  }

  @Post('withdraw')
  async withdraw(
  @Request() req,
  @Body() body: { amount: number }
) {
  return this.walletService.withdraw(req.user.id, body.amount);
}

  @UseGuards(JwtAuthGuard)
  @Get('transactions')
  async getTransactions(
    @Request() req,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.walletService.getTransactions(
      req.user.id,
      limit ? parseInt(limit.toString()) : 20,
      offset ? parseInt(offset.toString()) : 0,
    );
  }
}