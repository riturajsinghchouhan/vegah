import { formatCurrency, formatDateLabel } from "../../utils/formatters";

const BookingSummaryCard = ({ booking, pricing }) => (
  <section className="surface-card p-4">
    <div className="flex items-start gap-3">
      {booking.vehicle?.image ? (
        <img alt={booking.vehicle.name} className="h-20 w-24 rounded-[18px] object-cover" src={booking.vehicle.image} />
      ) : null}
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-app-subtle">{booking.vehicle?.type ?? "Vehicle"}</p>
        <h3 className="mt-1 text-[15px] font-semibold text-app-text">{booking.vehicle?.name ?? "Select a vehicle"}</h3>
        <p className="mt-1 text-xs text-app-subtle">
          {formatDateLabel(booking.startDate)} {booking.startTime}
        </p>
        <p className="text-xs text-app-subtle">
          {formatDateLabel(booking.endDate)} {booking.endTime}
        </p>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-app-subtle">Estimated total</span>
          <span className="text-lg font-semibold text-app-text">{formatCurrency(pricing.total)}</span>
        </div>
      </div>
    </div>
  </section>
);

export default BookingSummaryCard;
