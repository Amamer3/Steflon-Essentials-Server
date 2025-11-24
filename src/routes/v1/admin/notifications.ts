import { Router } from 'express';
import {
    getNotifications,
    getNotificationById,
    createNotification,
    updateNotification,
    deleteNotification,
    sendNotification,
    scheduleNotification,
    getNotificationStats,
} from '../../../controllers/admin/notificationController';

const router = Router();

router.get('/', getNotifications);
router.get('/:id', getNotificationById);
router.post('/', createNotification);
router.put('/:id', updateNotification);
router.delete('/:id', deleteNotification);
router.post('/:id/send', sendNotification);
router.post('/:id/schedule', scheduleNotification);
router.get('/:id/stats', getNotificationStats);

export default router;
