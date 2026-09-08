import { BatteryCharging, CarFront, Clock3, Gauge, MapPin } from "lucide-react";

const specs = (vehicle) => [
  { icon: Gauge, label: "Range", value: vehicle.rangeKm ? `${vehicle.rangeKm} km` : 'N/A' },
  { icon: BatteryCharging, label: "Battery", value: vehicle.battery ? `${vehicle.battery}` : 'N/A' },
  { icon: Clock3, label: "Charge time", value: vehicle.chargeTime || 'N/A' },
  { icon: CarFront, label: "Seats", value: vehicle.seats ? `${vehicle.seats} seats` : '2 seats' },
  { icon: MapPin, label: "Pickup", value: vehicle.location || 'N/A' },
];

const VehicleSpecs = ({ vehicle }) => (
  <section className="surface-card p-5">
    <h2 className="text-lg font-semibold text-app-text">Vehicle essentials</h2>
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      {specs(vehicle).map(({ icon: Icon, label, value }) => (
        <div key={label} className="rounded-3xl border border-app-border bg-app-card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-50 p-2 text-app-primary">
              <Icon size={16} />
            </div>
            <div>
              <p className="text-sm font-medium text-app-text">{label}</p>
              <p className="text-sm text-app-subtle">{value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  </section>
);

export default VehicleSpecs;
