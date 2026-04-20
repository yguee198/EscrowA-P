import { IsString, IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';

export class SendMoneyDto {
  @IsString()
  @IsNotEmpty()
  receiverPhone: string;

  @IsNumber()
  @Min(1)
  amount: number;

  @IsNumber()
  @IsOptional()
  fee?: number;

  @IsString()
  @IsNotEmpty()
  pin: string;

  @IsString()
  @IsOptional()
  description?: string;
}