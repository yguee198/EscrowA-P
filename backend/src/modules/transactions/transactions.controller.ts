import { Controller, Post, Get, Body, Param, UseGuards, Request, Req } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SendMoneyDto } from './dto/send-money.dto';
import { RequestMoneyDto } from './dto/request-money.dto';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { ConfirmTransactionDto } from './dto/confirm-transaction.dto';

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(private transactionsService: TransactionsService) { }

  // @UseGuards(JwtAuthGuard)
  @Post('send')
  async sendMoney(@Request() req, @Body() dto: SendMoneyDto) {
    return this.transactionsService.sendMoney(req.user.id, dto);
  }

  // @UseGuards(JwtAuthGuard)
  @Post('request')
  async requestMoney(@Req() req, @Body() dto: RequestMoneyDto) {
    const userId = req.user.id;
    return this.transactionsService.requestMoney(userId, dto);
  }


  @Post('initiate')
  async initiate(
    @Req() req,
    @Body() dto: CreateTransactionDto,
  ) {
    return this.transactionsService.initiateTransaction(req.user.id, dto);
  }

  @Post('confirm')
  async confirm(
    @Req() req,
    @Body() dto: ConfirmTransactionDto,
  ) {
    return this.transactionsService.confirmTransaction(req.user.id, dto);
  }

  @Get(':id')
  async getTransaction(@Request() req, @Param('id') id: string) {
    return this.transactionsService.getTransactionById(req.user.id, id);
  }
}