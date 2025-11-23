import { Router, Request, Response } from 'express';
import { authenticateUser } from '../../middleware/auth';
import { getCurrentUser } from '../../services/authService';

const router = Router();

// GET /api/v1/user/profile - Get current user profile
router.get('/profile', authenticateUser, async (req: Request, res: Response) => {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Remove sensitive data
    const { password, ...userProfile } = user as any;
    res.json({ success: true, data: userProfile });
  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

