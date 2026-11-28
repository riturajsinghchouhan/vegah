import { createContext, useEffect, useMemo, useState } from "react";
import { calculateBookingPricing } from "../utils/pricing";
import api from "../services/api";

// Calendar date in the *browser's* timezone. toISOString() would shift to UTC,
// which in IST (UTC+5:30) yields yesterday's date any time before 05:30 and gets
// the booking rejected by the server's "start date cannot be in the past" rule.
export const toLocalDateString = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

export const computeEndDate = (startDateStr, rentalType) => {
  if (!startDateStr) return "";
  const d = new Date(`${startDateStr}T00:00:00`);
  if (isNaN(d.getTime())) return "";
  const isWeekly = rentalType === "daily" || rentalType === "weekly";
  if (isWeekly) {
    d.setDate(d.getDate() + 7);
  } else {
    // Monthly (30 days)
    d.setDate(d.getDate() + 30);
  }
  return toLocalDateString(d);
};

const formattedToday = toLocalDateString(new Date());

// A draft restored from localStorage (or an app left open past midnight) can carry
// a date that is now in the past. The server rejects those, so roll them forward.
const withFreshDates = (draft) => {
  const today = toLocalDateString(new Date());
  const startDate = !draft.startDate || draft.startDate < today ? today : draft.startDate;
  const rentalType = draft.rentalType || "daily";
  let endDate = draft.endDate;
  // If endDate is missing, or in the past, or equal to startDate (old 0-day draft):
  if (!endDate || endDate <= startDate) {
    endDate = computeEndDate(startDate, rentalType);
  }
  const startTime = draft.startTime || "10:00";
  const endTime = draft.endTime || startTime;
  // Any coupon held by the draft is dropped: it may have expired or run out of
  // uses since, and the dates it was priced against have just moved. The user
  // re-applies it at checkout, which re-validates against the server.
  return { ...draft, startDate, startTime, endDate, endTime, rentalType, couponCode: "", couponDiscount: 0 };
};

const initialState = {
  vehicle: null,
  rentalType: "daily",
  startDate: formattedToday,
  startTime: "10:00",
  endDate: computeEndDate(formattedToday, "daily"),
  endTime: "10:00",
  pickupLocation: "",
  aadharNumber: "",
  aadharFile: null,
  licenseNumber: "",
  licenseFile: null,
  batteryPackage: "unlimited", // default to unlimited package
  userPhotoFile: null,
  couponCode: "",
  couponDiscount: 0,
};

export const BookingContext = createContext(null);

export const BookingProvider = ({ children }) => {
  const [taxBillingSettings, setTaxBillingSettings] = useState({
    gstRate: 18,
    platformFee: 20,
    serviceCharge: 5,
    cancellationFee: 100,
    batteryPackageSingle: 50,
    batteryPackageUnlimited: 150,
  });

  // Whether checkout and the extension sheet may offer cash at the hub. Admin >
  // Settings > Booking owns this. Default on so a failed settings fetch does not
  // silently hide a payment method -- the server refuses it anyway if it is off.
  const [codEnabled, setCodEnabled] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings/public').catch(() => api.get('/admin/settings/public'));
        const data = res?.data?.data || res?.data;
        if (data) {
          setTaxBillingSettings({
            gstRate: Number(data.gstRate ?? 18),
            platformFee: Number(data.platformFee ?? 20),
            serviceCharge: Number(data.serviceCharge ?? 5),
            cancellationFee: Number(data.cancellationFee ?? 100),
            batteryPackageSingle: Number(data.batteryPackageSingle ?? 50),
            batteryPackageUnlimited: Number(data.batteryPackageUnlimited ?? 150),
          });
          setCodEnabled(data.codEnabled !== false);
        }
      } catch (err) {
        console.warn("Could not load dynamic tax/billing settings, using defaults.", err);
      }
    };
    fetchSettings();
  }, []);

  const [booking, setBooking] = useState(() => {
    try {
      const draft = localStorage.getItem("vegah_draft_booking");
      if (draft) {
        const parsed = JSON.parse(draft);
        const now = new Date().getTime();
        // Check if draft is older than 30 minutes (30 * 60 * 1000 ms) or if it's old data without a timestamp
        if (!parsed.lastUpdated || (now - parsed.lastUpdated > 30 * 60 * 1000)) {
          localStorage.removeItem("vegah_draft_booking");
          return withFreshDates(initialState);
        }
        return withFreshDates(parsed);
      }
      return withFreshDates(initialState);
    } catch {
      return withFreshDates(initialState);
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

  // Effect to persist draft booking with timestamp
  useEffect(() => {
    try {
      const bookingToSave = { ...booking, lastUpdated: new Date().getTime() };
      localStorage.setItem("vegah_draft_booking", JSON.stringify(bookingToSave));
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
    setBooking((current) => {
      const updated = { ...current, [field]: value };
      // The discount was calculated against a particular rental and battery
      // package. Change either and the stale amount would be applied to a
      // basket the server never approved, so it is cleared and re-applied.
      if (["rentalType", "startDate", "startTime", "endDate", "endTime", "batteryPackage"].includes(field)) {
        updated.couponCode = "";
        updated.couponDiscount = 0;
      }
      if (field === "rentalType") {
        updated.endDate = computeEndDate(updated.startDate, value);
        updated.endTime = updated.startTime || "10:00";
      } else if (field === "startDate") {
        updated.endDate = computeEndDate(value, updated.rentalType);
      } else if (field === "startTime") {
        updated.endTime = value;
      }
      return updated;
    });
  };

  const selectVehicle = (vehicle) => {
    const pickupLoc = vehicle?.zone?.pickupLocation?.address || vehicle?.location || "Main Station";
    setBooking((current) => {
      const startDate = current.startDate || toLocalDateString(new Date());
      const rentalType = current.rentalType || "daily";
      const endDate = computeEndDate(startDate, rentalType);
      const startTime = current.startTime || "10:00";
      const endTime = current.endTime || startTime;
      return {
        ...current,
        vehicle,
        couponCode: "",
        couponDiscount: 0,
        pickupLocation: pickupLoc,
        startDate,
        rentalType,
        endDate,
        startTime,
        endTime,
      };
    });
  };

  const applyCoupon = (code, discountAmount) => {
    setBooking((current) => ({
      ...current,
      couponCode: (code || "").trim().toUpperCase(),
      couponDiscount: Number(discountAmount) || 0,
    }));
  };

  const removeCoupon = () => {
    setBooking((current) => ({ ...current, couponCode: "", couponDiscount: 0 }));
  };

  const resetBooking = () => {
    setBooking(withFreshDates(initialState));
    localStorage.removeItem("vegah_draft_booking");
  };

  const pricing = useMemo(
    () => calculateBookingPricing(booking, taxBillingSettings),
    [booking, taxBillingSettings]
  );

  const value = useMemo(
    () => ({
      booking,
      pricing,
      taxBillingSettings,
      codEnabled,
      latestBooking,
      updateBookingField,
      selectVehicle,
      setLatestBooking,
      applyCoupon,
      removeCoupon,
      resetBooking,
    }),
    [booking, latestBooking, pricing, taxBillingSettings, codEnabled]
  );

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
};
