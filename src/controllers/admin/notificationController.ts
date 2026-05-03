import { Request, Response } from 'express';
import { supabase } from '../../config/supabase';

export async function getNotifications(_req: Request, res: Response): Promise<void> {
    try {
        const { data: notifications, error } = await supabase
            .from('notifications')
            .select('*')
            .order('createdAt', { ascending: false });

        if (error) throw error;

        res.json({ success: true, data: notifications });
    } catch (error) {
        console.error('Error getting notifications:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
}

export async function getNotificationById(req: Request, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        const { data: notification, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !notification) {
            res.status(404).json({ success: false, error: 'Notification not found' });
            return;
        }

        res.json({
            success: true,
            data: notification,
        });
    } catch (error) {
        console.error('Error getting notification:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
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
            scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
            status: scheduledAt ? 'scheduled' : 'draft',
            stats: {
                sent: 0,
                opened: 0,
                clicked: 0,
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const { data: notification, error } = await supabase
            .from('notifications')
            .insert(newNotification)
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({
            success: true,
            data: notification,
        });
    } catch (error) {
        console.error('Error creating notification:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
}

export async function updateNotification(req: Request, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        const updates = req.body;

        if (updates.scheduledAt) updates.scheduledAt = new Date(updates.scheduledAt).toISOString();
        updates.updatedAt = new Date().toISOString();

        const { data: notification, error } = await supabase
            .from('notifications')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            data: notification,
        });
    } catch (error) {
        console.error('Error updating notification:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
}

export async function deleteNotification(req: Request, res: Response): Promise<void> {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.json({ success: true, message: 'Notification deleted successfully' });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
}

export async function sendNotification(req: Request, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        // In a real app, you'd trigger a push/email service here
        const { data: notification, error } = await supabase
            .from('notifications')
            .update({ status: 'sent', updatedAt: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        res.json({ success: true, data: notification });
    } catch (error) {
        console.error('Error sending notification:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
}

export async function scheduleNotification(req: Request, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        const { scheduledAt } = req.body;
        const { data: notification, error } = await supabase
            .from('notifications')
            .update({ 
                status: 'scheduled', 
                scheduledAt: new Date(scheduledAt).toISOString(),
                updatedAt: new Date().toISOString() 
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        res.json({ success: true, data: notification });
    } catch (error) {
        console.error('Error scheduling notification:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
}

export async function getNotificationStats(req: Request, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        const { data: notification, error } = await supabase
            .from('notifications')
            .select('stats')
            .eq('id', id)
            .single();

        if (error) throw error;
        res.json({ success: true, data: notification.stats });
    } catch (error) {
        console.error('Error getting notification stats:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
}
