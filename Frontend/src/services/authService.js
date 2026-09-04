import api from "./api";

export const authService = {
  async requestOtp(phone) {
    const response = await api.post('/auth/request-otp', { phone });
    return response.data; // { success: true, message: 'OTP sent' }
  },
  
  async verifyOtp(phone, otp) {
    const response = await api.post('/auth/verify-otp', { phone, otp });
    // Returns: { success: true, data: { accessToken, refreshToken, user, isNewUser } }
    return response.data.data; 
  },
  
  async restoreSession() {
    const rawSession = window.localStorage.getItem("evora-session");
    if (!rawSession) return null;

    try {
      const session = JSON.parse(rawSession);
      const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN';
      const endpoint = isAdmin ? '/admin/profile' : '/users/me';

      const response = await api.get(endpoint);
      if (response.data.success) {
        // Update user data from server
        session.user = response.data.data;
        window.localStorage.setItem("evora-session", JSON.stringify(session));
        return session;
      }
      return null;
    } catch (err) {
      console.error("Session restore failed", err);
      window.localStorage.removeItem("evora-session");
      window.localStorage.removeItem("admin_token");
      return null;
    }
  },
  
  async logout() {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.warn("Logout request failed or already unauthorized");
    }
    window.localStorage.removeItem("evora-session");
    return { success: true };
  },
};
