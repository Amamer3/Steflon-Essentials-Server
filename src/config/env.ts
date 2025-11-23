import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  BETTER_AUTH_SECRET: z.string().min(32, 'BETTER_AUTH_SECRET must be at least 32 characters'),
  BETTER_AUTH_URL: z.string().url('BETTER_AUTH_URL must be a valid URL'),
  FIREBASE_PROJECT_ID: z.string().trim().min(1, 'FIREBASE_PROJECT_ID is required and cannot be empty'),
  FIREBASE_PRIVATE_KEY: z.string().trim().min(1, 'FIREBASE_PRIVATE_KEY is required and cannot be empty'),
  FIREBASE_CLIENT_EMAIL: z.string().trim().email('FIREBASE_CLIENT_EMAIL must be a valid email'), 
});

export type Env = z.infer<typeof envSchema>;

let env: Env;

// Pre-process environment variables to handle empty strings
const processedEnv = Object.fromEntries(
  Object.entries(process.env).map(([key, value]) => [
    key,
    value === '' ? undefined : value,
  ])
);

try {
  env = envSchema.parse(processedEnv);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('❌ Environment variable validation failed:');
    console.error('');
    error.errors.forEach((err) => {
      const varName = err.path.join('.');
      const currentValue = processedEnv[varName];
      console.error(`  - ${varName}: ${err.message}`);
      if (currentValue === undefined || currentValue === '') {
        console.error(`    Current value: (empty or undefined)`);
      } else {
        console.error(`    Current value: ${currentValue.substring(0, 50)}${currentValue.length > 50 ? '...' : ''}`);
      }
    });
    console.error('');
    console.error('Please check your .env file and ensure all required variables have values.');
    process.exit(1);
  }
  throw error;
}

export { env };

