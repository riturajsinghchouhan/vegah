import { createContext, useMemo, useState } from "react";
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
  pickupLocation: "HSR Layout Hub",
  aadharNumber: "",
  aadharFile: null,
  licenseNumber: "",
  licenseFile: null,
  batteryPackage: "single", // default to single charge/swap per day
  userPhotoFile: null,
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
