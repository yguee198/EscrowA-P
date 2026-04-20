import { Injectable } from '@nestjs/common';

@Injectable()
export class UssdConfig {
  /**
   * Session timeout in milliseconds (default: 5 minutes)
   */
  sessionTimeout = parseInt(process.env.USSD_SESSION_TIMEOUT || '300000', 10);

  /**
   * Maximum retry attempts
   */
  maxRetries = parseInt(process.env.USSD_MAX_RETRIES || '3', 10);

  /**
   * Step timeout in milliseconds
   */
  stepTimeout = parseInt(process.env.USSD_STEP_TIMEOUT || '30000', 10);

  /**
   * Supported telecom operators
   */
  supportedOperators = (process.env.USSD_OPERATORS || 'MTN,AIRTEL,VODAFONE').split(',');

  /**
   * Default language
   */
  defaultLanguage = process.env.USSD_DEFAULT_LANG || 'en';

  /**
   * Enable debug logging
   */
  debug = process.env.USSD_DEBUG === 'true';
}