import { Router } from 'express';
import { authenticateUser } from '../../middleware/auth';
import { getUserProfile, updateUserProfile } from '../../controllers/profileController';

const router = Router();

// GET /api/v1/user/profile - Get current user profile
router.get('/profile', authenticateUser, getUserProfile);

// PUT /api/v1/user/profile - Update user profile
router.put('/profile', authenticateUser, updateUserProfile);

export default router;

