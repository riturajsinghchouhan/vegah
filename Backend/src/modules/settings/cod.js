import { BadRequestError } from '../../utils/errors.js';
import * as settingsService from './settings.service.js';

/**
 * The COD kill switch.
 *
 * Admin > Settings > Booking carries a single `codEnabled` flag. Turning it off
 * stops riders choosing "pay cash at the hub" -- on a new booking and on a plan
 * extension -- without touching the CASH payment method itself: bookings that
 * were already taken on cash still run their course, the hub still collects
 * them, and an admin can still record a cash receipt by hand. The flag only
 * decides what a rider is offered.
 *
 * `codDisabledAt` is written alongside it so a booking that already existed
 * when the switch was thrown can still be paid in cash. The rider picked cash
 * on a screen that legitimately offered it; refusing the payment afterwards
 * would strand a booking that is already holding a vehicle.
 */

export const COD_ENABLED_KEY = 'codEnabled';
export const COD_DISABLED_AT_KEY = 'codDisabledAt';

export const COD_DISABLED_MESSAGE =
  'Cash on delivery is currently unavailable. Please pay online or from your wallet.';

/** Settings store booleans as whatever the admin form sent, so "false" counts. */
const isFalse = (value) => value === false || value === 'false';

export const isCodEnabled = async () => {
  const values = await settingsService.getSettingValues([COD_ENABLED_KEY]);
  // Absent means enabled: COD predates this switch, and an install that never
  // opened the settings screen must keep working the way it did.
  return !isFalse(values[COD_ENABLED_KEY]);
};

export const assertCodEnabled = async () => {
  if (!(await isCodEnabled())) {
    throw new BadRequestError(COD_DISABLED_MESSAGE);
  }
};

/**
 * Whether this booking may still be settled in cash. True while COD is on, and
 * true for a booking created before it was turned off.
 */
export const canPayBookingInCash = async (booking) => {
  const values = await settingsService.getSettingValues([COD_ENABLED_KEY, COD_DISABLED_AT_KEY]);
  if (!isFalse(values[COD_ENABLED_KEY])) return true;

  // A booking already on CASH was offered it when it was allowed.
  if (booking?.paymentMethod === 'CASH') return true;

  const disabledAt = values[COD_DISABLED_AT_KEY] ? new Date(values[COD_DISABLED_AT_KEY]) : null;
  if (!disabledAt || Number.isNaN(disabledAt.getTime())) return false;

  const createdAt = booking?.createdAt ? new Date(booking.createdAt) : null;
  if (!createdAt || Number.isNaN(createdAt.getTime())) return false;

  return createdAt < disabledAt;
};

export const assertBookingPayableInCash = async (booking) => {
  if (!(await canPayBookingInCash(booking))) {
    throw new BadRequestError(COD_DISABLED_MESSAGE);
  }
};
