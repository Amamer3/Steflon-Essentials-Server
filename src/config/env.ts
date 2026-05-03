import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const envSchema = z.object({
  PORT: z.string().default('5000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  // Supabase
  SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL'),
  SUPABASE_ANON_KEY: z.string().min(1, 'SUPABASE_ANON_KEY is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
  FRONTEND_URL: z.string().url('FRONTEND_URL must be a valid URL').optional(),
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

