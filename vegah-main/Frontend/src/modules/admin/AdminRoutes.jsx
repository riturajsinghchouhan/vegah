import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "./layouts/AdminLayout";
import AdminPlaceholderPage from "./pages/AdminPlaceholderPage";
import AdminDashboard from "./pages/AdminDashboard";
import AdminZones from "./pages/AdminZones";
import AdminZoneForm from "./pages/AdminZoneForm";
import AdminCategories from "./pages/AdminCategories";
import AdminCategoryForm from "./pages/AdminCategoryForm";
import AdminEVs from "./pages/AdminEVs";
import AdminBookings from "./pages/AdminBookings";
import AdminBookingDetails from "./pages/AdminBookingDetails";
import AdminFleetTimeline from "./pages/AdminFleetTimeline";
import AdminInspections from "./pages/AdminInspections";
import AdminInspectionDetails from "./pages/AdminInspectionDetails";
import AdminCustomers from "./pages/AdminCustomers";
import AdminCustomerDetails from "./pages/AdminCustomerDetails";
import AdminReports from "./pages/AdminReports";
import AdminWallet from "./pages/AdminWallet";
import AdminCoupons from "./pages/AdminCoupons";
import AdminFinance from "./pages/AdminFinance";
import AdminSettlements from "./pages/AdminSettlements";
import AdminTaxBilling from "./pages/AdminTaxBilling";
import AdminSettings from "./pages/AdminSettings";
import AdminLogin from "./pages/AdminLogin";
import AdminProtectedRoute from "./components/AdminProtectedRoute";

export default function AdminRoutes() {
  return (
    <Routes>
      {/* Login route (no sidebar) */}
      <Route path="login" element={<AdminLogin />} />

      {/* Authenticated routes (with sidebar) */}
      <Route element={<AdminProtectedRoute><AdminLayout /></AdminProtectedRoute>}>
        {/* Redirect root admin to dashboard */}
        <Route path="/" element={<Navigate to="dashboard" replace />} />
        
        {/* Actual Dashboard route */}
        <Route path="dashboard" element={<AdminDashboard />} />

        {/* Zones route */}
        <Route path="zones" element={<AdminZones />} />
        <Route path="zones/new" element={<AdminZoneForm />} />
        <Route path="zones/:id" element={<AdminZoneForm />} />

        {/* Categories route */}
        <Route path="categories" element={<AdminCategories />} />
        <Route path="categories/new" element={<AdminCategoryForm />} />
        <Route path="categories/:id" element={<AdminCategoryForm />} />

        {/* EV Management route */}
        <Route path="evs" element={<AdminEVs />} />

        {/* Bookings route */}
        <Route path="bookings" element={<AdminBookings />} />
        <Route path="bookings/:id" element={<AdminBookingDetails />} />
        
        {/* Fleet Timeline route */}
        <Route path="fleet-timeline" element={<AdminFleetTimeline />} />

        {/* Inspections route */}
        <Route path="inspections" element={<AdminInspections />} />
        <Route path="inspections/:id" element={<AdminInspectionDetails />} />

        {/* Customers route */}
        <Route path="customers" element={<AdminCustomers />} />
        <Route path="customers/:id" element={<AdminCustomerDetails />} />

        {/* Reports route */}
        <Route path="reports" element={<AdminReports />} />

        {/* Wallet route */}
        <Route path="wallet" element={<AdminWallet />} />

        {/* New feature routes */}
        <Route path="coupons" element={<AdminCoupons />} />
        <Route path="finance" element={<AdminFinance />} />
        <Route path="settlements" element={<AdminSettlements />} />
        <Route path="tax-billing" element={<AdminTaxBilling />} />
        <Route path="settings" element={<AdminSettings />} />

        {/* Catch-all route for the placeholders */}
        <Route path="*" element={<AdminPlaceholderPage />} />
      </Route>
    </Routes>
  );
}

