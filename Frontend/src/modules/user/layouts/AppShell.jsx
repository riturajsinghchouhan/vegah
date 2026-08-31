import { Outlet } from "react-router-dom";
import BottomNav from "../../../components/layout/BottomNav";

const AppShell = () => (
  <div className="app-shell">
    <Outlet />
    <BottomNav />
  </div>
);

export default AppShell;
