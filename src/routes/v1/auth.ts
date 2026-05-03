import { Router, Request, Response } from 'express';
import { authenticateUser } from '../../middleware/auth';
import { getUserProfile, updateUserProfile } from '../../controllers/profileController';
import { supabase } from '../../config/supabase';

const router = Router();

// POST /api/v1/auth/sign-up - User registration
router.post('/sign-up', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
        },
      },
    });

    if (error) {
      res.status(400).json({ success: false, error: error.message });
      return;
    }

    // Create user profile in 'users' table
    if (data.user) {
      const { error: dbError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          email: email,
          name: name,
          role: 'user',
        });
      
      if (dbError) {
        console.error('Error creating user profile:', dbError);
      }
    }

    res.status(201).json({
      success: true,
      data: {
        user: data.user,
        session: data.session,
      },
    });
  } catch (error) {
    console.error('Error in sign-up:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/v1/auth/sign-in - User login
router.post('/sign-in', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      res.status(401).json({ success: false, error: error.message });
      return;
    }

    res.json({
      success: true,
      data: {
        user: data.user,
        session: data.session,
      },
    });
  } catch (error) {
    console.error('Error in sign-in:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/v1/auth/sign-out - User logout
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

// Test route for auth
router.get('/test-auth', (_req, res) => {
  res.json({ success: true, message: 'Auth router is working!' });
});

// GET /api/v1/auth/profile - Get current user profile
router.get('/profile', authenticateUser, getUserProfile);

// Alias for profile
router.get('/me', authenticateUser, getUserProfile);

// PUT /api/v1/auth/profile - Update user profile
router.put('/profile', authenticateUser, updateUserProfile);

export default router;

