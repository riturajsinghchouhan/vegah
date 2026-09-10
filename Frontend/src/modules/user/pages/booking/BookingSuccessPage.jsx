import { CheckCircle2, Navigation, Clock, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Button from "../../../../components/common/Button";
import PageHeader from "../../../../components/layout/PageHeader";
import { formatCurrency } from "../../../../utils/formatters";
import { useBooking } from "../../../../hooks/useBooking";
import { bookingService } from "../../../../services/bookingService";
import { initSocket } from "../../../../services/socketService";

const BookingSuccessPage = () => {
  const { latestBooking, setLatestBooking } = useBooking();
  const [loading, setLoading] = useState(false);
  const [confirmedAlert, setConfirmedAlert] = useState(false);

  const playCelebrationSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.12); // E5
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.24); // G5
      osc.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.36); // C6
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.7);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.7);
    } catch (e) {
      console.warn("Audio playback warning:", e);
    }
  };

  useEffect(() => {
    // If latestBooking is missing or missing amount/totalAmount, fetch latest booking from backend
    if (!latestBooking || (!latestBooking.amount && !latestBooking.totalAmount)) {
      setLoading(true);
      bookingService
        .listBookings({ limit: 1 })
        .then((bookings) => {
          if (bookings && bookings.length > 0) {
            const recent = bookings[0];
            setLatestBooking(recent);
          }
        })
        .catch((err) => {
          console.error("Failed to fetch recent booking:", err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, []);

  // ⚡ Real-Time Socket Listener for Admin Status Update
  useEffect(() => {
    const socket = initSocket();

    const handleStatusUpdated = (updatedBooking) => {
      console.log("⚡ [User Socket] BOOKING_STATUS_UPDATED received:", updatedBooking);

      const targetId = updatedBooking._id || updatedBooking.id || updatedBooking.bookingId;
      const currentId = latestBooking?._id || latestBooking?.id || latestBooking?.bookingId;

      if (!currentId || targetId === currentId || !latestBooking) {
        setLatestBooking((prev) => ({
          ...prev,
          ...updatedBooking,
          status: updatedBooking.status || prev?.status,
        }));

        if (updatedBooking.status === "CONFIRMED" || updatedBooking.status === "ACTIVE") {
          setConfirmedAlert(true);
          playCelebrationSound();
        }
      }
    };

    socket.on("BOOKING_STATUS_UPDATED", handleStatusUpdated);

    return () => {
      socket.off("BOOKING_STATUS_UPDATED", handleStatusUpdated);
    };
  }, [latestBooking, setLatestBooking]);

  const bookingAmount =
    latestBooking?.amount ??
    latestBooking?.totalAmount ??
    latestBooking?.pricing?.total ??
    0;

  const vehicleName =
    latestBooking?.vehicle?.name ??
    (typeof latestBooking?.vehicle === "string" ? latestBooking?.vehicle : null) ??
    "Selected EV";

  const bookingId = latestBooking?.bookingId ?? latestBooking?.id ?? "EVR-NEW";
  const pickupLoc = latestBooking?.pickupLocation ?? "Hub to be confirmed";
  const bookingStatus = (latestBooking?.status || "RESERVED").toUpperCase();

  const isConfirmed = bookingStatus === "CONFIRMED" || bookingStatus === "ACTIVE";
  const isPending = !isConfirmed && (bookingStatus === "RESERVED" || bookingStatus === "PENDING_VERIFICATION" || latestBooking?.paymentMode === "CASH");

  return (
    <main className="page-padding">
      <PageHeader subtitle="Step 3 of 3" title={isConfirmed ? "Booking Confirmed" : "Booking Processing"} />

      <section className="surface-card mx-auto max-w-3xl p-6 text-center sm:p-8 relative">
        {/* Live Admin Approval Banner */}
        {confirmedAlert && (
          <div className="mb-6 bg-emerald-600 text-white p-4 rounded-2xl shadow-xl flex items-center justify-between border border-emerald-400 animate-bounce">
            <div className="flex items-center gap-3 text-left">
              <Sparkles className="h-6 w-6 text-yellow-300 shrink-0" />
              <div>
                <p className="font-extrabold text-sm tracking-wide">🎉 BOOKING CONFIRMED BY ADMIN!</p>
                <p className="text-xs text-emerald-100 mt-0.5">
                  Your booking <span className="font-mono font-bold">{bookingId}</span> has been approved and confirmed. Your vehicle is ready!
                </p>
              </div>
            </div>
            <button
              onClick={() => setConfirmedAlert(false)}
              className="p-1 hover:bg-emerald-700 rounded-lg text-emerald-100 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>
        )}

        <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full transition-all duration-500 ${
          isConfirmed ? "bg-emerald-100 text-emerald-600 ring-8 ring-emerald-50" : "bg-amber-100 text-amber-600 ring-8 ring-amber-50 animate-pulse"
        }`}>
          {isConfirmed ? <CheckCircle2 size={42} /> : <Clock size={42} className="animate-spin" style={{ animationDuration: '4s' }} />}
        </div>

        <h2 className="mt-6 text-2xl sm:text-3xl font-bold tracking-tight text-app-text">
          {isConfirmed
            ? "🎉 Your EV is Reserved & Confirmed!"
            : "Booking is processed. Waiting for admin confirmation..."}
        </h2>

        <p className="mt-3 text-sm leading-7 text-app-subtle max-w-xl mx-auto">
          {isConfirmed
            ? `Booking ID ${bookingId} has been confirmed by Admin. Pickup and vehicle details are ready in your bookings tab.`
            : `Booking ID ${bookingId} created. You are all set! Please wait a moment while an admin reviews and confirms your booking.`}
        </p>

        <div className="mt-8 grid gap-4 rounded-[1.75rem] border border-app-border bg-app-card p-5 text-left sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-app-subtle">Vehicle</p>
            <p className="mt-2 text-lg font-semibold text-app-text">{vehicleName}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-app-subtle">Amount</p>
            <p className="mt-2 text-lg font-semibold text-app-text">
              {loading ? "Loading..." : formatCurrency(bookingAmount)}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-app-subtle">Pickup</p>
            <p className="mt-2 text-sm text-app-text">{pickupLoc}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-app-subtle">Status</p>
            <div className="mt-2 flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                isConfirmed ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700 animate-pulse"
              }`}>
                {isConfirmed ? "✓ CONFIRMED" : "⏳ WAITING ADMIN CONFIRMATION"}
              </span>
            </div>
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
