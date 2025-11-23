import { Router } from 'express';
import {
  getDashboardStats,
  getRevenueAnalytics,
  getOrderAnalytics,
  getProductAnalytics,
  getCustomerAnalytics,
} from '../../../controllers/admin/analyticsController';

const router = Router();

// GET /api/v1/admin/analytics/dashboard - Get dashboard statistics
router.get('/dashboard', getDashboardStats);

// GET /api/v1/admin/analytics/revenue - Get revenue analytics
router.get('/revenue', getRevenueAnalytics);

// GET /api/v1/admin/analytics/orders - Get order analytics
router.get('/orders', getOrderAnalytics);

// GET /api/v1/admin/analytics/products - Get product performance analytics
router.get('/products', getProductAnalytics);

// GET /api/v1/admin/analytics/customers - Get customer analytics
router.get('/customers', getCustomerAnalytics);

export default router;

