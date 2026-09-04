import api from "../../../services/api";

export const adminService = {
  // --- Dashboard & Inventory ---
  async getInventorySummary() {
    const res = await api.get('/admin/inventory/summary');
    return res.data.data;
  },
  
  // --- Zones ---
  async getZones() {
    const res = await api.get('/admin/zones');
    return res.data.data;
  },
  async createZone(data) {
    const res = await api.post('/admin/zones', data);
    return res.data.data;
  },

  // --- Categories ---
  async getCategories() {
    const res = await api.get('/admin/categories');
    return res.data.data;
  },

  // --- Vehicles ---
  async getVehicles(params = {}) {
    // Admin uses standard vehicle GET with optional params
    const res = await api.get('/vehicles', { params });
    return res.data.data;
  },
  async createVehicle(data) {
    const res = await api.post('/vehicles', data);
    return res.data.data;
  },
  async updateVehicleStatus(id, status) {
    const res = await api.patch(`/admin/inventory/${id}/status`, { status });
    return res.data.data;
  },

  // --- Users ---
  async getUsers(params = {}) {
    const res = await api.get('/users', { params });
    return res.data.data;
  },

  // --- Bookings ---
  async getBookings(params = {}) {
    // Calling GET /bookings as an Admin returns ALL bookings in our backend
    const res = await api.get('/bookings', { params });
    return res.data.data;
  },
  async updateBookingStatus(id, status) {
    const res = await api.patch(`/bookings/${id}/status`, { status });
    return res.data.data;
  },
};
