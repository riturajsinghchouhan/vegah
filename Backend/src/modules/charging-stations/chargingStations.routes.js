import express from 'express';
import * as chargingStationsController from './chargingStations.controller.js';
import authenticate from '../../middleware/authenticate.js';
import authorize from '../../middleware/authorize.js';

const router = express.Router();

// Public / User Routes (authenticated)
router.get('/', authenticate, chargingStationsController.listChargingStations);
router.get('/:id', authenticate, chargingStationsController.getChargingStationById);

// Admin Only Routes
router.post('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), chargingStationsController.createChargingStation);
router.put('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), chargingStationsController.updateChargingStation);
router.delete('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), chargingStationsController.deleteChargingStation);

export default router;
