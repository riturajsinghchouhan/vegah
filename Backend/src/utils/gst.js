/**
 * GST primitives shared by invoicing, the ledger and the Zoho push.
 *
 * Only two things here actually change money: which state the customer is in,
 * and whether they are registered. Everything else is formatting.
 */

// 2 digit state + 10 char PAN + entity number + 'Z' + checksum.
const GSTIN_PATTERN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

export const isValidGstin = (value) => GSTIN_PATTERN.test(String(value || '').trim().toUpperCase());

/**
 * The numeric state codes embedded in a GSTIN, mapped to the two-letter codes
 * Zoho expects in `place_of_supply` and `state_code`.
 *
 * 25 (Daman & Diu) is absent on purpose: it merged into 26 in 2020 and the
 * portal no longer issues it.
 */
export const STATE_BY_GST_CODE = {
  '01': { code: 'JK', name: 'Jammu and Kashmir' },
  '02': { code: 'HP', name: 'Himachal Pradesh' },
  '03': { code: 'PB', name: 'Punjab' },
  '04': { code: 'CH', name: 'Chandigarh' },
  '05': { code: 'UT', name: 'Uttarakhand' },
  '06': { code: 'HR', name: 'Haryana' },
  '07': { code: 'DL', name: 'Delhi' },
  '08': { code: 'RJ', name: 'Rajasthan' },
  '09': { code: 'UP', name: 'Uttar Pradesh' },
  10: { code: 'BR', name: 'Bihar' },
  11: { code: 'SK', name: 'Sikkim' },
  12: { code: 'AR', name: 'Arunachal Pradesh' },
  13: { code: 'NL', name: 'Nagaland' },
  14: { code: 'MN', name: 'Manipur' },
  15: { code: 'MZ', name: 'Mizoram' },
  16: { code: 'TR', name: 'Tripura' },
  17: { code: 'ML', name: 'Meghalaya' },
  18: { code: 'AS', name: 'Assam' },
  19: { code: 'WB', name: 'West Bengal' },
  20: { code: 'JH', name: 'Jharkhand' },
  21: { code: 'OD', name: 'Odisha' },
  22: { code: 'CG', name: 'Chhattisgarh' },
  23: { code: 'MP', name: 'Madhya Pradesh' },
  24: { code: 'GJ', name: 'Gujarat' },
  26: { code: 'DN', name: 'Dadra and Nagar Haveli and Daman and Diu' },
  27: { code: 'MH', name: 'Maharashtra' },
  29: { code: 'KA', name: 'Karnataka' },
  30: { code: 'GA', name: 'Goa' },
  31: { code: 'LD', name: 'Lakshadweep' },
  32: { code: 'KL', name: 'Kerala' },
  33: { code: 'TN', name: 'Tamil Nadu' },
  34: { code: 'PY', name: 'Puducherry' },
  35: { code: 'AN', name: 'Andaman and Nicobar Islands' },
  36: { code: 'TS', name: 'Telangana' },
  37: { code: 'AP', name: 'Andhra Pradesh' },
  38: { code: 'LA', name: 'Ladakh' },
  97: { code: 'OT', name: 'Other Territory' },
};

export const STATE_OPTIONS = Object.entries(STATE_BY_GST_CODE)
  .map(([gstCode, state]) => ({ gstCode, ...state }))
  .sort((a, b) => a.name.localeCompare(b.name));

const STATE_NAME_BY_CODE = Object.fromEntries(
  Object.values(STATE_BY_GST_CODE).map((s) => [s.code, s.name])
);

export const stateNameOf = (stateCode) => STATE_NAME_BY_CODE[String(stateCode || '').toUpperCase()] || null;

/** A GSTIN carries its own state, so a registered customer never needs to be asked. */
export const stateCodeFromGstin = (gstin) => {
  const value = String(gstin || '').trim().toUpperCase();
  if (!isValidGstin(value)) return null;
  return STATE_BY_GST_CODE[value.slice(0, 2)]?.code || null;
};

/**
 * Zoho's `gst_treatment`, which drives how it reports the invoice in GSTR-1.
 * A B2B line needs the customer's GSTIN; without one the sale is B2C however
 * large it is, and must not claim otherwise.
 */
export const gstTreatmentOf = ({ gstin, isBusiness = false } = {}) => {
  if (isValidGstin(gstin)) return 'business_gst';
  return isBusiness ? 'business_none' : 'consumer';
};

/**
 * Whether a supply crosses a state border, which is what decides CGST+SGST
 * versus IGST.
 *
 * The rule is the place of supply, not the customer's address. Kept here on
 * its own because both the ledger split and the Zoho tax id depend on it, and
 * the two disagreeing would file an invoice under the wrong head.
 *
 * An unknown state on either side is treated as intra-state: that matches the
 * default when no place of supply was captured, and `splitGst` has always
 * fallen back to the supplier's own state.
 */
export const isInterStateSupply = ({ supplierStateCode, placeOfSupply } = {}) => {
  const supplier = String(supplierStateCode || '').toUpperCase();
  const place = String(placeOfSupply || supplier).toUpperCase();
  return Boolean(supplier) && Boolean(place) && supplier !== place;
};

/**
 * Splits tax between CGST+SGST and IGST.
 *
 * Intra-state supply splits in half, inter-state carries the whole rate as
 * IGST. Rounding is applied to the halves so CGST and SGST always add back to
 * the total.
 */
export const splitGst = ({ taxAmount, supplierStateCode, placeOfSupply }) => {
  const total = Math.round(Number(taxAmount || 0) * 100) / 100;
  if (total <= 0) return { cgst: 0, sgst: 0, igst: 0, isInterState: false };

  const isInterState = isInterStateSupply({ supplierStateCode, placeOfSupply });

  if (isInterState) return { cgst: 0, sgst: 0, igst: total, isInterState: true };

  const half = Math.round((total / 2) * 100) / 100;
  // The remainder lands on SGST so the two halves reconstruct the total exactly.
  return { cgst: half, sgst: Math.round((total - half) * 100) / 100, igst: 0, isInterState: false };
};

/** Pulls the net and tax out of a tax-inclusive gross. */
export const splitInclusive = (gross, ratePercent) => {
  const amount = Number(gross || 0);
  const rate = Number(ratePercent || 0);
  if (rate <= 0) return { net: Math.round(amount * 100) / 100, tax: 0 };
  const net = Math.round((amount / (1 + rate / 100)) * 100) / 100;
  return { net, tax: Math.round((amount - net) * 100) / 100 };
};
