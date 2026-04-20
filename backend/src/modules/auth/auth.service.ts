import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../config/prisma/prisma.service';
import { RedisService } from '../../config/redis/redis.service';
import { HashingUtil } from '../../utils/hashing';
import { PinValidator } from '../../utils/pin-validator';
import { RegisterDto, LoginDto, SetPinDto, VerifyPinDto } from './dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private redis: RedisService,
  ) { }

  async register(dto: RegisterDto) {
    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
    });

    if (existingUser) {
      throw new BadRequestException('User with this phone already exists');
    }

    // Validate PIN
    const pinValidation = PinValidator.validate(dto.pin);
    if (!pinValidation.valid) {
      throw new BadRequestException(pinValidation.message);
    }

    if (!dto.nid || dto.nid.length !== 16) {
    throw new BadRequestException('NID must be 16 digits');
  }

    // Hash password and PIN
    const passwordHash = await HashingUtil.hash(dto.password);
    const pinHash = await HashingUtil.hash(dto.pin);

    // Create user and wallet in transaction
    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data : {
          phone: dto.phone,
          email: dto.email,
          passwordHash,
          pinHash,
          nid: dto.nid,
        },
      });

      // Create default wallet
      await tx.wallet.create({
        data: {
          userId: newUser.id,
          balance: 0,
          currency: 'RWF',
        },
      });

      return newUser;
    });

    // Generate JWT token
    const token = this.generateToken(user.id, user.phone);

    return {
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
      },
      token,
    };
  } catch (error){
     
    if(error.code === 'P2002'){
       const target = error.meta?.target;

    if (target?.includes('nid')) {
      throw new BadRequestException('User with this NID already used');   
    }
     
    if (target?.includes('phone')){
      throw new BadRequestException('User with this phone already used');
    }
     
    if (target?.includes('email')){
      throw new BadRequestException('User with this email already used');
    }
    
    throw new BadRequestException('Duplicate fields error');
  }
    throw error;
}
  async login(dto: LoginDto) {

    console.log('====== LOGIN DEBUG START ======');

    // ✅ 1️⃣ Normalize inputs (VERY IMPORTANT)
    const cleanPhone = String(dto.phone || '').trim();
    const cleanPassword = String(dto.password || '').trim();

    console.log('PHONE RAW:', JSON.stringify(dto.phone));
    console.log('PHONE CLEAN:', JSON.stringify(cleanPhone));
    console.log('PASSWORD RAW:', JSON.stringify(dto.password));
    console.log('PASSWORD CLEAN LENGTH:', cleanPassword.length);

    if (!cleanPhone || !cleanPassword) {
      throw new UnauthorizedException('Phone and password are required');
    }

    // ✅ 2️⃣ Check rate limit FIRST
    const canProceed = await this.redis.checkRateLimit(
      `login:${cleanPhone}`,
      5,
      300,
    );

    if (!canProceed) {
      throw new UnauthorizedException(
        'Too many login attempts. Please try again later.',
      );
    }

    // ✅ 3️⃣ Find user using CLEAN phone
    const user = await this.prisma.user.findUnique({
      where: { phone: cleanPhone },
    });

    if (!user) {
      console.log('USER NOT FOUND');
      throw new UnauthorizedException('Invalid credentials');
    }

    // ✅ 4️⃣ Verify password using CLEAN password
    const isPasswordValid = await HashingUtil.compare(
      cleanPassword,
      user.passwordHash,
    );

    console.log('Password match result:', isPasswordValid);

    if (!isPasswordValid) {
      console.log('PASSWORD NOT MATCHING');
      throw new UnauthorizedException('Invalid credentials');
    }

    console.log('✅ LOGIN SUCCESS');

    // ✅ 5️⃣ Generate token
    const token = this.generateToken(user.id, user.phone);

    return {
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
      },
      token,
    };
  }


  async setPin(userId: string, dto: SetPinDto) {
    // Validate PIN
    const pinValidation = PinValidator.validate(dto.newPin);
    if (!pinValidation.valid) {
      throw new BadRequestException(pinValidation.message);
    }

    // Get user
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Verify old PIN if exists
    if (user.pinHash) {
      if (!dto.oldPin) {
        throw new BadRequestException('Old PIN is required');
      }
      const isOldPinValid = await HashingUtil.compare(dto.oldPin, user.pinHash);
      if (!isOldPinValid) {
        throw new UnauthorizedException('Invalid old PIN');
      }
    }

    // Hash and update new PIN
    const pinHash = await HashingUtil.hash(dto.newPin);
    await this.prisma.user.update({
      where: { id: userId },
      data: { pinHash },
    });

    return { message: 'PIN updated successfully' };
  }

  // async verifyPin(userId: string, dto: VerifyPinDto): Promise<boolean> {
  //   // Check rate limiting
  //   const canProceed = await this.redis.checkRateLimit(`pin:${userId}`, 3, 300);
  //   if (!canProceed) {
  //     throw new UnauthorizedException('Too many PIN attempts. Please try again later.');
  //   }

  //   // Get user
  //   const user = await this.prisma.user.findUnique({
  //     where: { id: userId },
  //   });

  //   if (!user || !user.pinHash) {
  //     throw new UnauthorizedException('PIN not set');
  //   }

  //   // Verify PIN
  //   const isPinValid = await HashingUtil.compare(dto.pin, user.pinHash);
  //   if (!isPinValid) {
  //     throw new UnauthorizedException('Invalid PIN');
  //   }

  //   return true;
  // }

  async verifyPin(
    userId: string,
    dto: VerifyPinDto,
    operation: string = 'escrow',
  ): Promise<boolean> {

    const key = `pin:${operation}:${userId}`;

    // 1️⃣ Get user
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.pinHash) {
      throw new UnauthorizedException('PIN not set');
    }

    // 2️⃣ Normalize PIN
    const cleanPin = String(dto.pin || '').trim();
    if (!cleanPin) {
      throw new BadRequestException('PIN cannot be empty');
    }

    // 3️⃣ Compare PIN
    const isPinValid = await HashingUtil.compare(
      cleanPin,
      user.pinHash,
    );

    if (!isPinValid) {
      // 4️⃣ Increment failed attempts (5 min window, 4 max attempts)
      try {
        await this.redis.incrementAttempts(key, 300, 4);
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : 'Failed to increment attempts';
        throw new BadRequestException(errMsg);
      }

      throw new BadRequestException('Invalid PIN');
    }

    // ✅ SUCCESS → DO NOTHING (no reset)
    return true;
  }


  private generateToken(userId: string, phone: string): string {
    const payload = { sub: userId, phone };
    return this.jwtService.sign(payload);
  }

  async validateUser(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        phone: true,
        email: true,
        role: true,
      },
    });
  }
}
