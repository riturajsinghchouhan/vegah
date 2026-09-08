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
  async deleteVehicleImage(vehicleId, imageId) {
    const res = await api.delete(`/vehicles/${vehicleId}/images/${imageId}`);
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
  async createInspection(data) {
    const res = await api.post('/admin/inspections', data);
    return res.data.data;
  },
  async updateInspection(id, data) {
    const res = await api.put(`/admin/inspections/${id}`, data);
    return res.data.data;
  },

  // --- Users ---
  async getUsers(params = {}) {
    const res = await api.get('/users', { params });
    return res.data.data;
  },
  async getUserById(id) {
    const res = await api.get(`/users/${id}`);
    return res.data.data;
  },
  async blockUser(id) {
    const res = await api.patch(`/users/${id}/block`);
    return res.data.data;
  },
  async unblockUser(id) {
    const res = await api.patch(`/users/${id}/unblock`);
    return res.data.data;
  },

  // --- Bookings ---
  async getBookings(params = {}) {
    // Calling GET /bookings as an Admin returns ALL bookings in our backend
    const res = await api.get('/bookings', { params });
    return res.data.data;
  },
  async getBookingById(id) {
    const res = await api.get(`/bookings/${id}`);
    return res.data.data;
  },
  async updateBookingStatus(id, status) {
    const res = await api.patch(`/bookings/${id}/status`, { status });
    return res.data.data;
  },

  // --- Coupons ---
  async getCoupons(params = {}) {
    const res = await api.get('/coupons/admin', { params });
    return res.data.data;
  },
  async createCoupon(data) {
    const res = await api.post('/coupons/admin', data);
    return res.data.data;
  },
  async updateCoupon(id, data) {
    const res = await api.put(`/coupons/admin/${id}`, data);
    return res.data.data;
  },
  async deleteCoupon(id) {
    const res = await api.delete(`/coupons/admin/${id}`);
    return res.data.data;
  },
  async toggleCouponStatus(id) {
    const res = await api.patch(`/coupons/admin/${id}/status`);
    return res.data.data;
  },
  async validateCoupon(code, amount) {
    const res = await api.post('/coupons/validate', { code, amount });
    return res.data.data;
  },

  // --- Wallet & Refunds ---
  async getAdminWalletSummary(params = {}) {
    const res = await api.get('/wallet/admin/summary', { params });
    return res.data.data;
  },
  async getRefunds(params = {}) {
    const res = await api.get('/wallet/admin/refunds', { params });
    return res.data.data;
  },
  async updateRefundStatus(id, status) {
    const res = await api.patch(`/wallet/admin/refunds/${id}/status`, { status });
    return res.data.data;
  },
  async getUserWallet() {
    const res = await api.get('/wallet/user');
    return res.data.data;
  },
  async addWalletFunds(amount, description) {
    const res = await api.post('/wallet/user/add-funds', { amount, description });
    return res.data.data;
  },

  // --- Reports ---
  async getReportsData(params = {}) {
    const res = await api.get('/admin/reports/analytics', { params });
    return res.data.data;
  },

  // --- Finance, Settlements & Tax Billing ---
  async getFinanceSummary(params = {}) {
    const res = await api.get('/admin/finance/summary', { params });
    return res.data.data;
  },
  async getSettlements(params = {}) {
    const res = await api.get('/admin/finance/settlements', { params });
    return res.data.data;
  },
  async getTaxBilling(params = {}) {
    const res = await api.get('/admin/finance/tax-billing', { params });
    return res.data.data;
  },

  // --- Settings ---
  async getSettings(params = {}) {
    const res = await api.get('/admin/settings', { params });
    return res.data.data;
  },
  async updateSettings(data, category) {
    const url = category ? `/admin/settings?category=${category}` : '/admin/settings';
    const res = await api.put(url, data);
    return res.data.data;
  },
};
