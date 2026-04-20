import { Controller, Post, Body, UseGuards, Request, Get, Patch, Param } from '@nestjs/common';
import { WithdrawService } from './withdraw.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('withdraw')
@UseGuards(JwtAuthGuard)
export class WithdrawController {
  constructor(private withdrawService: WithdrawService) { }

  @Post('request')
  async requestWithdrawal(@Request() req, @Body() body: any) {
    return this.withdrawService.requestWithdrawal(
      req.user.id,
      body.amount,
      body.pin,
      body.currency,
      body.bank_name,
      body.bank_account_number,
    );
  }

  @Get('history')
  async getHistory(@Request() req) {
    return this.withdrawService.getWithdrawalHistory(req.user.id);
  }

   @Get('admin/pending')
  async getPendingWithdrawals() {
    return this.withdrawService.getPendingWithdrawals();
  }

  // Admin: approve withdrawal
  @Patch('admin/:id/approve')
  async approveWithdrawal(@Param('id') id: string, @Request() req) {
    return this.withdrawService.approveWithdrawal(id, req.user.id);
  }

   @Patch('admin/:id/reject')
  async rejectWithdrawal(@Param('id') id: string, @Request() req) {
    return this.withdrawService.rejectWithdrawal(id, req.user.id);
  }
}