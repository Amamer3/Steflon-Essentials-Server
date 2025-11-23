import { Router } from 'express';
import { authenticateUser, requireAdmin } from '../../middleware/auth';
import adminAuthRoutes from './admin/auth';
import adminProductRoutes from './admin/products';
import adminOrderRoutes from './admin/orders';
import adminCustomerRoutes from './admin/customers';
import adminAnalyticsRoutes from './admin/analytics';
import adminProfileRoutes from './admin/profile';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticateUser);
router.use(requireAdmin);

// Admin authentication routes
router.use('/auth', adminAuthRoutes);

// Admin management routes
router.use('/products', adminProductRoutes);
router.use('/orders', adminOrderRoutes);
router.use('/customers', adminCustomerRoutes);
router.use('/analytics', adminAnalyticsRoutes);
router.use('/profile', adminProfileRoutes);

export default router;

