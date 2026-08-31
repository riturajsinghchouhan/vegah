import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "./layouts/AdminLayout";
import AdminPlaceholderPage from "./pages/AdminPlaceholderPage";
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
        
        {/* Catch-all route for the placeholders */}
        <Route path="*" element={<AdminPlaceholderPage />} />
      </Route>
    </Routes>
  );
}

