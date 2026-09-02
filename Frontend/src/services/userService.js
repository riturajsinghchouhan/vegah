import { mockUser } from "../data/user";
import { delay } from "../utils/delay";

export const userService = {
  async getProfile() {
    await delay(250);
    return mockUser;
  },
};
