import { UssdSession } from '../ussd.types';

export interface HandlerResult {
  nextStep?: string;
  sessionData?: Record<string, any>;
  message: string;
  endSession?: boolean;
}

export interface UssdStepHandler {
  handle(session: UssdSession, input: string): Promise<HandlerResult>;
}

export const USSD_STEP_HANDLER_METADATA = 'ussd_step_handler';