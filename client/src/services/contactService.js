import api from './api';

export const contactService = {
  // List all contacts
  getContacts: async (filters = {}) => {
    const response = await api.get('/contacts', { params: filters });
    return response.data;
  },

  // Get single contact
  getContact: async (id) => {
    const response = await api.get(`/contacts/${id}`);
    return response.data;
  },

  // Create contact
  createContact: async (contactData) => {
    const response = await api.post('/contacts', contactData);
    return response.data;
  },

  // Update contact
  updateContact: async (id, contactData) => {
    const response = await api.put(`/contacts/${id}`, contactData);
    return response.data;
  },

  // Delete contact
  deleteContact: async (id) => {
    const response = await api.delete(`/contacts/${id}`);
    return response.data;
  },

  // Get contacts by MOU
  getContactsByMOU: async (mouId) => {
    const response = await api.get(`/contacts/mou/${mouId}`);
    return response.data;
  },

  // Get contact statistics
  getStats: async () => {
    const response = await api.get('/contacts/stats');
    return response.data;
  },

  // Bulk import contacts
  bulkImport: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/contacts/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Export contacts
  export: async (filters = {}) => {
    const response = await api.get('/contacts/export', {
      params: filters,
      responseType: 'blob',
    });
    return response.data;
  },
};

export default contactService;
