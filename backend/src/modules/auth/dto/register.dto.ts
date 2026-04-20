import { IsString, IsNotEmpty, MinLength, IsEmail, IsOptional, Length, Matches} from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+[1-9]\d{7,14}$/, {
    message: 'Phone must be in international format (E.164)',
  })
  phone: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4,6}$/, { message: 'PIN must be 4-6 digits' })
  pin: string;

  @IsString()
  @Length(16, 16, { message: 'NID must be exactly 16 digits' })
  nid: string;
}
