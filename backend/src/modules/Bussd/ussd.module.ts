import { Module } from '@nestjs/common';
import { UssdController } from './ussd.controller';
import { UssdService } from './ussd.service';
import { UssdSessionService } from './ussd.session.service';
import { UssdMenuService } from './ussd.menu.service';
import { UssdLanguageService } from './ussd.language.service';
import { UssdValidator } from './ussd.validator';
import { UssdConfig } from './config/ussd.config';
import { PrismaService } from '../../config/prisma/prisma.service';

@Module({
  controllers: [UssdController],
  providers: [
    UssdService,
    UssdSessionService,
    UssdMenuService,
    UssdLanguageService,
    UssdValidator,
    UssdConfig,
    PrismaService,
  ],
  exports: [UssdService, UssdSessionService],
})
export class UssdModule {}