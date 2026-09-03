import api from "./api";

export const userService = {
  async getProfile() {
    const response = await api.get('/users/me');
    return response.data.data;
  },
};
