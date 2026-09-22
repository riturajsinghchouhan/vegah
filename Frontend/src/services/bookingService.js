import api from "./api";

export const bookingService = {
  async listBookings(params = {}) {
    const response = await api.get('/bookings', { params });
    const rawData = response.data.data;
    const bookingsList = Array.isArray(rawData) ? rawData : (rawData?.bookings || []);
    return bookingsList.map((b) => ({
      ...b,
      id: b._id || b.id || b.bookingId,
      amount: b.totalAmount ?? b.amount ?? 0,
      totalAmount: b.totalAmount ?? b.amount ?? 0,
    }));
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
      aadharFile: payload.aadharFile?.dataUrl || payload.aadharFile || undefined,
      licenseFile: payload.licenseFile?.dataUrl || payload.licenseFile || undefined,
      userPhotoFile: payload.userPhotoFile?.dataUrl || payload.userPhotoFile || undefined,
    };

    const response = await api.post('/bookings', requestData);
    
    // The backend returns the created booking in response.data.data
    const booking = response.data.data;
    const bookingAmt = booking.totalAmount ?? booking.amount ?? payload.pricing?.total ?? payload.amount ?? 0;
    return {
      ...booking,
      id: booking._id || booking.id,
      status: booking.status,
      amount: bookingAmt,
      totalAmount: bookingAmt,
      vehicle: payload.vehicle || booking.vehicle,
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

  async updateBookingStatus(bookingId, status) {
    const response = await api.patch(`/bookings/${bookingId}/status`, { status });
    return response.data.data;
  },

  async getBooking(id) {
    const response = await api.get(`/bookings/${id}`);
    const b = response.data.data;
    return {
      ...b,
      id: b._id || b.id || b.bookingId,
      amount: b.totalAmount ?? b.amount ?? 0,
      totalAmount: b.totalAmount ?? b.amount ?? 0,
    };
  },

  // Server-authoritative trip timer. Runs from the admin-confirmed pickup time,
  // not from the originally booked start time.
  async getLiveStatus(bookingId) {
    const response = await api.get(`/bookings/${bookingId}/live`);
    return response.data.data;
  },

  // Step 7: the user tells us the EV is back at the hub. The booking moves to
  // PENDING_RETURN and only the admin can close it from there.
  async requestReturn(bookingId, note) {
    const response = await api.patch(`/bookings/${bookingId}/request-return`, note ? { note } : {});
    return response.data.data;
  },

  async extendBooking(bookingId, extraHours) {
    const response = await api.patch(`/bookings/${bookingId}/extend`, { extraHours });
    return response.data.data;
  },

  async cancelBooking(bookingId, cancellationReason) {
    const response = await api.patch(`/bookings/${bookingId}/status`, {
      status: 'CANCELLED_BY_USER',
      cancellationReason,
    });
    return response.data.data;
  },

  async getNotifications(params = {}) {
    const response = await api.get('/users/notifications', { params });
    return response.data.data;
  },

  async markNotificationsRead(ids) {
    const response = await api.patch('/users/notifications/read', ids ? { ids } : {});
    return response.data.data;
  },
};
