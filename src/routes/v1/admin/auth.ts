import { Router, Request, Response } from 'express';
import { getCurrentUser } from '../../../services/authService';

const router = Router();

// GET /api/v1/admin/auth/me - Get current admin
router.get('/me', async (req: Request, res: Response) => {
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

export default router;

