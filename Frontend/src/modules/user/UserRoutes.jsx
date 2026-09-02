import { lazy } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import AppShell from "./layouts/AppShell";
import AuthLayout from "./layouts/AuthLayout";

const LoginPage = lazy(() => import("./pages/auth/LoginPage"));
const OtpPage = lazy(() => import("./pages/auth/OtpPage"));
const HomePage = lazy(() => import("./pages/home/HomePage"));
const VehiclesPage = lazy(() => import("./pages/vehicles/VehiclesPage"));
const VehicleDetailsPage = lazy(() => import("./pages/vehicles/VehicleDetailsPage"));
const BookingPage = lazy(() => import("./pages/booking/BookingPage"));
const AadharDetailsPage = lazy(() => import("./pages/booking/AadharDetailsPage"));
const LicenseDetailsPage = lazy(() => import("./pages/booking/LicenseDetailsPage"));
const BatteryPackagePage = lazy(() => import("./pages/booking/BatteryPackagePage"));
const UserPhotoPage = lazy(() => import("./pages/booking/UserPhotoPage"));
const PaymentPage = lazy(() => import("./pages/booking/PaymentPage"));
const BookingSuccessPage = lazy(() => import("./pages/booking/BookingSuccessPage"));
const BookingsPage = lazy(() => import("./pages/bookings/BookingsPage"));
const ActiveRentalPage = lazy(() => import("./pages/bookings/ActiveRentalPage"));
const ChargingPage = lazy(() => import("./pages/charging/ChargingPage"));
const StationDetailsPage = lazy(() => import("./pages/charging/StationDetailsPage"));
const ProfilePage = lazy(() => import("./pages/profile/ProfilePage"));

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, sessionReady } = useAuth();
  const location = useLocation();

  if (!sessionReady) {
    return null;
  }

  if (!isAuthenticated) {
    // Redirect to the user login page
    return <Navigate to="/user/login" replace state={{ from: location.pathname }} />;
  }

  return children;
};

const RootRedirect = () => {
  const { isAuthenticated, sessionReady } = useAuth();

  if (!sessionReady) {
    return null;
  }

  return <Navigate to={isAuthenticated ? "home" : "login"} replace />;
};

const UserRoutes = () => (
  <Routes>
    <Route path="/" element={<RootRedirect />} />

    <Route element={<AuthLayout />}>
      <Route path="login" element={<LoginPage />} />
      <Route path="otp" element={<OtpPage />} />
    </Route>

    <Route
      element={
        <ProtectedRoute>
          <AppShell />
        </ProtectedRoute>
      }
    >
      <Route path="home" element={<HomePage />} />
      <Route path="vehicles" element={<VehiclesPage />} />
      <Route path="vehicles/:vehicleId" element={<VehicleDetailsPage />} />
      <Route path="booking" element={<BookingPage />} />
      <Route path="booking/aadhar" element={<AadharDetailsPage />} />
      <Route path="booking/license" element={<LicenseDetailsPage />} />
      <Route path="booking/battery-package" element={<BatteryPackagePage />} />
      <Route path="booking/photo" element={<UserPhotoPage />} />
      <Route path="booking/payment" element={<PaymentPage />} />
      <Route path="booking/success" element={<BookingSuccessPage />} />
      <Route path="bookings" element={<BookingsPage />} />
      <Route path="rental/active" element={<ActiveRentalPage />} />
      <Route path="charging" element={<ChargingPage />} />
      <Route path="charging/:stationId" element={<StationDetailsPage />} />
      <Route path="profile" element={<ProfilePage />} />
    </Route>

    {/* Catch-all for unknown /user/* paths */}
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default UserRoutes;
