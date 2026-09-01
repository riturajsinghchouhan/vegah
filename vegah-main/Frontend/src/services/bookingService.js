import { bookings } from "../data/bookings";
import { delay } from "../utils/delay";

export const bookingService = {
  async listBookings() {
    await delay(350);
    return bookings;
  },
  async createBooking(payload) {
    await delay(650);
    return {
      bookingId: `EVR-${Math.floor(20000 + Math.random() * 9000)}`,
      status: "Confirmed",
      ...payload,
    };
  },
};
