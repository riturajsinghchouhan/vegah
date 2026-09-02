import { delay } from "../utils/delay";
import { mockUser } from "../data/user";

export const authService = {
  async requestOtp(phone) {
    await delay(400);
    return { success: true, phone };
  },
  async verifyOtp() {
    await delay(500);
    return { user: mockUser, token: "mock-jwt-token" };
  },
  async restoreSession() {
    await delay(250);
    const rawSession = window.localStorage.getItem("evora-session");
    return rawSession ? JSON.parse(rawSession) : null;
  },
  async logout() {
    await delay(200);
    window.localStorage.removeItem("evora-session");
    return { success: true };
  },
};
