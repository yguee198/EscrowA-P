import { Controller, Post, Body, Param } from '@nestjs/common';
import { DisputeService } from './dispute.service';
import { OpenDisputeDto } from './dto/open-dispute.dto';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';

@Controller('disputes')
export class DisputeController {
  constructor(private disputeService: DisputeService) {}

  @Post('open')
  openDispute(@Body() dto: OpenDisputeDto) {
    const userId = "GET_FROM_JWT"; // replace later
    return this.disputeService.openDispute(userId, dto.escrowId, dto.reason);
  }

  @Post(':id/resolve')
  resolveDispute(
    @Param('id') disputeId: string,
    @Body() dto: ResolveDisputeDto,
  ) {
    return this.disputeService.resolveDispute(disputeId, dto.resolution);
  }
}