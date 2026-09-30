import api from './api';

// Fetch a region landing page: SEO copy + products actually sourced from it.
export const getLocation = async (slug) => {
    const { data } = await api.get(`/locations/${slug}`);
    return data;
};
