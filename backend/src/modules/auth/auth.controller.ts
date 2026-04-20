import { Controller, Post, Body, UseGuards, Request, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, SetPinDto, VerifyPinDto } from './dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('set-pin')
  async setPin(@Request() req, @Body() dto: SetPinDto) {
    return this.authService.setPin(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('verify-pin')
  async verifyPin(@Request() req, @Body() dto: VerifyPinDto) {
    const isValid = await this.authService.verifyPin(req.user.id, dto);
    return { valid: isValid };
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    return req.user;
  }
}
