import React from "react";
import { Navigate, useLocation } from "react-router-dom";

export default function VendorProtectedRoute({ children }) {
  const location = useLocation();
  const isAuthenticated = Boolean(localStorage.getItem("vendor_token"));

  if (!isAuthenticated) {
    return <Navigate to="/vendor/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
