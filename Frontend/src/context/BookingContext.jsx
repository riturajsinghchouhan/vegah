import { createContext, useMemo, useState } from "react";
import { calculateBookingPricing } from "../utils/pricing";

const initialState = {
  vehicle: null,
  rentalType: "hourly",
  startDate: "2026-08-15",
  startTime: "18:00",
  endDate: "2026-08-15",
  endTime: "22:00",
  pickupLocation: "HSR Layout Hub",
};

export const BookingContext = createContext(null);

export const BookingProvider = ({ children }) => {
  const [booking, setBooking] = useState(initialState);
  const [latestBooking, setLatestBooking] = useState(null);

  const updateBookingField = (field, value) => {
    setBooking((current) => ({ ...current, [field]: value }));
  };

  const selectVehicle = (vehicle) => {
    setBooking((current) => ({ ...current, vehicle }));
  };

  const resetBooking = () => {
    setBooking(initialState);
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
