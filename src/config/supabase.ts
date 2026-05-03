import { createClient } from '@supabase/supabase-js';
import { env } from './env';

if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY || !env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase environment variables');
}

// Client for public operations (using anon key)
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

// Client for admin operations (using service role key)
// This bypasses Row Level Security (RLS) - use with caution!
export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
