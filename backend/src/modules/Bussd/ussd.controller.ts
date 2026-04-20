import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { UssdService } from './ussd.service';

interface UssdBody {
  sessionId: string;
  phoneNumber: string;
  text?: string;
}

@Controller('ussd')
export class UssdController {
  constructor(private readonly ussdService: UssdService) {}

  @Post()
  async handleUssd(@Body() body: UssdBody) {
    const sessionId = body.sessionId || `session_${Date.now()}`;
    const phoneNumber = body.phoneNumber;
    const text = body.text || '';

    const response = await this.ussdService.handleUssdRequest({
      sessionId,
      phoneNumber,
      text,
    });

    const prefix = response.type === 'END' ? 'END' : 'CON';
    return `${prefix} ${response.message}`;
  }
}