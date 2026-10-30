import { BadRequestError } from '../../utils/errors.js';

// The ledger stores every amount as an integer number of paise. Rupee floats
// cannot be summed without drift, and a drift of one paisa makes debits stop
// equalling credits, which is the one invariant the whole ledger rests on.
export const toPaise = (rupees) => {
  const value = Number(rupees);
  if (!Number.isFinite(value)) throw new BadRequestError('Amount must be a finite number');
  return Math.round(value * 100);
};

export const toRupees = (paise) => {
  const value = Number(paise);
  if (!Number.isInteger(value)) throw new BadRequestError('Ledger amounts must be whole paise');
  return value / 100;
};

export const assertPaise = (value, label = 'Amount') => {
  if (!Number.isInteger(value)) throw new BadRequestError(`${label} must be a whole number of paise`);
  if (value < 0) throw new BadRequestError(`${label} cannot be negative`);
  return value;
};

// Splits a total across `parts` instalments. Every instalment is equal except
// the last, which absorbs the remainder so the series sums back to the total
// exactly -- this is what lets a deferred revenue balance close at zero on the
// final day of a plan instead of leaving a rounding tail behind.
export const splitEvenly = (totalPaise, parts) => {
  assertPaise(totalPaise, 'Total');
  if (!Number.isInteger(parts) || parts < 1) {
    throw new BadRequestError('Split must be into a whole number of parts, at least one');
  }
  const base = Math.floor(totalPaise / parts);
  const instalments = new Array(parts).fill(base);
  instalments[parts - 1] = totalPaise - base * (parts - 1);
  return instalments;
};
