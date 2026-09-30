/**
 * Utility for server-side pricing calculation
 * This mirrors the frontend pricing logic (src/utils/pricing.js)
 * It serves as the final authority on all financial calculations.
 */

const DEFAULT_GST_RATE = 0.18; // 18% default fallback
const DEFAULT_SERVICE_FEE_RATE = 0.05; // 5% default fallback
const DEFAULT_PLATFORM_FEE = 20;

/**
 * `pricePerHour` and `pricePerDay` are legacy field names. The product actually
 * sells two plans -- Monthly and Weekly -- so `pricePerHour` holds the MONTHLY
 * price and `pricePerDay` the WEEKLY one. (Confirmed by the admin EV form, which
 * labels those two inputs "Monthly Price" and "Weekly Price", and by the rental
 * type options, where value "hourly" is labelled Monthly and "daily" Weekly.)
 * calculateRentalCost below is therefore correct in billing whole months/weeks.
 *
 * Anything billed by the hour -- a rental extension, a late-return fee -- must
 * pro-rate off the plan price rather than read `pricePerHour` as a literal
 * hourly rate, or one extra hour costs a whole month.
 */
const HOURS_PER_MONTH = 30 * 24;
const HOURS_PER_WEEK = 7 * 24;

export const deriveHourlyRate = (vehicle, rentalType) => {
  const type = String(rentalType || '').toUpperCase();
  if (type === 'DAILY' || type === 'WEEKLY') {
    return (Number(vehicle?.pricePerDay) || 0) / HOURS_PER_WEEK;
  }
  return (Number(vehicle?.pricePerHour) || 0) / HOURS_PER_MONTH;
};

export const calculateRentalCost = (pricePerHour, pricePerDay, startDate, endDate, rentalType) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (start >= end) {
    throw new Error('End date must be after start date');
  }

  const durationMs = end - start;
  const DAY_IN_MS = 24 * 60 * 60 * 1000;
  const WEEK_IN_MS = 7 * DAY_IN_MS;
  const MONTH_IN_MS = 30 * DAY_IN_MS;
  
  const type = String(rentalType).toUpperCase();
  if (type === 'HOURLY' || type === 'MONTHLY') {
    // Monthly calculation (30 days per unit)
    const days = durationMs / DAY_IN_MS;
    const months = Math.max(1, Math.ceil(Math.round(days * 10) / 300) || Math.ceil(durationMs / MONTH_IN_MS) || 1);
    return months * pricePerHour;
  } else if (type === 'DAILY' || type === 'WEEKLY') {
    // Weekly calculation (7 days per unit)
    const days = durationMs / DAY_IN_MS;
    const weeks = Math.max(1, Math.ceil(Math.round(days * 10) / 70) || Math.ceil(durationMs / WEEK_IN_MS) || 1);
    return weeks * pricePerDay;
  }
  
  throw new Error('Invalid rental type');
};

export const calculateTotalAmount = ({
  rentalBase,
  batteryPackagePrice = 0,
  securityDeposit = 0,
  discountAmount = 0,
  gstRate,
  serviceChargeRate,
  platformFee,
}) => {
  const effectiveGstRate = gstRate != null ? Number(gstRate) / 100 : DEFAULT_GST_RATE;
  const effectiveServiceRate = serviceChargeRate != null ? Number(serviceChargeRate) / 100 : DEFAULT_SERVICE_FEE_RATE;
  const effectivePlatformFee = platformFee != null ? Number(platformFee) : DEFAULT_PLATFORM_FEE;

  // Service fee is X% of rentalBase
  const serviceFee = Math.round(rentalBase * effectiveServiceRate);
  
  // Tax is GST% on (rentalBase + serviceFee + platformFee + batteryPackageFee - discountAmount)
  const taxableAmount = Math.max(0, rentalBase + serviceFee + effectivePlatformFee + batteryPackagePrice - discountAmount);
  const taxAmount = Math.round(taxableAmount * effectiveGstRate);
  
  const totalAmount = rentalBase + serviceFee + effectivePlatformFee + batteryPackagePrice + taxAmount + securityDeposit - discountAmount;

  return {
    rentalBase,
    batteryPackageFee: batteryPackagePrice,
    serviceFee,
    platformFee: effectivePlatformFee,
    taxAmount,
    discountAmount,
    securityDeposit,
    totalAmount,
  };
};
