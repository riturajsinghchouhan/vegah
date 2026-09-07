import express from 'express';
import authenticate from '../../middleware/authenticate.js';
import authorize from '../../middleware/authorize.js';
import * as reportsController from './reports.controller.js';

const router = express.Router();

router.get('/analytics', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), reportsController.getReportsData);

export default router;
