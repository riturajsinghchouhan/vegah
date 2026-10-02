import { Outlet } from "react-router-dom";
import BottomNav from "../../../components/layout/BottomNav";
import BookingLiveUpdates from "../components/booking/BookingLiveUpdates";

const AppShell = () => (
  <div className="app-shell">
    <BookingLiveUpdates />
    <Outlet />
    <BottomNav />
  </div>
);

export default AppShell;
