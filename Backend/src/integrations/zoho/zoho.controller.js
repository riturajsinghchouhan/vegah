import ZohoSync from '../../models/ZohoSync.js';
import { sendSuccess } from '../../utils/response.js';
import { STATE_OPTIONS } from '../../utils/gst.js';
import { BadRequestError, NotFoundError } from '../../utils/errors.js';
import * as client from './zoho.client.js';
import * as config from './zoho.config.js';
import * as lookups from './zoho.lookups.js';
import * as customers from './zoho.customers.js';
import * as invoices from './zoho.invoices.js';
import * as payments from './zoho.payments.js';
import * as expenses from './zoho.expenses.js';

/**
 * Whether the integration can actually run, and what is still missing.
 * Deliberately never throws: a broken connection is a thing to display, not an
 * error page.
 */
export const getStatus = async (req, res, next) => {
  try {
    const configured = client.isConfigured();
    const mapping = await config.getConfig();

    let organization = null;
    let connectionError = null;
    if (configured) {
      try {
        organization = await client.ping();
      } catch (error) {
        connectionError = error.message;
      }
    }

    const counts = await ZohoSync.aggregate([
      { $group: { _id: { entity: '$entity', status: '$status' }, count: { $sum: 1 } } },
    ]);

    const byEntity = {};
    for (const row of counts) {
      const { entity, status } = row._id;
      byEntity[entity] = byEntity[entity] || { PENDING: 0, SYNCED: 0, FAILED: 0, SKIPPED: 0 };
      byEntity[entity][status] = row.count;
    }

    sendSuccess(res, 200, 'Zoho status fetched', {
      configured,
      connected: Boolean(organization),
      connectionError,
      organization,
      missing: {
        invoice: config.missingFor(mapping, 'INVOICE'),
        payment: config.missingFor(mapping, 'PAYMENT'),
        expense: config.missingFor(mapping, 'EXPENSE'),
      },
      counts: byEntity,
    });
  } catch (error) {
    next(error);
  }
};

export const getConfig = async (req, res, next) => {
  try {
    const mapping = await config.getConfig();
    sendSuccess(res, 200, 'Zoho mapping fetched', { config: mapping, states: STATE_OPTIONS });
  } catch (error) {
    next(error);
  }
};

export const updateConfig = async (req, res, next) => {
  try {
    const mapping = await config.saveConfig(req.body || {}, req.user?._id);
    sendSuccess(res, 200, 'Zoho mapping saved', { config: mapping });
  } catch (error) {
    next(error);
  }
};

export const getLookups = async (req, res, next) => {
  try {
    sendSuccess(res, 200, 'Zoho lookups fetched', await lookups.listAll());
  } catch (error) {
    next(error);
  }
};

export const syncCustomers = async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.body?.limit, 10) || 100, 1), 500);
    const result = await customers.syncPendingCustomers({ limit });
    sendSuccess(res, 200, 'Customer sync run complete', result);
  } catch (error) {
    next(error);
  }
};

/**
 * Retries everything of one kind that has not reached Zoho. Ordered by
 * dependency: a payment cannot be applied before its invoice exists, so
 * "all" walks them in that order rather than in parallel.
 */
export const pushPending = async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.body?.limit, 10) || 50, 1), 200);
    const kind = String(req.params.kind || 'all').toLowerCase();

    const runners = {
      customers: () => customers.syncPendingCustomers({ limit }),
      invoices: () => invoices.pushPending({ limit }),
      payments: () => payments.pushPendingPayments({ limit }),
      expenses: () => expenses.pushPendingExpenses({ limit }),
    };

    if (kind !== 'all' && !runners[kind]) {
      throw new BadRequestError(`Unknown push target "${kind}"`);
    }

    const order = kind === 'all' ? ['customers', 'invoices', 'payments', 'expenses'] : [kind];
    const results = {};
    for (const name of order) {
      results[name] = await runners[name]();
    }

    sendSuccess(res, 200, 'Push run complete', results);
  } catch (error) {
    next(error);
  }
};

/** Re-pushes one record that previously failed. */
export const retryRecord = async (req, res, next) => {
  try {
    const record = await ZohoSync.findById(req.params.id);
    if (!record) throw new NotFoundError('Sync record not found');

    const retries = {
      CONTACT: () => customers.customerIdFor(record.localId),
      INVOICE: () => invoices.pushDocument(record.localId, { force: true }),
      CREDIT_NOTE: () => invoices.pushDocument(record.localId, { force: true }),
      PAYMENT: () => payments.pushPayment(record.localId, { force: true }),
      DEPOSIT: () => payments.pushDeposit(record.localId, { force: true }),
      EXPENSE: () => expenses.pushExpense(record.localId, { allowUpdate: true }),
    };

    const retry = retries[record.entity];
    if (!retry) throw new BadRequestError(`${record.entity} cannot be retried automatically`);

    const zohoId = await retry();
    sendSuccess(res, 200, 'Record pushed', { zohoId });
  } catch (error) {
    next(error);
  }
};

export const listSyncRecords = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 25, 1), 100);

    const filter = {};
    if (req.query.entity) filter.entity = req.query.entity;
    if (req.query.status) filter.status = req.query.status;

    const [records, total] = await Promise.all([
      ZohoSync.find(filter).sort({ updatedAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      ZohoSync.countDocuments(filter),
    ]);

    sendSuccess(res, 200, 'Zoho sync records fetched', records, {
      page, limit, total, totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (error) {
    next(error);
  }
};
