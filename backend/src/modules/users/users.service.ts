import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async updateProfile(userId: string, data: UpdateProfileDto) {
    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    // Update user
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        phone: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      message: 'Profile updated successfully',
      user: updatedUser,
    };
  }

  async findByPhone(phone: string) {
    return this.prisma.user.findUnique({
      where: { phone },
      select: {
        id: true,
        phone: true,
        email: true,
        role: true,
      },
    });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        phone: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async checkUserExists(phone: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { phone },
    });
    return !!user;
  }

  async checkPin(userId: string, enteredPin: string) {
  const user = await this.prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      pinHash: true,
      pinAttempts: true,
      isLocked: true,
      lockedUntil: true,
    },
  });

  if (!user) {
    throw new NotFoundException('User not found');
  }

  // Check if account is locked
  if (
    user.isLocked &&
    user.lockedUntil &&
    new Date() < user.lockedUntil
  ) {
    throw new ForbiddenException(
      `Account locked until ${user.lockedUntil.toISOString()}`
    );
  }

  const isPinCorrect = await bcrypt.compare(
    enteredPin,
    user.pinHash,
  );

  if (!isPinCorrect) {
    const newAttempts = user.pinAttempts + 1;
    const lockThreshold = 3;

    if (newAttempts >= lockThreshold) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          pinAttempts: 0,
          isLocked: true,
          lockedUntil: new Date(
            Date.now() + 15 * 60 * 1000,
          ),
        },
      });
    } else {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          pinAttempts: newAttempts,
        },
      });
    }

    throw new ForbiddenException('Incorrect PIN');
  }

  // Reset after success
  await this.prisma.user.update({
    where: { id: userId },
    data: {
      pinAttempts: 0,
      isLocked: false,
      lockedUntil: null,
    },
  });

  return true;
}
}