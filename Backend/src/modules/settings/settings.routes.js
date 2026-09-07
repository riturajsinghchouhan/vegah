import express from 'express';
import authenticate from '../../middleware/authenticate.js';
import authorize from '../../middleware/authorize.js';
import * as settingsController from './settings.controller.js';

const router = express.Router();

router.get('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), settingsController.getSettings);
router.put('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), settingsController.updateSettings);

export default router;
