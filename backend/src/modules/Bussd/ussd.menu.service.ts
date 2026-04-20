import { Injectable } from '@nestjs/common';
import { UssdStep, UssdResponse } from './ussd.types';

@Injectable()
export class UssdMenuService {
  getMainMenu(language: string = 'KIN'): UssdResponse {
    return {
      type: 'CON',
      message: this.getMainMenuText(language),
    };
  }

  private getMainMenuText(language: string): string {
    const menus: Record<string, string> = {
      KIN: `CON Murakaza neza kuri Mobile Escrow\n1. Ohereza amafaranga\n2. Reba konti\n3. Ibikoresho\n4. Ikibazo\n0. Fangura`,
      ENG: `CON Mobile Escrow\n1. Send Money\n2. Check Balance\n3. Transactions\n4. Dispute\n0. Exit`,
      FRA: `CON Mobile Escrow\n1. Envoyer\n2. Solde\n3. Transactions\n4. Litige\n0. Quitter`,
    };
    return menus[language] || menus['KIN'];
  }

  getEnterRecipient(language: string = 'KIN'): UssdResponse {
    return {
      type: 'CON',
      message: this.getEnterRecipientText(language),
    };
  }

  private getEnterRecipientText(language: string): string {
    const texts: Record<string, string> = {
      KIN: 'CON Injiza numero ya telefone',
      ENG: 'CON Enter recipient phone number:',
      FRA: 'CON Entrez le numero du beneficiaire:',
    };
    return texts[language] || texts['KIN'];
  }

  getEnterAmount(language: string = 'KIN'): UssdResponse {
    return {
      type: 'CON',
      message: this.getEnterAmountText(language),
    };
  }


  private getEnterAmountText(language: string): string {
    const texts: Record<string, string> = {
      KIN: 'CON Andika amafaranga',
      ENG: 'CON Enter amount:',
      FRA: 'CON Entrez le montant:',
    };
    return texts[language] || texts['KIN'];
  }
  
  getConfirmEscrow(
    recipient: string,
    amount: string,
    language: string = 'KIN',
  ): UssdResponse {
    return {
      type: 'CON',
      message: this.getConfirmEscrowText(recipient, amount, language),
    };
  }
  
  private getConfirmEscrowText(
    recipient: string,
    amount: string,
    language: string,
  ): string {
    const texts: Record<string, string> = {
      KIN: `CON Ohereza ${amount} RWF kuri ${recipient}?\n1. Emeza\n2. Hagarika`,
      ENG: `CON Send ${amount} RWF to ${recipient}?\n1. Confirm\n2. Cancel`,
      FRA: `CON Envoyer ${amount} RWF a ${recipient}?\n1. Confirmer\n2. Annuler`,
    };
    return texts[language] || texts['KIN'];
  }


  getEscrowSuccess(reference: string, language: string = 'KIN'): UssdResponse {
    return {
      type: 'END',
      message: this.getEscrowSuccessText(reference, language),
    };
  }
  

  private getEscrowSuccessText(reference: string, language: string): string {
    const texts: Record<string, string> = {
      KIN: `END Byarangiye neza\nRef: ${reference}`,
      ENG: `END Escrow created successfully\nRef: ${reference}`,
      FRA: `END Escrow cree avec succes\nRef: ${reference}`,
    };
    return texts[language] || texts['KIN'];
  }

  getInsufficientBalance(language: string = 'KIN'): UssdResponse {
    return {
      type: 'END',
      message: this.getInsufficientBalanceText(language),
    };
  }

  private getInsufficientBalanceText(language: string): string {
    const texts: Record<string, string> = {
      KIN: 'END Ntibishoboka. Konti ifite amafaranga make.',
      ENG: 'END Insufficient balance',
      FRA: 'END Solde insuffisant',
    };
    return texts[language] || texts['KIN'];
  }

  getCancelled(language: string = 'KIN'): UssdResponse {
    return {
      type: 'END',
      message: this.getCancelledText(language),
    };
  }

  private getCancelledText(language: string): string {
    const texts: Record<string, string> = {
      KIN: 'END Byahagaritswe. Murakoze.',
      ENG: 'END Cancelled. Thank you.',
      FRA: 'END Annule. Merci.',
    };
    return texts[language] || texts['KIN'];
  }

  getWalletInfo(
    balance: number,
    held: number,
    available: number,
    language: string = 'KIN',
  ): UssdResponse {
    return {
      type: 'CON',
      message: this.getWalletInfoText(balance, held, available, language),
    };
  }

  private getWalletInfoText(
    balance: number,
    held: number,
    available: number,
    language: string,
  ): string {
    const texts: Record<string, string> = {
      KIN: `CON Konti: ${balance} RWF\nIbibitse: ${held} RWF\nIbyifite: ${available} RWF\n0. Subira`,
      ENG: `CON Balance: ${balance} RWF\nHeld: ${held} RWF\nAvailable: ${available} RWF\n0. Back`,
      FRA: `CON Solde: ${balance} RWF\nBloque: ${held} RWF\nDisponible: ${available} RWF\n0. Retour`,
    };
    return texts[language] || texts['KIN'];
  }

  getEnterTransactionRef(language: string = 'KIN'): UssdResponse {
    return {
      type: 'CON',
      message: this.getEnterTransactionRefText(language),
    };
  }

  private getEnterTransactionRefText(language: string): string {
    const texts: Record<string, string> = {
      KIN: 'CON Injiza reference y\'ibikoresho',
      ENG: 'CON Enter transaction reference:',
      FRA: 'CON Entrez la reference de la transaction:',
    };
    return texts[language] || texts['KIN'];
  }
     
                                                                               
  getTransactionStatus(
    status: string,
    amount: string,
    language: string = 'KIN',
  ): UssdResponse {
    return {
      type: 'CON',
      message: this.getTransactionStatusText(status, amount, language),
    };
  }

  private getTransactionStatusText(
    status: string,
    amount: string,
    language: string,
  ): string {
    const texts: Record<string, string> = {
      KIN: `CON Ikibazo: ${status}\nAmafaranga: ${amount} RWF\n0. Subira`,
      ENG: `CON Status: ${status}\nAmount: ${amount} RWF\n0. Back`,
      FRA: `CON Statut: ${status}\nMontant: ${amount} RWF\n0. Retour`,
    };
    return texts[language] || texts['KIN'];
  }


  getInvalidInput(language: string = 'KIN'): UssdResponse {
    return {
      type: 'END',
      message: this.getInvalidInputText(language),
    };
  }

  private getInvalidInputText(language: string): string {
    const texts: Record<string, string> = {
      KIN: 'END Ibyinjijwe ntibyemewe. Nobera.',
      ENG: 'END Invalid input. Try again.',
      FRA: 'END Entree invalide. Reessayez.',
    };
    return texts[language] || texts['KIN'];
  }

  getDisputeSuccess(language: string = 'KIN'): UssdResponse {
    return {
      type: 'END',
      message: this.getDisputeSuccessText(language),
    };
  }

private getDisputeSuccessText(language: string): string {
    const texts: Record<string, string> = {
      KIN: 'END Ikibazo cyatanzwe. Tubakurikire.',
      ENG: 'END Dispute submitted. We will follow up.',
      FRA: 'END Litige soumis. Nous vous contacterons.',
    };
    return texts[language] || texts['KIN'];
  }

  getExit(language: string = 'KIN'): UssdResponse {
    return {
      type: 'END',
      message: this.getExitText(language),
    };
  }

  private getExitText(language: string): string {
    const texts: Record<string, string> = {
      KIN: 'END Byarangiye neza',
      ENG: 'END Goodbye',
      FRA: 'END Au revoir',
    };
    return texts[language] || texts['KIN'];
  }

  getTransactionNotFound(language: string = 'KIN'): UssdResponse {
    return {
      type: 'END',
      message: this.getTransactionNotFoundText(language),
    };
  }

  private getTransactionNotFoundText(language: string): string {
    const texts: Record<string, string> = {
      KIN: 'END Transaction ntibashije kuboneka',
      ENG: 'END Transaction not found',
      FRA: 'END Transaction non trouvee',
    };
    return texts[language] || texts['KIN'];
  }
}