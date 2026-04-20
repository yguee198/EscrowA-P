import api from './api';

export const authService = {
  register: async (data: { phone: string; email?: string; password: string; pin: string; nid: string; profileImage?:File }) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  login: async (data: { phone: string; password: string }) => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  verifyPin: async (pin: string) => {
    const response = await api.post('/auth/verify-pin', { pin });
    return response.data;
  },
}; 