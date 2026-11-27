import ZohoSync from '../../models/ZohoSync.js';
import Expense from '../../models/Expense.js';
import logger from '../../utils/logger.js';
import { NotFoundError, BadRequestError } from '../../utils/errors.js';
import {
  isValidGstin, stateCodeFromGstin, gstTreatmentOf, isInterStateSupply,
} from '../../utils/gst.js';
import * as client from './zoho.client.js';
import { getConfig, assertReadyFor, expenseAccountFor, taxIdForRate } from './zoho.config.js';

/**
 * Expenses, and the vendors they are paid to.
 *
 * The point of pushing these is input tax credit: GST paid to a registered
 * vendor is recoverable, but only if the spend is recorded against that
 * vendor's GSTIN. An expense without one still posts, it just posts as a cost
 * with no credit attached, which is exactly how it should read.
 */

const toZohoDate = (date) => new Date(date).toISOString().slice(0, 10);

const PAYMENT_ACCOUNT = {
  CASH: 'cash',
  UPI: 'bank',
  BANK_TRANSFER: 'bank',
  CARD: 'bank',
  CHEQUE: 'bank',
  OTHER: 'bank',
};

const paidThroughFor = (paymentMode, config) => {
  const key = PAYMENT_ACCOUNT[String(paymentMode || '').toUpperCase()] || 'bank';
  return config.accounts?.[key] || config.accounts?.bank;
};

const recordFor = async (entity, localId, localModel) => {
  const existing = await ZohoSync.findOne({ entity, localId });
  return existing || new ZohoSync({ entity, localModel, localId });
};

/**
 * Finds or creates the vendor contact.
 *
 * Vendors are not a collection of their own here -- an expense carries the
 * name and GSTIN directly -- so the name is the identity, and the local map is
 * keyed by it rather than by a document id.
 */
export const vendorIdFor = async (vendorName, vendorGstin) => {
  const name = String(vendorName || '').trim();
  if (!name) return null;

  const localId = `name:${name.toLowerCase()}`;
  const record = await recordFor('VENDOR', localId, 'Expense');
  if (record.zohoId) return record.zohoId;

  const gstin = isValidGstin(vendorGstin) ? String(vendorGstin).toUpperCase() : null;
  const payload = {
    contact_name: name,
    contact_type: 'vendor',
    gst_treatment: gstTreatmentOf({ gstin, isBusiness: true }),
  };
  if (gstin) {
    payload.gst_no = gstin;
    payload.place_of_supply = stateCodeFromGstin(gstin);
  }

  record.attempts += 1;
  record.lastAttemptAt = new Date();

  try {
    let contact;
    try {
      const data = await client.post('/contacts', payload);
      contact = data.contact;
    } catch (error) {
      // 3062 is Zoho's duplicate-name code; adopt whoever is already there.
      if (!/\b3062\b/.test(error.message || '')) throw error;
      const found = await client.get('/contacts', { contact_name: name });
      contact = (found.contacts || [])[0];
      if (!contact) throw error;
      logger.info(`Zoho vendor "${name}" already existed; adopted ${contact.contact_id}`);
    }

    record.zohoId = contact.contact_id;
    record.zohoNumber = contact.contact_name;
    record.status = 'SYNCED';
    record.syncedAt = new Date();
    record.lastError = null;
    record.payload = payload;
    await record.save();
    return record.zohoId;
  } catch (error) {
    record.status = 'FAILED';
    record.lastError = error.message;
    await record.save();
    throw error;
  }
};

const buildPayload = async (expense, config) => {
  const accountId = expenseAccountFor(config, expense.category);
  if (!accountId) throw new BadRequestError(`No Zoho expense account mapped for ${expense.category}`);

  const paidThroughAccountId = paidThroughFor(expense.paymentMode, config);
  if (!paidThroughAccountId) throw new BadRequestError(`No Zoho account mapped for ${expense.paymentMode}`);

  const payload = {
    date: toZohoDate(expense.date),
    account_id: accountId,
    paid_through_account_id: paidThroughAccountId,
    // `amount` is the gross paid, so Zoho must read the rate as inclusive or it
    // would add tax on top and overstate what left the bank.
    amount: expense.amount,
    is_inclusive_tax: true,
    reference_number: expense.referenceNumber || '',
    description: [expense.title, expense.notes].filter(Boolean).join(' — ').slice(0, 500),
  };

  // On a purchase the counterparty is the vendor, so the direction is our
  // state against theirs. A registered vendor carries its state in its GSTIN;
  // for an unregistered one there is no ITC to split anyway.
  const vendorState = stateCodeFromGstin(expense.vendorGstin);
  const isInterState = isInterStateSupply({
    supplierStateCode: config.supplierStateCode,
    placeOfSupply: vendorState || expense.placeOfSupply,
  });

  if (expense.taxRate > 0) {
    const taxId = taxIdForRate(config, expense.taxRate, { isInterState });
    // Unlike an invoice this is left lenient: an expense is not a filed
    // outbound document, so a missing id costs input credit on one entry
    // rather than misreporting a supply. It is logged so it can be found.
    if (taxId) {
      payload.tax_id = taxId;
    } else {
      const direction = isInterState ? 'inter-state (IGST)' : 'intra-state (CGST+SGST)';
      logger.warn(`Expense ${expense._id}: no Zoho tax id for ${expense.taxRate}% ${direction}; pushed without input tax`);
    }
  }

  if (isValidGstin(expense.vendorGstin)) {
    payload.gst_no = String(expense.vendorGstin).toUpperCase();
    payload.gst_treatment = 'business_gst';
    payload.destination_of_supply = expense.placeOfSupply || config.supplierStateCode;
  } else {
    payload.gst_treatment = 'business_none';
  }

  if (expense.sac) payload.hsn_or_sac = expense.sac;

  const vendorId = await vendorIdFor(expense.vendorName, expense.vendorGstin);
  if (vendorId) payload.vendor_id = vendorId;

  return payload;
};

/** Creates the expense in Zoho, or updates it if it was already pushed. */
export const pushExpense = async (expenseOrId, { allowUpdate = false } = {}) => {
  const expense = typeof expenseOrId === 'object' && expenseOrId?._id
    ? expenseOrId
    : await Expense.findById(expenseOrId);
  if (!expense) throw new NotFoundError('Expense not found');

  const localId = String(expense._id);
  const record = await recordFor('EXPENSE', localId, 'Expense');

  const config = await getConfig();
  assertReadyFor(config, 'EXPENSE');

  record.attempts += 1;
  record.lastAttemptAt = new Date();

  try {
    const payload = await buildPayload(expense, config);

    if (record.zohoId) {
      // An expense is not a numbered statutory document, so unlike an invoice
      // it can be corrected in place rather than reversed.
      if (!allowUpdate) return record.zohoId;
      await client.put(`/expenses/${record.zohoId}`, payload);
    } else {
      const data = await client.post('/expenses', payload);
      record.zohoId = data.expense.expense_id;
    }

    record.status = 'SYNCED';
    record.syncedAt = new Date();
    record.lastError = null;
    record.payload = payload;
    await record.save();
    return record.zohoId;
  } catch (error) {
    record.status = 'FAILED';
    record.lastError = error.message;
    await record.save();
    throw error;
  }
};

export const pushPendingExpenses = async ({ limit = 50 } = {}) => {
  const synced = await ZohoSync.find({ entity: 'EXPENSE', status: 'SYNCED' }).distinct('localId');
  const expenses = await Expense.find({ _id: { $nin: synced } }).sort({ date: 1 }).limit(limit);

  const result = { attempted: expenses.length, synced: 0, failed: 0, errors: [] };
  for (const expense of expenses) {
    try {
      await pushExpense(expense);
      result.synced += 1;
    } catch (error) {
      result.failed += 1;
      result.errors.push({ expenseId: String(expense._id), message: error.message });
    }
  }
  return result;
};
