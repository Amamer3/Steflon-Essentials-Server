import { Router, Request, Response } from 'express';
import { getCurrentUser } from '../../../services/authService';
import { authenticateUser } from '../../../middleware/auth';
import { supabase, supabaseAdmin } from '../../../config/supabase';

const router = Router();

// GET /api/v1/admin/auth/me - Get current admin
router.get('/me', authenticateUser, async (req: Request, res: Response) => {
  try {
    const user = await getCurrentUser(req);
    if (!user || user.role !== 'admin') {
      res.status(403).json({ error: 'Forbidden: Admin access required' });
      return;
    }

    const { password, ...adminProfile } = user as any;
    res.json({ success: true, data: adminProfile });
  } catch (error) {
    console.error('Error getting admin profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/v1/admin/auth/sign-in - Admin login
router.post('/sign-in', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Use Supabase for authentication (anon client is fine for auth)
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      res.status(401).json({
        success: false,
        message: error?.message || 'Authentication failed',
        error: error?.message || 'Authentication failed'
      });
      return;
    }

    // Check if user has admin role in database (using admin client to bypass RLS)
    const { data: userData, error: dbError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', data.user.id)
      .single();

    if (dbError || !userData || userData.role !== 'admin') {
      // User authenticated but is not an admin
      res.status(403).json({
        success: false,
        message: 'Access denied: Admin privileges required',
        error: 'Access denied: Admin privileges required'
      });
      return;
    }

    res.json({
      success: true,
      data: {
        user: data.user,
        session: data.session,
      }
    });

  } catch (error) {
    console.error('Error in admin sign-in:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// POST /api/v1/admin/auth/sign-out - Admin logout
router.post('/sign-out', authenticateUser, async (_req: Request, res: Response) => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    res.json({ success: true, message: 'Signed out successfully' });
  } catch (error) {
    console.error('Error in sign-out:', error);
    res.status(500).json({ success: false, error: 'Sign out failed' });
  }
});

export default router;
