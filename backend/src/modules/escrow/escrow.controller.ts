import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { EscrowService } from './escrow.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateEscrowDto } from './dto';

@Controller('escrow')
@UseGuards(JwtAuthGuard)
export class EscrowController {
  constructor(private escrowService: EscrowService) { }

  @Post('create')
  async createEscrow(@Request() req, @Body() dto: CreateEscrowDto) {
    // PIN verification is done inside the service
    return this.escrowService.createEscrow(req.user.id, dto);
  }

  @Post(':id/confirm')
  async confirmEscrow(@Request() req, @Param('id') id: string) {
    // Receiver confirms the escrow (no PIN needed)
    return this.escrowService.confirmEscrow(req.user.id, id);
  }

  @Get(':id')
  async getEscrowDetails(@Request() req, @Param('id') id: string) {
    return this.escrowService.getEscrowDetails(req.user.id, id);
  }
}