import { sendSuccess, sendError } from '../../utils/response.js';
import { 
    upsertFirebaseDeviceToken, 
    removeFirebaseDeviceToken, 
    sendNotificationToOwner 
} from '../../services/firebase.service.js';
import logger from '../../utils/logger.js';

/**
 * Register a new FCM device token for the current user
 */
export const registerToken = async (req, res) => {
    try {
        const { token, platform } = req.body;
        
        if (!token) {
            return sendError(res, 400, 'FCM token is required');
        }

        // Determine ownerType based on the authenticated user's role/context
        // Assuming req.user is populated by requireAuth middleware
        const ownerType = req.user?.role === 'ADMIN' ? 'ADMIN' : 'USER';
        const ownerId = req.user?.id || req.user?._id;

        if (!ownerId) {
            return sendError(res, 401, 'Unauthorized');
        }

        await upsertFirebaseDeviceToken({
            ownerType,
            ownerId,
            token,
            platform
        });

        return sendSuccess(res, 200, 'FCM token registered successfully');
    } catch (error) {
        logger.error(`Error registering FCM token: ${error.message}`);
        return sendError(res, 500, 'Failed to register token');
    }
};

/**
 * Remove an FCM device token for the current user
 */
export const removeToken = async (req, res) => {
    try {
        const { token, platform } = req.body;
        
        if (!token) {
            return sendError(res, 400, 'FCM token is required');
        }

        const ownerType = req.user?.role === 'ADMIN' ? 'ADMIN' : 'USER';
        const ownerId = req.user?.id || req.user?._id;

        if (!ownerId) {
            return sendError(res, 401, 'Unauthorized');
        }

        await removeFirebaseDeviceToken({
            ownerType,
            ownerId,
            token,
            platform
        });

        return sendSuccess(res, 200, 'FCM token removed successfully');
    } catch (error) {
        logger.error(`Error removing FCM token: ${error.message}`);
        return sendError(res, 500, 'Failed to remove token');
    }
};

/**
 * Test push notification endpoint
 */
export const testNotification = async (req, res) => {
    try {
        const ownerType = req.user?.role === 'ADMIN' ? 'ADMIN' : 'USER';
        const ownerId = req.user?.id || req.user?._id;

        if (!ownerId) {
            return sendError(res, 401, 'Unauthorized');
        }

        const response = await sendNotificationToOwner({
            ownerType,
            ownerId,
            payload: {
                title: 'Test Notification 🚀',
                body: 'This is a test notification from Vegah! If you are seeing this, push notifications are working perfectly.',
                data: { test: 'true' }
            }
        });

        return sendSuccess(res, 200, 'Test notification dispatched', response);
    } catch (error) {
        logger.error(`Error sending test notification: ${error.message}`);
        return sendError(res, 500, 'Failed to send test notification');
    }
};
