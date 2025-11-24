import { Request, Response } from 'express';
import { db } from '../../config/firestore';

function convertTimestamp(data: any): any {
    if (!data) return null;
    const converted: any = { ...data };
    Object.keys(converted).forEach((key) => {
        if (converted[key] && typeof converted[key] === 'object' && converted[key].toDate) {
            converted[key] = converted[key].toDate();
        }
    });
    return converted;
}

export async function getNotifications(_req: Request, res: Response): Promise<void> {
    try {
        const snapshot = await db.collection('notifications').orderBy('createdAt', 'desc').get();
        const notifications = snapshot.docs.map((doc: any) => ({
            id: doc.id,
            ...convertTimestamp(doc.data()),
        }));

        res.json({ success: true, data: notifications });
    } catch (error) {
        console.error('Error getting notifications:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

export async function getNotificationById(req: Request, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        const doc = await db.collection('notifications').doc(id).get();

        if (!doc.exists) {
            res.status(404).json({ error: 'Notification not found' });
            return;
        }

        res.json({
            success: true,
            data: { id: doc.id, ...convertTimestamp(doc.data()) },
        });
    } catch (error) {
        console.error('Error getting notification:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

export async function createNotification(req: Request, res: Response): Promise<void> {
    try {
        const { title, message, type, target, recipients, scheduledAt } = req.body;

        const newNotification = {
            title,
            message,
            type,
            target,
            recipients: recipients || [],
            scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
            status: scheduledAt ? 'scheduled' : 'draft',
            stats: {
                sent: 0,
                opened: 0,
                clicked: 0,
            },
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const docRef = await db.collection('notifications').add(newNotification);

        res.status(201).json({
            success: true,
            data: { id: docRef.id, ...newNotification },
        });
    } catch (error) {
        console.error('Error creating notification:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

export async function updateNotification(req: Request, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        const updates = req.body;

        if (updates.scheduledAt) updates.scheduledAt = new Date(updates.scheduledAt);
        updates.updatedAt = new Date();

        await db.collection('notifications').doc(id).update(updates);

        const updatedDoc = await db.collection('notifications').doc(id).get();

        res.json({
            success: true,
            data: { id: updatedDoc.id, ...convertTimestamp(updatedDoc.data()) },
        });
    } catch (error) {
        console.error('Error updating notification:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

export async function deleteNotification(req: Request, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        await db.collection('notifications').doc(id).delete();
        res.json({ success: true, message: 'Notification deleted' });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

export async function sendNotification(req: Request, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        const docRef = db.collection('notifications').doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            res.status(404).json({ error: 'Notification not found' });
            return;
        }

        // Logic to send notification would go here (e.g., FCM, email)
        // For now, just update status
        await docRef.update({
            status: 'sent',
            sentAt: new Date(),
            updatedAt: new Date(),
        });

        const updatedDoc = await docRef.get();
        res.json({
            success: true,
            data: { id: updatedDoc.id, ...convertTimestamp(updatedDoc.data()) },
        });
    } catch (error) {
        console.error('Error sending notification:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

export async function scheduleNotification(req: Request, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        const { scheduledAt } = req.body;

        if (!scheduledAt) {
            res.status(400).json({ error: 'Scheduled time is required' });
            return;
        }

        await db.collection('notifications').doc(id).update({
            scheduledAt: new Date(scheduledAt),
            status: 'scheduled',
            updatedAt: new Date(),
        });

        const updatedDoc = await db.collection('notifications').doc(id).get();
        res.json({
            success: true,
            data: { id: updatedDoc.id, ...convertTimestamp(updatedDoc.data()) },
        });
    } catch (error) {
        console.error('Error scheduling notification:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

export async function getNotificationStats(req: Request, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        const doc = await db.collection('notifications').doc(id).get();

        if (!doc.exists) {
            res.status(404).json({ error: 'Notification not found' });
            return;
        }

        const data = doc.data();
        res.json({
            success: true,
            data: {
                sentCount: data?.stats?.sent || 0,
                openedCount: data?.stats?.opened || 0,
                clickedCount: data?.stats?.clicked || 0,
                stats: data?.stats,
            },
        });
    } catch (error) {
        console.error('Error getting notification stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
