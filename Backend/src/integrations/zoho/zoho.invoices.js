import ZohoSync from '../../models/ZohoSync.js';
import TaxInvoice from '../../models/TaxInvoice.js';
import logger from '../../utils/logger.js';
import { NotFoundError, BadRequestError } from '../../utils/errors.js';
import { isInterStateSupply } from '../../utils/gst.js';
import * as client from './zoho.client.js';
import * as customers from './zoho.customers.js';
import { getConfig, assertReadyFor, taxIdForRate } from './zoho.config.js';

/**
 * Tax invoices and credit notes as Zoho documents.
 *
 * The document is already issued and numbered by the time it reaches here, so
 * this module never decides amounts or numbers -- it only translates. That
 * matters because Zoho is the copy, not the original: if the push is lost the
 * invoice the customer holds is still valid and can be re-pushed unchanged.
 */

const toZohoDate = (date) => new Date(date).toISOString().slice(0, 10);

const buildLineItems = (document, config, isInterState) => document.lineItems.map((item) => {
  const line = {
    name: item.name,
    description: item.description || '',
    rate: item.rate,
    quantity: item.quantity,
    unit: item.unit || 'nos',
    hsn_or_sac: item.sac || '',
  };

  // A zero-rated line carries no tax id at all; Zoho rejects a null one.
  const rate = Number(item.taxRate) || 0;
  if (rate <= 0) return line;

  const taxId = taxIdForRate(config, rate, { isInterState });
  // Falling back to Zoho's own default here would file a real GST document
  // under whatever tax the org happens to default to, which is worse than not
  // pushing: the push can be retried once the mapping is fixed, a wrongly
  // filed invoice has to be credited.
  if (!taxId) {
    const direction = isInterState ? 'inter-state (IGST)' : 'intra-state (CGST+SGST)';
    throw new BadRequestError(`No Zoho tax id mapped for ${rate}% ${direction}`);
  }
  line.tax_id = taxId;
  return line;
});

const buildPayload = (document, customerId, config) => {
  // The same rule the ledger used when it split this document's tax, so the
  // Zoho copy cannot land under a different head than the original.
  const isInterState = isInterStateSupply({
    supplierStateCode: config.supplierStateCode,
    placeOfSupply: document.placeOfSupply,
  });

  const payload = {
    customer_id: customerId,
    date: toZohoDate(document.date),
    due_date: toZohoDate(document.date),
    place_of_supply: document.placeOfSupply,
    gst_treatment: document.gstTreatment,
    // Our line rates exclude tax; Zoho must not re-derive them as inclusive.
    is_inclusive_tax: false,
    line_items: buildLineItems(document, config, isInterState),
    reference_number: document.bookingId || '',
    notes: document.documentType === 'CREDIT_NOTE' ? (document.reason || '') : '',
  };

  if (document.customer?.gstin) payload.gst_no = document.customer.gstin;

  if (document.discountAmount > 0) {
    payload.discount = document.discountAmount;
    payload.discount_type = 'entity_level';
    payload.is_discount_before_tax = true;
  }

  if (config.useOwnInvoiceNumbers) {
    const field = document.documentType === 'CREDIT_NOTE' ? 'creditnote_number' : 'invoice_number';
    payload[field] = document.invoiceNumber;
  }

  return payload;
};

const recordFor = async (entity, localId, localModel) => {
  const existing = await ZohoSync.findOne({ entity, localId });
  return existing || new ZohoSync({ entity, localModel, localId });
};

/**
 * Pushes one issued document to Zoho and returns its Zoho id.
 *
 * Idempotent: a document already synced is returned from the local map without
 * another call, because a second POST would create a second filed invoice.
 */
export const pushDocument = async (documentOrId, { force = false } = {}) => {
  const document = typeof documentOrId === 'object' && documentOrId?._id
    ? documentOrId
    : await TaxInvoice.findById(documentOrId);
  if (!document) throw new NotFoundError('Tax invoice not found');

  const isCreditNote = document.documentType === 'CREDIT_NOTE';
  const entity = isCreditNote ? 'CREDIT_NOTE' : 'INVOICE';
  const localId = String(document._id);

  const record = await recordFor(entity, localId, 'TaxInvoice');
  if (record.zohoId && !force) return record.zohoId;

  if (!document.user) throw new BadRequestError('Document has no customer to invoice');

  const config = await getConfig();
  assertReadyFor(config, 'INVOICE');

  record.attempts += 1;
  record.lastAttemptAt = new Date();

  try {
    const customerId = await customers.customerIdFor(document.user);
    const payload = buildPayload(document, customerId, config);
    const params = config.useOwnInvoiceNumbers ? { ignore_auto_number_generation: true } : {};

    const path = isCreditNote ? '/creditnotes' : '/invoices';
    const data = await client.post(path, payload, params);
    const created = isCreditNote ? data.creditnote : data.invoice;

    record.zohoId = isCreditNote ? created.creditnote_id : created.invoice_id;
    record.zohoNumber = isCreditNote ? created.creditnote_number : created.invoice_number;

    // Zoho creates both as drafts. Moving to sent/open is what makes the
    // document count towards GSTR-1; no email is sent by this call.
    try {
      const statusPath = isCreditNote
        ? `/creditnotes/${record.zohoId}/status/open`
        : `/invoices/${record.zohoId}/status/sent`;
      await client.post(statusPath);
    } catch (error) {
      // The document exists either way, so this is a warning rather than a
      // failure: re-running the push will not duplicate it.
      logger.warn(`Zoho ${entity} ${record.zohoNumber} created but not marked sent: ${error.message}`);
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

/**
 * Voids a Zoho invoice. Used only where the local document was cancelled
 * without a credit note; the normal correction path is a credit note, which
 * leaves the original standing.
 */
export const voidInvoice = async (taxInvoiceId) => {
  const record = await ZohoSync.findOne({ entity: 'INVOICE', localId: String(taxInvoiceId) });
  if (!record?.zohoId) return null;
  await client.post(`/invoices/${record.zohoId}/status/void`);
  record.status = 'SKIPPED';
  record.lastError = 'Voided in Zoho';
  await record.save();
  return record.zohoId;
};

/** Pushes everything issued but not yet in Zoho. Drives the retry button. */
export const pushPending = async ({ limit = 50 } = {}) => {
  const synced = await ZohoSync.find({
    entity: { $in: ['INVOICE', 'CREDIT_NOTE'] },
    status: 'SYNCED',
  }).distinct('localId');

  const documents = await TaxInvoice.find({ _id: { $nin: synced } })
    .sort({ date: 1 })
    .limit(limit);

  const result = { attempted: documents.length, synced: 0, failed: 0, errors: [] };
  for (const document of documents) {
    try {
      await pushDocument(document);
      result.synced += 1;
    } catch (error) {
      result.failed += 1;
      result.errors.push({ invoiceNumber: document.invoiceNumber, message: error.message });
    }
  }
  return result;
};
