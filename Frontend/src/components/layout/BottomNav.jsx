import { NavLink } from "react-router-dom";
import { bottomNavItems } from "../../constants/navigation";

const BottomNav = () => (
  <nav className="fixed inset-x-0 bottom-0 z-40 px-3 pb-3">
    <div className="mx-auto flex max-w-[406px] items-center justify-between rounded-[22px] border border-app-border bg-white px-3 py-2.5 shadow-[0_12px_36px_rgba(16,24,40,0.08)]">
      {bottomNavItems.map(({ label, path, icon: Icon }) => (
        <NavLink
          key={path}
          className={({ isActive }) =>
            `flex min-w-[56px] flex-col items-center gap-1 rounded-2xl px-2 py-1 text-[10px] font-medium transition ${
              isActive ? "text-[#FF5500]" : "text-app-subtle"
            }`
          }
          to={path}
        >
          <Icon size={18} strokeWidth={2.25} />
          <span>{label}</span>
        </NavLink>
      ))}
    </div>
  </nav>
);

export default BottomNav;
