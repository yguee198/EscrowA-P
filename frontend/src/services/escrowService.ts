import api from './api';

export const escrowService = {
    createEscrow: async (data: {
        receiverPhone: string;
        amount: number;
        pin: string;
        description?: string;
        reason?: string;
        releaseDays?: number;
    }) => {
        const response = await api.post('/escrow/create', data);
        return response.data;
    },

    confirmEscrow: async (escrowId: string, pin: string) => {
        const response = await api.post(`/escrow/${escrowId}/confirm`, {
            pin,
        });
        return response.data;
    },


    getEscrow: async (escrowId: string) => {
        const response = await api.get(`/escrow/${escrowId}`);
        return response.data;
    },
};