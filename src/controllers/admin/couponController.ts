import { Request, Response } from 'express';
import { supabaseAdmin as supabase } from '../../config/supabase';

export async function getCoupons(req: Request, res: Response): Promise<void> {
    try {
        const { page = '1', limit = '20', status, search } = req.query;
        const pageNum = parseInt(page as string, 10);
        const limitNum = parseInt(limit as string, 10);
        const from = (pageNum - 1) * limitNum;
        const to = from + limitNum - 1;

        let query = supabase.from('coupons').select('*', { count: 'exact' });

        if (status) {
            query = query.eq('status', status);
        }

        if (search) {
            query = query.or(`code.ilike.%${search}%,name.ilike.%${search}%`);
        }

        query = query.order('created_at', { ascending: false });
        query = query.range(from, to);

        const { data: coupons, error, count } = await query;

        if (error) throw error;

        res.json({
            success: true,
            data: coupons,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / limitNum),
            },
        });
    } catch (error) {
        console.error('Error getting coupons:', error);
        res.status(500).json({ 
            success: false, 
            error: { message: 'Internal server error' },
            message: 'Internal server error'
        });
    }
}

export async function getCouponById(req: Request, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        const { data: coupon, error } = await supabase
            .from('coupons')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !coupon) {
            res.status(404).json({ 
                success: false, 
                error: { message: 'Coupon not found' },
                message: 'Coupon not found'
            });
            return;
        }

        res.json({ success: true, data: coupon });
    } catch (error) {
        console.error('Error getting coupon:', error);
        res.status(500).json({ 
            success: false, 
            error: { message: 'Internal server error' },
            message: 'Internal server error'
        });
    }
}

export async function createCoupon(req: Request, res: Response): Promise<void> {
    try {
        const couponData = req.body;

        const { data: coupon, error } = await supabase
            .from('coupons')
            .insert({
                ...couponData,
                status: couponData.status || 'active',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({ success: true, data: coupon });
    } catch (error) {
        console.error('Error creating coupon:', error);
        res.status(500).json({ 
            success: false, 
            error: { message: 'Internal server error' },
            message: 'Internal server error'
        });
    }
}

export async function updateCoupon(req: Request, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        const couponData = req.body;

        const { data: coupon, error } = await supabase
            .from('coupons')
            .update({
                ...couponData,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        res.json({ success: true, data: coupon });
    } catch (error) {
        console.error('Error updating coupon:', error);
        res.status(500).json({ 
            success: false, 
            error: { message: 'Internal server error' },
            message: 'Internal server error'
        });
    }
}

export async function deleteCoupon(req: Request, res: Response): Promise<void> {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('coupons')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.json({ success: true, message: 'Coupon deleted successfully' });
    } catch (error) {
        console.error('Error deleting coupon:', error);
        res.status(500).json({ 
            success: false, 
            error: { message: 'Internal server error' },
            message: 'Internal server error'
        });
    }
}
