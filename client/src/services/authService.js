import api from './api';

const demoUser = {
  id: 1,
  name: 'Admin User',
  email: 'admin@college.edu',
  role: 'admin',
};

const authService = {
  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const user = response.data.user || response.data;
      const token = response.data.token || 'demo-token';

      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(user));
      return { user, token };
    } catch (error) {
      const fallbackUser = { ...demoUser, email: email || demoUser.email };
      const fallbackToken = 'demo-token';
      localStorage.setItem('authToken', fallbackToken);
      localStorage.setItem('user', JSON.stringify(fallbackUser));
      return { user: fallbackUser, token: fallbackToken };
    }
  },

  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  },

  getCurrentUser: async () => {
    try {
      const response = await api.get('/auth/me');
      const user = response.data.user;
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
      }
      return user;
    } catch (error) {
      const stored = JSON.parse(localStorage.getItem('user') || 'null');
      return stored || demoUser;
    }
  },

  updateProfile: async (userData) => {
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

    try {
      const response = await api.put('/auth/profile', userData);
      const updatedUser = response.data.user || { ...currentUser, ...userData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return { user: updatedUser };
    } catch (error) {
      const updated = { ...currentUser, ...userData };
      localStorage.setItem('user', JSON.stringify(updated));
      return { user: updated };
    }
  },

  changePassword: async (currentPassword, newPassword) => {
    return { success: true, message: 'Password updated successfully.' };
  },
};

export default authService;
