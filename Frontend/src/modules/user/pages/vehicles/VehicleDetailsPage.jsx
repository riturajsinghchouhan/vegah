import { Check, MapPin, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../../../../components/common/Button";
import PriceBreakdown from "../../../../components/booking/PriceBreakdown";
import PageHeader from "../../../../components/layout/PageHeader";
import VehicleGallery from "../../../../components/vehicle/VehicleGallery";
import VehicleSpecs from "../../../../components/vehicle/VehicleSpecs";
import { vehicleService } from "../../../../services/vehicleService";
import { useBooking } from "../../../../hooks/useBooking";

const VehicleDetailsPage = () => {
  const { vehicleId } = useParams();
  const navigate = useNavigate();
  const { selectVehicle, booking } = useBooking();
  const [vehicle, setVehicle] = useState(null);

  useEffect(() => {
    vehicleService.getVehicleById(vehicleId).then(setVehicle);
  }, [vehicleId]);

  if (!vehicle) {
    return null;
  }

  const previewPricing = {
    rentalBase: vehicle.prices.hour * 4,
    durationLabel: "4 hours",
    securityDeposit: vehicle.deposit,
    serviceFee: Math.round(vehicle.prices.hour * 4 * 0.05),
    taxes: Math.round(vehicle.prices.hour * 4 * 0.18),
    total: vehicle.prices.hour * 4 + vehicle.deposit + Math.round(vehicle.prices.hour * 4 * 0.23),
  };

  const handleBookNow = () => {
    selectVehicle(vehicle);
    navigate("/booking", {
      state: {
        startDate: booking.startDate,
      },
    });
  };

  return (
    <main className="page-padding">
      <PageHeader showBack subtitle="Vehicle details and booking preview" title={vehicle.name} />

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <VehicleGallery vehicle={vehicle} />

          <section className="surface-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-app-subtle">{vehicle.type}</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-app-text">{vehicle.name}</h2>
                <p className="mt-2 flex items-center gap-2 text-sm text-app-subtle">
                  <Star size={16} className="text-amber-500" />
                  {vehicle.rating} rating from {vehicle.reviewsCount} reviews
                </p>
              </div>
              <div className="rounded-[1.5rem] bg-emerald-50 px-4 py-3 text-right">
                <p className="text-sm text-app-subtle">From</p>
                <p className="text-2xl font-semibold text-app-primary">Rs {vehicle.prices.hour}/hr</p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {vehicle.features.map((feature) => (
                <div key={feature} className="flex items-center gap-3 rounded-2xl border border-app-border bg-app-card p-3">
                  <div className="rounded-xl bg-white p-2 text-app-primary">
                    <Check size={16} />
                  </div>
                  <span className="text-sm text-app-text">{feature}</span>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-3xl border border-app-border bg-app-card p-4 text-sm text-app-subtle">
              <div className="flex items-center gap-2 text-app-text">
                <MapPin size={16} />
                Pickup location
              </div>
              <p className="mt-2">{vehicle.location}</p>
              <p className="mt-1">{vehicle.pickupNote}</p>
            </div>
          </section>

          <VehicleSpecs vehicle={vehicle} />
        </div>

        <div className="space-y-6">
          <section className="surface-card p-5">
            <h3 className="text-lg font-semibold text-app-text">Booking-ready pricing</h3>
            <p className="mt-2 text-sm leading-6 text-app-subtle">
              Final pricing will be revalidated by the backend, but the UI uses a shared calculation utility from day one.
            </p>
            <div className="mt-4 rounded-3xl border border-app-border bg-app-card p-4">
              <div className="flex items-center justify-between text-sm text-app-subtle">
                <span>Hourly price</span>
                <span className="font-medium text-app-text">Rs {vehicle.prices.hour}</span>
              </div>
              <div className="mt-3 flex items-center justify-between text-sm text-app-subtle">
                <span>Daily price</span>
                <span className="font-medium text-app-text">Rs {vehicle.prices.day}</span>
              </div>
              <div className="mt-3 flex items-center justify-between text-sm text-app-subtle">
                <span>Security deposit</span>
                <span className="font-medium text-app-text">Rs {vehicle.deposit}</span>
              </div>
            </div>
            <Button className="mt-5 w-full" onClick={handleBookNow}>
              Book now
            </Button>
          </section>

          <PriceBreakdown pricing={previewPricing} />
        </div>
      </div>
    </main>
  );
};

export default VehicleDetailsPage;
