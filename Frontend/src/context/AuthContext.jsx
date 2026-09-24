import { createContext, useEffect, useMemo, useState } from "react";
import { authService } from "../services/authService";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    authService.restoreSession().then((session) => {
      setUser(session?.user ?? null);
      setSessionReady(true);
    });
  }, []);

  const requestOtp = async (phone) => authService.requestOtp(phone);

  const verifyOtp = async (phone, otp) => {
    const session = await authService.verifyOtp(phone, otp);
    
    // Strip large binary data (base64 images in kycDetails) before saving to localStorage
    // to prevent QuotaExceededError. Tokens + lightweight user info are enough.
    const sessionToStore = {
      ...session,
      user: session.user
        ? {
            ...session.user,
            kycDetails: session.user.kycDetails
              ? {
                  ...session.user.kycDetails,
                  aadharFrontImage: undefined,
                  aadharBackImage: undefined,
                  licenseImage: undefined,
                  userPhoto: undefined,
                }
              : session.user.kycDetails,
          }
        : session.user,
    };

    try {
      window.localStorage.setItem("evora-session", JSON.stringify(sessionToStore));
    } catch (err) {
      // If localStorage is full, clear it and retry with just tokens
      console.warn("localStorage full, saving minimal session:", err);
      try {
        window.localStorage.setItem("evora-session", JSON.stringify({
          accessToken: session.accessToken,
          refreshToken: session.refreshToken,
          user: { _id: session.user?._id, fullName: session.user?.fullName, phone: session.user?.phone },
        }));
      } catch (e) {
        console.error("Could not save session to localStorage:", e);
      }
    }

    setUser(session.user);
    return session;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const updateUser = (userData) => {
    setUser(userData);
    const session = JSON.parse(window.localStorage.getItem("evora-session") || "{}");
    if (session && session.accessToken) {
      session.user = userData;
      window.localStorage.setItem("evora-session", JSON.stringify(session));
    }
  };

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      sessionReady,
      requestOtp,
      verifyOtp,
      logout,
      updateUser,
    }),
    [sessionReady, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
