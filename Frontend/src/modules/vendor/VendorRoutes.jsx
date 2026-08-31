import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import VendorLayout from "./layouts/VendorLayout";
import VendorPlaceholderPage from "./pages/VendorPlaceholderPage";
import VendorLogin from "./pages/VendorLogin";
import VendorProtectedRoute from "./components/VendorProtectedRoute";

export default function VendorRoutes() {
  return (
    <Routes>
      {/* Login route (no sidebar) */}
      <Route path="login" element={<VendorLogin />} />

      {/* Authenticated routes (with sidebar) */}
      <Route element={<VendorProtectedRoute><VendorLayout /></VendorProtectedRoute>}>
        {/* Redirect root vendor to dashboard */}
        <Route path="/" element={<Navigate to="dashboard" replace />} />
        
        {/* Catch-all route for the placeholders */}
        <Route path="*" element={<VendorPlaceholderPage />} />
      </Route>
    </Routes>
  );
}

