import api from "../../../services/api";

export const adminService = {
  // --- Dashboard & Inventory ---
  async getInventorySummary() {
    const res = await api.get('/admin/inventory/summary');
    return res.data.data;
  },
  
  // --- Zones ---
  async getZones(params = {}) {
    const res = await api.get('/admin/zones', { params });
    return res.data.data;
  },
  async getZoneById(id) {
    const res = await api.get(`/admin/zones/${id}`);
    return res.data.data;
  },
  async createZone(data) {
    const res = await api.post('/admin/zones', data);
    return res.data.data;
  },
  async updateZone(id, data) {
    const res = await api.put(`/admin/zones/${id}`, data);
    return res.data.data;
  },
  async deleteZone(id) {
    const res = await api.delete(`/admin/zones/${id}`);
    return res.data.data;
  },

  // --- Categories ---
  async getCategories(params = {}) {
    const res = await api.get('/admin/categories', { params });
    return res.data.data;
  },
  async getCategoryById(id) {
    const res = await api.get(`/admin/categories/${id}`);
    return res.data.data;
  },
  async createCategory(data) {
    const res = await api.post('/admin/categories', data);
    return res.data.data;
  },
  async updateCategory(id, data) {
    const res = await api.put(`/admin/categories/${id}`, data);
    return res.data.data;
  },
  async deleteCategory(id) {
    const res = await api.delete(`/admin/categories/${id}`);
    return res.data.data;
  },

  // --- Vehicles ---
  async getVehicles(params = {}) {
    // Admin uses standard vehicle GET with optional params
    const res = await api.get('/vehicles', { params });
    return res.data.data;
  },
  async getVehicleById(id) {
    const res = await api.get(`/vehicles/${id}`);
    return res.data.data;
  },
  async createVehicle(data) {
    const res = await api.post('/vehicles', data);
    return res.data.data;
  },
  async updateVehicle(id, data) {
    const res = await api.put(`/vehicles/${id}`, data);
    return res.data.data;
  },
  async deleteVehicle(id) {
    const res = await api.delete(`/vehicles/${id}`);
    return res.data.data;
  },
  async updateVehicleStatus(id, status) {
    const res = await api.patch(`/admin/inventory/${id}/status`, { status });
    return res.data.data;
  },

  // --- Fleet Timeline ---
  async getFleetTimeline(params = {}) {
    const res = await api.get('/admin/fleet-timeline', { params });
    return res.data.data;
  },

  // --- Inspections ---
  async getInspections(params = {}) {
    const res = await api.get('/admin/inspections', { params });
    return res.data.data;
  },
  async getInspectionById(id) {
    const res = await api.get(`/admin/inspections/${id}`);
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
