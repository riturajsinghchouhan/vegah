import { BellRing, KeyRound, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { initSocket } from "../../../../services/socketService";

// Booking lifecycle events the server pushes to the user's socket room.
const BOOKING_EVENTS = [
  "BOOKING_CONFIRMED",
  "TRIP_STARTED",
  "TRIP_EXTENDED",
  "TRIP_OVERDUE",
  "RENTAL_EXPIRING_SOON",
  "RETURN_SUBMITTED",
  "RETURN_REJECTED",
  "TRIP_COMPLETED",
];

// The live rental screen already raises its own alert for these.
const HANDLED_ON_RENTAL_PAGE = ["RENTAL_EXPIRING_SOON", "TRIP_OVERDUE"];

const IN_TRIP_EVENTS = ["TRIP_STARTED", "TRIP_EXTENDED", "TRIP_OVERDUE", "RENTAL_EXPIRING_SOON", "RETURN_SUBMITTED", "RETURN_REJECTED"];

const AUTO_HIDE_MS = 8000;

/**
 * App-wide banner so the user sees every booking step (approval, EV handover
 * with its plate number, return checks...) the moment the admin acts, on
 * whichever page they are on.
 */
const BookingLiveUpdates = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const pathnameRef = useRef(pathname);
  const hideTimerRef = useRef(null);
  const [banner, setBanner] = useState(null);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    const socket = initSocket();

    const show = (next) => {
      setBanner(next);
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = setTimeout(() => setBanner(null), AUTO_HIDE_MS);
    };

    const handlers = BOOKING_EVENTS.map((event) => {
      const handler = (payload = {}) => {
        if (HANDLED_ON_RENTAL_PAGE.includes(event) && pathnameRef.current === "/user/rental/active") return;
        show({
          title: payload.title || "Booking update",
          body: payload.body || "",
          plate: event === "TRIP_STARTED" ? payload.assignedPlateNumber || null : null,
          target: IN_TRIP_EVENTS.includes(event) ? "/user/rental/active" : "/user/bookings",
        });
      };
      socket.on(event, handler);
      return [event, handler];
    });

    // Admin cancellations have no dedicated notification event.
    const handleStatusUpdated = (booking = {}) => {
      if (booking.status !== "CANCELLED_BY_ADMIN") return;
      show({
        title: "Booking cancelled",
        body: `Booking ${booking.bookingId || ""} was cancelled by the hub.${booking.cancellationReason ? ` Reason: ${booking.cancellationReason}` : ""}`,
        plate: null,
        target: "/user/bookings",
      });
    };
    socket.on("BOOKING_STATUS_UPDATED", handleStatusUpdated);

    return () => {
      handlers.forEach(([event, handler]) => socket.off(event, handler));
      socket.off("BOOKING_STATUS_UPDATED", handleStatusUpdated);
      clearTimeout(hideTimerRef.current);
    };
  }, []);

  if (!banner) return null;

  const open = () => {
    setBanner(null);
    if (pathnameRef.current !== banner.target) navigate(banner.target);
  };

  return (
    <div
      className="fixed inset-x-0 z-[100] flex justify-center px-4"
      style={{ top: "calc(env(safe-area-inset-top, 0px) + 12px)" }}
    >
      <div
        role="status"
        aria-live="polite"
        onClick={open}
        className="w-full max-w-md cursor-pointer rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_10px_30px_rgba(0,0,0,0.12)]"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#272664]/10 text-[#272664]">
            <BellRing size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-bold text-gray-900">{banner.title}</p>
            {banner.body && <p className="mt-0.5 text-[12px] leading-snug text-gray-600">{banner.body}</p>}
            {banner.plate && (
              <div className="mt-2 inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5">
                <KeyRound size={14} className="text-emerald-600" />
                <span className="text-[11px] font-semibold text-emerald-700">Your EV:</span>
                <span className="font-mono text-[14px] font-bold tracking-wide text-emerald-800">{banner.plate}</span>
              </div>
            )}
          </div>
          <button
            type="button"
            aria-label="Dismiss"
            onClick={(e) => {
              e.stopPropagation();
              setBanner(null);
            }}
            className="shrink-0 rounded-full p-1 text-gray-400 hover:bg-gray-100"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingLiveUpdates;
