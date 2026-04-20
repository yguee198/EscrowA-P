import api from './api'; // cyangwa axios instance yawe

export const userService = {
  lookupByPhone: async (phone: string) => {
    const res = await api.get(`/users/phone?phone=${phone}`);
    return res.data; // { found: true/false, user: { id, phone, email, role } }
  },
};