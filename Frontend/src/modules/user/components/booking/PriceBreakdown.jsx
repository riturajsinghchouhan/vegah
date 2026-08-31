import { formatCurrency } from "../../utils/formatters";

const rows = (pricing) => [
  { label: `Rental (${pricing.durationLabel})`, value: pricing.rentalBase },
  { label: "Security deposit", value: pricing.securityDeposit },
  { label: "Service fee", value: pricing.serviceFee },
  { label: "Taxes", value: pricing.taxes },
];

const PriceBreakdown = ({ pricing }) => (
  <section className="surface-card p-4">
    <h3 className="text-base font-semibold text-app-text">Booking summary</h3>
    <div className="mt-4 space-y-3">
      {rows(pricing).map((row) => (
        <div key={row.label} className="flex items-center justify-between text-sm text-app-subtle">
          <span>{row.label}</span>
          <span className="font-medium text-app-text">{formatCurrency(row.value)}</span>
        </div>
      ))}
      <div className="border-t border-dashed border-app-border pt-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-app-text">Total payable</span>
          <span className="text-lg font-semibold text-app-primary">{formatCurrency(pricing.total)}</span>
        </div>
      </div>
    </div>
  </section>
);

export default PriceBreakdown;
