import api from './api';

export const excelService = {
  uploadExcel: async (payload) => (await api.post('/excel/import', payload, { headers: { 'Content-Type': 'multipart/form-data' } })).data,
  getTemplates: async () => (await api.get('/excel/templates')).data,
};

export default excelService;
