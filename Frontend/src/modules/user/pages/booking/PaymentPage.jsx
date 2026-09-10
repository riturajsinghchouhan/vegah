import { CreditCard, Landmark, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Button from "../../../../components/common/Button";
import PriceBreakdown from "../../../../components/booking/PriceBreakdown";
import PageHeader from "../../../../components/layout/PageHeader";
import { useBooking } from "../../../../hooks/useBooking";
import { bookingService } from "../../../../services/bookingService";
import { formatCurrency } from "../../../../utils/formatters";

import { useState } from "react";

const paymentMethods = [
  { id: "ONLINE", title: "Pay Online", description: "UPI, Credit/Debit Cards, Net Banking", icon: Landmark },
  { id: "CASH", title: "Pay with Cash", description: "Pay when you pick up the vehicle", icon: Wallet },
];

const PaymentPage = () => {
  const navigate = useNavigate();
  const { booking, pricing, setLatestBooking } = useBooking();

  const [paymentMode, setPaymentMode] = useState("ONLINE");
  const [processing, setProcessing] = useState(false);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePay = async () => {
    try {
      setProcessing(true);
      const createdBooking = await bookingService.createBooking({
        ...booking,
        pricing,
        amount: pricing.total,
        paymentMethod: paymentMode,
      });

      const fullBookingInfo = {
        ...createdBooking,
        vehicle: booking.vehicle || createdBooking.vehicle,
        amount: createdBooking.totalAmount ?? createdBooking.amount ?? pricing.total,
        totalAmount: createdBooking.totalAmount ?? createdBooking.amount ?? pricing.total,
        paymentMode: paymentMode,
      };

      if (paymentMode === "CASH") {
        setLatestBooking(fullBookingInfo);
        navigate("/user/booking/success");
        return;
      }

      const res = await loadRazorpayScript();
      if (!res) {
        alert("Razorpay SDK failed to load. Are you online?");
        setProcessing(false);
        return;
      }

      const paymentData = await bookingService.initiatePayment(createdBooking.id, 'ONLINE');
      
      const options = {
        key: paymentData.razorpayKeyId || "rzp_test_dummy",
        amount: paymentData.amount * 100,
        currency: paymentData.currency || "INR",
        name: "Vegah EVs",
        description: "Booking Payment",
        order_id: paymentData.razorpayOrderId,
        handler: async function (response) {
          try {
            await bookingService.verifyPayment({
              bookingId: createdBooking.id,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              method: 'ONLINE'
            });
            setLatestBooking(fullBookingInfo);
            navigate("/user/booking/success");
          } catch (err) {
            alert("Payment verification failed. Please contact support.");
          }
        },
        theme: { color: "#ea580c" },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.on('payment.failed', function (response) {
        alert("Payment failed! Please try again.");
      });
      paymentObject.open();

    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Failed to process payment");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <main className="page-padding">
      <PageHeader showBack subtitle="Step 6 of 6" title="Payment" />

      <div className="mb-6 flex w-full items-center justify-center">
        {[1, 2, 3, 4, 5, 6].map((step, index, arr) => (
          <div key={step} className="flex items-center">
            <div
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${
                step === 6 ? "bg-app-primary text-white" : step < 6 ? "bg-app-primary/20 text-app-primary" : "bg-[#f1f4f1] text-app-subtle"
              }`}
            >
              {step}
            </div>
            {index < arr.length - 1 && (
              <div className={`h-[2px] w-6 sm:w-8 mx-1 ${step < 6 ? "bg-app-primary/20" : "bg-[#f1f4f1]"}`} />
            )}
          </div>
        ))}
      </div>

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
          {paymentMethods.map(({ id, title, description, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setPaymentMode(id)}
              className={`flex w-full items-center justify-between rounded-[18px] border p-4 text-left transition ${
                paymentMode === id ? "border-app-primary bg-[#eff9f1]/30" : "border-app-border bg-white hover:border-app-primary/50"
              }`}
              type="button"
            >
              <div className="flex items-center gap-3">
                <div className={`rounded-2xl p-3 ${paymentMode === id ? "bg-app-primary text-white" : "bg-[#eff9f1] text-app-primary"}`}>
                  <Icon size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-app-text">{title}</p>
                  <p className="text-xs text-app-subtle">{description}</p>
                </div>
              </div>
              <div className={`h-5 w-5 flex items-center justify-center rounded-full border-2 ${paymentMode === id ? "border-app-primary bg-app-primary" : "border-gray-300"}`}>
                {paymentMode === id && <div className="h-2 w-2 rounded-full bg-white" />}
              </div>
            </button>
          ))}
        </div>
      </section>

      <div className="mt-5">
        <PriceBreakdown pricing={pricing} />
      </div>

      <Button className="mt-5 w-full" onClick={handlePay} disabled={processing}>
        {processing ? "Processing..." : paymentMode === "ONLINE" ? `Pay Now ${formatCurrency(pricing.total)}` : "Confirm Booking"}
      </Button>
    </main>
  );
};

export default PaymentPage;
