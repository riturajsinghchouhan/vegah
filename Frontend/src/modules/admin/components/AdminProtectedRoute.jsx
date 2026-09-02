import React from "react";
import { Navigate, useLocation } from "react-router-dom";

export default function AdminProtectedRoute({ children }) {
  const location = useLocation();
  const isAuthenticated = Boolean(localStorage.getItem("admin_token"));

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
