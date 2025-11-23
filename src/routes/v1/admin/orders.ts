import { Router } from 'express';
import {
  getAdminOrders,
  getAdminOrderById,
  updateOrderStatus,
  exportOrders,
} from '../../../controllers/admin/orderController';

const router = Router();

// GET /api/v1/admin/orders - Get all orders with filtering
router.get('/', getAdminOrders);

// GET /api/v1/admin/orders/:id - Get single order details
router.get('/:id', getAdminOrderById);

// PUT /api/v1/admin/orders/:id/status - Update order status
router.put('/:id/status', updateOrderStatus);

// GET /api/v1/admin/orders/export - Export orders to CSV/Excel
router.get('/export', exportOrders);

export default router;

