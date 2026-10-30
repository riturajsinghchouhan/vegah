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
    const items = Array.isArray(res.data.data) ? res.data.data : (res.data.data?.zones || []);
    return { items, data: items, meta: res.data.meta || { total: items.length, page: 1, limit: items.length, totalPages: 1 } };
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
    const items = Array.isArray(res.data.data) ? res.data.data : (res.data.data?.categories || []);
    return { items, data: items, meta: res.data.meta || { total: items.length, page: 1, limit: items.length, totalPages: 1 } };
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
    const res = await adminApi.get('/vehicles', { params });
    const items = Array.isArray(res.data.data) ? res.data.data : (res.data.data?.vehicles || []);
    return { items, data: items, meta: res.data.meta || { total: items.length, page: 1, limit: items.length, totalPages: 1 } };
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
    const res = await adminApi.patch(`/admin/inventory/vehicles/${id}/status`, { status });
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
    const items = Array.isArray(res.data.data) ? res.data.data : (res.data.data?.inspections || []);
    return { items, data: items, meta: res.data.meta || { total: items.length, page: 1, limit: items.length, totalPages: 1 } };
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
    const items = Array.isArray(res.data.data) ? res.data.data : (res.data.data?.users || []);
    return { items, data: items, meta: res.data.meta || { total: items.length, page: 1, limit: items.length, totalPages: 1 } };
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
  async deleteUser(id) {
    const res = await adminApi.delete(`/users/${id}`);
    return res.data;
  },

  // --- Bookings ---
  async getBookings(params = {}) {
    const res = await adminApi.get('/bookings', { params: { limit: 50, ...params } });
    const items = Array.isArray(res.data.data) ? res.data.data : (res.data.data?.bookings || []);
    return { items, bookings: items, data: items, meta: res.data.meta || { total: items.length, page: 1, limit: items.length, totalPages: 1 } };
  },
  async getBookingById(id) {
    const res = await adminApi.get(`/bookings/${id}`);
    return res.data.data;
  },
  async updateBooking(id, data) {
    const res = await adminApi.patch(`/bookings/${id}`, data);
    return res.data.data;
  },
  async updateBookingStatus(id, status) {
    const res = await adminApi.patch(`/bookings/${id}/status`, { status });
    return res.data.data;
  },
  // Step 4: customer is at the hub and has the EV in hand. Starts the trip timer.
  async confirmPickup(id, payload = {}) {
    const res = await adminApi.patch(`/bookings/${id}/confirm-pickup`, payload);
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
  // Pings the rider's app over the socket to report its current GPS position.
  // The response itself just confirms the request went out - the actual
  // coordinates arrive asynchronously over the LOCATION_UPDATED socket event.
  async requestLocation(id) {
    const res = await adminApi.post(`/bookings/${id}/request-location`);
    return res.data.data;
  },

  // --- Coupons ---
  async getCoupons(params = {}) {
    const res = await adminApi.get('/coupons/admin', { params });
    const items = Array.isArray(res.data.data) ? res.data.data : (res.data.data?.coupons || []);
    return { items, data: items, meta: res.data.meta || { total: items.length, page: 1, limit: items.length, totalPages: 1 } };
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
  async getCustomerWallets(params = {}) {
    const res = await adminApi.get('/wallet/admin/customers', { params });
    const items = Array.isArray(res.data.data) ? res.data.data : (res.data.data?.transactions || []);
    return { items, data: items, summary: res.data.data?.summary || {}, meta: res.data.meta || { total: items.length, page: 1, limit: items.length, totalPages: 1 } };
  },
  async adjustCustomerWallet(payload) {
    const res = await adminApi.post('/wallet/admin/adjust', payload);
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
  async getAdminUserWallet(userId) {
    const res = await adminApi.get(`/wallet/admin/user/${userId}`);
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
  async createInvoice(data) {
    const res = await adminApi.post('/admin/finance/tax-billing/invoices', data);
    return res.data.data;
  },
  async deleteInvoice(id) {
    const res = await adminApi.delete(`/admin/finance/tax-billing/invoices/${id}`);
    return res.data.data;
  },
  async getDeletedInvoices() {
    const res = await adminApi.get('/admin/finance/tax-billing/bin');
    return res.data.data || [];
  },
  async restoreInvoice(id) {
    const res = await adminApi.post(`/admin/finance/tax-billing/bin/${id}/restore`);
    return res.data.data;
  },
  async purgeInvoice(id) {
    const res = await adminApi.delete(`/admin/finance/tax-billing/bin/${id}`);
    return res.data.data;
  },

  // --- Accounting (expenses vs earnings) ---
  async getAccountingSummary(params = {}) {
    const res = await adminApi.get('/admin/finance/accounting/summary', { params });
    return res.data.data;
  },
  async getExpenseMeta() {
    const res = await adminApi.get('/admin/finance/expenses/meta');
    return res.data.data;
  },
  async getExpenses(params = {}) {
    const res = await adminApi.get('/admin/finance/expenses', { params });
    return { expenses: res.data.data || [], meta: res.data.meta || {} };
  },
  async createExpense(data) {
    const res = await adminApi.post('/admin/finance/expenses', data);
    return res.data.data;
  },
  async updateExpense(id, data) {
    const res = await adminApi.put(`/admin/finance/expenses/${id}`, data);
    return res.data.data;
  },
  async deleteExpense(id) {
    const res = await adminApi.delete(`/admin/finance/expenses/${id}`);
    return res.data;
  },

  // --- Ledger (double-entry: all three statements come from one ledger) ---
  async getLedgerBalanceSheet(params = {}) {
    const res = await adminApi.get('/admin/ledger/balance-sheet', { params });
    return res.data.data;
  },
  async getLedgerProfitLoss(params = {}) {
    const res = await adminApi.get('/admin/ledger/profit-loss', { params });
    return res.data.data;
  },
  async getLedgerReceiptsPayments(params = {}) {
    const res = await adminApi.get('/admin/ledger/receipts-payments', { params });
    return res.data.data;
  },
  async getLedgerTrialBalance(params = {}) {
    const res = await adminApi.get('/admin/ledger/trial-balance', { params });
    return res.data.data;
  },
  async getLedgerDailyCheck(params = {}) {
    const res = await adminApi.get('/admin/ledger/daily-check', { params });
    return res.data.data;
  },
  async getLedgerJournal(params = {}) {
    const res = await adminApi.get('/admin/ledger/journal', { params });
    return { entries: res.data.data || [], meta: res.data.meta || {} };
  },
  async getLedgerAccounts() {
    const res = await adminApi.get('/admin/ledger/accounts');
    return res.data.data;
  },
  async getLedgerPeriods() {
    const res = await adminApi.get('/admin/ledger/periods');
    return res.data.data;
  },
  async closeLedgerPeriod(periodKey) {
    const res = await adminApi.post('/admin/ledger/periods/close', { periodKey });
    return res.data.data;
  },
  async reopenLedgerPeriod(periodKey, reason) {
    const res = await adminApi.post('/admin/ledger/periods/reopen', { periodKey, reason });
    return res.data.data;
  },
  async postLedgerVoucher(payload) {
    const res = await adminApi.post('/admin/ledger/voucher', payload);
    return res.data.data;
  },
  async reverseLedgerEntry(id, reason) {
    const res = await adminApi.post(`/admin/ledger/journal/${id}/reverse`, { reason });
    return res.data.data;
  },
  async getLedgerPendingMoney() {
    const res = await adminApi.get('/admin/ledger/pending-money');
    return res.data.data;
  },
  async recordLedgerCashHandover(payload) {
    const res = await adminApi.post('/admin/ledger/cash-handover', payload);
    return res.data.data;
  },
  async recordLedgerGatewaySettlement(payload) {
    const res = await adminApi.post('/admin/ledger/gateway-settlement', payload);
    return res.data.data;
  },
  async installLedgerChart() {
    const res = await adminApi.post('/admin/ledger/install-chart');
    return res.data.data;
  },
  // Streams the report as a file the browser saves, so the CA can open it in Excel.
  async downloadLedgerCsv(report, params = {}) {
    const res = await adminApi.get(`/admin/ledger/export/${report}`, { params, responseType: 'blob' });
    const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${report}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
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
