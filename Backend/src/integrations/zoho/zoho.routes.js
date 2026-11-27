import express from 'express';
import authenticate from '../../middleware/authenticate.js';
import authorize from '../../middleware/authorize.js';
import * as zohoController from './zoho.controller.js';

const router = express.Router();

const guard = [authenticate, authorize('ADMIN', 'SUPER_ADMIN')];
// Changing the mapping changes which ledger account real money is filed
// against, and a push creates documents that are filed with the GST portal.
// Both stay with SUPER_ADMIN, matching the ledger's own controls.
const approver = [authenticate, authorize('SUPER_ADMIN')];

router.get('/status', ...guard, zohoController.getStatus);
router.get('/config', ...guard, zohoController.getConfig);
router.get('/lookups', ...guard, zohoController.getLookups);
router.get('/sync', ...guard, zohoController.listSyncRecords);

router.put('/config', ...approver, zohoController.updateConfig);
router.post('/customers/sync', ...approver, zohoController.syncCustomers);
router.post('/push/:kind', ...approver, zohoController.pushPending);
router.post('/sync/:id/retry', ...approver, zohoController.retryRecord);

export default router;
