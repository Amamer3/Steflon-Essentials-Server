import { Request } from 'express';
import { supabase, supabaseAdmin } from '../config/supabase';

/**
 * Get current user from request session using Supabase Auth
 */
export async function getCurrentUser(req: Request) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      // Also check for cookie-based session if applicable
      // But standard for APIs is Authorization header
      return null;
    }

    const token = authHeader.split(' ')[1];
    if (!token) return null;

    // Get user from Supabase Auth
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return null;
    }

    // Get full user data from Supabase 'users' table
    const { data: userData, error: dbError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (dbError) {
      console.warn('User data not found in database for ID:', user.id);
      // Return basic auth user data if DB record is missing
      return {
        id: user.id,
        email: user.email!,
        role: (user.app_metadata?.role as string) || 'user',
      };
    }

    return {
      id: user.id,
      email: user.email || userData?.email,
      name: userData?.name,
      role: userData?.role || 'user',
      ...userData,
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

