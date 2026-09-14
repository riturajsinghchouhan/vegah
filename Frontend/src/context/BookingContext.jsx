import { createContext, useEffect, useMemo, useState } from "react";
import { calculateBookingPricing } from "../utils/pricing";

const today = new Date();
const formattedToday = today.toISOString().split('T')[0];

const initialState = {
  vehicle: null,
  rentalType: "hourly",
  startDate: formattedToday,
  startTime: "10:00",
  endDate: formattedToday,
  endTime: "14:00",
  pickupLocation: "",
  aadharNumber: "",
  aadharFile: null,
  licenseNumber: "",
  licenseFile: null,
  batteryPackage: "single", // default to single charge/swap per day
  userPhotoFile: null,
};

export const BookingContext = createContext(null);

export const BookingProvider = ({ children }) => {
  const [booking, setBooking] = useState(() => {
    try {
      const draft = localStorage.getItem("vegah_draft_booking");
      return draft ? JSON.parse(draft) : initialState;
    } catch {
      return initialState;
    }
  });

  const [latestBooking, setLatestBookingState] = useState(() => {
    try {
      const saved = localStorage.getItem("vegah_latest_booking");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Effect to persist draft booking
  useEffect(() => {
    try {
      localStorage.setItem("vegah_draft_booking", JSON.stringify(booking));
    } catch (e) {
      console.error("Failed to save draft booking to localStorage (might be too large)", e);
    }
  }, [booking]);

  const setLatestBooking = (data) => {
    setLatestBookingState(data);
    try {
      if (data) {
        localStorage.setItem("vegah_latest_booking", JSON.stringify(data));
      } else {
        localStorage.removeItem("vegah_latest_booking");
      }
    } catch (e) {
      console.error("Failed to save latest booking to localStorage", e);
    }
  };

  const updateBookingField = (field, value) => {
    setBooking((current) => ({ ...current, [field]: value }));
  };

  const selectVehicle = (vehicle) => {
    const pickupLoc = vehicle?.zone?.pickupLocation?.address || vehicle?.location || "Main Station";
    setBooking((current) => ({ ...current, vehicle, pickupLocation: pickupLoc }));
  };

  const resetBooking = () => {
    setBooking(initialState);
    localStorage.removeItem("vegah_draft_booking");
  };

  const pricing = useMemo(() => calculateBookingPricing(booking), [booking]);

  const value = useMemo(
    () => ({
      booking,
      pricing,
      latestBooking,
      updateBookingField,
      selectVehicle,
      setLatestBooking,
      resetBooking,
    }),
    [booking, latestBooking, pricing]
  );

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
};
