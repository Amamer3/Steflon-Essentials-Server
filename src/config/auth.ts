import { betterAuth } from 'better-auth';
import { db } from './firestore';
import { env } from './env';
import { createFirestoreAdapter } from '../adapters/firestore';

// Verify Firestore is connected before creating adapter factory
if (!db) {
  console.error('❌ Firestore database instance is not available');
  process.exit(1);
}

// Create adapter factory function that BetterAuth expects
// BetterAuth will call this function with options during initialization
const firestoreAdapterFactory = (_options: any) => {
  try {
    const adapter = createFirestoreAdapter(db);
    console.log('✅ Firestore adapter created successfully');
    return adapter;
  } catch (error) {
    console.error('❌ Failed to create Firestore adapter:');
    console.error(error);
    throw new Error('Firestore adapter creation failed. Check your environment variables.');
  }
};

// Initialize BetterAuth with Firestore adapter factory (no SQLite fallback)
export const auth = betterAuth({
  database: firestoreAdapterFactory,
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  basePath: '/api/auth', // Explicitly set the base path for BetterAuth routes
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Set to true if you want email verification
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  trustedOrigins: ['http://localhost:5173'], // Add your trusted origins here when I get on production i should update this with the production URL 
});

