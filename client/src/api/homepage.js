import api from './api';

export const getHomepageSections = async () => {
    const { data } = await api.get('/homepage');
    return data;
};

export const getHomepageSectionsAdmin = async () => {
    const { data } = await api.get('/homepage/admin');
    return data;
};

export const createHomepageSection = async (sectionData) => {
    const { data } = await api.post('/homepage', sectionData);
    return data;
};

export const updateHomepageSection = async (id, sectionData) => {
    const { data } = await api.put(`/homepage/${id}`, sectionData);
    return data;
};

export const reorderHomepageSections = async (order) => {
    const { data } = await api.put('/homepage/reorder', { order });
    return data;
};

export const deleteHomepageSection = async (id) => {
    const { data } = await api.delete(`/homepage/${id}`);
    return data;
};
