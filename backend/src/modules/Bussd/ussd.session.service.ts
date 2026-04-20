import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../config/prisma/prisma.service';
import { UssdStep, UssdSessionData } from './ussd.types';

@Injectable()
export class UssdSessionService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrCreateSession(
    sessionId: string,
    phoneNumber: string,
  ): Promise<{ id: string; currentStep: string; data: UssdSessionData; language: string }> {
    let session = await this.prisma.ussdSession.findFirst({
      where: { sessionId, phoneNumber, isActive: true },
    });

    if (!session) {
      session = await this.prisma.ussdSession.create({
        data: {
          sessionId,
          phoneNumber,
          currentStep: UssdStep.MAIN_MENU,
          data: {},
          language: 'KIN',
          isActive: true,
        },
      });
    }

    return {
      id: session.id,
      currentStep: session.currentStep,
      data: session.data as UssdSessionData,
      language: session.language,
    };
  }

  async updateSession(
    sessionId: string,
    phoneNumber: string,
    currentStep: string,
    data: UssdSessionData,
  ): Promise<void> {
    await this.prisma.ussdSession.updateMany({
      where: { sessionId, phoneNumber, isActive: true },
      data: {
        currentStep,
        data: data as unknown as Prisma.JsonValue,
        updatedAt: new Date(),
      },
    });
  }

  async clearSession(sessionId: string, phoneNumber: string): Promise<void> {
    await this.prisma.ussdSession.updateMany({
      where: { sessionId, phoneNumber, isActive: true },
      data: {
        currentStep: UssdStep.MAIN_MENU,
        data: {},
        updatedAt: new Date(),
      },
    });
  }

  async endSession(sessionId: string, phoneNumber: string): Promise<void> {
    await this.prisma.ussdSession.updateMany({
      where: { sessionId, phoneNumber, isActive: true },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });
  }
}