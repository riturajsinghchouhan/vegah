import adminApi from "../../../services/adminApi";

export const adminService = {
  // --- Dashboard & Inventory ---
  async getDashboardStats() {
    const res = await adminApi.get('/admin/dashboard/stats');
    return res.data.data;
  },
  async getDashboardCharts(params = {}) {
    const res = await adminApi.get('/admin/dashboard/charts', { params });
    return res.data.data;
  },
  async getInventorySummary() {
    const res = await adminApi.get('/admin/inventory/summary');
    return res.data.data;
  },
  
  // --- Zones ---
  async getZones(params = {}) {
    const res = await adminApi.get('/admin/zones', { params });
    return res.data.data;
  },
  async getZoneById(id) {
    const res = await adminApi.get(`/admin/zones/${id}`);
    return res.data.data;
  },
  async createZone(data) {
    const res = await adminApi.post('/admin/zones', data);
    return res.data.data;
  },
  async updateZone(id, data) {
    const res = await adminApi.put(`/admin/zones/${id}`, data);
    return res.data.data;
  },
  async deleteZone(id) {
    const res = await adminApi.delete(`/admin/zones/${id}`);
    return res.data.data;
  },

  // --- Categories ---
  async getCategories(params = {}) {
    const res = await adminApi.get('/admin/categories', { params });
    return res.data.data;
  },
  async getCategoryById(id) {
    const res = await adminApi.get(`/admin/categories/${id}`);
    return res.data.data;
  },
  async createCategory(data) {
    const res = await adminApi.post('/admin/categories', data);
    return res.data.data;
  },
  async updateCategory(id, data) {
    const res = await adminApi.put(`/admin/categories/${id}`, data);
    return res.data.data;
  },
  async deleteCategory(id) {
    const res = await adminApi.delete(`/admin/categories/${id}`);
    return res.data.data;
  },

  // --- Vehicles ---
  async getVehicles(params = {}) {
    // Admin uses standard vehicle GET with optional params
    const res = await adminApi.get('/vehicles', { params });
    return res.data.data;
  },
  async getVehicleById(id) {
    const res = await adminApi.get(`/vehicles/${id}`);
    return res.data.data;
  },
  async createVehicle(data) {
    const res = await adminApi.post('/vehicles', data);
    return res.data.data;
  },
  async updateVehicle(id, data) {
    const res = await adminApi.put(`/vehicles/${id}`, data);
    return res.data.data;
  },
  async deleteVehicle(id) {
    const res = await adminApi.delete(`/vehicles/${id}`);
    return res.data.data;
  },
  async deleteVehicleImage(vehicleId, imageId) {
    const res = await adminApi.delete(`/vehicles/${vehicleId}/images/${imageId}`);
    return res.data.data;
  },
  async updateVehicleStatus(id, status) {
    const res = await adminApi.patch(`/admin/inventory/${id}/status`, { status });
    return res.data.data;
  },

  // --- Fleet Timeline ---
  async getFleetTimeline(params = {}) {
    const res = await adminApi.get('/admin/fleet-timeline', { params });
    return res.data.data;
  },

  // --- Inspections ---
  async getInspections(params = {}) {
    const res = await adminApi.get('/admin/inspections', { params });
    return res.data.data;
  },
  async getInspectionById(id) {
    const res = await adminApi.get(`/admin/inspections/${id}`);
    return res.data.data;
  },
  async createInspection(data) {
    const res = await adminApi.post('/admin/inspections', data);
    return res.data.data;
  },
  async updateInspection(id, data) {
    const res = await adminApi.put(`/admin/inspections/${id}`, data);
    return res.data.data;
  },

  // --- Users ---
  async getUsers(params = {}) {
    const res = await adminApi.get('/users', { params });
    return res.data.data;
  },
  async getUserById(id) {
    const res = await adminApi.get(`/users/${id}`);
    return res.data.data;
  },
  async blockUser(id) {
    const res = await adminApi.patch(`/users/${id}/block`);
    return res.data.data;
  },
  async unblockUser(id) {
    const res = await adminApi.patch(`/users/${id}/unblock`);
    return res.data.data;
  },

  // --- Bookings ---
  async getBookings(params = {}) {
    // Calling GET /bookings as an Admin returns ALL bookings in our backend
    const res = await adminApi.get('/bookings', { params: { limit: 100, ...params } });
    return res.data.data;
  },
  async getBookingById(id) {
    const res = await adminApi.get(`/bookings/${id}`);
    return res.data.data;
  },
  async updateBookingStatus(id, status) {
    const res = await adminApi.patch(`/bookings/${id}/status`, { status });
    return res.data.data;
  },
  // Step 4: customer is at the hub and has the EV in hand. Starts the trip timer.
  async confirmPickup(id, note) {
    const res = await adminApi.patch(`/bookings/${id}/confirm-pickup`, note ? { note } : {});
    return res.data.data;
  },
  // Step 9: EV is physically back. Settles deposit/late fee and closes the rental.
  async confirmReturn(id, { note, depositStatus } = {}) {
    const res = await adminApi.patch(`/bookings/${id}/confirm-return`, {
      ...(note ? { note } : {}),
      ...(depositStatus ? { depositStatus } : {}),
    });
    return res.data.data;
  },
  // The claimed drop-off could not be verified - trip keeps running.
  async rejectReturn(id, note) {
    const res = await adminApi.patch(`/bookings/${id}/reject-return`, note ? { note } : {});
    return res.data.data;
  },

  // --- Coupons ---
  async getCoupons(params = {}) {
    const res = await adminApi.get('/coupons/admin', { params });
    return res.data.data;
  },
  async createCoupon(data) {
    const res = await adminApi.post('/coupons/admin', data);
    return res.data.data;
  },
  async updateCoupon(id, data) {
    const res = await adminApi.put(`/coupons/admin/${id}`, data);
    return res.data.data;
  },
  async deleteCoupon(id) {
    const res = await adminApi.delete(`/coupons/admin/${id}`);
    return res.data.data;
  },
  async toggleCouponStatus(id) {
    const res = await adminApi.patch(`/coupons/admin/${id}/status`);
    return res.data.data;
  },
  async validateCoupon(code, amount) {
    const res = await adminApi.post('/coupons/validate', { code, amount });
    return res.data.data;
  },

  // --- Wallet & Refunds ---
  async getAdminWalletSummary(params = {}) {
    const res = await adminApi.get('/wallet/admin/summary', { params });
    return res.data.data;
  },
  async getRefunds(params = {}) {
    const res = await adminApi.get('/wallet/admin/refunds', { params });
    return res.data.data;
  },
  async updateRefundStatus(id, status) {
    const res = await adminApi.patch(`/wallet/admin/refunds/${id}/status`, { status });
    return res.data.data;
  },
  async getUserWallet() {
    const res = await adminApi.get('/wallet/user');
    return res.data.data;
  },
  async addWalletFunds(amount, description) {
    const res = await adminApi.post('/wallet/user/add-funds', { amount, description });
    return res.data.data;
  },

  // --- Reports ---
  async getReportsData(params = {}) {
    const res = await adminApi.get('/admin/reports/analytics', { params });
    return res.data.data;
  },

  // --- Finance, Settlements & Tax Billing ---
  async getFinanceSummary(params = {}) {
    const res = await adminApi.get('/admin/finance/summary', { params });
    return res.data.data;
  },
  async getSettlements(params = {}) {
    const res = await adminApi.get('/admin/finance/settlements', { params });
    return res.data.data;
  },
  async getTaxBilling(params = {}) {
    const res = await adminApi.get('/admin/finance/tax-billing', { params });
    return res.data.data;
  },

  // --- Settings ---
  async getSettings(params = {}) {
    const res = await adminApi.get('/admin/settings', { params });
    return res.data.data;
  },
  async updateSettings(data, category) {
    const url = category ? `/admin/settings?category=${category}` : '/admin/settings';
    const res = await adminApi.put(url, data);
    return res.data.data;
  },
};
