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
      rentalType: payload.rentalType || (payload.duration > 24 ? 'DAILY' : 'HOURLY'), // simplistic mapping if needed
      startDate: payload.startDate,
      startTime: payload.startTime,
      endDate: payload.endDate,
      endTime: payload.endTime,
      pickupLocation: payload.pickupLocation || 'Default Hub',
      batteryPackage: payload.batteryPackage || 'SINGLE',
      couponCode: payload.couponCode || '',
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
};
