import { IsString, IsNotEmpty, IsOptional, Matches } from 'class-validator';

export class SetPinDto {
  @IsString()
  @IsOptional()
  oldPin?: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4,6}$/, { message: 'PIN must be 4-6 digits' })
  newPin: string;
}
