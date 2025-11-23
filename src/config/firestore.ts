import admin from 'firebase-admin';
import { env } from './env';

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: env.FIREBASE_PROJECT_ID,
        privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
      }),
    });
    console.log('✅ Firebase Admin initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin:');
    console.error(error);
    throw new Error('Firebase Admin initialization failed. Check your environment variables.');
  }
}

// Get Firestore instance
export const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });

// Verify Firestore is available
if (!db) {
  throw new Error('Firestore database instance is not available');
}

export { admin };

