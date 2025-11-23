import { Router } from 'express';
import { authenticateUser } from '../../middleware/auth';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} from '../../controllers/cartController';

const router = Router();

// All cart routes require authentication
router.use(authenticateUser);

// GET /api/v1/cart - Get user's cart
router.get('/', getCart);

// POST /api/v1/cart/add - Add item to cart
router.post('/add', addToCart);

// PUT /api/v1/cart/update/:itemId - Update cart item quantity
router.put('/update/:itemId', updateCartItem);

// DELETE /api/v1/cart/remove/:itemId - Remove item from cart
router.delete('/remove/:itemId', removeCartItem);

// DELETE /api/v1/cart/clear - Clear entire cart
router.delete('/clear', clearCart);

export default router;

