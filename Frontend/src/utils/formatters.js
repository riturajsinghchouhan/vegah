export const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

export const formatDistance = (distanceKm) => `${distanceKm.toFixed(1)} km`;

export const formatDateLabel = (value) => {
  if (!value) {
    return "TBD";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
};

// Rentals are sold by the week and by the month, so riders are shown whole days
// left rather than a ticking clock. Rounded up: 6d 23h left still reads "7 days".
const DAY_IN_MS = 24 * 60 * 60 * 1000;

export const daysFromMs = (ms) => Math.max(0, Math.ceil(ms / DAY_IN_MS));

export const formatDayCount = (days) => `${days} ${days === 1 ? "day" : "days"}`;

/**
 * The rider-facing state of a rental deadline: how many whole days are left, or
 * how many days it is overdue by. `hasStarted` is false until the hub hands the
 * EV over, when the deadline is still only the booked window.
 */
export const describeRentalDays = (deadline, { hasStarted = true } = {}) => {
  if (!deadline) return { days: 0, label: "—", caption: hasStarted ? "Days left" : "Plan length" };

  const diffMs = new Date(deadline).getTime() - Date.now();
  if (hasStarted && diffMs <= 0) {
    // Days left round up (6d 23h still has 7 days on it), but days overdue round
    // down, so being 3d 2h late reads "3 days", not "4".
    const days = Math.max(1, Math.floor(-diffMs / DAY_IN_MS));
    return { days, label: formatDayCount(days), caption: "Overdue by", isOverdue: true };
  }

  const days = daysFromMs(diffMs);
  return {
    days,
    label: formatDayCount(days),
    caption: hasStarted ? "Days left" : "Plan length",
    isOverdue: false,
  };
};
