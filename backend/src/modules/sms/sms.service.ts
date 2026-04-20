import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import AfricaTalking from 'africastalking';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private africasTalking: any;

  constructor(private config: ConfigService) {
    const apiKey = this.config.get<string>('AFRICA_TALKING_API_KEY');
    const username = this.config.get<string>('AFRICA_TALKING_USERNAME', 'sandbox');

    if (apiKey && username) {
      this.africasTalking = AfricaTalking({
        apiKey,
        username,
      });
    }
  }

  async sendSMS(to: string, message: string): Promise<void> {
    // Format phone number to Africa Talking format (e.g., +250...)
    const formattedPhone = this.formatPhoneNumber(to);

    if (!this.africasTalking) {
      this.logger.log(`[STUB SMS] To: ${formattedPhone}, Message: ${message}`);
      return;
    }

    try {
      const sms = this.africasTalking.SMS();
      const result = await sms.send({
        to: [formattedPhone],
        message,
      });
      this.logger.log(`SMS sent successfully: ${JSON.stringify(result)}`);
    } catch (error) {
      this.logger.error(`Failed to send SMS: ${error.message}`, error.stack);
      throw error;
    }
  }

  private formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');

    // If starts with 0, replace with country code (250 for Rwanda)
    if (digits.startsWith('0')) {
      return `+250${digits.substring(1)}`;
    }

    // If doesn't start with +, add + prefix
    if (!phone.startsWith('+')) {
      return `+${digits}`;
    }

    return phone;
  }
}
