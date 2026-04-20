import { IsEmail, IsString, Length, IsOptional } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @Length(16, 16)
  nid?: string;
}