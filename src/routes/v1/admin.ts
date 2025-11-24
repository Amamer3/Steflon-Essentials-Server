import { Router } from 'express';
import { authenticateUser, requireAdmin } from '../../middleware/auth';
import adminAuthRoutes from './admin/auth';
import adminProductRoutes from './admin/products';
import adminOrderRoutes from './admin/orders';
import adminCustomerRoutes from './admin/customers';
import adminAnalyticsRoutes from './admin/analytics';
import adminProfileRoutes from './admin/profile';

import adminCouponRoutes from './admin/coupons';
import adminNotificationRoutes from './admin/notifications';

const router = Router();

// Admin authentication routes (some are public like sign-in)
router.use('/auth', adminAuthRoutes);

// All other admin routes require authentication and admin role
router.use(authenticateUser);
router.use(requireAdmin);

// Admin management routes
router.use('/products', adminProductRoutes);
router.use('/orders', adminOrderRoutes);
router.use('/customers', adminCustomerRoutes);
router.use('/analytics', adminAnalyticsRoutes);
router.use('/profile', adminProfileRoutes);
import adminDashboardRoutes from './admin/dashboard';

router.use('/dashboard', adminDashboardRoutes);
router.use('/coupons', adminCouponRoutes);
router.use('/notifications', adminNotificationRoutes);

export default router;

