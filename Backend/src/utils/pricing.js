/**
 * Utility for server-side pricing calculation
 * This mirrors the frontend pricing logic (src/utils/pricing.js)
 * It serves as the final authority on all financial calculations.
 */

const DEFAULT_GST_RATE = 0.18; // 18% default fallback
const DEFAULT_SERVICE_FEE_RATE = 0.05; // 5% default fallback
const DEFAULT_PLATFORM_FEE = 20;

export const calculateRentalCost = (pricePerHour, pricePerDay, startDate, endDate, rentalType) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (start >= end) {
    throw new Error('End date must be after start date');
  }

  const durationMs = end - start;
  
  if (rentalType === 'HOURLY') {
    const hours = Math.ceil(durationMs / (1000 * 60 * 60));
    return hours * pricePerHour;
  } else if (rentalType === 'DAILY') {
    const days = Math.ceil(durationMs / (1000 * 60 * 60 * 24));
    return days * pricePerDay;
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
