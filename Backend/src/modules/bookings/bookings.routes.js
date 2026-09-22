import express from 'express';
import * as bookingsController from './bookings.controller.js';
import * as bookingsValidation from './bookings.validation.js';
import validate from '../../middleware/validate.js';
import authenticate from '../../middleware/authenticate.js';
import authorize from '../../middleware/authorize.js';

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
  validate(bookingsValidation.extendBookingSchema),
  bookingsController.extendBooking
);

// --- Rental handover lifecycle ---

// USER declares the vehicle dropped at the hub -> PENDING_RETURN
router.patch(
  '/:id/request-return',
  validate(bookingsValidation.lifecycleNoteSchema),
  bookingsController.requestReturn
);

// ADMIN confirms physical handover -> ACTIVE (starts the trip timer)
router.patch(
  '/:id/confirm-pickup',
  authorize('ADMIN', 'SUPER_ADMIN'),
  validate(bookingsValidation.lifecycleNoteSchema),
  bookingsController.confirmPickup
);

// ADMIN verifies the vehicle is back -> COMPLETED
router.patch(
  '/:id/confirm-return',
  authorize('ADMIN', 'SUPER_ADMIN'),
  validate(bookingsValidation.confirmReturnSchema),
  bookingsController.confirmReturn
);

// ADMIN could not verify the return -> back to ACTIVE/OVERDUE
router.patch(
  '/:id/reject-return',
  authorize('ADMIN', 'SUPER_ADMIN'),
  validate(bookingsValidation.lifecycleNoteSchema),
  bookingsController.rejectReturn
);

export default router;
