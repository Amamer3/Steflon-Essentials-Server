import { Request, Response } from 'express';
import { supabase } from '../../config/supabase';

export async function getAdminOrders(req: Request, res: Response): Promise<void> {
  try {
    const { page = '1', limit = '20', status, search, dateFrom, dateTo } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;

    let query = supabase.from('orders').select('*', { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`orderNumber.ilike.%${search}%,userId.ilike.%${search}%`);
    }

    if (dateFrom) {
      query = query.gte('createdAt', new Date(dateFrom as string).toISOString());
    }
    if (dateTo) {
      query = query.lte('createdAt', new Date(dateTo as string).toISOString());
    }

    query = query.order('createdAt', { ascending: false });
    query = query.range(from, to);

    const { data: orders, error, count } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: orders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limitNum),
      },
    });
  } catch (error) {
    console.error('Error getting admin orders:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

export async function getAdminOrderById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !order) {
      res.status(404).json({ success: false, error: 'Order not found' });
      return;
    }

    res.json({ success: true, data: order });
  } catch (error) {
    console.error('Error getting admin order:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

export async function updateOrderStatus(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Refunded'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ success: false, error: 'Invalid status' });
      return;
    }

    const { data: order, error } = await supabase
      .from('orders')
      .update({
        status,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data: order });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

export async function deleteOrder(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ success: true, message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

export async function exportOrders(_req: Request, res: Response): Promise<void> {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) throw error;
    res.json({ success: true, data: orders });
  } catch (error) {
    console.error('Error exporting orders:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
