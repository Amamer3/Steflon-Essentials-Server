import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin as supabase } from '../../config/supabase';

function getDateRange(timeRange: string): { start: string; end: string } {
  const end = new Date();
  let start = new Date();

  switch (timeRange) {
    case '7days':
      start.setDate(end.getDate() - 7);
      break;
    case '30days':
      start.setDate(end.getDate() - 30);
      break;
    case '90days':
      start.setDate(end.getDate() - 90);
      break;
    case '1year':
      start.setFullYear(end.getFullYear() - 1);
      break;
    case 'all':
    default:
      start = new Date(0); // Beginning of time
      break;
  }

  return { start: start.toISOString(), end: end.toISOString() };
}

function getPreviousDateRange(startStr: string, endStr: string): { prevStart: string; prevEnd: string } {
  const start = new Date(startStr);
  const end = new Date(endStr);
  const duration = end.getTime() - start.getTime();
  const prevEnd = new Date(start.getTime());
  const prevStart = new Date(start.getTime() - duration);
  return { prevStart: prevStart.toISOString(), prevEnd: prevEnd.toISOString() };
}

export async function getDashboardStats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { timeRange = '30days' } = req.query;
    const { start, end } = getDateRange(timeRange as string);
    const { prevStart, prevEnd } = getPreviousDateRange(start, end);

    // Current period orders
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .gte('created_at', start)
      .lte('created_at', end);

    if (ordersError) throw ordersError;

    // Previous period orders
    const { data: prevOrders, error: prevOrdersError } = await supabase
      .from('orders')
      .select('*')
      .gte('created_at', prevStart)
      .lte('created_at', prevEnd);

    if (prevOrdersError) throw prevOrdersError;

    // Current stats
    const revenue = (orders || []).reduce((sum: number, order: any) => sum + (order.total || 0), 0);
    const totalOrders = (orders || []).length;
    const totalCustomers = new Set((orders || []).map((o: any) => o.user_id)).size;

    // Previous stats
    const prevRevenue = (prevOrders || []).reduce((sum: number, order: any) => sum + (order.total || 0), 0);
    const prevTotalOrders = (prevOrders || []).length;
    const prevTotalCustomers = new Set((prevOrders || []).map((o: any) => o.user_id)).size;

    // Calculate changes
    const calculateChange = (current: number, prev: number) => {
      if (prev === 0) return current > 0 ? 100 : 0;
      return ((current - prev) / prev) * 100;
    };

    const revenueChange = calculateChange(revenue, prevRevenue);
    const ordersChange = calculateChange(totalOrders, prevTotalOrders);
    const customersChange = calculateChange(totalCustomers, prevTotalCustomers);

    // Total products
    const { count: totalProducts, error: productsError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Active');

    if (productsError) throw productsError;

    res.json({
      success: true,
      data: {
        totalOrders,
        totalRevenue: revenue,
        totalCustomers,
        totalProducts: totalProducts || 0,
        changes: {
          revenue: revenueChange,
          orders: ordersChange,
          customers: customersChange,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getRevenueAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { timeRange = '30days' } = req.query;
    const { start, end } = getDateRange(timeRange as string);

    const { data, error } = await supabase
      .from('orders')
      .select('created_at, total')
      .gte('created_at', start)
      .lte('created_at', end)
      .order('created_at', { ascending: true });

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function getOrderAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { timeRange = '30days' } = req.query;
    const { start, end } = getDateRange(timeRange as string);

    const { data, error } = await supabase
      .from('orders')
      .select('created_at, status')
      .gte('created_at', start)
      .lte('created_at', end)
      .order('created_at', { ascending: true });

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function getProductAnalytics(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // This is a simplified version. In a real app, you might use a more complex query or RPC.
    const { data, error } = await supabase
      .from('products')
      .select('name, stock, category, bestseller, featured')
      .order('stock', { ascending: true });

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function getCustomerAnalytics(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('created_at, role, status')
      .order('created_at', { ascending: true });

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function getRecentOrders(_req: Request, res: Response): Promise<void> {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    res.json({ success: true, data: orders });
  } catch (error) {
    console.error('Error getting recent orders:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: 'Internal server error'
    });
  }
}

export async function getRevenueStats(req: Request, res: Response): Promise<void> {
  try {
    const { timeRange = '7days' } = req.query;
    const { start, end } = getDateRange(timeRange as string);

    const { data: orders, error } = await supabase
      .from('orders')
      .select('total, created_at')
      .gte('created_at', start)
      .lte('created_at', end)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Group by date
    const stats: Record<string, number> = {};
    (orders || []).forEach((order: any) => {
      const date = new Date(order.created_at).toISOString().split('T')[0];
      stats[date] = (stats[date] || 0) + (order.total || 0);
    });

    const formattedData = Object.entries(stats).map(([date, amount]) => ({
      date,
      amount,
    }));

    res.json({ success: true, data: formattedData });
  } catch (error) {
    console.error('Error getting revenue stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: 'Internal server error'
    });
  }
}

export async function getCategoryStats(_req: Request, res: Response): Promise<void> {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('category');

    if (error) throw error;

    const stats: Record<string, number> = {};
    (products || []).forEach((p: any) => {
      if (p.category) {
        stats[p.category] = (stats[p.category] || 0) + 1;
      }
    });

    const formattedData = Object.entries(stats).map(([name, value]) => ({
      name,
      value,
    }));

    res.json({ success: true, data: formattedData });
  } catch (error) {
    console.error('Error getting category stats:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
