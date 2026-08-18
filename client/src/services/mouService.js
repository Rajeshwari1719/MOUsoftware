import api from './api';

export const mouService = {
  getMous: async () => (await api.get('/mous')).data,
  getMou: async (id) => (await api.get(`/mous/${id}`)).data,
  createMou: async (payload) => (await api.post('/mous', payload)).data,
  updateMou: async (id, payload) => (await api.put(`/mous/${id}`, payload)).data,
  deleteMou: async (id) => (await api.delete(`/mous/${id}`)).data,
};

export default mouService;
