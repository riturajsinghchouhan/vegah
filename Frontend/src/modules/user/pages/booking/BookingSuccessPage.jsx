import { CheckCircle2, Navigation } from "lucide-react";
import { Link } from "react-router-dom";
import Button from "../../../../components/common/Button";
import PageHeader from "../../../../components/layout/PageHeader";
import { formatCurrency } from "../../../../utils/formatters";
import { useBooking } from "../../../../hooks/useBooking";

const BookingSuccessPage = () => {
  const { latestBooking } = useBooking();

  return (
    <main className="page-padding">
      <PageHeader subtitle="Step 3 of 3" title="Booking confirmed" />

      <section className="surface-card mx-auto max-w-3xl p-6 text-center sm:p-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-app-success">
          <CheckCircle2 size={30} />
        </div>
        <h2 className="mt-5 text-3xl font-semibold tracking-tight text-app-text">Your EV is reserved</h2>
        <p className="mt-3 text-sm leading-7 text-app-subtle">
          Booking ID {latestBooking?.bookingId ?? "EVR-NEW"} has been created successfully. Pickup and payment details are ready in your bookings tab.
        </p>

        <div className="mt-8 grid gap-4 rounded-[1.75rem] border border-app-border bg-app-card p-5 text-left sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-app-subtle">Vehicle</p>
            <p className="mt-2 text-lg font-semibold text-app-text">{latestBooking?.vehicle?.name ?? "Selected EV"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-app-subtle">Amount</p>
            <p className="mt-2 text-lg font-semibold text-app-text">{formatCurrency(latestBooking?.amount ?? 0)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-app-subtle">Pickup</p>
            <p className="mt-2 text-sm text-app-text">{latestBooking?.pickupLocation ?? "Hub to be confirmed"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-app-subtle">Status</p>
            <p className="mt-2 text-sm font-semibold text-app-success">{latestBooking?.status ?? "Confirmed"}</p>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link to="/user/bookings">
            <Button className="w-full sm:min-w-[180px]">View bookings</Button>
          </Link>
          <Link to="/user/charging">
            <Button className="w-full sm:min-w-[180px]" variant="secondary">
              <Navigation className="mr-2" size={16} />
              Find chargers
            </Button>
          </Link>
        </div>
      </section>
    </main>
  );
};

export default BookingSuccessPage;
