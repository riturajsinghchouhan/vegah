import { Router } from 'express';
import authenticate from '../../middleware/authenticate.js';
import * as fcmController from './fcm.controller.js';

const router = Router();

// Route to register an FCM device token
router.post('/token', authenticate, fcmController.registerToken);

// Route to deregister an FCM device token (e.g., on logout)
router.delete('/token', authenticate, fcmController.removeToken);

// Admin route to test push notifications
// Note: In a real app, protect this with requireAdmin middleware if available
router.post('/test', authenticate, fcmController.testNotification);

export default router;
