import { Request, Response } from 'express';
import { db } from '../../config/firestore';
import { Coupon } from '../../types';

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

export async function getCoupons(req: Request, res: Response): Promise<void> {
    try {
        const { page = '1', limit = '20', status, search } = req.query;
        const pageNum = parseInt(page as string, 10);
        const limitNum = parseInt(limit as string, 10);
        const skip = (pageNum - 1) * limitNum;

        let query = db.collection('coupons') as any;

        if (status) {
            query = query.where('status', '==', status);
        }

        const snapshot = await query.get();
        let coupons = snapshot.docs.map((doc: any) => ({
            id: doc.id,
            ...convertTimestamp(doc.data()),
        })) as Coupon[];

        if (search) {
            const searchLower = (search as string).toLowerCase();
            coupons = coupons.filter(
                (c) =>
                    c.code.toLowerCase().includes(searchLower) ||
                    c.name.toLowerCase().includes(searchLower)
            );
        }

        // Sort by createdAt desc
        coupons.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        const paginatedCoupons = coupons.slice(skip, skip + limitNum);

        res.json({
            success: true,
            data: paginatedCoupons,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: coupons.length,
                totalPages: Math.ceil(coupons.length / limitNum),
            },
        });
    } catch (error) {
        console.error('Error getting coupons:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

export async function getCouponById(req: Request, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        const doc = await db.collection('coupons').doc(id).get();

        if (!doc.exists) {
            res.status(404).json({ error: 'Coupon not found' });
            return;
        }

        const coupon = {
            id: doc.id,
            ...convertTimestamp(doc.data()),
        };

        res.json({ success: true, data: coupon });
    } catch (error) {
        console.error('Error getting coupon:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

export async function createCoupon(req: Request, res: Response): Promise<void> {
    try {
        const {
            code,
            name,
            type,
            value,
            minPurchase,
            maxDiscount,
            usageLimit,
            validFrom,
            validUntil,
            status = 'active',
        } = req.body;

        // Check if code exists
        const existing = await db.collection('coupons').where('code', '==', code).get();
        if (!existing.empty) {
            res.status(400).json({ error: 'Coupon code already exists' });
            return;
        }

        const newCoupon = {
            code,
            name,
            type,
            value,
            minPurchase,
            maxDiscount,
            usageLimit,
            usedCount: 0,
            validFrom: new Date(validFrom),
            validUntil: new Date(validUntil),
            status,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const docRef = await db.collection('coupons').add(newCoupon);

        res.status(201).json({
            success: true,
            data: { id: docRef.id, ...newCoupon },
        });
    } catch (error) {
        console.error('Error creating coupon:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

export async function updateCoupon(req: Request, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Handle date conversions
        if (updates.validFrom) updates.validFrom = new Date(updates.validFrom);
        if (updates.validUntil) updates.validUntil = new Date(updates.validUntil);

        updates.updatedAt = new Date();

        await db.collection('coupons').doc(id).update(updates);

        const updatedDoc = await db.collection('coupons').doc(id).get();

        res.json({
            success: true,
            data: { id: updatedDoc.id, ...convertTimestamp(updatedDoc.data()) },
        });
    } catch (error) {
        console.error('Error updating coupon:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

export async function deleteCoupon(req: Request, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        await db.collection('coupons').doc(id).delete();
        res.json({ success: true, message: 'Coupon deleted' });
    } catch (error) {
        console.error('Error deleting coupon:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
