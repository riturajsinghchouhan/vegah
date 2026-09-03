import admin from 'firebase-admin';
import env from './env.js';
import logger from '../utils/logger.js';

let firebaseApp = null;

if (env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    const serviceAccount = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT);
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: env.VITE_FIREBASE_DATABASE_URL
    });
    logger.info('Firebase Admin initialized successfully');
  } catch (error) {
    logger.error(`Firebase initialization error: ${error.message}`);
  }
} else {
  logger.info('Firebase Service Account not provided. Firebase features will be disabled.');
}

export default firebaseApp;
