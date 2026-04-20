import { IsString, IsNotEmpty, IsNumber, Min, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTransactionDto {
  @IsString()
  @IsNotEmpty()
  receiverPhone: string;

  @Type(() => Number) // VERY IMPORTANT (fix common bug)
  @IsNumber()
  @Min(1)
  amount: number;

  @IsString()
  @IsNotEmpty()
  pin: string; // optional if using OTP only

  @IsString()
  @IsOptional()
  description?: string;
}