import express from 'express';
import * as bookingsController from './bookings.controller.js';
import * as bookingsValidation from './bookings.validation.js';
import validate from '../../middleware/validate.js';
import authenticate from '../../middleware/authenticate.js';

const router = express.Router();

router.use(authenticate); // Both USER and ADMIN can access, logic handled in controller

router.post(
  '/',
  validate(bookingsValidation.createBookingSchema),
  bookingsController.createBooking
);

router.get(
  '/',
  validate(bookingsValidation.listBookingsSchema),
  bookingsController.listBookings
);

router.get(
  '/:id',
  validate(bookingsValidation.idParamSchema),
  bookingsController.getBookingById
);

router.patch(
  '/:id/status',
  validate(bookingsValidation.updateBookingStatusSchema),
  bookingsController.updateBookingStatus
);

// GET live status of an active booking
router.get(
  '/:id/live',
  validate(bookingsValidation.idParamSchema),
  bookingsController.getLiveStatus
);

// PATCH extend an active booking
router.patch(
  '/:id/extend',
  validate(bookingsValidation.idParamSchema),
  bookingsController.extendBooking
);

export default router;
