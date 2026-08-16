import { BatteryCharging, Clock3, MapPin, PhoneForwarded } from "lucide-react";
import Button from "../../components/common/Button";
import MetricCard from "../../components/common/MetricCard";
import PageHeader from "../../components/layout/PageHeader";

const ActiveRentalPage = () => (
  <main className="page-padding">
    <PageHeader showBack subtitle="Live rental surface prepared for future real-time APIs" title="Active rental" />

    <section className="surface-card p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-app-subtle">Currently riding</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-app-text">Ather 450X</h2>
          <p className="mt-2 text-sm text-app-subtle">KA 03 EV 4421 • Return by 10:00 PM today</p>
        </div>
        <div className="rounded-[1.5rem] bg-app-primary px-5 py-4 text-white">
          <p className="text-sm text-emerald-100">Rental timer</p>
          <p className="mt-2 text-3xl font-semibold">02:14:12</p>
        </div>
      </div>
    </section>

    <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard caption="Remaining battery" label="Battery" value="72%" />
      <MetricCard caption="Estimated range left" label="Range" value="92 km" />
      <MetricCard caption="Support future extensions" label="Extend rental" value="Available" />
      <MetricCard caption="Only location metadata for now" label="Live tracking" value="Pending API" />
    </section>

    <section className="mt-6 grid gap-6 xl:grid-cols-2">
      <div className="surface-card p-5">
        <h3 className="text-lg font-semibold text-app-text">Trip details</h3>
        <div className="mt-4 space-y-4 text-sm text-app-subtle">
          <div className="flex items-center gap-3">
            <MapPin size={18} className="text-app-primary" />
            <span>Pickup: Koramangala EVORA Hub</span>
          </div>
          <div className="flex items-center gap-3">
            <MapPin size={18} className="text-app-primary" />
            <span>Return: HSR Layout EVORA Hub</span>
          </div>
          <div className="flex items-center gap-3">
            <BatteryCharging size={18} className="text-app-primary" />
            <span>Fast charging enabled during trip</span>
          </div>
          <div className="flex items-center gap-3">
            <Clock3 size={18} className="text-app-primary" />
            <span>Rental ends at 10:00 PM on 15 Aug 2026</span>
          </div>
        </div>
      </div>

      <div className="surface-card p-5">
        <h3 className="text-lg font-semibold text-app-text">Quick actions</h3>
        <div className="mt-4 grid gap-3">
          <Button>Extend rental</Button>
          <Button variant="secondary">Navigate to charger</Button>
          <Button variant="ghost">
            <PhoneForwarded className="mr-2" size={16} />
            Support / emergency
          </Button>
        </div>
      </div>
    </section>
  </main>
);

export default ActiveRentalPage;
