import express from 'express';
import * as inspectionsController from './inspections.controller.js';
import authenticate from '../../middleware/authenticate.js';
import authorize from '../../middleware/authorize.js';

const router = express.Router();

router.use(authenticate, authorize('ADMIN', 'SUPER_ADMIN'));

router.get('/', inspectionsController.listInspections);
router.get('/:id', inspectionsController.getInspectionById);
router.post('/', inspectionsController.createInspection);
router.put('/:id', inspectionsController.updateInspection);

export default router;
