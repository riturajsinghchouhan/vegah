import api from "./api";

export const bookingService = {
  async listBookings(params = {}) {
    const response = await api.get('/bookings', { params });
    // Assuming backend returns { data: [...bookings] } 
    // Mapped appropriately or used directly if UI handles it
    return response.data.data;
  },
  
  async createBooking(payload) {
    // Transform payload to backend expected format if needed
    // payload from useBooking: { vehicle, vehicleId, startDate, startTime, endDate, endTime, pickupLocation, batteryPackage, rentalType }
    
    // In our backend createBooking expects:
    // { vehicleId, rentalType, startDate, startTime, endDate, endTime, pickupLocation, batteryPackage, couponCode }
    const requestData = {
      vehicleId: payload.vehicleId || payload.vehicle?.id,
      rentalType: payload.rentalType ? payload.rentalType.toUpperCase() : 'HOURLY',
      startDate: payload.startDate,
      startTime: payload.startTime,
      endDate: payload.endDate,
      endTime: payload.endTime,
      pickupLocation: payload.pickupLocation || 'Default Hub',
      batteryPackage: payload.batteryPackage ? payload.batteryPackage.toUpperCase() : 'SINGLE',
      couponCode: payload.couponCode || undefined,
    };

    const response = await api.post('/bookings', requestData);
    
    // The backend returns the created booking in response.data.data
    // Map backend `bookingId` or `_id` to `id` for frontend if required
    const booking = response.data.data;
    return {
      ...booking,
      id: booking._id,
      status: booking.status,
    };
  },
  
  async initiatePayment(bookingId, method = 'UPI') {
    const response = await api.post(`/payments/${bookingId}/initiate`, { method });
    return response.data.data;
  },
  
  async verifyPayment(verificationData) {
    const response = await api.post(`/payments/verify`, verificationData);
    return response.data.data;
  },
};
