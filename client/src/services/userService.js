import api from './api';

export const userService = {
  // List all users
  getUsers: async (filters = {}) => {
    const response = await api.get('/users', { params: filters });
    return response.data;
  },

  // Get single user
  getUser: async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  // Create user
  createUser: async (userData) => {
    const response = await api.post('/users', userData);
    return response.data;
  },

  // Update user
  updateUser: async (id, userData) => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },

  // Delete user
  deleteUser: async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  // Update user role
  updateRole: async (id, role) => {
    const response = await api.patch(`/users/${id}/role`, { role });
    return response.data;
  },

  // Get user statistics
  getStats: async () => {
    const response = await api.get('/users/stats');
    return response.data;
  },

  // Bulk import users
  bulkImport: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/users/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};

export default userService;
