import { Injectable } from '@nestjs/common';

@Injectable()
export class UssdLanguageService {
  getSupportedLanguages(): string[] {
    return ['KIN', 'ENG', 'FRA'];
  }

  getDefaultLanguage(): string {
    return 'KIN';
  }
}