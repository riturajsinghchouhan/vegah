import { createWorker, systemQueue, enqueue } from '../config/bullmq.js';
import { reservationExpiryProcessor } from './reservationExpiry.job.js';
import { rentalReminderProcessor, rentalOverdueProcessor } from './rentalLifecycle.job.js';
import { ledgerDailyProcessor } from './ledgerDaily.job.js';
import { rearmTripJobs } from '../modules/bookings/bookings.service.js';
import logger from '../utils/logger.js';

let workers = [];

export const initWorkers = async () => {
  const bookingWorker = createWorker('bookings', async (job) => {
    switch (job.name) {
      case 'reservation-expiry':
        await reservationExpiryProcessor(job);
        break;
      case 'rental-reminder':
        await rentalReminderProcessor(job);
        break;
      case 'rental-overdue':
        await rentalOverdueProcessor(job);
        break;
      default:
        throw new Error(`Unknown job name: ${job.name}`);
    }
  });

  if (bookingWorker) workers.push(bookingWorker);

  const systemWorker = createWorker('system', async (job) => {
    switch (job.name) {
      case 'ledger-daily-close':
        await ledgerDailyProcessor(job);
        break;
      default:
        throw new Error(`Unknown job name: ${job.name}`);
    }
  });

  if (systemWorker) workers.push(systemWorker);

  // End of day in IST. Repeatable jobs are keyed by name, so re-registering on
  // every boot replaces the schedule rather than stacking duplicates.
  if (systemQueue) {
    try {
      await enqueue(
        systemQueue,
        'ledger-daily-close',
        {},
        {
          repeat: { pattern: '30 18 * * *' }, // 00:00 IST
          jobId: 'ledger-daily-close',
          removeOnComplete: 20,
          removeOnFail: 50,
        }
      );
      logger.info('Ledger daily close scheduled for 00:00 IST');
    } catch (err) {
      logger.error(`Could not schedule ledger daily close: ${err.message}`);
    }
  }

  // Trips that were already running before this process started still need
  // their reminder and overdue checks.
  try {
    await rearmTripJobs();
  } catch (err) {
    logger.error(`Failed to re-arm trip jobs on boot: ${err.message}`);
  }
};

export const closeWorkers = async () => {
  for (const worker of workers) {
    await worker.close();
  }
};
