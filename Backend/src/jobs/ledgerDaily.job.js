import { recogniseDueRevenue } from '../modules/ledger/hooks.js';
import { getDailyCheck } from '../modules/ledger/reports.service.js';
import { notifyAdmins } from '../services/notification.service.js';
import logger from '../utils/logger.js';

/**
 * End-of-day close: release the revenue earned today, then run the balance
 * checks and report either "balanced" or only the exceptions, as the brief asks.
 */
export const ledgerDailyProcessor = async () => {
  const recognition = await recogniseDueRevenue();
  const check = await getDailyCheck({});

  if (check.status === 'BALANCED') {
    logger.info(`Ledger daily close: BALANCED (${recognition.recognised} recognition entries posted)`);
  } else {
    logger.warn(
      `Ledger daily close: ${check.exceptions.length} EXCEPTION(S)\n` +
      check.exceptions.map((e) => `  - ${e.check}: ${e.reason}`).join('\n')
    );
  }

  try {
    await notifyAdmins({
      event: 'LEDGER_DAILY_CHECK',
      title: check.status === 'BALANCED' ? 'Books balanced' : `Books: ${check.exceptions.length} exception(s)`,
      body: check.status === 'BALANCED'
        ? 'End-of-day check passed. Debits equal credits and all control accounts agree.'
        : check.exceptions.map((e) => `${e.check}: ${e.reason}`).join(' | '),
      payload: { status: check.status, exceptions: check.exceptions },
    });
  } catch (error) {
    // The close itself must not fail because a notification could not be sent.
    logger.error(`Ledger daily summary notification failed: ${error.message}`);
  }

  return { recognition, check };
};
