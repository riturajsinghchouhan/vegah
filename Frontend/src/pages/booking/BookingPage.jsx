import { CalendarDays, Clock3, MapPin } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import BookingSummaryCard from "../../components/booking/BookingSummaryCard";
import PriceBreakdown from "../../components/booking/PriceBreakdown";
import PageHeader from "../../components/layout/PageHeader";
import { rentalTypes } from "../../constants/options";
import { useBooking } from "../../hooks/useBooking";

const BookingPage = () => {
  const navigate = useNavigate();
  const { booking, pricing, updateBookingField } = useBooking();

  if (!booking.vehicle) {
    return <Navigate to="/vehicles" replace />;
  }

  const steps = [1, 2, 3, 4, 5];

  return (
    <main className="page-padding">
      <PageHeader showBack subtitle="Book vehicle" title={`Book ${booking.vehicle.name}`} />

      <div className="mb-5 flex items-center justify-between">
        {steps.map((step) => (
          <div
            key={step}
            className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold ${
              step === 1 ? "bg-app-primary text-white" : "bg-[#f1f4f1] text-app-subtle"
            }`}
          >
            {step}
          </div>
        ))}
      </div>

      <div className="space-y-5">
        <BookingSummaryCard booking={booking} pricing={pricing} />

        <section className="surface-card p-4">
          <h2 className="text-base font-semibold text-app-text">Step 1 of 5</h2>
          <p className="mt-1 text-sm text-app-subtle">Select rental type</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {rentalTypes.map((type) => (
              <button
                key={type.value}
                className={`rounded-[18px] border p-4 text-left transition ${
                  booking.rentalType === type.value ? "border-app-primary bg-[#eff9f1]" : "border-app-border bg-white"
                }`}
                onClick={() => updateBookingField("rentalType", type.value)}
                type="button"
              >
                <p className="text-sm font-semibold text-app-text">{type.label}</p>
                <p className="mt-1 text-xs text-app-subtle">
                  {type.value === "hourly" ? "Best for short city trips" : "Best for full-day flexibility"}
                </p>
              </button>
            ))}
          </div>
        </section>

        <section className="surface-card p-4">
          <h2 className="text-base font-semibold text-app-text">Schedule details</h2>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <Input
              label="Start date"
              onChange={(event) => updateBookingField("startDate", event.target.value)}
              type="date"
              value={booking.startDate}
            />
            <Input
              label="Start time"
              onChange={(event) => updateBookingField("startTime", event.target.value)}
              type="time"
              value={booking.startTime}
            />
            <Input
              label="End date"
              onChange={(event) => updateBookingField("endDate", event.target.value)}
              type="date"
              value={booking.endDate}
            />
            <Input
              label="End time"
              onChange={(event) => updateBookingField("endTime", event.target.value)}
              type="time"
              value={booking.endTime}
            />
          </div>

          <div className="mt-5 grid gap-3">
            <div className="rounded-[18px] border border-app-border bg-app-card p-4">
              <CalendarDays size={18} className="text-app-primary" />
              <p className="mt-3 text-sm font-medium text-app-text">Flexible dates</p>
              <p className="mt-1 text-xs text-app-subtle">Structure is ready for availability APIs.</p>
            </div>
            <div className="rounded-[18px] border border-app-border bg-app-card p-4">
              <Clock3 size={18} className="text-app-primary" />
              <p className="mt-3 text-sm font-medium text-app-text">Hourly or daily</p>
              <p className="mt-1 text-xs text-app-subtle">Same state model supports both flows.</p>
            </div>
            <div className="rounded-[18px] border border-app-border bg-app-card p-4">
              <MapPin size={18} className="text-app-primary" />
              <p className="mt-3 text-sm font-medium text-app-text">Pickup location</p>
              <p className="mt-1 text-xs text-app-subtle">Backend-ready for multi-hub expansion later.</p>
            </div>
          </div>
        </section>

        <section className="surface-card p-4">
          <Input
            label="Pickup hub"
            onChange={(event) => updateBookingField("pickupLocation", event.target.value)}
            placeholder="Choose pickup location"
            value={booking.pickupLocation}
          />
        </section>

        <PriceBreakdown pricing={pricing} />
        <Button className="w-full" onClick={() => navigate("/booking/payment")}>
          Next
        </Button>
      </div>
    </main>
  );
};

export default BookingPage;
