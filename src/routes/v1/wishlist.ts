import { Router } from 'express';
import { authenticateUser } from '../../middleware/auth';
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  checkWishlist,
} from '../../controllers/wishlistController';

const router = Router();

// All wishlist routes require authentication
router.use(authenticateUser);

// GET /api/v1/wishlist - Get user's wishlist
router.get('/', getWishlist);

// POST /api/v1/wishlist/add - Add product to wishlist
router.post('/add', addToWishlist);

// DELETE /api/v1/wishlist/remove/:productId - Remove product from wishlist
router.delete('/remove/:productId', removeFromWishlist);

// GET /api/v1/wishlist/check/:productId - Check if product is in wishlist
router.get('/check/:productId', checkWishlist);

export default router;

