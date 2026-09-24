import api from "./api";

export const sanitizeUserForStorage = (user) => {
  if (!user || typeof user !== 'object') return user;

  const sanitized = { ...user };

  if (sanitized.kycDetails) {
    const kyc = { ...sanitized.kycDetails };
    ['aadharFrontImage', 'aadharBackImage', 'licenseFrontImage', 'licenseBackImage', 'licenseImage', 'userPhoto'].forEach((field) => {
      if (typeof kyc[field] === 'string' && kyc[field].startsWith('data:')) {
        kyc[field] = undefined;
      }
    });
    sanitized.kycDetails = kyc;
  }

  if (typeof sanitized.userPhoto === 'string' && sanitized.userPhoto.startsWith('data:')) {
    sanitized.userPhoto = undefined;
  }
  if (typeof sanitized.avatarUrl === 'string' && sanitized.avatarUrl.startsWith('data:')) {
    sanitized.avatarUrl = undefined;
  }

  return sanitized;
};

export const authService = {
  async requestOtp(phone) {
    const response = await api.post('/auth/request-otp', { phone });
    return response.data; // { success: true, message: 'OTP sent' }
  },
  

  async verifyOtp(phone, otp) {
    const response = await api.post('/auth/verify-otp', { phone, otp });
    // Returns: { success: true, data: { accessToken, refreshToken, user, isNewUser } }
    return response.data.data; 
    return response.data.data;
  },
  

  async restoreSession() {
    const rawSession = window.localStorage.getItem("evora-session");
    if (!rawSession) return null;

    let session;
    try {
      const session = JSON.parse(rawSession);
      session = JSON.parse(rawSession);
    } catch (err) {
      console.error("Session restore failed to parse JSON:", err);
      window.localStorage.removeItem("evora-session");
      window.localStorage.removeItem("admin_token");
      return null;
    }

    if (!session || (!session.accessToken && !session.user)) {
      return null;
    }

    try {
      const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN';
      const endpoint = isAdmin ? '/admin/profile' : '/users/me';

      const response = await api.get(endpoint);
      if (response.data.success) {
        // Update user data from server
        session.user = response.data.data;
        window.localStorage.setItem("evora-session", JSON.stringify(session));
      if (response.data && response.data.success && response.data.data) {
        const freshUser = response.data.data;
        session.user = freshUser;

        const sessionToStore = {
          ...session,
          user: sanitizeUserForStorage(freshUser),
        };

        try {
          window.localStorage.setItem("evora-session", JSON.stringify(sessionToStore));
        } catch (storeErr) {
          console.warn("Failed to update evora-session in localStorage:", storeErr);
        }

        return session;
      }
      return null;
    } catch (err) {
      console.error("Session restore failed", err);
      console.warn("Session restore profile fetch failed:", err?.message || err);

      // If network error / offline / server hiccup, fallback to stored session if user exists
      if (session && session.user) {
        console.info("Using cached session fallback");
        return session;
      }

      window.localStorage.removeItem("evora-session");
      window.localStorage.removeItem("admin_token");
      return null;
    }

    return session;
  },
  

  async logout() {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.warn("Logout request failed or already unauthorized");
    }
    window.localStorage.removeItem("evora-session");
    window.localStorage.removeItem("admin_token");
    return { success: true };
  },
};
