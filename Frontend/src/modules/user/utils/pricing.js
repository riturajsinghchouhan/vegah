const HOUR_IN_MS = 60 * 60 * 1000;
const DAY_IN_MS = 24 * HOUR_IN_MS;

const parseDateTime = (date, time) => {
  if (!date || !time) {
    return null;
  }

  return new Date(`${date}T${time}:00`);
};

export const calculateBookingPricing = (
  { vehicle, rentalType, startDate, startTime, endDate, endTime },
  settings = {}
) => {
  const gstRate = Number(settings?.gstRate ?? 18);
  const serviceChargeRate = Number(settings?.serviceCharge ?? 5);
  const platformFee = Number(settings?.platformFee ?? 20);

  if (!vehicle) {
    return {
      rentalBase: 0,
      durationLabel: "0h",
      securityDeposit: 0,
      serviceFee: 0,
      platformFee: 0,
      taxes: 0,
      gstRate,
      serviceChargeRate,
      total: 0,
    };
  }

  const start = parseDateTime(startDate, startTime);
  const end = parseDateTime(endDate, endTime);
  const durationMs = start && end ? Math.max(end.getTime() - start.getTime(), 0) : 0;
  const unitMs = rentalType === "daily" ? DAY_IN_MS : HOUR_IN_MS;
  const units = Math.max(1, Math.ceil(durationMs / unitMs) || 1);
  const basePrice = rentalType === "daily" ? vehicle.prices.day : vehicle.prices.hour;
  const rentalBase = basePrice * units;
  const serviceFee = Math.round(rentalBase * (serviceChargeRate / 100));
  const taxable = Math.max(0, rentalBase + serviceFee + platformFee);
  const taxes = Math.round(taxable * (gstRate / 100));
  const total = rentalBase + vehicle.deposit + serviceFee + platformFee + taxes;
  const durationLabel = rentalType === "daily" ? `${units} day${units > 1 ? "s" : ""}` : `${units} hour${units > 1 ? "s" : ""}`;

  return {
    rentalBase,
    durationLabel,
    securityDeposit: vehicle.deposit,
    serviceFee,
    platformFee,
    taxes,
    gstRate,
    serviceChargeRate,
    total,
  };
};
