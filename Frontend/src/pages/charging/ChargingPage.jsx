import { useState } from "react";
import StationCard from "../../components/charging/StationCard";
import PageHeader from "../../components/layout/PageHeader";
import { chargingFilters } from "../../constants/options";
import { chargingStations } from "../../data/chargingStations";

const ChargingPage = () => {
  const [activeFilter, setActiveFilter] = useState("Available now");

  return (
    <main className="page-padding">
      <PageHeader showBack subtitle="Search charging stations" title="Charging Stations" />

      <section className="surface-card overflow-hidden p-4">
        <div className="h-[320px] rounded-[20px] bg-[url('https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?auto=format&fit=crop&w=1200&q=80')] bg-cover bg-center">
          <div className="flex h-full items-end rounded-[20px] bg-[linear-gradient(180deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.92)_100%)] p-4">
            <div className="rounded-[18px] bg-white/95 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-app-subtle">Navigation</p>
              <p className="mt-1 text-sm font-semibold text-app-text">Route and marker surface ready</p>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-6 flex flex-wrap gap-2">
        {chargingFilters.map((filter) => (
          <button
            key={filter}
            className={`chip ${activeFilter === filter ? "chip-active" : ""}`}
            onClick={() => setActiveFilter(filter)}
            type="button"
          >
            {filter}
          </button>
        ))}
      </div>

      <section className="mt-6 space-y-3">
        {chargingStations.map((station) => (
          <StationCard key={station.id} station={station} />
        ))}
      </section>
    </main>
  );
};

export default ChargingPage;
