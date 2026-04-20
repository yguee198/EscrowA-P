import { Injectable } from '@nestjs/common';

@Injectable()
export class BillService {
  async payElectricity(meter: string, amount: number, pin: string) {
    // TODO: Integrate with external API and ledger
    return { status: 'success', token: '4578-4567-8990' };
  }
}