import { lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

// Admin and Vendor Modules
const AdminRoutes = lazy(() => import("../modules/admin/AdminRoutes"));
const VendorRoutes = lazy(() => import("../modules/vendor/VendorRoutes"));

// User Module
const UserRoutes = lazy(() => import("../modules/user/UserRoutes"));

const AppRoutes = () => (
  <Routes>
    {/* Redirect root to /user */}
    <Route path="/" element={<Navigate to="/user" replace />} />

    {/* Module Routes */}
    <Route path="/user/*" element={<UserRoutes />} />
    <Route path="/admin/*" element={<AdminRoutes />} />
    <Route path="/vendor/*" element={<VendorRoutes />} />

    {/* Fallback */}
    <Route path="*" element={<Navigate to="/user" replace />} />
  </Routes>
);

export default AppRoutes;
