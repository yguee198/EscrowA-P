import { IsString } from 'class-validator';

export class OpenDisputeDto {
  @IsString()
  escrowId: string;

  @IsString()
  reason: string;
}