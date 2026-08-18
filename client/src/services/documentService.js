import api from './api';

export const documentService = {
  getDocuments: async () => (await api.get('/documents')).data,
  uploadDocument: async (payload) => (await api.post('/documents/upload', payload, { headers: { 'Content-Type': 'multipart/form-data' } })).data,
  deleteDocument: async (id) => (await api.delete(`/documents/${id}`)).data,
};

export default documentService;
