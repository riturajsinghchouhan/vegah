import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDummyKeyForVegahEVs",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "vegah-evs.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "vegah-evs",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "vegah-evs.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1234567890:web:abcdef123456",
};

let messaging = null;

try {
  const app = initializeApp(firebaseConfig);
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    messaging = getMessaging(app);
  }
} catch (error) {
  console.warn("Firebase Messaging initialization fallback:", error.message);
}

export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.log("This browser does not support desktop notifications.");
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('Notification permission granted.');
      if (messaging) {
        const token = await getToken(messaging, {
          vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY || undefined,
        });
        console.log('FCM Registration Token:', token);
        return token;
      }
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error);
  }
  return null;
};

export const onForegroundMessage = (callback) => {
  if (messaging) {
    return onMessage(messaging, (payload) => {
      console.log('Received foreground push message:', payload);
      callback(payload);
    });
  }
  return () => {};
};

export { messaging };
