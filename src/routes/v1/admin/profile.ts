import { Router } from 'express';
import {
  getAdminProfile,
  updateAdminProfile,
  changeAdminPassword,
} from '../../../controllers/admin/profileController';

const router = Router();

// GET /api/v1/admin/profile - Get admin profile
router.get('/', getAdminProfile);

// PUT /api/v1/admin/profile - Update admin profile
router.put('/', updateAdminProfile);

// PUT /api/v1/admin/profile/change-password - Change admin password
router.put('/change-password', changeAdminPassword);

export default router;

