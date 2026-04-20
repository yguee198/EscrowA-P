import { IsIn } from 'class-validator';

export class ResolveDisputeDto {
  @IsIn(['REFUND', 'RELEASE'])
  resolution: 'REFUND' | 'RELEASE';
}