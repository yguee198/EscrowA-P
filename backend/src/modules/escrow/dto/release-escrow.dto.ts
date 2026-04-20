import { IsString, IsNotEmpty } from 'class-validator';

export class ReleaseEscrowDto {
  @IsString()
  @IsNotEmpty()
  receiverId: string;

  @IsString()
  @IsNotEmpty()
  pin: string;
}