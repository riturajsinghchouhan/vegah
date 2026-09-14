import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  BatteryCharging, 
  Clock3, 
  MapPin, 
  PhoneForwarded, 
  Navigation, 
  AlertTriangle, 
  X, 
  CheckCircle2 
} from "lucide-react";
import Button from "../../../../components/common/Button";
import MetricCard from "../../../../components/common/MetricCard";
import PageHeader from "../../../../components/layout/PageHeader";
import { bookingService } from "../../../../services/bookingService";

const ActiveRentalPage = () => {
  const navigate = useNavigate();
  const [activeBooking, setActiveBooking] = useState(null);
  const [showAlert15Min, setShowAlert15Min] = useState(false);
  const hasAlertedRef = useRef(false);

  // Default target end time (3 hours from now if no booking is returned by API)
  const [targetTime, setTargetTime] = useState(() => {
    const defaultEnd = new Date();
    defaultEnd.setHours(defaultEnd.getHours() + 3);
    return defaultEnd;
  });

  const [timeLeft, setTimeLeft] = useState({
    hours: "02",
    minutes: "59",
    seconds: "59",
    totalSeconds: 10799,
  });

  // Fetch active booking from API
  useEffect(() => {
    let isMounted = true;
    const fetchActiveBooking = async () => {
      try {
        const bookings = await bookingService.listBookings({ status: 'ACTIVE' });
        const active = Array.isArray(bookings)
          ? bookings.find(b => b.status === 'ACTIVE' || b.status === 'CONFIRMED' || b.status === 'IN_PROGRESS') || bookings[0]
          : null;

        if (isMounted && active) {
          setActiveBooking(active);
          // Set target end time from booking endDate/endTime or fallback
          if (active.endDate) {
            const endStr = `${active.endDate}T${active.endTime || '22:00'}`;
            const parsedEnd = new Date(endStr);
            if (!isNaN(parsedEnd.getTime()) && parsedEnd.getTime() > Date.now()) {
              setTargetTime(parsedEnd);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load active booking:", err);
      }
    };

    fetchActiveBooking();
    return () => { isMounted = false; };
  }, []);

  // Ticking countdown timer interval
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const difference = targetTime.getTime() - now.getTime();

      if (difference <= 0) {
        setTimeLeft({
          hours: "00",
          minutes: "00",
          seconds: "00",
          totalSeconds: 0,
        });
        return;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      const totalSecs = Math.floor(difference / 1000);

      setTimeLeft({
        hours: String(hours).padStart(2, "0"),
        minutes: String(minutes).padStart(2, "0"),
        seconds: String(seconds).padStart(2, "0"),
        totalSeconds: totalSecs,
      });

      // ⚠️ 15-minute alert trigger (900 seconds or less)
      if (totalSecs > 0 && totalSecs <= 900 && !hasAlertedRef.current) {
        hasAlertedRef.current = true;
        setShowAlert15Min(true);
        try {
          const ctx = new (window.AudioContext || window.webkitAudioContext)();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(440, ctx.currentTime);
          osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15);
          gain.gain.setValueAtTime(0.2, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.4);
        } catch (e) {
          console.warn("Audio chime error:", e);
        }
      }
    };

    calculateTimeLeft(); // initial run
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [targetTime]);

  const handleExtendRental = () => {
    // Add 1 hour to target time and reset alert
    hasAlertedRef.current = false;
    setShowAlert15Min(false);
    setTargetTime((prev) => new Date(prev.getTime() + 60 * 60 * 1000));
  };

  const vehicleName = activeBooking?.vehicle?.name || "Ather 450X";
  const plateNumber = activeBooking?.vehicle?.plateNumber || "KA 03 EV 4421";
  const pickupLoc = activeBooking?.pickupLocation || activeBooking?.vehicle?.zone?.pickupLocation?.address || activeBooking?.vehicle?.location || "Koramangala EVORA Hub";
  const returnLoc = activeBooking?.returnLocation || activeBooking?.vehicle?.zone?.dropLocation?.address || "HSR Layout EVORA Hub";
  const formattedReturnTime = targetTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formattedReturnDate = targetTime.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <main className="page-padding">
      <PageHeader showBack subtitle="Live rental tracking and session status" title="Active rental" />

      {/* ⚠️ 15-Minute Remaining Alert Notification */}
      {showAlert15Min && (
        <div className="mb-6 bg-gradient-to-r from-amber-500 to-orange-600 text-white p-4 sm:p-5 rounded-2xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-amber-300 animate-pulse">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-white/20 shrink-0">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="font-black text-base tracking-wide flex items-center gap-2">
                ⚠️ ONLY 15 MINUTES REMAINING!
              </p>
              <p className="text-xs text-amber-100 mt-1">
                Your rental session ends soon. Please begin navigating back to the drop location to complete your return on time.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              onClick={() => navigate(`/user/navigation?type=drop&bookingId=${activeBooking?._id || activeBooking?.id || activeBooking?.bookingId}`, { state: { booking: activeBooking } })}
              className="bg-white text-orange-700 hover:bg-orange-50 font-black text-xs py-2 px-4 shadow-md flex items-center gap-1.5"
            >
              <Navigation size={14} />
              Navigate to Drop Now
            </Button>
            <button
              onClick={() => setShowAlert15Min(false)}
              className="p-1.5 hover:bg-white/20 rounded-lg text-white"
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
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-app-subtle">Currently riding</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-app-text">{vehicleName}</h2>
            <p className="mt-2 text-sm text-app-subtle">
              {plateNumber} • Return by {formattedReturnTime} today
            </p>
          </div>

          <div className="rounded-[1.5rem] bg-[#272664] px-5 py-4 text-white shadow-md min-w-[180px]">
            <p className="text-xs font-semibold uppercase tracking-wider text-orange-100">Rental timer</p>
            <p className="mt-2 text-3xl font-bold tracking-widest font-mono">
              {timeLeft.hours}:{timeLeft.minutes}:{timeLeft.seconds}
            </p>
            {timeLeft.totalSeconds <= 0 && (
              <p className="text-[10px] text-amber-200 mt-1 font-semibold">Rental Time Expired</p>
            )}
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard caption="Remaining battery" label="Battery" value="78%" />
        <MetricCard caption="Estimated range left" label="Range" value="95 km" />
        <MetricCard caption="Instant 1-hr extension" label="Extend rental" value="Available" />
        <MetricCard caption="GPS & Remote Status" label="Live tracking" value="Connected" />
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
          </div>
        </div>

        <div className="surface-card p-5">
          <h3 className="text-lg font-semibold text-app-text">Quick actions</h3>
          <div className="mt-4 grid gap-3">
            <Button 
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 flex items-center justify-center gap-2 shadow-md"
              onClick={() => navigate(`/user/navigation?type=drop&bookingId=${activeBooking?._id || activeBooking?.id || activeBooking?.bookingId}`, { state: { booking: activeBooking } })}
            >
              <Navigation size={18} />
              Navigate to Drop Location
            </Button>
            <Button onClick={handleExtendRental}>
              + Extend Rental (+1 Hour)
            </Button>
            <Button variant="secondary" onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(returnLoc)}`, '_blank')}>
              Open in External Maps
            </Button>
            <Button variant="ghost" onClick={() => window.location.href = "tel:18001234567"}>
              <PhoneForwarded className="mr-2" size={16} />
              Support / emergency helpline
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
};

export default ActiveRentalPage;
