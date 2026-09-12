import { useEffect, useState } from "react";
import { BatteryCharging, Clock3, MapPin, PhoneForwarded } from "lucide-react";
import Button from "../../../../components/common/Button";
import MetricCard from "../../../../components/common/MetricCard";
import PageHeader from "../../../../components/layout/PageHeader";
import { bookingService } from "../../../../services/bookingService";

const ActiveRentalPage = () => {
  const [activeBooking, setActiveBooking] = useState(null);

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

      setTimeLeft({
        hours: String(hours).padStart(2, "0"),
        minutes: String(minutes).padStart(2, "0"),
        seconds: String(seconds).padStart(2, "0"),
        totalSeconds: Math.floor(difference / 1000),
      });
    };

    calculateTimeLeft(); // initial run
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [targetTime]);

  const handleExtendRental = () => {
    // Add 1 hour to target time
    setTargetTime((prev) => new Date(prev.getTime() + 60 * 60 * 1000));
  };

  const vehicleName = activeBooking?.vehicle?.name || "Ather 450X";
  const plateNumber = activeBooking?.vehicle?.plateNumber || "KA 03 EV 4421";
  const pickupLoc = activeBooking?.pickupLocation || activeBooking?.vehicle?.location || "Koramangala EVORA Hub";
  const returnLoc = activeBooking?.returnLocation || "HSR Layout EVORA Hub";
  const formattedReturnTime = targetTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formattedReturnDate = targetTime.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <main className="page-padding">
      <PageHeader showBack subtitle="Live rental tracking and session status" title="Active rental" />

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
            <Button onClick={handleExtendRental}>
              + Extend Rental (+1 Hour)
            </Button>
            <Button variant="secondary" onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(pickupLoc)}`, '_blank')}>
              Navigate to charger / hub
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
