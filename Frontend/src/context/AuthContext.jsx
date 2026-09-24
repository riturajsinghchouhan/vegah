import { createContext, useEffect, useMemo, useState } from "react";
import { authService, sanitizeUserForStorage } from "../services/authService";

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

    const sessionToStore = {
      ...session,
      user: sanitizeUserForStorage(session.user),
    };

    try {
      window.localStorage.setItem("evora-session", JSON.stringify(sessionToStore));
    } catch (err) {
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
    const sessionStr = window.localStorage.getItem("evora-session");
    if (sessionStr) {
      try {
        const session = JSON.parse(sessionStr);
        if (session && session.accessToken) {
          session.user = sanitizeUserForStorage(userData);
          window.localStorage.setItem("evora-session", JSON.stringify(session));
        }
      } catch (err) {
        console.warn("Failed to update user in localStorage", err);
      }
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
