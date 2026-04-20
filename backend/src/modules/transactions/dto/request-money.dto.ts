import { IsString, IsNotEmpty, IsNumber, Min, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class RequestMoneyDto {
  @IsString()
  @IsNotEmpty({ message: 'receiverPhone should not be empty' })
  receiverPhone: string;

  @Type(() => Number)
  @IsNumber({}, { message: 'amount must be a number' })
  @Min(1, { message: 'amount must be at least 1' })
  amount: number;

  @IsString()
  @IsOptional()
  description?: string;
}