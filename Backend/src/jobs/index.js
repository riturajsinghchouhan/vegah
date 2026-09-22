import { createWorker } from '../config/bullmq.js';
import { reservationExpiryProcessor } from './reservationExpiry.job.js';
import { rentalReminderProcessor, rentalOverdueProcessor } from './rentalLifecycle.job.js';
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
