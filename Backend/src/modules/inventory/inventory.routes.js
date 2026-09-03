import express from 'express';
import * as inventoryController from './inventory.controller.js';
import * as inventoryValidation from './inventory.validation.js';
import validate from '../../middleware/validate.js';
import authenticate from '../../middleware/authenticate.js';
import authorize from '../../middleware/authorize.js';

const router = express.Router();

// Admin only routes for inventory management
router.use(authenticate, authorize('ADMIN', 'SUPER_ADMIN'));

router.patch(
  '/vehicles/:id/status',
  validate(inventoryValidation.updateStatusSchema),
  inventoryController.updateVehicleStatus
);

router.get(
  '/zones/:zoneId/availability',
  validate(inventoryValidation.zoneAvailabilitySchema),
  inventoryController.getZoneAvailability
);

router.get(
  '/zones/availability',
  inventoryController.getAllZonesAvailability
);

export default router;
