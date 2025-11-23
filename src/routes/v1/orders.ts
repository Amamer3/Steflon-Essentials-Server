import { Router } from 'express';
import { authenticateUser } from '../../middleware/auth';
import {
  createOrder,
  getOrders,
  getOrderById,
  cancelOrder,
  reorderItems,
} from '../../controllers/orderController';

const router = Router();

// All order routes require authentication
router.use(authenticateUser);

// POST /api/v1/orders - Create new order from cart
router.post('/', createOrder);

// GET /api/v1/orders - Get user's order history
router.get('/', getOrders);

// GET /api/v1/orders/:id - Get single order details
router.get('/:id', getOrderById);

// POST /api/v1/orders/:id/cancel - Cancel an order
router.post('/:id/cancel', cancelOrder);

// POST /api/v1/orders/:id/reorder - Reorder items from previous order
router.post('/:id/reorder', reorderItems);

export default router;

