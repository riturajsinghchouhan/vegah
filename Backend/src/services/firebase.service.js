import firebaseApp from '../config/firebase.js'; // exported from config
import admin from 'firebase-admin'; // fallback to get enum values if needed, but methods are on firebaseApp
import User from '../models/User.js';
import Admin from '../models/Admin.js';
import logger from '../utils/logger.js';

// Configuration
const OWNER_TOKEN_FIELDS = {
    web: 'fcmTokens',
    mobile: 'fcmTokenMobile'
};

const sanitizeString = (value) => String(value ?? '').trim();

const normalizeTokenList = (tokens = []) => {
    if (!Array.isArray(tokens)) return [];
    const validTokens = tokens.map(t => sanitizeString(t)).filter(t => t.length > 5);
    return [...new Set(validTokens)];
};

const getOwnerModel = (ownerType) => {
    const type = sanitizeString(ownerType).toUpperCase();
    if (type === 'USER') return User;
    if (type === 'ADMIN') return Admin;
    return null;
};

const getTokenFieldForPlatform = (platform) => {
    if (String(platform || '').toLowerCase() === 'mobile') return OWNER_TOKEN_FIELDS.mobile;
    return OWNER_TOKEN_FIELDS.web;
};

export const listOwnerTokens = async ({ ownerType, ownerId, platform }) => {
    if (!ownerType || !ownerId) return [];
    
    const model = getOwnerModel(ownerType);
    if (!model) return [];
    
    const doc = await model.findById(ownerId).select('+fcmTokens +fcmTokenMobile').lean();
    if (!doc) return [];
    
    if (platform) {
        return normalizeTokenList(doc[getTokenFieldForPlatform(platform)]);
    }
    
    const webTokens = normalizeTokenList(doc.fcmTokens);
    const mobileTokens = normalizeTokenList(doc.fcmTokenMobile);
    return normalizeTokenList([...webTokens, ...mobileTokens]);
};

export const upsertFirebaseDeviceToken = async ({ ownerType, ownerId, token, platform }) => {
    const normalizedToken = sanitizeString(token);
    if (!ownerType || !ownerId || !normalizedToken) {
        throw new Error('ownerType, ownerId, and token are required.');
    }
    
    const model = getOwnerModel(ownerType);
    if (!model) throw new Error(`Unsupported owner type: ${ownerType}`);
    
    const doc = await model.findById(ownerId);
    if (!doc) return { success: false, error: 'Owner not found' };
    
    const field = getTokenFieldForPlatform(platform);
    const currentTokens = Array.isArray(doc[field]) ? doc[field] : [];
    
    if (!currentTokens.includes(normalizedToken)) {
        doc[field] = normalizeTokenList([...currentTokens, normalizedToken]);
        await doc.save();
    }
    
    return { success: true };
};

export const removeFirebaseDeviceToken = async ({ ownerType, ownerId, token, platform }) => {
    const normalizedToken = sanitizeString(token);
    if (!ownerType || !ownerId || !normalizedToken) {
        throw new Error('ownerType, ownerId, and token are required.');
    }
    
    const model = getOwnerModel(ownerType);
    if (!model) throw new Error(`Unsupported owner type: ${ownerType}`);
    
    const doc = await model.findById(ownerId);
    if (!doc) return { success: false };
    
    if (platform) {
        const field = getTokenFieldForPlatform(platform);
        doc[field] = normalizeTokenList((Array.isArray(doc[field]) ? doc[field] : []).filter(t => t !== normalizedToken));
    } else {
        doc.fcmTokens = normalizeTokenList((Array.isArray(doc.fcmTokens) ? doc.fcmTokens : []).filter(t => t !== normalizedToken));
        doc.fcmTokenMobile = normalizeTokenList((Array.isArray(doc.fcmTokenMobile) ? doc.fcmTokenMobile : []).filter(t => t !== normalizedToken));
    }
    
    await doc.save();
    return { success: true };
};

export const sendPushNotification = async (tokens, payload = {}) => {
    if (!firebaseApp) {
        logger.debug('Push Notification skipped: Firebase Admin SDK not initialized.');
        return { successCount: 0, failureCount: 0, results: [] };
    }
    
    const uniqueTokens = normalizeTokenList(tokens);
    if (uniqueTokens.length === 0) {
        return { successCount: 0, failureCount: 0, results: [] };
    }
    
    try {
        const message = {
            notification: {
                title: payload.title || 'Notification',
                body: payload.body || ''
            },
            data: payload.data || {},
            tokens: uniqueTokens
        };
        
        const response = await firebaseApp.messaging().sendEachForMulticast(message);
        
        // Map the responses to identify tokens to remove
        const results = response.responses.map((res, idx) => {
            const token = uniqueTokens[idx];
            if (res.success) {
                return { token, ok: true };
            }
            const errorCode = res.error?.code;
            // Identifies unregistered / expired tokens that should be cleared
            const remove = errorCode === 'messaging/invalid-registration-token' || 
                           errorCode === 'messaging/registration-token-not-registered' ||
                           errorCode === 'messaging/invalid-argument';
            return {
                token,
                ok: false,
                remove,
                error: errorCode
            };
        });
        
        return { 
            successCount: response.successCount, 
            failureCount: response.failureCount, 
            results 
        };
    } catch (error) {
        logger.error(`FCM Multicast error: ${error.message}`);
        return { successCount: 0, failureCount: uniqueTokens.length, results: [] };
    }
};

export const sendNotificationToOwner = async ({ ownerType, ownerId, payload, platform } = {}) => {
    const tokens = await listOwnerTokens({ ownerType, ownerId, platform });
    if (!tokens.length) {
        return { successCount: 0, failureCount: 0, results: [] };
    }
    
    try {
        const response = await sendPushNotification(tokens, payload);
        const invalidTokens = (response.results || [])
            .filter(item => !item.ok && item.remove)
            .map(item => item.token);
            
        // Automatically cleanup dead tokens to maintain database hygiene
        if (invalidTokens.length > 0) {
            const model = getOwnerModel(ownerType);
            const doc = model ? await model.findById(ownerId) : null;
            if (doc) {
                const fieldNames = platform ? [getTokenFieldForPlatform(platform)] : [OWNER_TOKEN_FIELDS.web, OWNER_TOKEN_FIELDS.mobile];
                for (const field of fieldNames) {
                    doc[field] = normalizeTokenList((Array.isArray(doc[field]) ? doc[field] : []).filter(t => !invalidTokens.includes(t)));
                }
                await doc.save();
                logger.info(`Cleaned up ${invalidTokens.length} dead FCM tokens for ${ownerType}:${ownerId}`);
            }
        }
        
        return response;
    } catch (error) {
        logger.warn(`FCM push failed for ${ownerType}:${ownerId}: ${error.message}`);
        return { successCount: 0, failureCount: tokens.length, error: error.message };
    }
};

export const sendNotificationToOwners = async (targets = [], payload = {}) => {
    // Deduplicate targets so a user with multiple roles isn't notified twice
    const uniqueTargets = Array.isArray(targets) 
        ? [...new Map(targets.filter(t => t?.ownerType && t?.ownerId).map(t => [`${t.ownerType}:${t.ownerId}`, t])).values()]
        : [];
        
    const results = [];
    for (const target of uniqueTargets) {
        results.push(await sendNotificationToOwner({
            ownerType: target.ownerType,
            ownerId: target.ownerId,
            platform: target.platform,
            payload
        }));
    }
    return results;
};
