import api from "./api";

export const userService = {
  async getProfile() {
    const response = await api.get('/users/me');
    return response.data.data;
  },
  
  async updateProfile(data) {
    const response = await api.patch('/users/profile', data);
    return response.data.data;
  },

  async getActiveCoupons() {
    const response = await api.get('/coupons/active');
    return response.data.data || [];
  },

  async getPublicZones() {
    const response = await api.get('/admin/zones/public');
    return response.data.data || [];
  },
};

