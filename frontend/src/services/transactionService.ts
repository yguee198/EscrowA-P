import api from './api';

export const transactionService = {
  sendMoney: async (data: {
    receiverPhone: string;
    amount: number;
    pin: string;
    description?: string;
  }) => {
    const response = await api.post('/transactions/send', data);
    return response.data;
  },

  requestMoney: async (data: {
    receiverPhone: string;
    amount: number;
    description?: string;
  }) => {
    const response = await api.post('/transactions/request', data);
    return response.data;
  },


  getTransaction: async (id: string) => {
    const response = await api.get(`/transactions/${id}`);
    return response.data;
  },

  // getTransaction: async (escrowId: string) => {
  //   const response = await api.get(`/escrow/${escrowId}`);
  //   return response.data;
  // },

  requestWithdraw: async (data: {
    amount: number;
    pin: string;
    currency: string;
    bank_name: string;
    bank_account_number: string;
  }) => {
    const response = await api.post('/withdraw/request', data);
    return response.data;
  },

  getWithdrawHistory: async () => {
    const response = await api.get('/withdraw/history');
    return response.data;
  },
};