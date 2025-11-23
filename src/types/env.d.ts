declare namespace NodeJS {
  interface ProcessEnv {
    // Server
    PORT?: string;
    NODE_ENV?: 'development' | 'production' | 'test';
    
    // BetterAuth
    BETTER_AUTH_SECRET: string;
    BETTER_AUTH_URL: string;
    
    // Firestore
    FIREBASE_PROJECT_ID: string;
    FIREBASE_PRIVATE_KEY: string;
    FIREBASE_CLIENT_EMAIL: string;
  }
}

