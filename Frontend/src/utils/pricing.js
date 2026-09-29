const HOUR_IN_MS = 60 * 60 * 1000;
const DAY_IN_MS = 24 * HOUR_IN_MS;
const WEEK_IN_MS = 7 * DAY_IN_MS;
const MONTH_IN_MS = 30 * DAY_IN_MS;

const parseDateTime = (date, time) => {
  if (!date || !time) {
    return null;
  }

  return new Date(`${date}T${time}:00`);
};

export const calculateBookingPricing = (
  { vehicle, rentalType, startDate, startTime, endDate, endTime, batteryPackage },
  settings = {}
) => {
  const gstRate = Number(settings?.gstRate ?? 18);
  const serviceChargeRate = Number(settings?.serviceCharge ?? 5);
  const platformFee = Number(settings?.platformFee ?? 20);

  if (!vehicle) {
    return {
      rentalBase: 0,
      durationLabel: "0w",
      securityDeposit: 0,
      serviceFee: 0,
      platformFee: 0,
      batteryPackageFee: 0,
      taxes: 0,
      gstRate,
      serviceChargeRate,
      total: 0,
    };
  }

  const start = parseDateTime(startDate, startTime);
  const end = parseDateTime(endDate, endTime);
  const durationMs = start && end ? Math.max(end.getTime() - start.getTime(), 0) : 0;
  
  const isWeekly = rentalType === "daily" || rentalType === "weekly";

  let units = 1;
  let basePrice = 0;
  let durationLabel = "";

  if (isWeekly) {
    // Weekly calculation (7 days per unit)
    const days = durationMs / DAY_IN_MS;
    units = Math.max(1, Math.ceil(Math.round(days * 10) / 70) || Math.ceil(durationMs / WEEK_IN_MS) || 1);
    basePrice = Number(vehicle.prices?.day ?? vehicle.pricePerDay ?? 0);
    durationLabel = `${units} week${units > 1 ? "s" : ""}`;
  } else {
    // Monthly calculation (30 days per unit)
    const days = durationMs / DAY_IN_MS;
    units = Math.max(1, Math.ceil(Math.round(days * 10) / 300) || Math.ceil(durationMs / MONTH_IN_MS) || 1);
    basePrice = Number(vehicle.prices?.hour ?? vehicle.pricePerHour ?? 0);
    durationLabel = `${units} month${units > 1 ? "s" : ""}`;
  }

  const rentalBase = basePrice * units;
  
  let batteryPackageFee = 0;
  if (batteryPackage === "single") {
    batteryPackageFee = 50;
  } else if (batteryPackage === "unlimited") {
    batteryPackageFee = 150;
  }

  // Dynamic Service Fee based on % from Admin Tax & Billing
  const serviceFee = Math.round(rentalBase * (serviceChargeRate / 100));

  // Dynamic Taxes based on % from Admin Tax & Billing
  const taxable = Math.max(0, rentalBase + serviceFee + platformFee + batteryPackageFee);
  const taxes = Math.round(taxable * (gstRate / 100));

  const total = rentalBase + vehicle.deposit + serviceFee + platformFee + batteryPackageFee + taxes;

  return {
    rentalBase,
    durationLabel,
    securityDeposit: vehicle.deposit,
    serviceFee,
    platformFee,
    batteryPackageFee,
    taxes,
    gstRate,
    serviceChargeRate,
    total,
  };
};
