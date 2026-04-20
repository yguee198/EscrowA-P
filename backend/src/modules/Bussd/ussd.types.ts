export enum UssdStep {
  MAIN_MENU = 'MAIN_MENU',
  ESCROW_ENTER_RECIPIENT = 'ESCROW_ENTER_RECIPIENT',
  ESCROW_ENTER_AMOUNT = 'ESCROW_ENTER_AMOUNT',
  ESCROW_CONFIRM = 'ESCROW_CONFIRM',
  WALLET_VIEW = 'WALLET_VIEW',
  TRANSACTION_STATUS = 'TRANSACTION_STATUS',
  DISPUTE = 'DISPUTE',
  EXIT = 'EXIT',
}

export interface EscrowData {
  recipient?: string;
  amount?: string;
  reference?: string;
}

export interface UssdSession {
  id: string;
  currentStep: string;
  data: UssdSessionData;
  language: string;
}

export interface UssdSessionData {
  escrow?: EscrowData;
}

export interface UssdResponse {
  message: string;
  type: 'CON' | 'END';
}