import { createWorker } from '../config/bullmq.js';
import { reservationExpiryProcessor } from './reservationExpiry.job.js';

let workers = [];

export const initWorkers = () => {
  const bookingWorker = createWorker('bookings', async (job) => {
    switch (job.name) {
      case 'reservation-expiry':
        await reservationExpiryProcessor(job);
        break;
      default:
        throw new Error(`Unknown job name: ${job.name}`);
    }
  });

  if (bookingWorker) workers.push(bookingWorker);
};

export const closeWorkers = async () => {
  for (const worker of workers) {
    await worker.close();
  }
};
