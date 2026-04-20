import { IsString, IsNotEmpty, Length } from 'class-validator';

export class ConfirmTransactionDto {
  @IsString()
  @IsNotEmpty()
  transactionId: string;

  @IsString()
  @IsNotEmpty()
  @Length(6, 6) // OTP is 6 digits
  otp: string;
}