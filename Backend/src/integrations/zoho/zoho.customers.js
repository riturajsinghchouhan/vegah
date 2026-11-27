import ZohoSync from '../../models/ZohoSync.js';
import User from '../../models/User.js';
import logger from '../../utils/logger.js';
import { NotFoundError } from '../../utils/errors.js';
import {
  isValidGstin,
  stateCodeFromGstin,
  gstTreatmentOf,
  stateNameOf,
} from '../../utils/gst.js';
import * as client from './zoho.client.js';
import { getConfig } from './zoho.config.js';

/**
 * Riders as Zoho contacts.
 *
 * Everything downstream needs a `customer_id`, so this is the first module and
 * every invoice or payment push calls through it. The contact is created once
 * and then reused; it is only updated when a field Zoho cares about actually
 * changed, because a rider editing their avatar is not a reason to spend an
 * API call.
 */

const ENTITY = 'CONTACT';

/**
 * Zoho requires `contact_name` to be unique across the organisation, and a
 * fleet of riders produces duplicate names constantly. The phone number is
 * already unique on User, so it disambiguates without needing a lookup.
 */
const contactNameFor = (user) => {
  const name = String(user.fullName || '').trim() || 'Rider';
  const phone = String(user.phone || '').replace(/\D/g, '').slice(-10);
  return phone ? `${name} (${phone})` : name;
};

const buildPayload = (user, config) => {
  const billing = user.billing || {};
  const gstin = isValidGstin(billing.gstin) ? String(billing.gstin).trim().toUpperCase() : null;
  const isBusiness = Boolean(gstin || billing.companyName);

  // A GSTIN states its own state and outranks whatever was typed in the
  // address; falling back to the supplier's state keeps the invoice intra-state
  // rather than guessing an inter-state supply we cannot evidence.
  const stateCode = stateCodeFromGstin(gstin)
    || String(billing.stateCode || '').toUpperCase()
    || config.supplierStateCode;

  const payload = {
    contact_name: contactNameFor(user),
    contact_type: 'customer',
    customer_sub_type: isBusiness ? 'business' : 'individual',
    gst_treatment: gstTreatmentOf({ gstin, isBusiness }),
    place_of_supply: stateCode,
    contact_persons: [{
      first_name: String(user.fullName || 'Rider').trim(),
      email: user.email || '',
      phone: user.phone || '',
      mobile: user.phone || '',
      is_primary_contact: true,
    }],
  };

  if (gstin) payload.gst_no = gstin;
  if (billing.companyName) payload.company_name = String(billing.companyName).trim();

  // Zoho rejects a partial address, so it is sent only when there is a real one.
  if (billing.address || billing.city || billing.pincode) {
    payload.billing_address = {
      address: billing.address || '',
      city: billing.city || '',
      state: stateNameOf(stateCode) || '',
      state_code: stateCode || '',
      zip: billing.pincode || '',
      country: 'India',
    };
  }

  return payload;
};

/**
 * Zoho refuses a duplicate `contact_name` with code 3062. That happens when a
 * contact was created by a push whose response was lost, or by hand in Zoho, so
 * the right answer is to adopt the existing contact rather than fail forever.
 */
const findExistingByName = async (contactName) => {
  try {
    const data = await client.get('/contacts', { contact_name: contactName });
    return (data.contacts || [])[0] || null;
  } catch (error) {
    logger.warn(`Zoho contact lookup failed for "${contactName}": ${error.message}`);
    return null;
  }
};

const isDuplicateNameError = (error) => /\b3062\b/.test(error.message || '');

/**
 * Ensures the rider exists in Zoho and returns their `contact_id`.
 *
 * Safe to call on every push: a synced rider costs one indexed read.
 */
export const syncCustomer = async (user, { force = false } = {}) => {
  const config = await getConfig();
  const localId = String(user._id);
  const payload = buildPayload(user, config);

  let record = await ZohoSync.findOne({ entity: ENTITY, localId });

  if (record?.zohoId && !force) {
    // Only spend a PUT when something Zoho stores actually moved.
    if (JSON.stringify(record.payload) !== JSON.stringify(payload)) {
      try {
        await client.put(`/contacts/${record.zohoId}`, payload);
        record.payload = payload;
        record.syncedAt = new Date();
        record.lastError = null;
        await record.save();
      } catch (error) {
        // A stale contact is not worth failing an invoice over.
        logger.warn(`Zoho contact ${record.zohoId} update failed: ${error.message}`);
      }
    }
    return record.zohoId;
  }

  record = record || new ZohoSync({ entity: ENTITY, localModel: 'User', localId });
  record.attempts += 1;
  record.lastAttemptAt = new Date();

  try {
    let contact;
    try {
      const data = await client.post('/contacts', payload);
      contact = data.contact;
    } catch (error) {
      if (!isDuplicateNameError(error)) throw error;
      contact = await findExistingByName(payload.contact_name);
      if (!contact) throw error;
      logger.info(`Zoho contact "${payload.contact_name}" already existed; adopted ${contact.contact_id}`);
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

/** Resolves a rider id to a Zoho contact id, creating the contact if needed. */
export const customerIdFor = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new NotFoundError('Rider not found');
  return syncCustomer(user);
};

/**
 * Pushes riders who have never been synced. Used for the initial backfill and
 * by the admin retry button; failures are collected rather than thrown so one
 * bad record cannot stop the run.
 */
export const syncPendingCustomers = async ({ limit = 100 } = {}) => {
  const synced = await ZohoSync.find({ entity: ENTITY, status: 'SYNCED' }).distinct('localId');
  const users = await User.find({ _id: { $nin: synced } }).limit(limit);

  const result = { attempted: users.length, synced: 0, failed: 0, errors: [] };
  for (const user of users) {
    try {
      await syncCustomer(user);
      result.synced += 1;
    } catch (error) {
      result.failed += 1;
      result.errors.push({ userId: String(user._id), message: error.message });
    }
  }
  return result;
};
