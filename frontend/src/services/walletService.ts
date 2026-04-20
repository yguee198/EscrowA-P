import api from './api';

export const walletService = {
  getBalance: async () => {
    const response = await api.get('/wallet/balance');
    return response.data;
  },

  getTransactions: async (limit = 20, offset = 0) => {
    const response = await api.get(`/wallet/transactions?limit=${limit}&offset=${offset}`);
    return response.data;
  },
  
  deposit: async (amount: number) => {
    const { data } = await api.post('/wallet/deposit', { amount });
    return data;
  },

  withdraw: async (data: {
    amount: number;
    bankAccount: string;
    bankName: string;
    pin: string;
  }) => {
    const response = await api.post('/wallet/withdraw', data);
    return response.data;
  },
};