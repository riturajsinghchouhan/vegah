import { Clock3, Navigation, Star, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Button from "../../../../components/common/Button";
import PageHeader from "../../../../components/layout/PageHeader";
import { chargingService } from "../../../../services/chargingService";

const StationDetailsPage = () => {
  const { stationId } = useParams();
  const [station, setStation] = useState(null);

  useEffect(() => {
    chargingService.getStationById(stationId).then(setStation);
  }, [stationId]);

  if (!station) {
    return null;
  }

  const connectorTypes = station.connectorTypes ?? [station.connector].filter(Boolean);
  const chargers = station.chargers ?? [];
  const supportedVehicles = station.supportedVehicles ?? ["All electric scoots"];
  const paymentMethods = station.paymentMethods ?? ["UPI"];

  return (
    <main className="page-padding">
      <PageHeader showBack subtitle="Station details and battery availability" title={station.name} showBell={false} />

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <section className="surface-card overflow-hidden p-4">
            <div className="rounded-[1.75rem] bg-[#0B1320] p-4">
              <img alt={station.name} className="h-72 w-full object-contain sm:h-96" src={station.image} />
            </div>
          </section>

          <section className="surface-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-app-subtle">Battery swapping hub</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-app-text">{station.name}</h2>
                <p className="mt-2 text-sm text-app-subtle">{station.address}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <div className="rounded-[1.5rem] bg-orange-50 px-4 py-3">
                  <p className="text-sm text-orange-600 font-medium">Price</p>
                  <p className="mt-1 text-xl font-semibold text-[#FF5A1F]">
                    ₹{station.pricePerKwh?.toFixed(2) || "0.00"}<span className="text-sm font-medium text-orange-600/70">/kWh</span>
                  </p>
                </div>
                <div className="rounded-[1.5rem] bg-emerald-50 px-4 py-3">
                  <p className="text-sm text-emerald-700 font-medium">{station.openStatus}</p>
                  <p className="mt-1 text-xl font-semibold text-emerald-600">{station.availableChargers}/{station.totalChargers} open</p>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-3 text-sm text-app-subtle sm:grid-cols-3">
              <div className="rounded-3xl border border-app-border bg-app-card p-4">
                <Star size={18} className="text-amber-500" />
                <p className="mt-3 text-sm font-medium text-app-text">{station.rating} rating</p>
                <p className="mt-1">{station.distanceKm} km away</p>
              </div>
              <div className="rounded-3xl border border-app-border bg-app-card p-4">
                <Clock3 size={18} className="text-app-primary" />
                <p className="mt-3 text-sm font-medium text-app-text">{station.driveMinutes} min drive</p>
                <p className="mt-1">Route-ready travel estimate</p>
              </div>
              <div className="rounded-3xl border border-app-border bg-app-card p-4">
                <Zap size={18} className="text-app-primary" />
                <p className="mt-3 text-sm font-medium text-app-text">{station.speedLabel}</p>
                <p className="mt-1">Connector types: {connectorTypes.join(", ")}</p>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="surface-card p-5">
            <h3 className="text-lg font-semibold text-app-text">Battery status</h3>
            <div className="mt-4 space-y-3">
              {chargers.map((charger) => (
                <div key={charger.name + charger.connector} className="rounded-3xl border border-app-border bg-app-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-app-text">{charger.name}</p>
                      <p className="mt-1 text-sm text-app-subtle">
                        {charger.speed} • {charger.connector}
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-app-primary">{charger.status}</span>
                  </div>
                  <p className="mt-3 text-sm text-app-subtle">Rs {charger.price}/kWh</p>
                </div>
              ))}
            </div>
          </section>

          <section className="surface-card p-5">
            <h3 className="text-lg font-semibold text-app-text">Station info</h3>
            <div className="mt-4 space-y-3 text-sm text-app-subtle">
              <p>Amenities: {station.amenities.join(", ")}</p>
              <p>Supported vehicles: {supportedVehicles.join(", ")}</p>
              <p>Payment methods: {paymentMethods.join(", ")}</p>
              <p>Pricing starts at Rs {station.pricePerKwh}/kWh</p>
            </div>

            <div className="mt-5 grid gap-3">
              <Button>
                <Navigation className="mr-2" size={16} />
                Navigate
              </Button>
              <Button variant="secondary">Start swapping</Button>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
};

export default StationDetailsPage;
