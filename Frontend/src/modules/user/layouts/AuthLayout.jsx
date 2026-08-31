import { Outlet } from "react-router-dom";

const AuthLayout = () => (
  <main className="w-full min-h-[100dvh] bg-white">
    <Outlet />
  </main>
);

export default AuthLayout;
