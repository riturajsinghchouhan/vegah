import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  BatteryCharging,
  Clock3,
  MapPin,
  PhoneForwarded,
  Navigation,
  AlertTriangle,
  X,
  Hourglass,
  CheckCircle2,
  CalendarPlus,
  CreditCard,
  Banknote,
} from "lucide-react";
import Button from "../../../../components/common/Button";
import MetricCard from "../../../../components/common/MetricCard";
import PageHeader from "../../../../components/layout/PageHeader";
import { bookingService } from "../../../../services/bookingService";
import { initSocket } from "../../../../services/socketService";
import { formatCurrency } from "../../../../utils/formatters";
import { loadRazorpayScript } from "../../../../utils/razorpay";

const IN_TRIP_STATUSES = "ACTIVE,OVERDUE,PENDING_RETURN";

// Keep the local countdown honest against the server clock.
const RESYNC_INTERVAL_MS = 60 * 1000;

const pad = (n) => String(Math.max(0, n)).padStart(2, "0");

const splitDuration = (ms) => {
  const safe = Math.max(0, ms);
  return {
    hours: pad(Math.floor(safe / (1000 * 60 * 60))),
    minutes: pad(Math.floor((safe % (1000 * 60 * 60)) / (1000 * 60))),
    seconds: pad(Math.floor((safe % (1000 * 60)) / 1000)),
    totalSeconds: Math.floor(safe / 1000),
  };
};

const playChime = () => {
  try {
    const audio = new Audio('/sound/alert.mp3');
    audio.play().catch(e => console.warn("Audio playback prevented:", e));
  } catch (e) {
    console.warn("Audio chime error:", e);
  }
};

const ActiveRentalPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeBooking, setActiveBooking] = useState(null);
  const [live, setLive] = useState(null);
  const [loading, setLoading] = useState(true);
  const [extending, setExtending] = useState(false);
  const [showPlans, setShowPlans] = useState(false);
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [payingPlanId, setPayingPlanId] = useState(null);
  const [planError, setPlanError] = useState("");
  // "ONLINE" (Razorpay) or "CASH" (pay at the hub); chosen before the plan.
  const [paymentMode, setPaymentMode] = useState(null);
  const [extendSuccess, setExtendSuccess] = useState("");
  const [error, setError] = useState("");
  const [reminderAlert, setReminderAlert] = useState(null);
  const remindedRef = useRef(false);

  // The deadline the countdown runs against. Comes from the server and is the
  // admin-confirmed pickup time plus the booked duration, not the booked start.
  const [deadline, setDeadline] = useState(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(splitDuration(0));

  const applyLive = useCallback((liveData) => {
    if (!liveData) return;
    setLive(liveData);
    setHasStarted(Boolean(liveData.timer?.hasStarted));
    if (liveData.timer?.endsAt) {
      setDeadline(new Date(liveData.timer.endsAt));
    }
    if (liveData.timer?.isExpiringSoon && !remindedRef.current) {
      remindedRef.current = true;
      setReminderAlert({
        title: "Rental ending soon",
        body: "Your rental time is almost up. Head to the drop hub to return the EV on time.",
      });
      playChime();
    }
  }, []);

  const loadActiveBooking = useCallback(async () => {
    try {
      setError("");
      const bookings = await bookingService.listBookings({ status: IN_TRIP_STATUSES, limit: 1 });
      const current = Array.isArray(bookings) && bookings.length ? bookings[0] : null;

      if (!current) {
        setActiveBooking(null);
        setLive(null);
        return;
      }

      setActiveBooking(current);
      const liveData = await bookingService.getLiveStatus(current._id || current.id);
      applyLive(liveData);
    } catch (err) {
      console.error("Failed to load active booking:", err);
      setError("We could not load your live rental. Pull to refresh or try again shortly.");
    } finally {
      setLoading(false);
    }
  }, [applyLive]);

  useEffect(() => {
    loadActiveBooking();
    const resync = setInterval(loadActiveBooking, RESYNC_INTERVAL_MS);
    return () => clearInterval(resync);
  }, [loadActiveBooking]);

  // Live updates: the reminder job and the admin's return verification both
  // reach this screen over the socket.
  useEffect(() => {
    const socket = initSocket();

    const handleReminder = (payload) => {
      remindedRef.current = true;
      setReminderAlert({
        title: payload?.title || "Rental ending soon",
        body: payload?.body || "Your rental time is almost up. Please return the EV.",
      });
      playChime();
    };

    const handleStatusUpdated = (updated) => {
      const currentId = activeBooking?._id || activeBooking?.id;
      const targetId = updated?._id || updated?.id;
      if (currentId && targetId && String(currentId) !== String(targetId)) return;

      setActiveBooking((prev) => ({ ...(prev || {}), ...updated }));

      if (updated?.status === "COMPLETED") {
        navigate("/user/bookings");
        return;
      }
      loadActiveBooking();
    };

    // Admin location requests are answered app-wide by BookingLiveUpdates.
    socket.on("RENTAL_EXPIRING_SOON", handleReminder);
    socket.on("TRIP_OVERDUE", handleReminder);
    socket.on("BOOKING_STATUS_UPDATED", handleStatusUpdated);

    return () => {
      socket.off("RENTAL_EXPIRING_SOON", handleReminder);
      socket.off("TRIP_OVERDUE", handleReminder);
      socket.off("BOOKING_STATUS_UPDATED", handleStatusUpdated);
    };
  }, [activeBooking?._id, activeBooking?.id, loadActiveBooking, navigate]);

  // Local 1s tick between server re-syncs.
  useEffect(() => {
    if (!deadline) return undefined;

    const tick = () => setTimeLeft(splitDuration(deadline.getTime() - Date.now()));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  const openExtendPlans = async () => {
    const targetId = activeBooking?._id || activeBooking?.id;
    if (!targetId) return;

    setShowPlans(true);
    setPlanError("");
    setPaymentMode(null);
    setExtendSuccess("");
    setPlansLoading(true);
    // Warm the checkout SDK while the user reads the plans.
    loadRazorpayScript();
    try {
      const data = await bookingService.getExtensionPlans(targetId);
      setPlans(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load extension plans:", err);
      setPlanError(err?.response?.data?.message || "Could not load plans. Please try again.");
    } finally {
      setPlansLoading(false);
    }
  };

  // Home's "Extend Ride" button sends us here wanting the plans modal open
  // immediately, instead of making the rider find the button again.
  useEffect(() => {
    if (!location.state?.autoExtend || !activeBooking) return;
    openExtendPlans();
    navigate(location.pathname, { replace: true, state: {} });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBooking, location.state]);

  // A fresh deadline means a fresh reminder is due.
  const afterExtended = async (message) => {
    remindedRef.current = false;
    setReminderAlert(null);
    setShowPlans(false);
    setExtendSuccess(message);
    await loadActiveBooking();
  };

  const handleCashExtend = async (plan) => {
    const targetId = activeBooking?._id || activeBooking?.id;
    if (!targetId || payingPlanId) return;

    try {
      setPayingPlanId(plan.id);
      setPlanError("");
      setExtending(true);
      await bookingService.extendWithCash(targetId, plan.id);
      await afterExtended(
        `Rental extended with the ${plan.name}. Please pay ${formatCurrency(plan.price)} in cash at the hub.`
      );
    } catch (err) {
      console.error("Cash extension failed:", err);
      setPlanError(err?.response?.data?.message || "Could not extend the rental. Please try again.");
    } finally {
      setExtending(false);
      setPayingPlanId(null);
    }
  };

  const handleSelectPlan = async (plan) => {
    if (paymentMode === "CASH") {
      handleCashExtend(plan);
      return;
    }

    const targetId = activeBooking?._id || activeBooking?.id;
    if (!targetId || payingPlanId) return;

    try {
      setPayingPlanId(plan.id);
      setPlanError("");
      const [sdkLoaded, order] = await Promise.all([
        loadRazorpayScript(),
        bookingService.createExtensionOrder(targetId, plan.id),
      ]);

      if (!sdkLoaded || !window.Razorpay) {
        setPlanError("Could not load the payment window. Please check your connection and try again.");
        setPayingPlanId(null);
        return;
      }

      const paymentObject = new window.Razorpay({
        key: order.razorpayKeyId,
        amount: Math.round(order.amount * 100),
        currency: order.currency || "INR",
        name: "Swoop EVs",
        description: `Rental extension - ${plan.name}`,
        order_id: order.razorpayOrderId,
        handler: async (response) => {
          setExtending(true);
          try {
            await bookingService.verifyExtensionPayment(targetId, {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            await afterExtended(`Payment received. Rental extended with the ${plan.name}.`);
          } catch (err) {
            console.error("Extension payment verification failed:", err);
            setPlanError(err?.response?.data?.message || "Payment verification failed. Please contact support.");
          } finally {
            setExtending(false);
            setPayingPlanId(null);
          }
        },
        modal: { ondismiss: () => setPayingPlanId(null) },
        theme: { color: "#ea580c" },
      });
      paymentObject.on("payment.failed", () => {
        setPlanError("Payment failed! Please try again.");
        setPayingPlanId(null);
      });
      paymentObject.open();
    } catch (err) {
      console.error("Failed to start extension payment:", err);
      setPlanError(err?.response?.data?.message || "Could not start the payment. Please try again.");
      setPayingPlanId(null);
    }
  };

  const status = (activeBooking?.status || live?.status || "").toUpperCase();
  const isAwaitingReturnCheck = status === "PENDING_RETURN";
  const isOverdue = status === "OVERDUE" || Boolean(live?.timer?.isOverdue);

  const bookingRefId = activeBooking?._id || activeBooking?.id || activeBooking?.bookingId;
  const vehicleName = live?.vehicle?.name || activeBooking?.vehicle?.name || "Your EV";
  const plateNumber = live?.assignedPlateNumber || activeBooking?.assignedPlateNumber || "—";
  const pickupLoc = live?.pickupLocation || activeBooking?.pickupLocation || "Pickup hub";
  const returnLoc = live?.dropLocation || activeBooking?.vehicle?.zone?.dropLocation?.address || pickupLoc;
  const batteryLevel = live?.vehicle?.batteryLevel ?? activeBooking?.vehicle?.batteryLevel;

  const formattedReturnTime = deadline
    ? deadline.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "—";
  const formattedReturnDate = deadline
    ? deadline.toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" })
    : "—";
  const pickedUpAt = live?.actualPickupAt
    ? new Date(live.actualPickupAt).toLocaleString([], { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
    : null;

  const goToDrop = () =>
    navigate(`/user/navigation?type=drop&bookingId=${bookingRefId}`, { state: { booking: activeBooking } });

  if (loading) {
    return (
      <main className="page-padding">
        <PageHeader showBack subtitle="Live rental tracking and session status" title="Active rental" />
        <div className="py-16 text-center text-sm font-semibold text-app-subtle">Loading your live rental...</div>
      </main>
    );
  }

  if (!activeBooking) {
    return (
      <main className="page-padding">
        <PageHeader showBack subtitle="Live rental tracking and session status" title="Active rental" />
        <section className="surface-card mt-6 p-8 text-center">
          <h2 className="text-xl font-semibold text-app-text">No trip running right now</h2>
          <p className="mt-2 text-sm text-app-subtle">
            Your trip starts once the hub team confirms your pickup. Approved bookings appear under My Bookings.
          </p>
          <Button className="mt-6" onClick={() => navigate("/user/bookings")}>
            View My Bookings
          </Button>
        </section>
      </main>
    );
  }

  return (
    <main className="page-padding">
      <PageHeader showBack subtitle="Live rental tracking and session status" title="Active rental" />

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-500/15 p-4 text-sm font-semibold text-red-400">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {extendSuccess && (
        <div className="mb-4 flex items-start justify-between gap-2 rounded-2xl border border-green-200 bg-green-500/15 p-4 text-sm font-semibold text-green-400">
          <div className="flex items-start gap-2">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
            <span>{extendSuccess}</span>
          </div>
          <button onClick={() => setExtendSuccess("")} className="rounded-lg p-1 hover:bg-green-500/20" aria-label="Dismiss">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Return submitted, waiting on the hub team */}
      {isAwaitingReturnCheck && (
        <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-purple-200 bg-purple-500/15 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="shrink-0 rounded-xl bg-purple-500/20 p-2 text-purple-400">
              <Hourglass className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <p className="text-base font-black tracking-wide text-purple-400">Return submitted</p>
              <p className="mt-1 text-xs text-purple-400">
                The hub team is verifying the EV. Your rental closes as soon as they confirm it.
              </p>
            </div>
          </div>
          <Button variant="secondary" onClick={() => navigate("/user/bookings")} className="shrink-0">
            View My Bookings
          </Button>
        </div>
      )}

      {/* Rental-expiring reminder */}
      {reminderAlert && !isAwaitingReturnCheck && (
        <div className="mb-6 flex flex-col justify-between gap-4 rounded-2xl border border-amber-300 bg-gradient-to-r from-amber-500 to-orange-600 p-4 text-white shadow-xl sm:flex-row sm:items-center sm:p-5">
          <div className="flex items-start gap-3">
            <div className="shrink-0 rounded-xl bg-app-card/20 p-2">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-base font-black tracking-wide">⚠️ {reminderAlert.title}</p>
              <p className="mt-1 text-xs text-amber-100">{reminderAlert.body}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              onClick={goToDrop}
              className="flex items-center gap-1.5 bg-app-card px-4 py-2 text-xs font-black text-orange-400 shadow-md hover:bg-orange-500/15"
            >
              <Navigation size={14} />
              Navigate to Drop Now
            </Button>
            <button
              onClick={() => setReminderAlert(null)}
              className="rounded-lg p-1.5 text-white hover:bg-app-card/20"
              aria-label="Dismiss alert"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      <section className="surface-card p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-app-subtle">
              {isAwaitingReturnCheck ? "Awaiting verification" : "Currently riding"}
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-app-text">{vehicleName}</h2>
            <p className="mt-2 text-sm text-app-subtle">
              {plateNumber} • Return by {formattedReturnTime}
            </p>
            {pickedUpAt && (
              <p className="mt-1 text-xs text-app-subtle">Trip started at {pickedUpAt}</p>
            )}
          </div>

          <div className={`min-w-[180px] rounded-[1.5rem] px-5 py-4 text-[#1A2230] shadow-md ${isOverdue ? "bg-red-600" : "bg-[#D1FF42]"}`}>
            <p className="text-xs font-semibold uppercase tracking-wider text-orange-100">
              {isOverdue ? "Overdue by" : "Rental timer"}
            </p>
            <p className="mt-2 font-mono text-3xl font-bold tracking-widest">
              {timeLeft.hours}:{timeLeft.minutes}:{timeLeft.seconds}
            </p>
            {!hasStarted && (
              <p className="mt-1 text-[10px] font-semibold text-amber-200">Starts at handover</p>
            )}
            {isOverdue && (
              <p className="mt-1 text-[10px] font-semibold text-amber-200">Late fees may apply</p>
            )}
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          caption="Remaining battery"
          label="Battery"
          value={batteryLevel != null ? `${batteryLevel}%` : "—"}
        />
        <MetricCard caption="Booking reference" label="Booking ID" value={live?.bookingId || activeBooking?.bookingId || "—"} />
        <MetricCard
          caption="Weekly / monthly plans"
          label="Extend rental"
          value={isAwaitingReturnCheck ? "Unavailable" : "Available"}
        />
        <MetricCard
          caption="Security deposit"
          label="Deposit"
          value={live?.pricing?.depositStatus || activeBooking?.depositStatus || "—"}
        />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-2">
        <div className="surface-card p-5">
          <h3 className="text-lg font-semibold text-app-text">Trip details</h3>
          <div className="mt-4 space-y-4 text-sm text-app-subtle">
            <div className="flex items-center gap-3">
              <MapPin size={18} className="text-app-primary" />
              <span>Pickup: {pickupLoc}</span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin size={18} className="text-app-primary" />
              <span>Return: {returnLoc}</span>
            </div>
            <div className="flex items-center gap-3">
              <BatteryCharging size={18} className="text-app-primary" />
              <span>Fast charging enabled during trip</span>
            </div>
            <div className="flex items-center gap-3">
              <Clock3 size={18} className="text-app-primary" />
              <span>Rental ends at {formattedReturnTime} on {formattedReturnDate}</span>
            </div>
            {live?.pricing?.lateFee > 0 && (
              <div className="flex items-center gap-3 font-semibold text-red-400">
                <AlertTriangle size={18} />
                <span>Late fee so far: ₹{live.pricing.lateFee}</span>
              </div>
            )}
          </div>
        </div>

        <div className="surface-card p-5">
          <h3 className="text-lg font-semibold text-app-text">Quick actions</h3>
          <div className="mt-4 grid gap-3">
            {isAwaitingReturnCheck ? (
              <div className="flex items-center justify-center gap-2 rounded-xl border border-purple-200 bg-purple-500/15 py-3 text-sm font-bold text-purple-400">
                <CheckCircle2 size={18} />
                Drop reported — awaiting hub verification
              </div>
            ) : (
              <>
                <Button
                  className="flex items-center justify-center gap-2 bg-purple-600 py-3 font-bold text-white shadow-md hover:bg-purple-700"
                  onClick={goToDrop}
                >
                  <Navigation size={18} />
                  Navigate to Drop & Return
                </Button>
                <Button
                  className="flex items-center justify-center gap-2"
                  onClick={openExtendPlans}
                  disabled={extending}
                >
                  <CalendarPlus size={18} />
                  {extending ? "Extending..." : "Extend Rental"}
                </Button>
              </>
            )}
            <Button
              variant="secondary"
              onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(returnLoc)}`, "_blank")}
            >
              Open in External Maps
            </Button>
            <Button variant="ghost" onClick={() => { window.location.href = "tel:18001234567"; }}>
              <PhoneForwarded className="mr-2" size={16} />
              Support / emergency helpline
            </Button>
          </div>
        </div>
      </section>

      {showPlans && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
          onClick={() => !payingPlanId && setShowPlans(false)}
        >
          <div
            className="w-full max-w-md rounded-t-3xl bg-app-card p-5 shadow-2xl sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-app-text">Extend your rental</h3>
                <p className="mt-1 text-xs text-app-subtle">
                  {paymentMode
                    ? "Pick a plan. Time is added to your current return deadline."
                    : "How would you like to pay for the extension?"}
                </p>
              </div>
              <button
                onClick={() => setShowPlans(false)}
                disabled={Boolean(payingPlanId)}
                className="rounded-lg p-1.5 text-app-subtle hover:bg-app-muted disabled:opacity-50"
                aria-label="Close plans"
              >
                <X size={18} />
              </button>
            </div>

            {planError && (
              <div className="mt-4 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-500/15 p-3 text-xs font-semibold text-red-400">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                <span>{planError}</span>
              </div>
            )}

            {!paymentMode ? (
              <div className="mt-4 grid gap-3">
                <button
                  type="button"
                  onClick={() => { setPaymentMode("ONLINE"); setPlanError(""); }}
                  className="flex w-full items-center gap-3 rounded-[18px] border border-app-border bg-app-card p-4 text-left transition hover:border-app-primary/60 hover:bg-[#13301F]/40"
                >
                  <div className="rounded-xl bg-orange-500/15 p-2 text-orange-400">
                    <CreditCard size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-app-text">Pay online</p>
                    <p className="text-xs text-app-subtle">UPI, card or net banking via Razorpay</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => { setPaymentMode("CASH"); setPlanError(""); }}
                  className="flex w-full items-center gap-3 rounded-[18px] border border-app-border bg-app-card p-4 text-left transition hover:border-app-primary/60 hover:bg-[#13301F]/40"
                >
                  <div className="rounded-xl bg-green-500/15 p-2 text-green-400">
                    <Banknote size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-app-text">Cash on delivery (COD)</p>
                    <p className="text-xs text-app-subtle">Extend now, pay in cash at the hub</p>
                  </div>
                </button>
              </div>
            ) : (
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-app-muted px-3 py-2 text-xs font-semibold text-app-subtle">
                <span>
                  Paying by: <span className="text-app-text">{paymentMode === "CASH" ? "Cash on delivery" : "Online"}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setPaymentMode(null)}
                  disabled={Boolean(payingPlanId)}
                  className="text-app-primary hover:underline disabled:opacity-50"
                >
                  Change
                </button>
              </div>
              {plansLoading ? (
                <p className="py-8 text-center text-sm font-semibold text-app-subtle">Loading plans...</p>
              ) : plans.length === 0 ? (
                <p className="py-8 text-center text-sm font-semibold text-app-subtle">
                  No plans are available for this EV right now. Please contact support.
                </p>
              ) : (
                plans.map((plan) => (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => handleSelectPlan(plan)}
                    disabled={Boolean(payingPlanId)}
                    className="flex w-full items-center justify-between rounded-[18px] border border-app-border bg-app-card p-4 text-left transition hover:border-app-primary/60 hover:bg-[#13301F]/40 disabled:opacity-60"
                  >
                    <div>
                      <p className="text-sm font-semibold text-app-text">{plan.name}</p>
                      <p className="text-xs text-app-subtle">+{plan.durationDays} days added to your rental</p>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-bold text-app-text">{formatCurrency(plan.price)}</p>
                      <p className="text-[11px] font-semibold text-app-primary">
                        {payingPlanId === plan.id
                          ? (paymentMode === "CASH" ? "Extending..." : "Opening payment...")
                          : (paymentMode === "CASH" ? "Extend, pay cash" : "Pay & extend")}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
};

export default ActiveRentalPage;
