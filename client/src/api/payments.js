import api from './api';

// Public: get active payment accounts for checkout
export const getPaymentAccounts = async () => {
    const { data } = await api.get('/payments/accounts');
    return data;
};

// Public: get available payment methods (dynamic from DB)
export const getPaymentMethods = async () => {
    const { data } = await api.get('/payments/methods');
    return data;
};

// Admin: get all payment accounts
export const getPaymentAccountsAdmin = async () => {
    const { data } = await api.get('/payments/accounts/admin');
    return data;
};

// Admin: create payment account
export const createPaymentAccount = async (accountData) => {
    const { data } = await api.post('/payments/accounts', accountData);
    return data;
};

// Admin: update payment account
export const updatePaymentAccount = async (id, accountData) => {
    const { data } = await api.put(`/payments/accounts/${id}`, accountData);
    return data;
};

// Admin: delete payment account
export const deletePaymentAccount = async (id) => {
    const { data } = await api.delete(`/payments/accounts/${id}`);
    return data;
};

// Admin: verify or reject payment
export const updatePaymentStatus = async (orderId, payment_status) => {
    const { data } = await api.patch(`/orders/${orderId}/payment`, { payment_status });
    return data;
};
