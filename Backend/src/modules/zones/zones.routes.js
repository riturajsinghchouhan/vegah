import express from 'express';
import * as zonesController from './zones.controller.js';
import * as zonesValidation from './zones.validation.js';
import validate from '../../middleware/validate.js';
import authenticate from '../../middleware/authenticate.js';
import authorize from '../../middleware/authorize.js';

const router = express.Router();

// All zone routes require authentication and admin role
router.use(authenticate, authorize('ADMIN', 'SUPER_ADMIN'));

router.post(
  '/',
  validate(zonesValidation.createZoneSchema),
  zonesController.createZone
);

router.get(
  '/',
  validate(zonesValidation.listZonesSchema),
  zonesController.listZones
);

router.get(
  '/:id',
  validate(zonesValidation.idParamSchema),
  zonesController.getZoneById
);

router.put(
  '/:id',
  validate(zonesValidation.updateZoneSchema),
  zonesController.updateZone
);

router.delete(
  '/:id',
  validate(zonesValidation.idParamSchema),
  zonesController.deleteZone
);

export default router;
