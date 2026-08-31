import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Button from "../../../../components/common/Button";
import EmptyState from "../../../../components/common/EmptyState";
import PageHeader from "../../../../components/layout/PageHeader";
import { bookingTabs } from "../../../../constants/options";
import { bookings } from "../../../../data/bookings";
import { formatCurrency } from "../../../../utils/formatters";

const BookingsPage = () => {
  const [activeTab, setActiveTab] = useState("Upcoming");

  const filteredBookings = useMemo(
    () => bookings.filter((booking) => booking.status.toLowerCase() === activeTab.toLowerCase()),
    [activeTab]
  );

  return (
    <main className="page-padding">
      <PageHeader subtitle="Track every upcoming and past reservation" title="My Bookings" />

      <div className="mb-6 flex flex-wrap gap-2">
        {bookingTabs.map((tab) => (
          <button
            key={tab}
            className={`chip ${activeTab === tab ? "chip-active" : ""}`}
            onClick={() => setActiveTab(tab)}
            type="button"
          >
            {tab}
          </button>
        ))}
      </div>

      {filteredBookings.length ? (
        <div className="space-y-4">
          {filteredBookings.map((booking) => (
            <section key={booking.id} className="surface-card p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-app-subtle">{booking.id}</p>
                  <h2 className="mt-1 text-[15px] font-semibold text-app-text">{booking.vehicleName}</h2>
                  <p className="mt-2 text-xs text-app-subtle">{booking.dateRange}</p>
                  <p className="mt-1 text-xs text-app-subtle">{booking.location}</p>
                </div>
                <div className="text-right">
                  <p className="rounded-full bg-[#eff9f1] px-3 py-1 text-[10px] font-semibold text-app-primary">{booking.status}</p>
                  <p className="mt-3 text-base font-semibold text-app-text">{formatCurrency(booking.amount)}</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <Button variant="secondary">View details</Button>
                {booking.status === "Active" ? (
                  <Link to="/rental/active">
                    <Button>Open active rental</Button>
                  </Link>
                ) : null}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <EmptyState
          actionLabel="Explore vehicles"
          description="Bookings for this tab will appear here once you reserve an EV."
          onAction={() => setActiveTab("Upcoming")}
          title="Nothing here yet"
        />
      )}
    </main>
  );
};

export default BookingsPage;
