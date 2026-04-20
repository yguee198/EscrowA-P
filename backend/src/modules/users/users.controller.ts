import { Controller, Get, Query, UseGuards, Request, Put, Body, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) { }

  @Get('phone')
  async getUserByPhone(@Query('phone') phone: string) {
    const user = await this.usersService.findByPhone(phone);
    if (!user) {
      return { found: false };
    }
    return { found: true, user };
  }

  @Get('lookup')
  async lookupByPhone(@Query('phone') phone: string) {
    const user = await this.usersService.findByPhone(phone);

    if (!user) {
      return { found: false };
    }

    return {
      found: true,
      user: {
        id: user.id,
        phone: user.phone,
      },
    };
  }

  @Get('check')
  async checkUser(@Query('phone') phone: string) {
    const exists = await this.usersService.checkUserExists(phone);
    return { exists };
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    return this.usersService.findById(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Put('profile')
  async updateProfile(
    @Request() req,
    @Body() body: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(req.user.id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Post('check-pin')
  async checkPin(
    @Request() req,
    @Body('pin') enteredPin: string,
  ) {
    const result = await this.usersService.checkPin(
      req.user.id,
      enteredPin,
    );

    return {
      success: result,
      message: 'PIN verified successfully',
    };
  }
}