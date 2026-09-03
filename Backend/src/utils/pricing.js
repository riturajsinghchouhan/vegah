/**
 * Utility for server-side pricing calculation
 * This mirrors the frontend pricing logic (src/utils/pricing.js)
 * It serves as the final authority on all financial calculations.
 */

const GST_RATE = 0.18; // 18% GST
const SERVICE_FEE_RATE = 0.05; // 5% Service fee

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
  discountAmount = 0
}) => {
  // Service fee is 5% of rentalBase
  const serviceFee = Math.round(rentalBase * SERVICE_FEE_RATE);
  
  // Tax is 18% on (rentalBase + serviceFee + batteryPackageFee - discountAmount)
  const taxableAmount = rentalBase + serviceFee + batteryPackagePrice - discountAmount;
  const taxAmount = Math.round(Math.max(0, taxableAmount) * GST_RATE);
  
  const totalAmount = rentalBase + serviceFee + batteryPackagePrice + taxAmount + securityDeposit - discountAmount;

  return {
    rentalBase,
    batteryPackageFee: batteryPackagePrice,
    serviceFee,
    taxAmount,
    discountAmount,
    securityDeposit,
    totalAmount,
  };
};
