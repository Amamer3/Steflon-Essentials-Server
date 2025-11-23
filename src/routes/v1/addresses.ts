import { Router } from 'express';
import { authenticateUser } from '../../middleware/auth';
import {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from '../../controllers/addressController';

const router = Router();

// All address routes require authentication
router.use(authenticateUser);

// GET /api/v1/addresses - Get user's saved addresses
router.get('/', getAddresses);

// POST /api/v1/addresses - Add new address
router.post('/', addAddress);

// PUT /api/v1/addresses/:id - Update address
router.put('/:id', updateAddress);

// DELETE /api/v1/addresses/:id - Delete address
router.delete('/:id', deleteAddress);

// PUT /api/v1/addresses/:id/set-default - Set address as default
router.put('/:id/set-default', setDefaultAddress);

export default router;

