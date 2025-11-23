import { Router } from 'express';
import { authenticateUser } from '../../middleware/auth';
import {
  getUserProfile,
  updateUserProfile,
  changePassword,
} from '../../controllers/profileController';

const router = Router();

// All profile routes require authentication
router.use(authenticateUser);

// GET /api/v1/profile - Get user profile
router.get('/', getUserProfile);

// PUT /api/v1/profile - Update user profile
router.put('/', updateUserProfile);

// PUT /api/v1/profile/change-password - Change password
router.put('/change-password', changePassword);

export default router;

