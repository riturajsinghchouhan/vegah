import { toast } from "sonner";
import { CreditCard, Landmark, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Button from "../../../../components/common/Button";
import PriceBreakdown from "../../../../components/booking/PriceBreakdown";
import PageHeader from "../../../../components/layout/PageHeader";
import { useBooking } from "../../../../hooks/useBooking";
import { bookingService } from "../../../../services/bookingService";
import { walletService } from "../../../../services/walletService";
import { formatCurrency } from "../../../../utils/formatters";

import { useEffect, useRef, useState } from "react";

const RAZORPAY_SRC = "https://checkout.razorpay.com/v1/checkout.js";

// One shared promise for the whole app: the SDK is fetched at most once, and every
// caller after the first resolves instantly instead of injecting another <script>.
let razorpayScriptPromise = null;
const loadRazorpayScript = () => {
  if (window.Razorpay) return Promise.resolve(true);
  if (razorpayScriptPromise) return razorpayScriptPromise;

  razorpayScriptPromise = new Promise((resolve) => {
    const existing = document.querySelector(`script[src="${RAZORPAY_SRC}"]`);
    const script = existing || document.createElement("script");
    script.addEventListener("load", () => resolve(true));
    script.addEventListener("error", () => {
      razorpayScriptPromise = null; // let a retry re-attempt the download
      resolve(false);
    });
    if (!existing) {
      script.src = RAZORPAY_SRC;
      script.async = true;
      document.body.appendChild(script);
    }
  });
  return razorpayScriptPromise;
};

const paymentMethods = [
  { id: "ONLINE", title: "Pay Online", description: "UPI, Credit/Debit Cards, Net Banking", icon: Landmark },
  { id: "WALLET", title: "Vegah Wallet", description: "Instant payment using your wallet balance", icon: Wallet },
  { id: "CASH", title: "Pay with Cash", description: "Pay when you pick up the vehicle", icon: CreditCard },
];

const PaymentPage = () => {
  const navigate = useNavigate();
  const { booking, pricing, setLatestBooking, resetBooking } = useBooking();

  const [paymentMode, setPaymentMode] = useState("ONLINE");
  const [processing, setProcessing] = useState(false);
  const sdkReady = useRef(null);
  const [wallet, setWallet] = useState({ balance: 0, loading: true });

  // Warm the checkout SDK while the user is still picking a payment method. It
  // used to be fetched only after the booking POST returned, so its download sat
  // squarely on the critical path between the tap and the modal appearing.
  useEffect(() => {
    sdkReady.current = loadRazorpayScript();
  }, []);

  // The wallet option used to show no balance at all, so picking it was a coin
  // flip that usually ended in "Insufficient wallet balance" after the booking
  // had already been created.
  useEffect(() => {
    let cancelled = false;
    walletService
      .getWallet()
      .then((w) => { if (!cancelled) setWallet({ balance: w.balance, loading: false }); })
      .catch(() => { if (!cancelled) setWallet({ balance: 0, loading: false }); });
    return () => { cancelled = true; };
  }, []);

  const walletShort = Math.max(0, pricing.total - wallet.balance);
  const walletUsable = !wallet.loading && walletShort === 0;

  const handlePay = async () => {
    // Check this before creating the booking: failing afterwards left an orphan
    // RESERVED booking that quietly expired.
    if (paymentMode === "WALLET" && !walletUsable) {
      toast.error(`Wallet balance ${formatCurrency(wallet.balance)} is short by ${formatCurrency(walletShort)}. Add money or pick another method.`);
      return;
    }

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
        // Without this the booking sits in RESERVED and the server's 15-minute
        // reservation TTL silently expires it after the user sees "success".
        await bookingService.payWithCash(createdBooking.id);
        setLatestBooking(fullBookingInfo);
        resetBooking();
        navigate("/user/booking/success");
        return;
      }

      if (paymentMode === "WALLET") {
        await bookingService.payWithWallet(createdBooking.id);
        setLatestBooking(fullBookingInfo);
        resetBooking();
        navigate("/user/booking/success");
        return;
      }

      // The SDK has been downloading since this screen mounted, so this usually
      // resolves immediately; the order call runs alongside it rather than after.
      const [sdkLoaded, paymentData] = await Promise.all([
        sdkReady.current || loadRazorpayScript(),
        bookingService.initiatePayment(createdBooking.id, 'ONLINE'),
      ]);

      if (!sdkLoaded || !window.Razorpay) {
        toast.error("Could not load the payment window. Please check your connection and try again.");
        return;
      }
      
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
            resetBooking();
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
      const responseData = error.response?.data;
      let errorMessage = responseData?.message || "Failed to process payment";
      
      // If there are validation details, show what is missing/invalid
      if (responseData?.error?.details) {
        const details = Array.isArray(responseData.error.details) 
          ? responseData.error.details.map(d => d.message || d).join(', ')
          : JSON.stringify(responseData.error.details);
        errorMessage = `Validation Error: ${details}`;
      } else if (responseData?.error && typeof responseData.error === 'string') {
        errorMessage = responseData.error;
      }
      
      toast.error(errorMessage);
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
          {paymentMethods.map(({ id, title, description, icon: Icon }) => {
            const isWallet = id === "WALLET";
            const subtitle = !isWallet
              ? description
              : wallet.loading
                ? "Checking balance..."
                : walletUsable
                  ? `Balance ${formatCurrency(wallet.balance)} - enough for this booking`
                  : `Balance ${formatCurrency(wallet.balance)} - ${formatCurrency(walletShort)} short`;

            return (
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
                  <p className={`text-xs ${isWallet && !wallet.loading && !walletUsable ? "text-red-600" : "text-app-subtle"}`}>
                    {subtitle}
                  </p>
                </div>
              </div>
              <div className={`h-5 w-5 flex items-center justify-center rounded-full border-2 ${paymentMode === id ? "border-app-primary bg-app-primary" : "border-gray-300"}`}>
                {paymentMode === id && <div className="h-2 w-2 rounded-full bg-white" />}
              </div>
            </button>
            );
          })}
        </div>
      </section>

      <div className="mt-5">
        <PriceBreakdown pricing={pricing} />
      </div>

      <Button className="mt-5 w-full" onClick={handlePay} disabled={processing || (paymentMode === "WALLET" && !walletUsable)}>
        {processing
          ? "Processing..."
          : paymentMode === "WALLET" && !walletUsable
            ? wallet.loading ? "Checking wallet..." : `Add ${formatCurrency(walletShort)} to your wallet`
            : paymentMode === "ONLINE"
              ? `Pay Now ${formatCurrency(pricing.total)}`
              : "Confirm Booking"}
      </Button>
    </main>
  );
};

export default PaymentPage;
