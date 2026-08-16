import { Bell, CircleHelp, CreditCard, LogOut, MapPinHouse, Shield, TicketPercent } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/common/Button";
import PageHeader from "../../components/layout/PageHeader";
import { mockUser } from "../../data/user";
import { useAuth } from "../../hooks/useAuth";

const actions = [
  { label: "Payment methods", subtitle: "Cards, UPI and wallets", icon: CreditCard },
  { label: "Saved locations", subtitle: "Home, office and pickup hubs", icon: MapPinHouse },
  { label: "Notifications", subtitle: "Trip and charging alerts", icon: Bell },
  { label: "Refer & earn", subtitle: "Share and unlock credits", icon: TicketPercent },
  { label: "Help & support", subtitle: "Trip issues and assistance", icon: CircleHelp },
  { label: "Terms & privacy", subtitle: "Policies and permissions", icon: Shield },
];

const ProfilePage = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <main className="page-padding">
      <PageHeader subtitle="Manage account details and mobility preferences" title="Profile" />

      <section className="surface-card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-app-subtle">Account</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-app-text">{mockUser.fullName}</h2>
            <p className="mt-2 text-sm text-app-subtle">{mockUser.phone}</p>
            <p className="mt-1 text-sm text-app-subtle">{mockUser.email}</p>
          </div>
          <div className="rounded-[1.5rem] bg-emerald-50 px-5 py-4">
            <p className="text-sm text-app-subtle">Saved places</p>
            <p className="mt-2 text-lg font-semibold text-app-primary">{mockUser.savedLocations.length} locations</p>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4">
        {actions.map(({ label, subtitle, icon: Icon }) => (
          <button
            key={label}
            className="surface-card flex items-center justify-between p-5 text-left transition hover:border-app-primary"
            type="button"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-emerald-50 p-3 text-app-primary">
                <Icon size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-app-text">{label}</p>
                <p className="text-sm text-app-subtle">{subtitle}</p>
              </div>
            </div>
            <span className="text-sm font-medium text-app-primary">Open</span>
          </button>
        ))}
      </section>

      <div className="mt-6">
        <Button className="w-full" onClick={handleLogout} variant="secondary">
          <LogOut className="mr-2" size={16} />
          Logout
        </Button>
      </div>
    </main>
  );
};

export default ProfilePage;
