import express from 'express';
import * as electicaController from './electica.controller.js';
import authenticate from '../../middleware/authenticate.js';

const router = express.Router();

// Apply authentication middleware to protect all Electica routes
router.use(authenticate);

// Station routes
router.get('/stations', electicaController.getStations);
router.get('/station/:id', electicaController.getStation);
router.get('/station', electicaController.getStation);
router.get('/pods', electicaController.getPods);

// Battery routes
router.get('/batteries', electicaController.getBatteries);
router.get('/batteries/:id/telemetry/latest', electicaController.getLatestTelemetry);
router.get('/batteries/:id/telemetry', electicaController.getBatteryTelemetry);
router.get('/batteries/:id', electicaController.getBattery);

// Swap activity routes
router.get('/swaps', electicaController.getSwaps);

export default router;
