import * as settingsService from '../../modules/settings/settings.service.js';
import { BadRequestError } from '../../utils/errors.js';

/**
 * The account, tax and HSN ids that Zoho payloads need.
 *
 * None of these can be hard-coded: they are generated per organisation when the
 * books are set up, so a staging org and the live org have entirely different
 * ids for the same bank account. They live in settings under a single `zoho`
 * key and are edited from the admin screen.
 */

export const SETTINGS_KEY = 'zoho';
export const SETTINGS_CATEGORY = 'zoho';

export const DEFAULT_CONFIG = {
  // The state the business supplies from. Decides CGST+SGST versus IGST on
  // every invoice, so it is required before anything can be pushed.
  supplierStateCode: '',

  // Zoho chart-of-accounts ids, looked up once from /chartofaccounts.
  accounts: {
    bank: '',
    cash: '',
    // Where an unmatched or wallet-funded receipt is parked.
    wallet: '',
  },

  // Zoho expense account ids, one per expense category we already record.
  // Unmapped categories fall back to `other`.
  expenseAccounts: {
    CHARGING: '',
    MAINTENANCE: '',
    REPAIR: '',
    SALARY: '',
    RENT: '',
    UTILITIES: '',
    INSURANCE: '',
    MARKETING: '',
    TRANSPORT: '',
    OFFICE: '',
    OTHER: '',
  },

  // Zoho tax ids keyed by rate, from /settings/taxes.
  //
  // Split by direction because Zoho holds two separate tax records per rate --
  // a CGST+SGST group for intra-state supply and a single IGST tax for
  // inter-state -- and the id decides which head the amount is filed under.
  // One slot per rate would file half the invoices wrongly.
  taxes: {
    intra: {
      5: '', 12: '', 18: '', 28: '',
    },
    inter: {
      5: '', 12: '', 18: '', 28: '',
    },
  },

  // SAC codes per charge type. Renting a two-wheeler without an operator is
  // 997311; the fee-type services sit under 9985/9997. An accountant may want
  // these changed, hence settings rather than constants.
  sac: {
    rental: '997311',
    swap: '997311',
    serviceFee: '998599',
    platformFee: '998599',
    lateFee: '997311',
    damage: '999799',
    cancellationFee: '999799',
  },

  // Zoho's own numbering is switched off so the invoice number the customer was
  // given is the one that gets filed. Turning this off hands numbering to Zoho.
  useOwnInvoiceNumbers: true,
};

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

/**
 * Settings saved before taxes were split by direction are a flat `{rate: id}`
 * map. Those ids are CGST+SGST groups -- an org maps its own state first -- so
 * they are carried over as `intra` and `inter` is left to be filled in. Doing
 * this on read means no migration script and no half-mapped window.
 */
const normaliseTaxes = (stored) => {
  if (!isObject(stored)) return { ...DEFAULT_CONFIG.taxes };
  if (isObject(stored.intra) || isObject(stored.inter)) {
    return {
      intra: { ...DEFAULT_CONFIG.taxes.intra, ...(isObject(stored.intra) ? stored.intra : {}) },
      inter: { ...DEFAULT_CONFIG.taxes.inter, ...(isObject(stored.inter) ? stored.inter : {}) },
    };
  }
  return {
    intra: { ...DEFAULT_CONFIG.taxes.intra, ...stored },
    inter: { ...DEFAULT_CONFIG.taxes.inter },
  };
};

/** Shallow-merges stored settings over the defaults, one level into each group. */
const merge = (stored = {}) => {
  const result = { ...DEFAULT_CONFIG, ...stored };
  for (const key of ['accounts', 'sac', 'expenseAccounts']) {
    result[key] = { ...DEFAULT_CONFIG[key], ...(isObject(stored[key]) ? stored[key] : {}) };
  }
  result.taxes = normaliseTaxes(stored.taxes);
  return result;
};

export const getConfig = async () => {
  const values = await settingsService.getSettingValues([SETTINGS_KEY]);
  return merge(isObject(values[SETTINGS_KEY]) ? values[SETTINGS_KEY] : {});
};

export const saveConfig = async (patch, adminId) => {
  const current = await getConfig();
  const next = merge({ ...current, ...patch });
  await settingsService.updateSettings({ [SETTINGS_KEY]: next }, adminId, SETTINGS_CATEGORY);
  return next;
};

/**
 * What is missing before a given entity can be pushed. Reported rather than
 * thrown so the admin screen can show one list of everything left to fill in.
 */
export const missingFor = (config, entity) => {
  const missing = [];
  if (!config.supplierStateCode) missing.push('Supplier state code');

  if (entity === 'INVOICE') {
    // Both directions are listed because an unmapped one is not a smaller
    // problem than an unmapped rate -- it is an invoice filed under the wrong
    // head. Which direction a given booking needs is not knowable in advance.
    if (!Object.values(config.taxes?.intra || {}).some(Boolean)) {
      missing.push('At least one intra-state (CGST+SGST) tax id');
    }
    if (!Object.values(config.taxes?.inter || {}).some(Boolean)) {
      missing.push('At least one inter-state (IGST) tax id');
    }
  }
  if (entity === 'PAYMENT' || entity === 'DEPOSIT' || entity === 'DEPOSIT_REFUND') {
    if (!config.accounts?.bank) missing.push('Bank account id');
    if (!config.accounts?.cash) missing.push('Cash account id');
  }
  if (entity === 'EXPENSE') {
    if (!config.accounts?.bank) missing.push('Bank account id');
    if (!config.accounts?.cash) missing.push('Cash account id');
    // One fallback account is enough to post every category somewhere; a more
    // precise mapping is an accounting preference, not a blocker.
    if (!config.expenseAccounts?.OTHER) missing.push('Default (OTHER) expense account id');
  }
  return missing;
};

/** The expense account for a category, falling back to the default. */
export const expenseAccountFor = (config, category) =>
  config.expenseAccounts?.[category] || config.expenseAccounts?.OTHER || null;

export const assertReadyFor = (config, entity) => {
  const missing = missingFor(config, entity);
  if (missing.length) {
    throw new BadRequestError(`Zoho mapping incomplete: ${missing.join(', ')}`);
  }
};

/**
 * The tax id for a rate in one direction, or null when it is not mapped.
 *
 * `isInterState` is not optional by accident: a caller that does not know the
 * direction cannot pick a tax id at all, because the same rate has a different
 * id for IGST than for CGST+SGST.
 */
export const taxIdForRate = (config, rate, { isInterState }) => {
  const key = String(Math.round(Number(rate) || 0));
  const group = isInterState ? config.taxes?.inter : config.taxes?.intra;
  return group?.[key] || null;
};
