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
    window.localStorage.setItem("evora-session", JSON.stringify(session));
    setUser(session.user);
    return session;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      sessionReady,
      requestOtp,
      verifyOtp,
      logout,
    }),
    [sessionReady, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
