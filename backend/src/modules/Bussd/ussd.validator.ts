import { Injectable } from '@nestjs/common';

@Injectable()
export class UssdValidator {
  validatePhoneNumber(phone: string): boolean {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 9 && cleaned.length <= 15;
  }

  validateAmount(amount: string): boolean {
    const num = parseFloat(amount);
    return !isNaN(num) && num > 0;
  }

  parseAmount(amount: string): number {
    return parseFloat(amount);
  }

  normalizePhoneNumber(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('250')) {
      return cleaned;
    }
    if (cleaned.startsWith('0')) {
      return '250' + cleaned.slice(1);
    }
    return '250' + cleaned;
  }
}