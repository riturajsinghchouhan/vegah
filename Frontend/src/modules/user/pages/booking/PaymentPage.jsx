import { CreditCard, Landmark, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Button from "../../../../components/common/Button";
import PriceBreakdown from "../../../../components/booking/PriceBreakdown";
import PageHeader from "../../../../components/layout/PageHeader";
import { useBooking } from "../../../../hooks/useBooking";
import { bookingService } from "../../../../services/bookingService";
import { formatCurrency } from "../../../../utils/formatters";

const paymentMethods = [
  { title: "UPI", description: "Pay using any UPI app", icon: Wallet },
  { title: "Cards", description: "Credit / Debit Card", icon: CreditCard },
  { title: "Net Banking", description: "All major banks", icon: Landmark },
];

const PaymentPage = () => {
  const navigate = useNavigate();
  const { booking, pricing, setLatestBooking } = useBooking();

  const handlePay = async () => {
    const createdBooking = await bookingService.createBooking({
      ...booking,
      pricing,
      amount: pricing.total,
    });
    setLatestBooking(createdBooking);
    navigate("/booking/success");
  };

  return (
    <main className="page-padding">
      <PageHeader showBack subtitle="Payment" title="Payment" />

      <section className="surface-card p-4">
        <p className="text-xs text-app-subtle">Total Amount</p>
        <h2 className="mt-1 text-[30px] font-semibold text-app-text">{formatCurrency(pricing.total)}</h2>
        <div className="mt-4 flex items-center justify-between rounded-xl bg-[#f7f9f7] px-4 py-3">
          <span className="text-sm text-app-subtle">Apply Promo Code</span>
          <span className="text-xs font-semibold text-app-primary">APPLY</span>
        </div>
      </section>

      <section className="mt-5 surface-card p-4">
        <h2 className="text-base font-semibold text-app-text">Recommended</h2>
        <div className="mt-4 space-y-3">
          {paymentMethods.map(({ title, description, icon: Icon }, index) => (
            <button
              key={title}
              className="flex w-full items-center justify-between rounded-[18px] border border-app-border bg-white p-4 text-left transition hover:border-app-primary"
              type="button"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-[#eff9f1] p-3 text-app-primary">
                  <Icon size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-app-text">{title}</p>
                  <p className="text-xs text-app-subtle">{description}</p>
                </div>
              </div>
              <div className={`h-4 w-4 rounded-full border ${index === 0 ? "border-app-primary bg-[#eff9f1]" : "border-app-border bg-white"}`} />
            </button>
          ))}
        </div>
      </section>

      <div className="mt-5">
        <PriceBreakdown pricing={pricing} />
      </div>

      <Button className="mt-5 w-full" onClick={handlePay}>
        Pay Now {formatCurrency(pricing.total)}
      </Button>
    </main>
  );
};

export default PaymentPage;
