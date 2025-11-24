import { Router } from 'express';
import { getDashboardStats, getRecentOrders } from '../../../controllers/admin/analyticsController';

const router = Router();

router.get('/stats', getDashboardStats);
router.get('/recent-orders', getRecentOrders);

export default router;
