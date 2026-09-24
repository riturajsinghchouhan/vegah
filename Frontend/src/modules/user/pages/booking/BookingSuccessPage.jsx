import { CheckCircle2, Navigation, Clock, Sparkles, X, MapPin } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../../../components/common/Button";
import PageHeader from "../../../../components/layout/PageHeader";
import { formatCurrency } from "../../../../utils/formatters";
import { useBooking } from "../../../../hooks/useBooking";
import { bookingService } from "../../../../services/bookingService";
import { initSocket } from "../../../../services/socketService";

const BookingSuccessPage = () => {
  const { latestBooking, setLatestBooking } = useBooking();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [confirmedAlert, setConfirmedAlert] = useState(false);
  const latestBookingRef = useRef(latestBooking);

  useEffect(() => {
    latestBookingRef.current = latestBooking;
  }, [latestBooking]);

  const playCelebrationSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.12);
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.24);
      osc.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.36);
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
    setLoading(true);
    bookingService
      .listBookings({ limit: 1 })
      .then((bookingsList) => {
        if (bookingsList && bookingsList.length > 0) {
          setLatestBooking(bookingsList[0]);
        }
      })
      .catch((err) => console.error("Failed to fetch recent booking:", err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const socket = initSocket();

    const handleStatusUpdated = (updatedBooking) => {
      const current = latestBookingRef.current;
      const targetId = updatedBooking._id || updatedBooking.id || updatedBooking.bookingId;
      const currentId = current?._id || current?.id || current?.bookingId;

      if (currentId && targetId !== currentId) return;

      setLatestBooking({ ...(current || {}), ...updatedBooking });

      if (updatedBooking.status === "CONFIRMED") {
        setConfirmedAlert(true);
        playCelebrationSound();
      }

      // The admin confirmed the physical handover - the trip is live, so move
      // the user straight onto the running-trip screen.
      if (updatedBooking.status === "ACTIVE") {
        playCelebrationSound();
        navigate("/user/rental/active");
      }
    };

    socket.on("BOOKING_STATUS_UPDATED", handleStatusUpdated);
    return () => socket.off("BOOKING_STATUS_UPDATED", handleStatusUpdated);
  }, [setLatestBooking, navigate]);

  const bookingAmount = latestBooking?.amount ?? latestBooking?.totalAmount ?? latestBooking?.pricing?.total ?? 0;
  const vehicleName = latestBooking?.vehicle?.name ?? (typeof latestBooking?.vehicle === "string" ? latestBooking?.vehicle : null) ?? "Selected EV";
  const bookingId = latestBooking?.bookingId ?? latestBooking?.id ?? "EVR-NEW";
  const pickupLoc = latestBooking?.pickupLocation ?? "Hub to be confirmed";
  const bookingStatus = (latestBooking?.status || "RESERVED").toUpperCase();
  const isApproved = bookingStatus === "CONFIRMED";
  const isRejected = bookingStatus === "CANCELLED" || bookingStatus === "REJECTED" || bookingStatus === "CANCELLED_BY_ADMIN";
  const targetId = latestBooking?._id || latestBooking?.id || latestBooking?.bookingId;

  return (
    <main className="page-padding min-h-screen flex flex-col bg-[#fcfcfc]">
      <PageHeader title={isApproved ? "Booking Approved" : isRejected ? "Booking Rejected" : "Booking Status"} />

      <div className="flex-1 flex flex-col items-center justify-center py-8">
        <section className="surface-card w-full max-w-2xl p-6 sm:p-10 text-center relative shadow-sm border border-app-border rounded-3xl bg-white">

          {confirmedAlert && !isRejected && (
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-[90%] sm:w-full bg-emerald-600 text-white px-5 py-4 rounded-2xl shadow-xl flex items-start gap-4 border-2 border-white animate-bounce-short z-10">
              <Sparkles className="h-6 w-6 text-yellow-300 shrink-0 mt-0.5" />
              <div className="text-left flex-1">
                <p className="font-extrabold text-sm tracking-wide">🎉 BOOKING APPROVED!</p>
                <p className="text-xs text-emerald-100 mt-1 leading-relaxed">
                  Booking <span className="font-mono font-bold bg-emerald-800/40 px-1.5 py-0.5 rounded">{bookingId}</span> is approved. Head to the pickup hub to collect your EV.
                </p>
              </div>
              <button onClick={() => setConfirmedAlert(false)} className="shrink-0 p-1.5 hover:bg-emerald-700 rounded-full text-emerald-100 transition-colors">
                <X size={16} />
              </button>
            </div>
          )}

          <div className={`mx-auto flex h-24 w-24 items-center justify-center rounded-full transition-all duration-500 mb-8 ${
            isApproved ? "bg-emerald-100 text-emerald-600 ring-[12px] ring-emerald-50" : isRejected ? "bg-red-100 text-red-600 ring-[12px] ring-red-50" : "bg-amber-100 text-amber-600 ring-[12px] ring-amber-50"
          }`}>
            {isApproved ? <CheckCircle2 size={48} className="animate-in zoom-in duration-500" /> : isRejected ? <X size={48} className="animate-in zoom-in duration-500" /> : <Clock size={48} className="animate-spin" style={{ animationDuration: '3s' }} />}
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-app-text mb-3">
            {isApproved ? "Ready for Pickup!" : isRejected ? "Booking Rejected" : "Waiting for Approval..."}
          </h2>

          <p className="text-sm leading-relaxed text-app-subtle max-w-md mx-auto mb-10">
            {isApproved
              ? "Your booking is approved. Navigate to the pickup hub and show your booking ID — the hub team will hand over the EV and start your trip."
              : isRejected 
              ? "Unfortunately, your booking request was rejected by the admin. Please try booking a different vehicle or contact support."
              : "Your booking is created and sent to the admin. Please wait while it's being reviewed."}
          </p>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 text-left">
            <div className="bg-[#f9fbf9] p-4 rounded-2xl border border-app-border/50">
              <p className="text-[11px] font-bold uppercase tracking-wider text-app-subtle mb-1">Vehicle</p>
              <p className="text-base font-semibold text-app-text truncate">{vehicleName}</p>
            </div>
            <div className="bg-[#f9fbf9] p-4 rounded-2xl border border-app-border/50">
              <p className="text-[11px] font-bold uppercase tracking-wider text-app-subtle mb-1">Amount</p>
              <p className="text-base font-semibold text-app-text">
                {loading ? "..." : formatCurrency(bookingAmount)}
              </p>
            </div>
            <div className="bg-[#f9fbf9] p-4 rounded-2xl border border-app-border/50 col-span-2 sm:col-span-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-app-subtle mb-1">Pickup Hub</p>
              <p className="text-sm font-medium text-app-text line-clamp-2">{pickupLoc}</p>
            </div>
            <div className="bg-[#f9fbf9] p-4 rounded-2xl border border-app-border/50 col-span-2 sm:col-span-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-app-subtle mb-1">Status</p>
              <div className="mt-1">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
                  isApproved ? "bg-emerald-100 text-emerald-700" : isRejected ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700 animate-pulse"
                }`}>
                  {isApproved ? "✓ APPROVED" : isRejected ? "✕ REJECTED" : "⏳ PENDING"}
                </span>
              </div>
            </div>
          </div>

          {isApproved && (
            <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50/60 p-4 text-left flex items-start gap-3">
              <MapPin size={18} className="mt-0.5 shrink-0 text-blue-600" />
              <p className="text-xs leading-relaxed text-blue-900">
                Your rental timer starts only when the hub team confirms the handover — not now. Take your time getting there.
              </p>
            </div>
          )}

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
            {isApproved ? (
              <>
                <Button
                  onClick={() => navigate(`/user/navigation?type=pickup&bookingId=${targetId}`, { state: { booking: latestBooking } })}
                  className="w-full flex-1 sm:flex-none flex items-center justify-center gap-2 font-bold py-3.5 shadow-md shadow-emerald-600/20"
                >
                  <Navigation size={18} />
                  Navigate to Pickup Hub
                </Button>
                <Button
                  onClick={() => navigate("/user/bookings")}
                  variant="secondary"
                  className="w-full flex-1 sm:flex-none flex items-center justify-center gap-2 py-3.5 bg-gray-900 text-white hover:bg-gray-800"
                >
                  View My Bookings
                </Button>
              </>
            ) : isRejected ? (
              <Button className="w-full py-3.5 shadow-sm" onClick={() => navigate("/user/bookings")}>
                Go Back to My Bookings
              </Button>
            ) : (
              <Button className="w-full py-3.5 shadow-sm" onClick={() => navigate("/user/bookings")}>
                View My Bookings
              </Button>
            )}
          </div>
        </section>
      </div>
    </main>
  );
};

export default BookingSuccessPage;
